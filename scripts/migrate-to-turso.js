const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');

const local = new PrismaClient({ datasources: { db: { url: 'file:' + __dirname + '/../prisma/dev.db' } } });
const remote = createClient({
  url: 'libsql://taskforce-unej-ahmaddavid.aws-ap-south-1.turso.io',
  authToken: process.env.TURSO_TOKEN,
});

async function copyTable(table, columns, rows) {
  if (!rows.length) return console.log(`${table}: 0 (kosong)`);
  const placeholders = '(' + columns.map(() => '?').join(',') + ')';
  const stmts = [];
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const sql = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(',')}) VALUES ` +
      chunk.map(() => placeholders).join(',');
    const args = chunk.flatMap(r => columns.map(c => {
      const v = r[c];
      return v instanceof Date ? v.getTime() : v;
    }));
    stmts.push({ sql, args });
  }
  await remote.batch(stmts, 'write');
  console.log(`${table}: ${rows.length} baris terkirim`);
}

(async () => {
  // urutan aman sesuai foreign key
  const users = await local.user.findMany();
  await copyTable('User', ['id','name','email','passwordHash','role','unit','status','createdAt'], users);

  const fields = await local.cooperationField.findMany();
  await copyTable('CooperationField', ['id','code','name'], fields);

  const partners = await local.partner.findMany();
  await copyTable('Partner', ['id','slug','name','level','category','country','city','address','phone','email','website','description','picName','picPosition','picPhone','picEmail','source','internalNote','usedByProdi','status','verifiedById','verifiedAt','createdById','createdAt','updatedAt'], partners);

  const agreements = await local.agreement.findMany();
  await copyTable('Agreement', ['id','partnerId','type','number','startDate','endDate','documentUrl','notes','createdAt','updatedAt'], agreements);

  const partnerFields = await local.partnerField.findMany();
  await copyTable('PartnerField', ['partnerId','cooperationFieldId'], partnerFields);

  const activities = await local.activity.findMany();
  await copyTable('Activity', ['id','partnerId','title','type','dateStart','dateEnd','location','description','output','internalPic','partnerPic','unit','participants','photoUrl','driveUrl','publicationUrl','status','submittedBy','submittedEmail','reviewedById','reviewedAt','reviewNote','createdAt','updatedAt'], activities);

  const lecturers = await local.activityLecturer.findMany();
  await copyTable('ActivityLecturer', ['id','activityId','name','isLeader','order'], lecturers);

  const students = await local.activityStudent.findMany();
  await copyTable('ActivityStudent', ['id','activityId','name','order'], students);

  const proposals = await local.partnerEditProposal.findMany();
  await copyTable('PartnerEditProposal', ['id','partnerId','name','level','category','address','phone','email','website','picName','picPosition','picPhone','picEmail','city','country','description','submitterName','submitterEmail','submitterUnit','note','status','reviewNote','reviewedAt','createdAt'], proposals);

  const team = await local.teamMember.findMany();
  await copyTable('TeamMember', ['id','name','isKetua','phone','email','photoUrl','order','createdAt'], team);

  console.log('=== MIGRASI SELESAI ===');
})().catch(e => { console.error('GAGAL:', e); process.exit(1); }).finally(() => local.$disconnect());
