-- AlterTable
ALTER TABLE "areas" ADD COLUMN     "color" TEXT,
ADD COLUMN     "driver" TEXT,
ADD COLUMN     "vehicle" TEXT,
ADD COLUMN     "workers" TEXT;

-- CreateTable
CREATE TABLE "route_schedules" (
    "id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "route_schedules_area_id_idx" ON "route_schedules"("area_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_schedules_area_id_day_of_week_key" ON "route_schedules"("area_id", "day_of_week");

-- CreateIndex
CREATE INDEX "route_stops_schedule_id_order_idx" ON "route_stops"("schedule_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_schedule_id_order_key" ON "route_stops"("schedule_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_schedule_id_place_id_key" ON "route_stops"("schedule_id", "place_id");

-- AddForeignKey
ALTER TABLE "route_schedules" ADD CONSTRAINT "route_schedules_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "route_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
