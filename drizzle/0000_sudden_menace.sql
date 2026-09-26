CREATE TYPE "public"."link_kind" AS ENUM('helps', 'unlocks');--> statement-breakpoint
CREATE TYPE "public"."resource_kind" AS ENUM('video', 'tab', 'article', 'exercise');--> statement-breakpoint
CREATE TYPE "public"."stop_kind" AS ENUM('skill', 'song');--> statement-breakpoint
CREATE TABLE "criteria" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "criteria_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"stop_id" integer NOT NULL,
	"level" smallint NOT NULL,
	"text" text NOT NULL,
	"sort" integer NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "criteria_stop_level_sort" UNIQUE("stop_id","level","sort"),
	CONSTRAINT "criteria_level_range" CHECK ("criteria"."level" between 2 and 4)
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "regions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"blurb" text NOT NULL,
	"map_x" double precision NOT NULL,
	"map_y" double precision NOT NULL,
	"map_w" double precision NOT NULL,
	"map_h" double precision NOT NULL,
	"sort" integer NOT NULL,
	CONSTRAINT "regions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"stop_id" integer NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"kind" "resource_kind" NOT NULL,
	"sort" integer NOT NULL,
	CONSTRAINT "resources_stop_sort" UNIQUE("stop_id","sort")
);
--> statement-breakpoint
CREATE TABLE "stop_links" (
	"from_stop_id" integer NOT NULL,
	"to_stop_id" integer NOT NULL,
	"kind" "link_kind" NOT NULL,
	CONSTRAINT "stop_links_from_stop_id_to_stop_id_kind_pk" PRIMARY KEY("from_stop_id","to_stop_id","kind")
);
--> statement-breakpoint
CREATE TABLE "stops" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stops_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"region_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"kind" "stop_kind" DEFAULT 'skill' NOT NULL,
	"map_x" double precision NOT NULL,
	"map_y" double precision NOT NULL,
	"target_bpm" integer,
	"sort" integer NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "stops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stop_links" ADD CONSTRAINT "stop_links_from_stop_id_stops_id_fk" FOREIGN KEY ("from_stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stop_links" ADD CONSTRAINT "stop_links_to_stop_id_stops_id_fk" FOREIGN KEY ("to_stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stops_region_idx" ON "stops" USING btree ("region_id");