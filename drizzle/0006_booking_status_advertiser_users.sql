ALTER TABLE "bookings" ALTER COLUMN "manager_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "status" text DEFAULT 'sent' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "advertiser_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE set null ON UPDATE no action;