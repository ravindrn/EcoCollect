ALTER TABLE "vehicles" ADD COLUMN "area_id" UUID;
ALTER TABLE "places" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "places" ADD COLUMN "longitude" DOUBLE PRECISION;

CREATE INDEX "vehicle_area_id_idx" ON "vehicles"("area_id");

ALTER TABLE "vehicles"  
        ADD CONSTRAINT "vehicles_area_id_fkey"
        FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;