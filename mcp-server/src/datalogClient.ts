import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { Project, Table, Column, Asset } from './types.js';

export class DatalogClient {
  private client: AxiosInstance;

  constructor(apiKey: string, baseUrl: string = 'https://studio.igot.ai/v1/catalog') {
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

  async listProjects(): Promise<Project[]> {
    const response = await this.client.get('/projects', {
      params: { limit: 100 },
    });
    return response.data;
  }

  async listTables(projectId: string): Promise<Table[]> {
    const response = await this.client.get(`/projects/${projectId}/tables`, {
      params: { limit: 200 },
    });
    return response.data;
  }

  async listColumns(projectName: string, collectionName: string): Promise<Column[]> {
    const response = await this.client.get(`/columns/${projectName}/${collectionName}`);
    return response.data;
  }

  async listAssets(projectName: string, collectionName: string): Promise<Asset[]> {
    const response = await this.client.get(`/assets/${projectName}/${collectionName}`);
    return response.data;
  }

  async uploadFile(
    projectName: string,
    collectionName: string,
    filePath: string,
    transform: boolean = true,
  ): Promise<any> {
    const form = new FormData();
    form.append('upload_files', fs.createReadStream(filePath));

    const response = await this.client.post(`/upload/${projectName}/${collectionName}`, form, {
      params: { transform },
      headers: { ...form.getHeaders() },
    });
    return response.data;
  }

  async uploadPlainText(
    projectName: string,
    collectionName: string,
    text: string,
    transform: boolean = true,
  ): Promise<any> {
    const form = new FormData();
    form.append('plain_text', text);

    const response = await this.client.post(`/upload/${projectName}/${collectionName}`, form, {
      params: { transform },
      headers: { ...form.getHeaders() },
    });
    return response.data;
  }
}
