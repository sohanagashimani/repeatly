/*
  Warnings:

  - Made the column `processing` on table `Job` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "processing" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Job_processing_idx" ON "Job"("processing");
