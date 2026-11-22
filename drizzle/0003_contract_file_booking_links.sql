ALTER TABLE "bookings" ADD COLUMN "advertiser_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "contract_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "campaign_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "file" jsonb;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "discount" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "file" jsonb;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;