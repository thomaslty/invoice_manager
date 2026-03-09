ALTER TABLE "invoice_snapshots" DROP CONSTRAINT "invoice_snapshots_invoice_id_invoices_id_fk";
--> statement-breakpoint
ALTER TABLE "invoice_snapshots" DROP CONSTRAINT "invoice_snapshots_font_id_fonts_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_template_id_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_font_id_fonts_id_fk";
--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT "templates_font_id_fonts_id_fk";
--> statement-breakpoint
ALTER TABLE "invoice_snapshots" ADD CONSTRAINT "invoice_snapshots_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_snapshots" ADD CONSTRAINT "invoice_snapshots_font_id_fonts_id_fk" FOREIGN KEY ("font_id") REFERENCES "public"."fonts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_font_id_fonts_id_fk" FOREIGN KEY ("font_id") REFERENCES "public"."fonts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_font_id_fonts_id_fk" FOREIGN KEY ("font_id") REFERENCES "public"."fonts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_ref_no_idx" ON "invoices" USING btree ("ref_no");--> statement-breakpoint
CREATE INDEX "invoices_client_name_idx" ON "invoices" USING btree ("client_name");--> statement-breakpoint
CREATE INDEX "invoices_date_idx" ON "invoices" USING btree ("date");