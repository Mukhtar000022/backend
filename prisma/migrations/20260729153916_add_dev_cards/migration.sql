-- CreateTable
CREATE TABLE "dev_cards" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "age_group" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "filled_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_marks" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "skill_no" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_marks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dev_cards_student_id_idx" ON "dev_cards"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "dev_cards_student_id_age_group_key" ON "dev_cards"("student_id", "age_group");

-- CreateIndex
CREATE UNIQUE INDEX "dev_marks_card_id_skill_no_key" ON "dev_marks"("card_id", "skill_no");

-- AddForeignKey
ALTER TABLE "dev_cards" ADD CONSTRAINT "dev_cards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_cards" ADD CONSTRAINT "dev_cards_filled_by_fkey" FOREIGN KEY ("filled_by") REFERENCES "tutors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_marks" ADD CONSTRAINT "dev_marks_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "dev_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
