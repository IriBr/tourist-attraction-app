-- AlterTable
ALTER TABLE "Visit" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Visit_isVerified_idx" ON "Visit"("isVerified");

-- Update existing verified visits (those created via camera scan have specific notes)
UPDATE "Visit" SET "isVerified" = true WHERE "notes" LIKE '%Verified via AI vision%';
