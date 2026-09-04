import { createClient } from "@libsql/client";

const db = createClient({ url: process.env.TURSO_URL!, authToken: process.env.TURSO_TOKEN! });

const cols = ['goal','partnerPICPosition','partnerPICPhone','partnerPICEmail','rkpStatus','rkpUrl','iaNumber','iaStatus','submitterNim','submitterPhone','submitterUnit','dosenName','reportDate','reportSummary','reportOutput','reportLink'];

async function main() {
  for (const col of cols) {
    try {
      await db.execute({ sql: `ALTER TABLE Activity ADD COLUMN ${col} TEXT`, args: [] });
      console.log(`+ Added: ${col}`);
    } catch (e: any) {
      console.log(`~ ${col}: ${e.message || 'exists'}`);
    }
  }
  console.log("Done");
}

main().catch(e => { console.error(e); process.exit(1); });
