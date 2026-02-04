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

export interface Column {
  name: string;
  data_type: string;
  prompt_template?: string;
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
