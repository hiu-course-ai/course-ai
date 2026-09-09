/*
  Warnings:

  - Added the required column `category` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requirementType` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CourseCategory" AS ENUM ('LIBERAL_ARTS', 'SPECIALIZED', 'FREE_ELECTIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('REQUIRED', 'SELECTIVE_REQUIRED', 'ELECTIVE');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "category" "CourseCategory" NOT NULL,
ADD COLUMN     "countsTowardGraduation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requirementType" "RequirementType" NOT NULL;

-- CreateTable
CREATE TABLE "graduation_requirements" (
    "id" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "enrollmentYear" INTEGER NOT NULL,
    "minLiberalArtsCredits" INTEGER NOT NULL,
    "minSpecializedCredits" INTEGER NOT NULL,
    "minTotalCredits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "graduation_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "graduation_requirements_faculty_department_enrollmentYear_key" ON "graduation_requirements"("faculty", "department", "enrollmentYear");
