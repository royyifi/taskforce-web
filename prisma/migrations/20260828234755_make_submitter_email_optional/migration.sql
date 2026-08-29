-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PartnerEditProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "name" TEXT,
    "level" TEXT,
    "category" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "picName" TEXT,
    "picPosition" TEXT,
    "picPhone" TEXT,
    "picEmail" TEXT,
    "city" TEXT,
    "country" TEXT,
    "description" TEXT,
    "submitterName" TEXT NOT NULL,
    "submitterEmail" TEXT,
    "submitterUnit" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerEditProposal_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PartnerEditProposal" ("address", "category", "city", "country", "createdAt", "description", "email", "id", "level", "name", "note", "partnerId", "phone", "picEmail", "picName", "picPhone", "picPosition", "reviewNote", "reviewedAt", "status", "submitterEmail", "submitterName", "submitterUnit", "website") SELECT "address", "category", "city", "country", "createdAt", "description", "email", "id", "level", "name", "note", "partnerId", "phone", "picEmail", "picName", "picPhone", "picPosition", "reviewNote", "reviewedAt", "status", "submitterEmail", "submitterName", "submitterUnit", "website" FROM "PartnerEditProposal";
DROP TABLE "PartnerEditProposal";
ALTER TABLE "new_PartnerEditProposal" RENAME TO "PartnerEditProposal";
CREATE INDEX "PartnerEditProposal_partnerId_idx" ON "PartnerEditProposal"("partnerId");
CREATE INDEX "PartnerEditProposal_status_idx" ON "PartnerEditProposal"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
