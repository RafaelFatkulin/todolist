ALTER TABLE "users" ADD COLUMN "reset_password_token" varchar(512);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_token_expires_at" timestamp;