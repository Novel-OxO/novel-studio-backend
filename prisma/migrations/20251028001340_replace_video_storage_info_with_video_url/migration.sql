/*
  Warnings:

  - You are about to drop the column `video_storage_info` on the `lectures` table. All the data in the column will be lost.

*/
-- Step 1: Add new video_url column
ALTER TABLE "lectures" ADD COLUMN "video_url" TEXT;

-- Step 2: Migrate data - Extract 'url' from video_storage_info JSON if it exists
UPDATE "lectures"
SET "video_url" = video_storage_info->>'url'
WHERE video_storage_info IS NOT NULL
  AND video_storage_info->>'url' IS NOT NULL;

-- Step 3: Drop old video_storage_info column
ALTER TABLE "lectures" DROP COLUMN "video_storage_info";
