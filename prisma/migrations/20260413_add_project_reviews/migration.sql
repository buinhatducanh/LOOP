-- CreateProjectReviews
CREATE TABLE IF NOT EXISTS "project_reviews" (
 "id" TEXT NOT NULL,
 "order_id" TEXT NOT NULL,
 "user_id" TEXT NOT NULL,
 "rating" INTEGER NOT NULL,
 "title" TEXT,
 "comment" TEXT,
 "aspects" JSONB,
 "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "project_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "project_reviews_order_id_user_id_key" ON "project_reviews"("order_id", "user_id");
CREATE INDEX IF NOT EXISTS "project_reviews_user_id_idx" ON "project_reviews"("user_id");
CREATE INDEX IF NOT EXISTS "project_reviews_order_id_idx" ON "project_reviews"("order_id");

-- CreateSupportTickets
CREATE TABLE IF NOT EXISTS "support_tickets" (
 "id" TEXT NOT NULL,
 "user_id" TEXT NOT NULL,
 "order_id" TEXT,
 "subject" TEXT NOT NULL,
 "description" TEXT NOT NULL,
 "priority" TEXT NOT NULL DEFAULT 'normal',
 "status" TEXT NOT NULL DEFAULT 'open',
 "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "support_tickets_user_id_idx" ON "support_tickets"("user_id");
CREATE INDEX IF NOT EXISTS "support_tickets_order_id_idx" ON "support_tickets"("order_id");
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets"("status");
