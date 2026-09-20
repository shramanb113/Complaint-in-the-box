CREATE TABLE "packets" (
	"id" text PRIMARY KEY NOT NULL,
	"packet" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"ip_hash" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "rate_limits_ip_hash_window_start_pk" PRIMARY KEY("ip_hash","window_start")
);
--> statement-breakpoint
CREATE INDEX "packets_expires_at_idx" ON "packets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits" USING btree ("window_start");