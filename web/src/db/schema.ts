import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  boolean,
  serial,
  real,
  unique,
} from "drizzle-orm/pg-core";

// ─── Users ────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // 'platform_admin' | 'user'
  status: text("status").notNull().default("active"), // 'active' | 'disabled'
  tokenInvalidatedAt: timestamp("token_invalidated_at"), // JWT吊销
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Project ───────────────────────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  templateType: text("template_type").notNull().default("custom"),
  // e.g. ["产品线","模块","功能项"] or ["系统层","组件","功能"]
  hierarchyLabels: jsonb("hierarchy_labels")
    .$type<string[]>()
    .notNull()
    .default(["层级1", "层级2", "层级3"]),
  versionMode: text("version_mode").notNull().default("release"), // release | continuous
  aiProvider: text("ai_provider").default("local"), // 'local' | 'claude' | 'codex' | 'kimi'
  aiApiKeyEnc: text("ai_api_key_enc"), // AES-256-GCM encrypted
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Project Members ──────────────────────────────────

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("viewer"), // 'admin' | 'editor' | 'viewer'
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.projectId, t.userId)],
);

// ─── Analysis Tasks ───────────────────────────────────

export const analysisTasks = pgTable("analysis_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  taskType: text("task_type").notNull(), // 'analyze' | 'test_points' | 'compare'
  inputHash: text("input_hash").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'running' | 'completed' | 'failed'
  inputData: jsonb("input_data").notNull(),
  resultData: jsonb("result_data"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ─── Dimension Type (global registry) ──────────────────

export const dimensionTypes = pgTable("dimension_types", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g. "description", "user_scenario"
  name: text("name").notNull(), // display name e.g. "功能描述"
  icon: text("icon").notNull().default("FileText"), // lucide icon name
  description: text("description"),
  // JSON Schema defining the fields for this dimension
  fieldSchema: jsonb("field_schema").$type<Record<string, unknown>>(),
});

// ─── Project Dimension Config ──────────────────────────

export const projectDimensionConfigs = pgTable("project_dimension_configs", {
  id: serial("id").primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  dimensionTypeId: integer("dimension_type_id")
    .notNull()
    .references(() => dimensionTypes.id),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─── Node (self-referencing tree) ──────────────────────

export const nodes = pgTable("nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"), // null = root node
  name: text("name").notNull(),
  type: text("type").notNull().default("folder"), // folder | file
  depth: integer("depth").notNull().default(0), // 0=root, 1, 2, ...
  sortOrder: integer("sort_order").notNull().default(0),
  // materialized path: "rootId/parentId/thisId"
  path: text("path").notNull().default(""),
  currentVersionId: uuid("current_version_id"), // FK via ALTER TABLE in migration (circular ref)
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Dimension Record ──────────────────────────────────

export const dimensionRecords = pgTable("dimension_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => nodes.id, { onDelete: "cascade" }),
  dimensionTypeId: integer("dimension_type_id")
    .notNull()
    .references(() => dimensionTypes.id),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  version: integer("version").notNull().default(1), // optimistic locking
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Version Record ────────────────────────────────────

export const versionRecords = pgTable("version_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => nodes.id, { onDelete: "cascade" }),
  versionLabel: text("version_label").notNull(), // "v3.9.3" or "2026-04-07"
  summary: text("summary").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Node Relation (cross-project ok) ──────────────────

export const nodeRelations = pgTable("node_relations", {
  id: serial("id").primaryKey(),
  sourceNodeId: uuid("source_node_id")
    .notNull()
    .references(() => nodes.id, { onDelete: "cascade" }),
  targetNodeId: uuid("target_node_id")
    .notNull()
    .references(() => nodes.id, { onDelete: "cascade" }),
  relationType: text("relation_type").notNull().default("related_to"), // depends_on | related_to | conflicts_with
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Project Template ──────────────────────────────────

export const projectTemplates = pgTable("project_templates", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // "product_analysis", "system_architecture", etc.
  name: text("name").notNull(),
  description: text("description"),
  hierarchyLabels: jsonb("hierarchy_labels").$type<string[]>().notNull(),
  // dimension type keys that this template enables
  dimensionKeys: jsonb("dimension_keys").$type<string[]>().notNull(),
});

// ─── Knowledge Items (shared with FastAPI analyzer) ─────

export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  nodeId: uuid("node_id").references(() => nodes.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("text"), // text | url | file_ref
  tags: jsonb("tags").$type<string[]>().default([]),
  source: text("source").default("manual"), // manual | ai_extracted | imported
  confidence: real("confidence").default(1.0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
