-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ACCOUNT_ACCESS', 'TECHNICAL_ISSUE', 'BILLING_QUESTION', 'FEATURE_REQUEST', 'BUG_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "priority" "Priority" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "assigned_to" TEXT,
    "tags" TEXT[],
    "source" TEXT NOT NULL,
    "browser" TEXT,
    "device_type" TEXT,
    "classification_confidence" DOUBLE PRECISION,
    "classification_reasoning" TEXT,
    "classification_keywords" TEXT[],

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);
