-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inquiry',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "tags" TEXT NOT NULL DEFAULT '',
    "due_date" TIMESTAMP(3),
    "files" TEXT NOT NULL DEFAULT '[]',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_pattern" TEXT,
    "notify_email" BOOLEAN NOT NULL DEFAULT false,
    "custom_email" TEXT,
    "slack_webhook" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'User',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_queue" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "slack_webhook" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_card_id_idx" ON "comments"("card_id");

-- CreateIndex
CREATE INDEX "activity_log_card_id_idx" ON "activity_log"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_queue_card_id_key" ON "notification_queue"("card_id");

-- CreateIndex
CREATE INDEX "notification_queue_status_due_date_idx" ON "notification_queue"("status", "due_date");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
