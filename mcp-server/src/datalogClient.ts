import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { Project, Table, Column, Asset } from './types.js';

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

  async listAttributes(catalogName: string, collectionName: string): Promise<Column[]> {
    const response = await this.client.get(`/columns/${catalogName}/${collectionName}`);
    return response.data;
  }

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
}
