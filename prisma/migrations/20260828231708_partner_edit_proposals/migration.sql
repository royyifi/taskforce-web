-- CreateTable
CREATE TABLE "PartnerEditProposal" (
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
    "submitterEmail" TEXT NOT NULL,
    "submitterUnit" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerEditProposal_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PartnerEditProposal_partnerId_idx" ON "PartnerEditProposal"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerEditProposal_status_idx" ON "PartnerEditProposal"("status");
