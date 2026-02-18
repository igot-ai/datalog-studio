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
  AssetColumnValue,
  TableFilesResponse,
} from './types.js';

export class DataStudioClient {
  private client: AxiosInstance;

  constructor(apiKey: string, apiDomain: string, apiUri: string) {
    const baseUrl = `${apiDomain.replace(/\/$/, '')}${apiUri.startsWith('/') ? apiUri : '/' + apiUri}`;

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `ApiKey ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-request-source': 'web',
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

  async listCollections(catalogId: string): Promise<Table[]> {
    const response = await this.client.get(`/projects/${catalogId}/tables`, {
      params: { limit: 200 },
    });
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

  async listAssets(tableId: string, page: number = 1, limit: number = 10): Promise<Asset[]> {
    const response = await this.client.get(`/tables/${tableId}/assets`, {
      params: { page, limit },
    });
    return response.data;
  }

  async getAssetsCount(tableId: string): Promise<number> {
    const response = await this.client.get(`/tables/${tableId}/assets/count`);
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

  async getAssetColumnValues(tableId: string): Promise<AssetColumnValue[]> {
    const response = await this.client.get(`/tables/${tableId}/asset_column`);
    return response.data;
  }

  async getAssetColumnByAssets(tableId: string, assetIds: string[]): Promise<AssetColumnValue[]> {
    const response = await this.client.get(`/tables/${tableId}/data_assets`, {
      params: { asset_ids: assetIds },
    });
    return response.data;
  }

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
}
