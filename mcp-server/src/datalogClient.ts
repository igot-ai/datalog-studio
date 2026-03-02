import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import {
  Project,
  Table,
  Column,
  Asset,
  AddColumnRequest,
  TableUpdateRequest,
  ColumnUpdateRequest,
  AssetColumnValueUpdateRequest,
  CreateAssetsOptions,
  AssetContent,
  TableFilesResponse,
  CreateProjectDTO,
  CreateTableDTO,
  Skill,
  CreateSkillRequest,
  UpdateSkillRequest,
  ReloadSkillsResponse,
  ProjectMember,
  AssignProjectMemberRequest,
  UpdateProjectMemberRoleRequest,
  CreateCatalogInvitationRequest,
} from './types.js';

export class DataStudioClient {
  private client: AxiosInstance;

  constructor(apiKey: string, apiDomain: string, apiUri: string, session: string) {
    const baseUrl = `${apiDomain.replace(/\/$/, '')}${apiUri.startsWith('/') ? apiUri : '/' + apiUri}`;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `ApiKey ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-request-source': 'web',
        ...(session ? { 'X-Streaming-Channel': session } : {}),
      },
    });
  }

  // ─── Existing Project/Catalog Methods ──────────────────────────────

  async listCatalogs(): Promise<Project[]> {
    const response = await this.client.get('/projects', {
      params: { limit: 100 },
    });
    return response.data;
  }

  async createProject(projectData: CreateProjectDTO): Promise<Project> {
    const response = await this.client.post('/projects', projectData);
    return response.data;
  }

  async listProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await this.client.get(`/projects/${projectId}/members`);
    return response.data;
  }

  async assignMember(projectId: string, body: AssignProjectMemberRequest): Promise<ProjectMember> {
    const response = await this.client.post(`/projects/${projectId}/members`, body);
    return response.data;
  }

  async updateMemberRole(
    projectId: string,
    memberId: string,
    body: UpdateProjectMemberRoleRequest,
  ): Promise<any> {
    const response = await this.client.put(`/projects/${projectId}/members/${memberId}/role`, body);
    return response.data;
  }

  async createInvitation(projectId: string, body: CreateCatalogInvitationRequest): Promise<any> {
    const response = await this.client.post(`/projects/${projectId}/members/invitations`, body);
    return response.data;
  }

  async listCollections(catalogId: string): Promise<Table[]> {
    const response = await this.client.get(`/projects/${catalogId}/tables`, {
      params: { limit: 200 },
    });
    return response.data;
  }

  async createTable(catalogId: string, tableData: CreateTableDTO): Promise<Table> {
    const response = await this.client.post(`/projects/${catalogId}/tables`, tableData);
    return response.data;
  }

  // ─── Column Methods (by name) ──────────────────────────────────────

  async listAttributes(catalogName: string, collectionName: string): Promise<Column[]> {
    const response = await this.client.get(`/columns/${catalogName}/${collectionName}`);
    return response.data;
  }

  async addColumn(
    catalogName: string,
    collectionName: string,
    columnData: AddColumnRequest,
  ): Promise<any> {
    const response = await this.client.post(
      `/columns/${catalogName}/${collectionName}`,
      columnData,
    );
    return response.data;
  }

  async addColumns(
    catalogName: string,
    collectionName: string,
    columnsData: AddColumnRequest[],
  ): Promise<any> {
    const response = await this.client.post(
      `/columns/${catalogName}/${collectionName}/bulk`,
      columnsData,
    );
    return response.data;
  }

  // ─── Asset Methods (by name — existing) ────────────────────────────

  async listDataAssets(catalogName: string, collectionName: string): Promise<Asset[]> {
    const response = await this.client.get(`/assets/${catalogName}/${collectionName}`);
    return response.data;
  }

  async uploadFile(
    catalogName: string,
    collectionName: string,
    filePath: string,
    transform: boolean = true,
  ): Promise<any> {
    const form = new FormData();
    form.append('upload_files', fs.createReadStream(filePath));

    const response = await this.client.post(`/upload/${catalogName}/${collectionName}`, form, {
      params: { transform },
      headers: { ...form.getHeaders() },
    });
    return response.data;
  }

  async ingestData(
    catalogName: string,
    collectionName: string,
    text: string,
    transform: boolean = true,
  ): Promise<any> {
    const form = new FormData();
    form.append('plain_text', text);

    const response = await this.client.post(`/upload/${catalogName}/${collectionName}`, form, {
      params: { transform },
      headers: { ...form.getHeaders() },
    });
    return response.data;
  }

  // ─── Table Management (by table_id) ────────────────────────────────

  async getTableJsonSchema(tableId: string): Promise<any> {
    const response = await this.client.get(`/tables/${tableId}/json`);
    return response.data;
  }

  async updateTable(tableId: string, info: TableUpdateRequest): Promise<Table> {
    const response = await this.client.put(`/tables/${tableId}`, info);
    return response.data;
  }

  async deleteTable(tableId: string): Promise<boolean> {
    const response = await this.client.delete(`/tables/${tableId}`);
    return response.data;
  }

  // ─── Asset Management (by table_id) ────────────────────────────────

  async listAssets(
    tableId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
    createdAtFrom?: string,
    createdAtTo?: string,
  ): Promise<Asset[]> {
    const params: Record<string, any> = { page, limit };
    if (status) params.status = status;
    if (createdAtFrom) params.created_at_from = createdAtFrom;
    if (createdAtTo) params.created_at_to = createdAtTo;

    const response = await this.client.get(`/tables/${tableId}/assets`, { params });
    return response.data;
  }

  async getAssetsCount(tableId: string): Promise<number> {
    const response = await this.client.get(`/projects/${tableId}/tables/count`);
    return response.data;
  }

  async getAssetContent(tableId: string, assetId: string): Promise<AssetContent> {
    const response = await this.client.get(`/tables/${tableId}/assets/${assetId}`);
    return response.data;
  }

  async createAssets(
    tableId: string,
    filePaths: string[] = [],
    options: CreateAssetsOptions = {},
  ): Promise<any> {
    const form = new FormData();

    for (const filePath of filePaths) {
      form.append('upload_files', fs.createReadStream(filePath));
    }

    if (options.plainText) {
      form.append('plain_text', options.plainText);
    }
    if (options.sourceId) {
      form.append('source_id', options.sourceId);
    }
    if (options.columnStaticData) {
      form.append('column_static_data', JSON.stringify(options.columnStaticData));
    }

    const response = await this.client.post(`/tables/${tableId}/assets`, form, {
      params: { transform: options.transform ?? false },
      headers: { ...form.getHeaders() },
    });
    return response.data;
  }

  async deleteAsset(tableId: string, assetId: string): Promise<boolean> {
    const response = await this.client.delete(`/tables/${tableId}/assets/${assetId}`);
    return response.data;
  }

  // ─── Column Management (by table_id) ───────────────────────────────

  async getColumns(tableId: string): Promise<Column[]> {
    const response = await this.client.get(`/tables/${tableId}/columns`);
    return response.data;
  }

  async getColumnsCount(tableId: string): Promise<number> {
    const response = await this.client.get(`/tables/${tableId}/columns/count`);
    return response.data;
  }

  async createColumn(tableId: string, info: AddColumnRequest): Promise<any> {
    const response = await this.client.post(`/tables/${tableId}/columns`, info);
    return response.data;
  }

  async createColumnsBulk(tableId: string, info: AddColumnRequest[]): Promise<any> {
    const response = await this.client.post(`/tables/${tableId}/columns/bulk`, info);
    return response.data;
  }

  async updateColumn(tableId: string, info: ColumnUpdateRequest): Promise<any> {
    const response = await this.client.put(`/tables/${tableId}/columns`, info);
    return response.data;
  }

  async deleteColumn(tableId: string, columnId: string): Promise<boolean> {
    const response = await this.client.delete(`/tables/${tableId}/columns/${columnId}`);
    return response.data;
  }

  // ─── Data / Asset-Column Values ────────────────────────────────────
  // Note: column values (values[]) are embedded in each asset returned by listAssets.

  async updateAssetColumnValue(
    tableId: string,
    assetId: string,
    columnId: string,
    info: AssetColumnValueUpdateRequest,
  ): Promise<any> {
    const response = await this.client.put(
      `/tables/${tableId}/assets/${assetId}/columns/${columnId}/value_data`,
      info,
    );
    return response.data;
  }

  async deleteAssetColumn(tableId: string): Promise<boolean> {
    const response = await this.client.delete(`/tables/${tableId}/asset_column`);
    return response.data;
  }

  // ─── Export ────────────────────────────────────────────────────────

  async exportJson(tableId: string): Promise<any> {
    const response = await this.client.get(`/tables/${tableId}/export/json`);
    return response.data;
  }

  async exportCsv(tableId: string): Promise<string> {
    const response = await this.client.get(`/tables/${tableId}/export/csv`, {
      responseType: 'text',
    });
    return response.data;
  }

  async exportExcel(tableId: string): Promise<Buffer> {
    const response = await this.client.get(`/tables/${tableId}/export/excel`, {
      responseType: 'arraybuffer',
    });
    return response.data;
  }

  // ─── Files ─────────────────────────────────────────────────────────

  async getTableFiles(tableId: string, limit: number = 5): Promise<TableFilesResponse> {
    const response = await this.client.get(`/tables/${tableId}/files`, {
      params: { limit },
    });
    return response.data;
  }

  // ─── Skill Management ──────────────────────────────────────────────

  async listSkills(projectId: string): Promise<Skill[]> {
    const response = await this.client.get(`/projects/${projectId}/skills`);
    return response.data;
  }

  async getSkill(projectId: string, skillId: string): Promise<Skill> {
    const response = await this.client.get(`/projects/${projectId}/skills/${skillId}`);
    return response.data;
  }

  async createSkill(projectId: string, data: CreateSkillRequest): Promise<Skill> {
    const response = await this.client.post(`/projects/${projectId}/skills`, data);
    return response.data;
  }

  async updateSkill(projectId: string, skillId: string, data: UpdateSkillRequest): Promise<Skill> {
    const response = await this.client.put(`/projects/${projectId}/skills/${skillId}`, data);
    return response.data;
  }

  async deleteSkill(projectId: string, skillId: string): Promise<void> {
    await this.client.delete(`/projects/${projectId}/skills/${skillId}`);
  }

  async reloadSkills(projectId: string): Promise<ReloadSkillsResponse> {
    const response = await this.client.post(`/projects/${projectId}/skills/reload`);
    return response.data;
  }
}
