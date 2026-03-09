CREATE TABLE "fonts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"family" varchar(255) NOT NULL,
	"source" varchar(20) NOT NULL,
	"file_path" text,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"font_id" integer,
	"json_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer,
	"font_id" integer,
	"ref_no" varchar(100),
	"client_name" varchar(255),
	"date" date,
	"total_amount" numeric(12, 2),
	"json_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"font_id" integer,
	"json_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_snapshots" ADD CONSTRAINT "invoice_snapshots_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_snapshots" ADD CONSTRAINT "invoice_snapshots_font_id_fonts_id_fk" FOREIGN KEY ("font_id") REFERENCES "public"."fonts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_font_id_fonts_id_fk" FOREIGN KEY ("font_id") REFERENCES "public"."fonts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_font_id_fonts_id_fk" FOREIGN KEY ("font_id") REFERENCES "public"."fonts"("id") ON DELETE no action ON UPDATE no action;