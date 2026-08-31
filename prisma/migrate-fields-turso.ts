/**
 * Migrasi bidang kerja sama pada Turso (production).
 *
 * Jalankan: TURSO_URL="libsql://..." TURSO_TOKEN="..." npx tsx prisma/migrate-fields-turso.ts
 */
import { createClient } from "@libsql/client";

const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("Set TURSO_URL dan TURSO_TOKEN environment variables.");
  process.exit(1);
}

const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const TARGET = [
  { code: "MG",  name: "Magang" },
  { code: "PD",  name: "Pendidikan" },
  { code: "PM",  name: "Pengabdian Masyarakat" },
  { code: "PN",  name: "Penelitian" },
  { code: "PP",  name: "Pertukaran Pelajar" },
  { code: "SPI", name: "Studi/Proyek Independen" },
];

const MAPPING: [string, string][] = [
  ["RS", "PN"],
  ["PI", "PN"],
  ["PK", "PM"],
  ["KKN", "PM"],
  ["KW", "PM"],
  ["AM", "SPI"],
];

async function main() {
  console.log("=== Turso: Migrasi Bidang Kerja Sama ===\n");

  // Count before
  const before = await db.execute("SELECT COUNT(*) as cnt FROM PartnerField");
  console.log("Relasi sebelum:", before.rows[0].cnt);

  // Ensure 6 canonical masters exist
  for (const { code, name } of TARGET) {
    const existing = await db.execute({ sql: "SELECT id FROM CooperationField WHERE code = ?", args: [code] });
    if (existing.rows.length === 0) {
      await db.execute({ sql: "INSERT INTO CooperationField (id, code, name) VALUES (?, ?, ?)", args: [crypto.randomUUID(), code, name] });
      console.log(`  + Created ${code} = ${name}`);
    } else {
      await db.execute({ sql: "UPDATE CooperationField SET name = ? WHERE code = ?", args: [name, code] });
      console.log(`  ~ Updated ${code} = ${name}`);
    }
  }

  // Migrate old codes
  for (const [oldCode, newCode] of MAPPING) {
    const oldField = await db.execute({ sql: "SELECT id FROM CooperationField WHERE code = ?", args: [oldCode] });
    const newField = await db.execute({ sql: "SELECT id FROM CooperationField WHERE code = ?", args: [newCode] });
    if (oldField.rows.length === 0 || newField.rows.length === 0) continue;

    const oldId = oldField.rows[0].id as string;
    const newId = newField.rows[0].id as string;

    const relasi = await db.execute({ sql: "SELECT partnerId FROM PartnerField WHERE cooperationFieldId = ?", args: [oldId] });
    let moved = 0;
    for (const row of relasi.rows) {
      const partnerId = row.partnerId as string;
      // Check if new rel already exists
      const exists = await db.execute({ sql: "SELECT 1 FROM PartnerField WHERE partnerId = ? AND cooperationFieldId = ?", args: [partnerId, newId] });
      if (exists.rows.length === 0) {
        await db.execute({ sql: "INSERT INTO PartnerField (partnerId, cooperationFieldId) VALUES (?, ?)", args: [partnerId, newId] });
      }
      await db.execute({ sql: "DELETE FROM PartnerField WHERE partnerId = ? AND cooperationFieldId = ?", args: [partnerId, oldId] });
      moved++;
    }
    console.log(`  ${oldCode} -> ${newCode}: ${moved} relasi`);
  }

  // Delete old masters with 0 remaining relasi
  for (const [oldCode] of MAPPING) {
    const stillUsed = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM PartnerField pf JOIN CooperationField cf ON pf.cooperationFieldId = cf.id WHERE cf.code = ?", args: [oldCode] });
    if ((stillUsed.rows[0].cnt as number) === 0) {
      await db.execute({ sql: "DELETE FROM CooperationField WHERE code = ?", args: [oldCode] });
      console.log(`  Deleted old master ${oldCode}`);
    }
  }

  // Verify
  const after = await db.execute("SELECT COUNT(*) as cnt FROM PartnerField");
  console.log(`\nRelasi sesudah: ${after.rows[0].cnt} (sebelum: ${before.rows[0].cnt})`);

  const masters = await db.execute("SELECT code, name FROM CooperationField ORDER BY code");
  console.log("\nMaster final:");
  for (const m of masters.rows) {
    const cnt = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM PartnerField pf JOIN CooperationField cf ON pf.cooperationFieldId = cf.id WHERE cf.code = ?", args: [m.code] });
    console.log(`  ${m.code} = ${m.name} (${cnt.rows[0].cnt} mitra)`);
  }

  console.log("\n=== Selesai ===");
}

main().catch((e) => { console.error(e); process.exit(1); });
