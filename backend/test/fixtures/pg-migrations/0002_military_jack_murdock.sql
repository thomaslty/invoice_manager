CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"oidc_sub" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");
--> statement-breakpoint
-- Insert __admin__ user for backfilling existing data and BYPASS_LOGIN mode
INSERT INTO "users" ("email", "name") VALUES ('admin@localhost', 'Admin') ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Add uploaded_by to fonts (nullable, no backfill needed — NULL means system font)
ALTER TABLE "fonts" ADD COLUMN "uploaded_by" integer;
--> statement-breakpoint
ALTER TABLE "fonts" ADD CONSTRAINT "fonts_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Add user_id to invoices: nullable first, backfill, then NOT NULL
ALTER TABLE "invoices" ADD COLUMN "user_id" integer;
--> statement-breakpoint
UPDATE "invoices" SET "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'admin@localhost') WHERE "user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "invoices_user_id_idx" ON "invoices" USING btree ("user_id");
--> statement-breakpoint
-- Add user_id to templates: nullable first, backfill, then NOT NULL
ALTER TABLE "templates" ADD COLUMN "user_id" integer;
--> statement-breakpoint
UPDATE "templates" SET "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'admin@localhost') WHERE "user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
