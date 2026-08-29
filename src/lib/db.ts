import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

function createDbClient() {
  const url = process.env.DATABASE_URL;
  // Turso/production: gunakan libsql:// protocol
  if (url && url.startsWith("libsql")) {
    const token = process.env.DATABASE_AUTH_TOKEN;
    const client = createClient({ url, authToken: token });
    const adapter = new PrismaLibSQL(client);
    // datasourceUrl file: hanya untuk memuaskan validasi protokol Prisma;
    // koneksi asli sepenuhnya lewat adapter libSQL (Turso)
    return new PrismaClient({ adapter, datasourceUrl: "file:./dev.db" });
  }
  // Local development: gunakan sqlite langsung
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const db = globalForPrisma.prisma ?? createDbClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
