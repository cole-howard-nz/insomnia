CREATE TYPE "public"."practice_feel" AS ENUM('sloppy', 'clean', 'breakthrough');--> statement-breakpoint
CREATE TABLE "level_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stop_id" integer NOT NULL,
	"from_level" smallint NOT NULL,
	"to_level" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_session_stops" (
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"stop_id" integer NOT NULL,
	"bpm" integer,
	CONSTRAINT "practice_session_stops_session_id_stop_id_pk" PRIMARY KEY("session_id","stop_id")
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"practiced_on" date NOT NULL,
	"minutes" integer NOT NULL,
	"feel" "practice_feel" NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_minutes_range" CHECK ("practice_sessions"."minutes" between 1 and 720)
);
--> statement-breakpoint
CREATE TABLE "user_criteria_done" (
	"user_id" uuid NOT NULL,
	"criterion_id" integer NOT NULL,
	"done_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_criteria_done_user_id_criterion_id_pk" PRIMARY KEY("user_id","criterion_id")
);
--> statement-breakpoint
CREATE TABLE "user_stop_progress" (
	"user_id" uuid NOT NULL,
	"stop_id" integer NOT NULL,
	"level" smallint DEFAULT 1 NOT NULL,
	"last_practiced_at" timestamp with time zone,
	"best_bpm" integer,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_stop_progress_user_id_stop_id_pk" PRIMARY KEY("user_id","stop_id"),
	CONSTRAINT "progress_level_range" CHECK ("user_stop_progress"."level" between 1 and 4)
);
--> statement-breakpoint
ALTER TABLE "level_events" ADD CONSTRAINT "level_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_events" ADD CONSTRAINT "level_events_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session_stops" ADD CONSTRAINT "practice_session_stops_session_id_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session_stops" ADD CONSTRAINT "practice_session_stops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session_stops" ADD CONSTRAINT "practice_session_stops_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_criteria_done" ADD CONSTRAINT "user_criteria_done_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_criteria_done" ADD CONSTRAINT "user_criteria_done_criterion_id_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stop_progress" ADD CONSTRAINT "user_stop_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stop_progress" ADD CONSTRAINT "user_stop_progress_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "level_events_user_stop_idx" ON "level_events" USING btree ("user_id","stop_id","created_at");--> statement-breakpoint
CREATE INDEX "practice_session_stops_user_stop_idx" ON "practice_session_stops" USING btree ("user_id","stop_id");--> statement-breakpoint
CREATE INDEX "practice_sessions_user_idx" ON "practice_sessions" USING btree ("user_id","practiced_on");