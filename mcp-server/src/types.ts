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

export interface Asset {
  id: string;
  table_id: string;
  filename: string;
  file_type: string;
  file_directus_id: string;
  status: string;
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
