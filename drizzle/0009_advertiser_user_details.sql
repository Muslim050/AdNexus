ALTER TABLE "advertisers" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "advertisers" ADD COLUMN "creative_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "advertisers" ADD COLUMN "requisites" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "advertisers" ADD COLUMN "color" text DEFAULT '#0E7745' NOT NULL;--> statement-breakpoint
ALTER TABLE "advertisers" ADD COLUMN "logo" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text DEFAULT '' NOT NULL;