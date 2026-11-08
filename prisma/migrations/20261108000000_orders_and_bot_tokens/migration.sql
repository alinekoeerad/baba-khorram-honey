-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONTACTED', 'SHIPPED', 'CANCELLED');

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "baleBotToken" TEXT,
ADD COLUMN IF NOT EXISTS "baleChatId" TEXT,
ADD COLUMN IF NOT EXISTS "eitaaBotToken" TEXT,
ADD COLUMN IF NOT EXISTS "eitaaChatId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerMobile" TEXT NOT NULL,
    "customerCity" TEXT,
    "customerAddress" TEXT,
    "customerNotes" TEXT,
    "preferredContact" "ChannelType" NOT NULL,
    "lines" JSONB NOT NULL DEFAULT '[]',
    "totalPrice" INTEGER,
    "messageText" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "channelType" TEXT,
    "channelValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_customerMobile_idx" ON "orders"("customerMobile");

