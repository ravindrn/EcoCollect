-- CreateTable
CREATE TABLE "community_updates" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_reactions" (
    "id" UUID NOT NULL,
    "update_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_comments" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "update_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_updates_area_id_created_at_idx" ON "community_updates"("area_id", "created_at");

-- CreateIndex
CREATE INDEX "community_updates_user_id_created_at_idx" ON "community_updates"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "community_reactions_user_id_idx" ON "community_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_reactions_update_id_user_id_key" ON "community_reactions"("update_id", "user_id");

-- CreateIndex
CREATE INDEX "community_comments_update_id_created_at_idx" ON "community_comments"("update_id", "created_at");

-- CreateIndex
CREATE INDEX "community_comments_user_id_idx" ON "community_comments"("user_id");

-- AddForeignKey
ALTER TABLE "community_updates" ADD CONSTRAINT "community_updates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_updates" ADD CONSTRAINT "community_updates_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_update_id_fkey" FOREIGN KEY ("update_id") REFERENCES "community_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_update_id_fkey" FOREIGN KEY ("update_id") REFERENCES "community_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
