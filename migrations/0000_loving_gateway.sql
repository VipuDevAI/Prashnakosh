CREATE TABLE IF NOT EXISTS "academic_years" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"is_active" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"locked_at" timestamp,
	"locked_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"user_name" text,
	"user_role" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar,
	"details" jsonb,
	"previous_state" text,
	"new_state" text,
	"comments" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_exam_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"wing" text NOT NULL,
	"exam_name" text NOT NULL,
	"academic_year_id" varchar NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"total_marks" integer DEFAULT 100 NOT NULL,
	"exam_type" text DEFAULT 'unit' NOT NULL,
	"allow_mock_test" boolean DEFAULT false,
	"watermark_text" text,
	"logo_url" text,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"deleted_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attempts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"test_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"assigned_set_index" integer,
	"assigned_question_ids" jsonb,
	"answers" jsonb,
	"question_statuses" jsonb,
	"marked_for_review" jsonb,
	"score" integer,
	"total_marks" integer,
	"percentage" numeric(5, 2),
	"status" text DEFAULT 'in_progress',
	"time_remaining" integer,
	"started_at" timestamp,
	"submitted_at" timestamp,
	"teacher_remarks" text,
	"manual_scores" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "batches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"test_id" varchar NOT NULL,
	"name" text NOT NULL,
	"assigned_set" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blueprint_policies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"academic_year_id" varchar NOT NULL,
	"is_blueprint_mandatory" boolean DEFAULT true,
	"blueprint_mode" text DEFAULT 'academic_year',
	"allow_edit_after_lock" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blueprints" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"department_id" varchar,
	"academic_year_id" varchar,
	"exam_framework_id" varchar,
	"exam_config_id" varchar,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"grade" text NOT NULL,
	"total_marks" integer NOT NULL,
	"sections" jsonb,
	"created_by" varchar,
	"approved_by" varchar,
	"is_approved" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"locked_at" timestamp,
	"locked_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"class_id" varchar NOT NULL,
	"subject_id" varchar NOT NULL,
	"name" text NOT NULL,
	"head_id" varchar,
	"head_role_label" text DEFAULT 'HOD',
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exam_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"from_state" text,
	"to_state" text NOT NULL,
	"actor_id" varchar NOT NULL,
	"actor_role" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"comments" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exam_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"key" text NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exam_frameworks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"academic_year_id" varchar NOT NULL,
	"grade_group" text NOT NULL,
	"applicable_grades" jsonb,
	"exam_name" text NOT NULL,
	"exam_category" text DEFAULT 'unit',
	"exam_order" integer DEFAULT 1,
	"exam_type" text DEFAULT 'offline',
	"duration_minutes" integer DEFAULT 60,
	"max_marks" integer DEFAULT 40,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_visible" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file_metadata" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"file_type" text NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"file_size" bigint DEFAULT 0,
	"mime_type" text,
	"s3_bucket" text,
	"s3_key" text,
	"s3_url" text,
	"is_uploaded" boolean DEFAULT false,
	"linked_entity_type" text,
	"linked_entity_id" varchar,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grade_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"academic_year_id" varchar NOT NULL,
	"grade" text NOT NULL,
	"grade_group" text,
	"display_name" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grades" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"student_name" text,
	"test_id" varchar,
	"subject" text NOT NULL,
	"grade" text,
	"score" integer DEFAULT 0,
	"total_marks" integer,
	"percentage" numeric(5, 2),
	"graded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lessons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"department_id" varchar,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"grade" text NOT NULL,
	"order_index" integer DEFAULT 0,
	"status" text DEFAULT 'draft',
	"unlock_date" timestamp,
	"deadline" timestamp,
	"scores_revealed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "paper_generation_audit" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"test_id" varchar NOT NULL,
	"set_number" integer NOT NULL,
	"action" text NOT NULL,
	"generated_by" varchar NOT NULL,
	"user_role" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "passages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"subject" text NOT NULL,
	"grade" text,
	"passage_type" text DEFAULT 'prose'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"test_type" text NOT NULL,
	"subject" text NOT NULL,
	"grade" text NOT NULL,
	"chapter_ids" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "practice_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"subject" text NOT NULL,
	"chapter" text,
	"topic" text,
	"questions_attempted" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"status" text DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "question_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" varchar NOT NULL,
	"reviewer_id" varchar NOT NULL,
	"status" text DEFAULT 'pending',
	"comments" text,
	"reviewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"department_id" varchar,
	"content" text NOT NULL,
	"content_format" text DEFAULT 'text',
	"type" text NOT NULL,
	"options" jsonb,
	"option_images" jsonb,
	"correct_answer" text,
	"explanation" text,
	"hint" text,
	"image_url" text,
	"passage_id" varchar,
	"instruction_text" text,
	"subject" text NOT NULL,
	"section" text,
	"lesson" text NOT NULL,
	"topic" text,
	"grade" text NOT NULL,
	"difficulty" text DEFAULT 'medium',
	"bloom_level" text,
	"marks" integer DEFAULT 1,
	"is_verified" boolean DEFAULT false,
	"is_practice" boolean DEFAULT true,
	"is_assessment" boolean DEFAULT false,
	"created_by" varchar,
	"upload_id" varchar,
	"status" text DEFAULT 'draft',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"content_hash" text,
	"academic_year" text,
	"created_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reference_library" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"academic_year_id" varchar,
	"grade" text NOT NULL,
	"subject" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"reference_type" text NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text,
	"file_size" integer,
	"year" text,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"deleted_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reference_materials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"grade" text NOT NULL,
	"subject" text,
	"category" text NOT NULL,
	"academic_year" text,
	"file_url" text,
	"file_name" text NOT NULL,
	"file_size" bigint DEFAULT 0,
	"mime_type" text,
	"s3_key" text,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_classes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"numeric_grade" integer NOT NULL,
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_exams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"wing_id" varchar NOT NULL,
	"exam_name" text NOT NULL,
	"academic_year" text NOT NULL,
	"total_marks" integer DEFAULT 100 NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"exam_date" timestamp,
	"subjects" jsonb DEFAULT '[]'::jsonb,
	"question_paper_sets" integer DEFAULT 1,
	"watermark_text" text,
	"logo_url" text,
	"page_size" text DEFAULT 'A4',
	"allow_mock_test" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_storage_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"s3_bucket_name" text,
	"s3_folder_path" text,
	"max_storage_bytes" bigint DEFAULT 107374182400,
	"used_storage_bytes" bigint DEFAULT 0,
	"is_configured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar,
	CONSTRAINT "school_storage_configs_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_subjects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_wings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"grades" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storage_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"total_bytes" integer DEFAULT 0,
	"question_image_bytes" integer DEFAULT 0,
	"upload_file_bytes" integer DEFAULT 0,
	"reference_file_bytes" integer DEFAULT 0,
	"last_calculated_at" timestamp DEFAULT now(),
	CONSTRAINT "storage_usage_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"test_id" varchar,
	"attempt_id" varchar,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"logo" text,
	"active" boolean DEFAULT true,
	"principal_name" text,
	"address" text,
	"city" text,
	"state" text,
	"pincode" text,
	"phone" text,
	"email" text,
	"website" text,
	"board" text,
	"affiliation_number" text,
	"established_year" text,
	"student_count" integer,
	"teacher_count" integer,
	"user_code_counter" integer DEFAULT 0,
	CONSTRAINT "tenants_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"department_id" varchar,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"grade" text NOT NULL,
	"section" text,
	"chapter_id" varchar,
	"exam_config_id" varchar,
	"duration" integer DEFAULT 60,
	"total_marks" integer DEFAULT 100,
	"question_count" integer DEFAULT 50,
	"question_ids" jsonb,
	"question_sets" jsonb,
	"is_active" boolean DEFAULT false,
	"results_revealed" boolean DEFAULT false,
	"created_by" varchar,
	"blueprint_id" varchar,
	"workflow_state" text DEFAULT 'draft',
	"hod_approved_by" varchar,
	"hod_approved_at" timestamp,
	"hod_comments" text,
	"principal_approved_by" varchar,
	"principal_approved_at" timestamp,
	"principal_comments" text,
	"sent_to_committee_at" timestamp,
	"is_confidential" boolean DEFAULT false,
	"printing_ready" boolean DEFAULT false,
	"sets_approved" boolean DEFAULT false,
	"sets_approved_by" varchar,
	"sets_approved_at" timestamp,
	"paper_format" text DEFAULT 'A4',
	"generated_paper_url" text,
	"answer_key_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uploads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"filename" text NOT NULL,
	"source" text NOT NULL,
	"subject" text,
	"grade" text,
	"question_count" integer DEFAULT 0,
	"uploaded_by" varchar,
	"uploaded_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"department_id" varchar NOT NULL,
	"role" text NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"user_code" text,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"grade" text DEFAULT 'V',
	"section" text,
	"roll_number" text,
	"batch_id" varchar,
	"wing_id" varchar,
	"subjects" jsonb DEFAULT '[]'::jsonb,
	"avatar" text,
	"parent_of" varchar,
	"active" boolean DEFAULT true,
	"must_change_password" boolean DEFAULT false,
	"assigned_questions" jsonb DEFAULT '{}'::jsonb,
	"session_token" text,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
