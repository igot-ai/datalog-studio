/**
 * Types for Datalog Studio MCP Server
 */

export interface Project {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectDTO {
  name: string;
  title: string;
  description?: string;
  project_type: 'DATA' | 'ONTOLOGY';
  domain?: string;
  tags?: string[];
}

export interface Table {
  id: string;
  project_id: string;
  name: string;
  table_type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTableDTO {
  project_id: string;
  name: string;
  table_type?: string;
  description?: string;
  status?: string;
  model_transform?: string;
  language?: string;
  model_reasoning?: string;
}

export interface Column {
  id?: string;
  name: string;
  data_type: string;
  content_location?: string;
  scan_ranges?: string[];
  prompt_template?: string;
  agent_id?: string;
  config?: {
    multi_hop?: number;
  };
}

export interface AddColumnRequest {
  name: string;
  data_type: 'number' | 'text' | 'boolean' | 'datetime' | 'table' | 'table_markdown' | 'json' | 'markdown' | 'static' | 'agent';
  content_location: string;
  scan_ranges: string[];
  prompt_template?: string;
  agent_id?: string;
  config?: {
    multi_hop?: number;
  };
}

export interface AssetValue {
  column_name: string;
  value: string | null;
  version: number;
}

export interface Asset {
  id: string;
  table_id: string;
  version: number;
  status: string;
  file_type: string;
  filename: string;
  file_directus_id: string;
  is_vector: boolean;
  source_id: string | null;
  created_at: string;
  updated_at: string;
  values: AssetValue[];
}

export interface DatalogResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// --- New types for Table/Column API integration ---

export interface TableUpdateRequest {
  name?: string;
  description?: string;
  table_type?: string;
  status?: string;
}

export interface ColumnUpdateRequest {
  id: string;
  name?: string;
  data_type?: string;
  content_location?: string;
  scan_ranges?: string[];
  prompt_template?: string;
  agent_id?: string;
  config?: {
    multi_hop?: number;
  };
}

export interface AssetColumnValueUpdateRequest {
  value: string;
}

export interface CreateAssetsOptions {
  plainText?: string;
  sourceId?: string;
  columnStaticData?: Record<string, any>;
  transform?: boolean;
}

export interface AssetContent {
  url: string;
  status: string;
  content: string; // base64 encoded
  mime_type: string;
}

export interface AssetColumnValue {
  asset_id?: string;
  asset_filename?: string;
  column_id?: string;
  column_name?: string;
  value?: string;
}

export interface TableFilesResponse {
  index_id?: string;
  project_id: string;
  project_name: string;
  table_name: string;
  files: string[];
  total_files: number;
  table_id: string;
  link?: string;
}

// --- Skill Management Types ---

export interface SkillReference {
  id: string;
  skill_id: string;
  filename: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  project_id: string;
  name: string;
  description: string;
  skill_md_content: string;
  depends_on: string[];
  is_enabled: boolean;
  references: SkillReference[];
  created_at: string;
  updated_at: string;
}

export interface CreateSkillRequest {
  name: string;
  description?: string;
  skill_md_content?: string;
  is_enabled?: boolean;
}

export interface UpdateSkillRequest {
  name?: string;
  description?: string;
  skill_md_content?: string;
  is_enabled?: boolean;
}

export interface ReloadSkillsResponse {
  loaded: number;
  message: string;
}

export interface ProjectMemberRole {
  id: string;
  project_id: string;
  role_key: string;
  role_title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  permissions?: any[];
}

export interface ProjectMemberUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role_id: string;
  created_by: string;
  created_at: string;
  user: ProjectMemberUser;
  role: ProjectMemberRole;
}

export interface AssignProjectMemberRequest {
  user_id: string;
  role_id: string;
}

export interface UpdateProjectMemberRoleRequest {
  role_id: string;
}

export interface CreateCatalogInvitationRequest {
  email: string;
  role_id: string;
}

// ─── Physical Table Types ────────────────────────────────────────────────────

export interface PhysicalTableEntry {
  table_id: string;
  table_name: string;
  physical_table_name: string;
  description: string;
  row_count: number;
  column_count: number;
}

export interface PhysicalTableSchema {
  table_id: string;
  physical_table_name: string;
  columns: Array<{ name: string; pg_type: string; nullable: boolean }>;
  row_count: number;
}

export interface PhysicalTableQueryFilter {
  column: string;
  op: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'ilike' | 'is_null' | 'is_not_null';
  value?: string;
}

export interface PhysicalTableFilterGroup {
  operator: 'and' | 'or';
  conditions: Array<PhysicalTableQueryFilter | PhysicalTableFilterGroup>;
}

export interface PhysicalTableQueryParams {
  /**
   * Optional GROUP BY: returns one row per distinct combination of listed
   * column names. Omit or set to null for a plain SELECT *.
   * Do NOT set this when you also want aggregate functions — use
   * aggregate_physical_table for SUM / COUNT / AVG / MIN / MAX.
   */
  group_by?: string[] | null;
  filters?: PhysicalTableFilterGroup;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PhysicalTableQueryResult {
  physical_table_name: string;
  total: number;
  limit: number;
  offset: number;
  rows: Record<string, any>[];
  /** Echoed back when group_by was set; empty array for plain SELECT. */
  group_by?: string[];
}

// ─── Aggregate (GROUP BY + functions) Types ────────────────────────────────

export interface PhysicalTableAggregateSpec {
  /** Aggregate function: count | sum | avg | min | max */
  func: 'count' | 'sum' | 'avg' | 'min' | 'max';
  /** Column to aggregate. Use "*" for COUNT(*). Default: "*" */
  column?: string;
  /** Output key in result rows. Must be a valid identifier (no spaces). */
  alias: string;
}

export interface PhysicalTableGroupByParams {
  /** Columns to group on. Empty list → global aggregation (no GROUP BY cols). */
  group_by?: string[];
  /** Required — at least one aggregate expression. */
  aggregates: PhysicalTableAggregateSpec[];
  /** Pre-aggregation WHERE filter (same FilterGroup format as query). */
  filters?: PhysicalTableFilterGroup;
  /**
   * Post-aggregation HAVING filter.
   * Use aggregate *alias* names as column references, not original column names.
   * Example: { operator: "and", conditions: [{ column: "total_amount", op: "gte", value: "500" }] }
   */
  having?: PhysicalTableFilterGroup;
  /** Must be a group_by column name or an aggregate alias — not a raw column. */
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PhysicalTableGroupByResult {
  physical_table_name: string;
  /** Columns used in GROUP BY (empty for global aggregation). */
  group_by: string[];
  /** Aggregate alias names, in order. */
  aggregates: string[];
  total: number;
  limit: number;
  offset: number;
  rows: Record<string, any>[];
}
