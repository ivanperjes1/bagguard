CREATE TYPE "public"."bagguard_department" AS ENUM('M1 - College', 'M2 - SHS-AMA', 'M3 - SHS-SASN');--> statement-breakpoint
CREATE TYPE "public"."bagguard_user_role" AS ENUM('student', 'guard', 'admin');--> statement-breakpoint
CREATE TYPE "public"."bagguard_registration_status" AS ENUM('pending', 'approved', 'rejected', 'revoked', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."bagguard_notification_type" AS ENUM('registration_submitted', 'registration_approved', 'registration_rejected', 'registration_requires_correction', 'registration_revoked', 'registration_deactivated', 'registration_reactivated', 'lost_or_stolen_reported', 'suspicious_bag_reported', 'repeated_failed_verification', 'system');--> statement-breakpoint
CREATE TYPE "public"."bagguard_scan_status" AS ENUM('authorized', 'pending_approval', 'unregistered', 'rejected', 'revoked', 'inactive', 'error');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bag_admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bag_admin_bootstrap" (
	"id" integer PRIMARY KEY NOT NULL,
	"claimed_by" text,
	"claimed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bag_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" "bagguard_notification_type" DEFAULT 'system' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"related_registration_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bag_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_name" text NOT NULL,
	"usn" text NOT NULL,
	"department" "bagguard_department" NOT NULL,
	"bag_description" text NOT NULL,
	"image_path" text,
	"image_url" text,
	"status" "bagguard_registration_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"approved_at" timestamp,
	"approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bag_scan_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid,
	"searched_usn" text NOT NULL,
	"checkpoint_name" text DEFAULT 'Main Gate' NOT NULL,
	"operator_id" text,
	"status" "bagguard_scan_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bagguard_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"role" "bagguard_user_role" DEFAULT 'student' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bag_admin_audit_logs" ADD CONSTRAINT "bag_admin_audit_logs_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bag_admin_bootstrap" ADD CONSTRAINT "bag_admin_bootstrap_claimed_by_user_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bag_notifications" ADD CONSTRAINT "bag_notifications_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bag_notifications" ADD CONSTRAINT "bag_notifications_related_registration_id_bag_registrations_id_fk" FOREIGN KEY ("related_registration_id") REFERENCES "public"."bag_registrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bag_registrations" ADD CONSTRAINT "bag_registrations_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bag_scan_logs" ADD CONSTRAINT "bag_scan_logs_registration_id_bag_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."bag_registrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bag_scan_logs" ADD CONSTRAINT "bag_scan_logs_operator_id_user_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bagguard_profiles" ADD CONSTRAINT "bagguard_profiles_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bag_admin_audit_logs_created_idx" ON "bag_admin_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bag_notifications_recipient_created_idx" ON "bag_notifications" USING btree ("recipient_id","created_at");--> statement-breakpoint
CREATE INDEX "bag_notifications_recipient_unread_idx" ON "bag_notifications" USING btree ("recipient_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "bag_registrations_usn_unique" ON "bag_registrations" USING btree ("usn");--> statement-breakpoint
CREATE INDEX "bag_registrations_status_created_idx" ON "bag_registrations" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "bag_registrations_department_idx" ON "bag_registrations" USING btree ("department");--> statement-breakpoint
CREATE INDEX "bag_scan_logs_created_idx" ON "bag_scan_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bag_scan_logs_status_idx" ON "bag_scan_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bagguard_profiles_role_idx" ON "bagguard_profiles" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");