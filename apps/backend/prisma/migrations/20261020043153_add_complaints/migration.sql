-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('OVERFLOW', 'MISSED_PICKUP', 'ILLEGAL_DUMPING', 'BURNING', 'DAMAGED_BIN', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "photo_url" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "complaints_reporter_id_idx" ON "complaints"("reporter_id");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "complaints_category_idx" ON "complaints"("category");

-- CreateIndex
CREATE INDEX "complaints_created_at_idx" ON "complaints"("created_at");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
