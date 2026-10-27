BEGIN;

-- CreateEnum
CREATE TYPE "BankConnector" AS ENUM ('VIVID');

-- CreateTable
CREATE TABLE "BankConnection" (
    "id" SERIAL NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "connector" "BankConnector" NOT NULL,
    "sessionId" TEXT NOT NULL,
    "accountUid" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastImportedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankConnection_sourceId_projectId_key" ON "BankConnection"("sourceId", "projectId");

-- AddForeignKey
ALTER TABLE "BankConnection" ADD CONSTRAINT "BankConnection_sourceId_projectId_fkey" FOREIGN KEY ("sourceId", "projectId") REFERENCES "Source"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankConnection" ADD CONSTRAINT "BankConnection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EnableRowLevelSecurity
ALTER TABLE "BankConnection" ENABLE ROW LEVEL SECURITY;

COMMIT;
