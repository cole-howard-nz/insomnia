CREATE TYPE "public"."evidence_kind" AS ENUM('audio', 'video', 'note');--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stop_id" integer NOT NULL,
	"kind" "evidence_kind" NOT NULL,
	"level_at" smallint NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"storage_key" text,
	"mime" text,
	"bytes" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_level_range" CHECK ("evidence"."level_at" between 0 and 4),
	CONSTRAINT "evidence_bytes_nonneg" CHECK ("evidence"."bytes" >= 0)
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "experience" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "chasing" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "rain_sound" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_user_stop_idx" ON "evidence" USING btree ("user_id","stop_id","created_at");
--> statement-breakpoint
-- Accounts that exist before onboarding do not get sent through it.
UPDATE "users" SET "onboarding_done" = true;
