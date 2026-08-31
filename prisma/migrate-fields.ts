/**
 * Migrasi standarisasi bidang kerja sama ke 6 kode kanonis.
 *
 * Pemetaan:
 *   MG  -> MG  (Magang)
 *   RS  -> PN  (Penelitian)
 *   PI  -> PN  (Penelitian)
 *   PK  -> PM  (Pengabdian Masyarakat)
 *   KKN -> PM  (Pengabdian Masyarakat)
 *   KW  -> PM  (Pengabdian Masyarakat)
 *   AM  -> SPI (Studi/Proyek Independen)
 *
 * Jalankan: npx tsx prisma/migrate-fields.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_FIELDS = [
  { code: "MG",  name: "Magang" },
  { code: "PD",  name: "Pendidikan" },
  { code: "PM",  name: "Pengabdian Masyarakat" },
  { code: "PN",  name: "Penelitian" },
  { code: "PP",  name: "Pertukaran Pelajar" },
  { code: "SPI", name: "Studi/Proyek Independen" },
] as const;

const MAPPING: Record<string, string> = {
  MG:  "MG",   // tetap
  RS:  "PN",   // Riset -> Penelitian
  PI:  "PN",   // Penelitian lama -> Penelitian
  PK:  "PM",   // Pengabdian -> Pengabdian Masyarakat
  KKN: "PM",   // KKN -> Pengabdian Masyarakat
  KW:  "PM",   // Kuliah Kerja -> Pengabdian Masyarakat
  AM:  "SPI",  // Agribisnis Muda -> Studi/Proyek Independen
};

async function main() {
  console.log("=== Migrasi Bidang Kerja Sama ===\n");

  // 1. Hitung relasi sebelum migrasi
  const relasiSebelum = await prisma.partnerField.count();
  console.log(`Relasi PartnerField sebelum migrasi: ${relasiSebelum}`);

  // 2. Buat/update 6 master kanonis
  for (const { code, name } of TARGET_FIELDS) {
    await prisma.cooperationField.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
    console.log(`  ✓ Master ${code} = ${name}`);
  }

  // 3. Pindahkan relasi dari kode lama ke kode kanonis baru
  let dipindahkan = 0;
  for (const [oldCode, newCode] of Object.entries(MAPPING)) {
    if (oldCode === newCode) continue;

    const oldField = await prisma.cooperationField.findUnique({ where: { code: oldCode } });
    const newField = await prisma.cooperationField.findUnique({ where: { code: newCode } });
    if (!oldField || !newField) continue;

    const relasi = await prisma.partnerField.findMany({
      where: { cooperationFieldId: oldField.id },
    });

    for (const r of relasi) {
      try {
        await prisma.partnerField.upsert({
          where: { partnerId_cooperationFieldId: { partnerId: r.partnerId, cooperationFieldId: newField.id } },
          update: {},
          create: { partnerId: r.partnerId, cooperationFieldId: newField.id },
        });
        // Hapus relasi lama
        await prisma.partnerField.delete({
          where: { partnerId_cooperationFieldId: { partnerId: r.partnerId, cooperationFieldId: oldField.id } },
        });
        dipindahkan++;
      } catch {
        // Relasi baru sudah ada (duplikat) — cukup hapus yang lama
        try {
          await prisma.partnerField.delete({
            where: { partnerId_cooperationFieldId: { partnerId: r.partnerId, cooperationFieldId: oldField.id } },
          });
          dipindahkan++;
        } catch { /* skip */ }
      }
    }

    console.log(`  ✓ ${oldCode} -> ${newCode}: ${relasi.length} relasi dipindahkan`);
  }

  // 4. Hapus master lama yang sudah tidak dipakai
  const oldCodes = Object.keys(MAPPING);
  for (const code of oldCodes) {
    const field = await prisma.cooperationField.findUnique({ where: { code } });
    if (field) {
      const sisa = await prisma.partnerField.count({ where: { cooperationFieldId: field.id } });
      if (sisa === 0) {
        await prisma.cooperationField.delete({ where: { code } });
        console.log(`  🗑  Master lama ${code} dihapus (0 relasi tersisa)`);
      } else {
        console.log(`  ⚠  Master lama ${code} masih punya ${sisa} relasi — tidak dihapus`);
      }
    }
  }

  // 5. Verifikasi
  const relasiSesudah = await prisma.partnerField.count();
  const masters = await prisma.cooperationField.findMany({ select: { code: true, name: true, _count: { select: { partners: true } } } });
  console.log(`\nRelasi PartnerField sesudah migrasi: ${relasiSesudah} (sebelum: ${relasiSebelum})`);
  console.log(`Selisih: ${relasiSesudah - relasiSebelum}`);
  console.log("\nMaster bidang final:");
  for (const m of masters) {
    console.log(`  ${m.code} = ${m.name} (${m._count.partners} mitra)`);
  }

  console.log("\n=== Migrasi selesai ===");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
