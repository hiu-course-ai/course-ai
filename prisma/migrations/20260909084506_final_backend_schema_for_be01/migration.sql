/*
  Warnings:

  - You are about to drop the column `department` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `faculty` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `graduation_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `faculty` on the `graduation_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `faculty` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[departmentId,enrollmentYear]` on the table `graduation_requirements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `departmentId` to the `graduation_requirements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('ACTIVE', 'DISCONTINUED', 'ARCHIVED');

-- DropIndex
DROP INDEX "graduation_requirements_faculty_department_enrollmentYear_key";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "department",
DROP COLUMN "faculty",
ADD COLUMN     "departmentId" TEXT;

-- AlterTable
ALTER TABLE "graduation_requirements" DROP COLUMN "department",
DROP COLUMN "faculty",
ADD COLUMN     "departmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "department",
DROP COLUMN "faculty",
ADD COLUMN     "departmentId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facultyName" TEXT NOT NULL,
    "status" "DepartmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "establishedYear" INTEGER NOT NULL,
    "discontinuedYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "graduation_requirements_departmentId_enrollmentYear_key" ON "graduation_requirements"("departmentId", "enrollmentYear");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graduation_requirements" ADD CONSTRAINT "graduation_requirements_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
