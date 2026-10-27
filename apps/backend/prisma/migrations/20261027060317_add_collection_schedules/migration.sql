-- CreateTable
CREATE TABLE "collection_schedules" (
    "id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "vehicle" TEXT,
    "driver" TEXT,
    "workers" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collection_schedules_area_id_day_of_week_idx" ON "collection_schedules"("area_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "collection_schedules" ADD CONSTRAINT "collection_schedules_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
