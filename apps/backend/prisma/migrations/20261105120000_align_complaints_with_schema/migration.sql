-- The live complaints table came from an older migration and is missing
-- the columns the current Prisma model reads.

ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "title" VARCHAR(100);
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "is_anonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "user_id" UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'complaints'
      AND column_name = 'category'
      AND udt_name = 'ComplaintCategory'
  ) THEN
    ALTER TABLE "complaints" ALTER COLUMN "category" TYPE TEXT USING ("category"::text);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'complaints'
      AND column_name = 'reporter_id'
  ) THEN
    ALTER TABLE "complaints" DROP CONSTRAINT IF EXISTS "complaints_reporter_id_fkey";
    DROP INDEX IF EXISTS "complaints_reporter_id_idx";
    ALTER TABLE "complaints" DROP COLUMN "reporter_id";
  END IF;
END $$;

UPDATE "complaints" SET "title" = 'Complaint' WHERE "title" IS NULL;
ALTER TABLE "complaints" ALTER COLUMN "title" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'complaints_user_id_fkey'
  ) THEN
    ALTER TABLE "complaints"
      ADD CONSTRAINT "complaints_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "complaints_user_id_created_at_idx" ON "complaints"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "complaints_status_created_at_idx" ON "complaints"("status", "created_at");
