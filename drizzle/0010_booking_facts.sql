CREATE TABLE "booking_facts" (
	"booking_id" uuid PRIMARY KEY NOT NULL,
	"outcome" text NOT NULL,
	"published_at" timestamp with time zone,
	"link" text DEFAULT '' NOT NULL,
	"impressions" bigint,
	"plan_impressions" bigint DEFAULT 0 NOT NULL,
	"screenshot" jsonb,
	"comment" text DEFAULT '' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_facts" ADD CONSTRAINT "booking_facts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;