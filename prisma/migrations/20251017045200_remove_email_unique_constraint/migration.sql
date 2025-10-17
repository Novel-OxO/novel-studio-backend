-- DropIndex
DROP INDEX "public"."users_email_key";

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- Create partial unique index for active users only (deletedAt IS NULL)
CREATE UNIQUE INDEX "users_email_active_key" ON "users"("email") WHERE "deleted_at" IS NULL;
