ALTER TABLE "placement_formats" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_formats" ADD COLUMN "includes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_formats" ADD COLUMN "impressions" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_formats" ADD COLUMN "price_per_impression" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_formats" ADD COLUMN "media" jsonb DEFAULT '[]'::jsonb NOT NULL;