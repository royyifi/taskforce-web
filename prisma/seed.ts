import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import importedPartners from "./imported-data.json";

const prisma = new PrismaClient();

const fields = [
  ["MG", "Magang"], ["AM", "Agribisnis Muda"], ["RS", "Riset"],
  ["PI", "Penelitian"], ["PK", "Pengabdian"], ["KW", "Kuliah Kerja"], ["KKN", "KKN"],
] as const;

function date(value: string | null) { return value ? new Date(value) : null; }

async function main() {
  for (const [code, name] of fields) {
    await prisma.cooperationField.upsert({ where: { code }, update: { name }, create: { code, name } });
  }

  for (const item of importedPartners) {
    const partner = await prisma.partner.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name, level: item.level, category: item.category,
        address: item.address, phone: item.phone, email: item.email, website: item.website,
        usedByProdi: item.usedByProdi, source: item.source, internalNote: item.note,
      },
      create: {
        slug: item.slug, name: item.name, level: item.level, category: item.category,
        address: item.address, phone: item.phone, email: item.email, website: item.website,
        usedByProdi: item.usedByProdi, source: item.source, internalNote: item.note,
      },
    });

    if (item.agreementNumber || item.agreementStart || item.agreementEnd) {
      const existing = await prisma.agreement.findFirst({ where: { partnerId: partner.id } });
      if (existing) {
        await prisma.agreement.update({ where: { id: existing.id }, data: {
          number: item.agreementNumber, startDate: date(item.agreementStart), endDate: date(item.agreementEnd), type: "PKS",
        }});
      } else {
        await prisma.agreement.create({ data: {
          partnerId: partner.id, type: "PKS", number: item.agreementNumber,
          startDate: date(item.agreementStart), endDate: date(item.agreementEnd),
        }});
      }
    }

    for (const code of item.fields) {
      const field = await prisma.cooperationField.findUnique({ where: { code } });
      if (field) await prisma.partnerField.upsert({
        where: { partnerId_cooperationFieldId: { partnerId: partner.id, cooperationFieldId: field.id } },
        update: {}, create: { partnerId: partner.id, cooperationFieldId: field.id },
      });
    }
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@taskforce.unej.ac.id" },
    update: { passwordHash, role: "SUPER_ADMIN" },
    create: { name: "Administrator Taskforce", email: "admin@taskforce.unej.ac.id", passwordHash, role: "SUPER_ADMIN" },
  });
  console.log(`Seeded ${importedPartners.length} partners`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
