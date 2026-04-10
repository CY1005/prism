CREATE TABLE "dimension_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"dimension_type_id" integer NOT NULL,
	"content" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dimension_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'FileText' NOT NULL,
	"description" text,
	"field_schema" jsonb,
	CONSTRAINT "dimension_types_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "node_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"relation_type" text DEFAULT 'related_to' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"type" text DEFAULT 'folder' NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"path" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_dimension_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"dimension_type_id" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"hierarchy_labels" jsonb NOT NULL,
	"dimension_keys" jsonb NOT NULL,
	CONSTRAINT "project_templates_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"template_type" text DEFAULT 'custom' NOT NULL,
	"hierarchy_labels" jsonb DEFAULT '["层级1","层级2","层级3"]'::jsonb NOT NULL,
	"version_mode" text DEFAULT 'release' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "version_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"version_label" text NOT NULL,
	"summary" text NOT NULL,
	"details" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dimension_records" ADD CONSTRAINT "dimension_records_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dimension_records" ADD CONSTRAINT "dimension_records_dimension_type_id_dimension_types_id_fk" FOREIGN KEY ("dimension_type_id") REFERENCES "public"."dimension_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_relations" ADD CONSTRAINT "node_relations_source_node_id_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_relations" ADD CONSTRAINT "node_relations_target_node_id_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_dimension_configs" ADD CONSTRAINT "project_dimension_configs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_dimension_configs" ADD CONSTRAINT "project_dimension_configs_dimension_type_id_dimension_types_id_fk" FOREIGN KEY ("dimension_type_id") REFERENCES "public"."dimension_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_records" ADD CONSTRAINT "version_records_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;