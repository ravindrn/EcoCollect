-- CreateEnum
CREATE TYPE "RouteAlertKind" AS ENUM ('OUTSIDE', 'INSIDE');

-- CreateTable
CREATE TABLE "route_alerts" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "kind" "RouteAlertKind" NOT NULL,
    "route_name" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "route_alerts_vehicle_id_recorded_at_idx" ON "route_alerts"("vehicle_id", "recorded_at");

-- CreateIndex
CREATE INDEX "route_alerts_recorded_at_idx" ON "route_alerts"("recorded_at");

-- AddForeignKey
ALTER TABLE "route_alerts" ADD CONSTRAINT "route_alerts_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_alerts" ADD CONSTRAINT "route_alerts_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
