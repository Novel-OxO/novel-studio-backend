-- CreateTable
CREATE TABLE "lecture_progresses" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "lecture_id" TEXT NOT NULL,
    "watch_time" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecture_progresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lecture_progresses_enrollment_id_idx" ON "lecture_progresses"("enrollment_id");

-- CreateIndex
CREATE INDEX "lecture_progresses_lecture_id_idx" ON "lecture_progresses"("lecture_id");

-- CreateIndex
CREATE UNIQUE INDEX "lecture_progresses_enrollment_id_lecture_id_key" ON "lecture_progresses"("enrollment_id", "lecture_id");

-- AddForeignKey
ALTER TABLE "lecture_progresses" ADD CONSTRAINT "lecture_progresses_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_progresses" ADD CONSTRAINT "lecture_progresses_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
