import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
export class DataStudioClient {
    constructor(apiKey, apiDomain, apiUri, session) {
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
    async listCatalogs() {
        const response = await this.client.get('/projects', {
            params: { limit: 100 },
        });
        return response.data;
    }
    async createProject(projectData) {
        const response = await this.client.post('/projects', projectData);
        return response.data;
    }
    async listProjectMembers(projectId) {
        const response = await this.client.get(`/projects/${projectId}/members`);
        return response.data;
    }
    async assignMember(projectId, body) {
        const response = await this.client.post(`/projects/${projectId}/members`, body);
        return response.data;
    }
    async updateMemberRole(projectId, memberId, body) {
        const response = await this.client.put(`/projects/${projectId}/members/${memberId}/role`, body);
        return response.data;
    }
    async createInvitation(projectId, body) {
        const response = await this.client.post(`/projects/${projectId}/members/invitations`, body);
        return response.data;
    }
    async listCollections(catalogId) {
        const response = await this.client.get(`/projects/${catalogId}/tables`, {
            params: { limit: 200 },
        });
        return response.data;
    }
    async createTable(catalogId, tableData) {
        const response = await this.client.post(`/projects/${catalogId}/tables`, tableData);
        return response.data;
    }
    // ─── Column Methods (by name) ──────────────────────────────────────
    async listAttributes(catalogName, collectionName) {
        const response = await this.client.get(`/columns/${catalogName}/${collectionName}`);
        return response.data;
    }
    async addColumn(catalogName, collectionName, columnData) {
        const response = await this.client.post(`/columns/${catalogName}/${collectionName}`, columnData);
        return response.data;
    }
    async addColumns(catalogName, collectionName, columnsData) {
        const response = await this.client.post(`/columns/${catalogName}/${collectionName}/bulk`, columnsData);
        return response.data;
    }
    // ─── Asset Methods (by name — existing) ────────────────────────────
    async listDataAssets(catalogName, collectionName) {
        const response = await this.client.get(`/assets/${catalogName}/${collectionName}`);
        return response.data;
    }
    async uploadFile(catalogName, collectionName, filePath, transform = true) {
        const form = new FormData();
        form.append('upload_files', fs.createReadStream(filePath));
        const response = await this.client.post(`/upload/${catalogName}/${collectionName}`, form, {
            params: { transform },
            headers: { ...form.getHeaders() },
        });
        return response.data;
    }
    async ingestData(catalogName, collectionName, text, transform = true) {
        const form = new FormData();
        form.append('plain_text', text);
        const response = await this.client.post(`/upload/${catalogName}/${collectionName}`, form, {
            params: { transform },
            headers: { ...form.getHeaders() },
        });
        return response.data;
    }
    // ─── Table Management (by table_id) ────────────────────────────────
    async getTableJsonSchema(tableId) {
        const response = await this.client.get(`/tables/${tableId}/json`);
        return response.data;
    }
    async updateTable(tableId, info) {
        const response = await this.client.put(`/tables/${tableId}`, info);
        return response.data;
    }
    async deleteTable(tableId) {
        const response = await this.client.delete(`/tables/${tableId}`);
        return response.data;
    }
    // ─── Asset Management (by table_id) ────────────────────────────────
    async listAssets(tableId, page = 1, limit = 10, status, createdAtFrom, createdAtTo) {
        const params = { page, limit };
        if (status)
            params.status = status;
        if (createdAtFrom)
            params.created_at_from = createdAtFrom;
        if (createdAtTo)
            params.created_at_to = createdAtTo;
        const response = await this.client.get(`/tables/${tableId}/assets`, { params });
        return response.data;
    }
    async getAssetsCount(tableId) {
        const response = await this.client.get(`/projects/${tableId}/tables/count`);
        return response.data;
    }
    async getAssetContent(tableId, assetId) {
        const response = await this.client.get(`/tables/${tableId}/assets/${assetId}`);
        return response.data;
    }
    async createAssets(tableId, filePaths = [], options = {}) {
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
    async deleteAsset(tableId, assetId) {
        const response = await this.client.delete(`/tables/${tableId}/assets/${assetId}`);
        return response.data;
    }
    // ─── Column Management (by table_id) ───────────────────────────────
    async getColumns(tableId) {
        const response = await this.client.get(`/tables/${tableId}/columns`);
        return response.data;
    }
    async getColumnsCount(tableId) {
        const response = await this.client.get(`/tables/${tableId}/columns/count`);
        return response.data;
    }
    async createColumn(tableId, info) {
        const response = await this.client.post(`/tables/${tableId}/columns`, info);
        return response.data;
    }
    async createColumnsBulk(tableId, info) {
        const response = await this.client.post(`/tables/${tableId}/columns/bulk`, info);
        return response.data;
    }
    async updateColumn(tableId, info) {
        const response = await this.client.put(`/tables/${tableId}/columns`, info);
        return response.data;
    }
    async deleteColumn(tableId, columnId) {
        const response = await this.client.delete(`/tables/${tableId}/columns/${columnId}`);
        return response.data;
    }
    // ─── Data / Asset-Column Values ────────────────────────────────────
    // Note: column values (values[]) are embedded in each asset returned by listAssets.
    async updateAssetColumnValue(tableId, assetId, columnId, info) {
        const response = await this.client.put(`/tables/${tableId}/assets/${assetId}/columns/${columnId}/value_data`, info);
        return response.data;
    }
    async deleteAssetColumn(tableId) {
        const response = await this.client.delete(`/tables/${tableId}/asset_column`);
        return response.data;
    }
    // ─── Export ────────────────────────────────────────────────────────
    async exportJson(tableId) {
        const response = await this.client.get(`/tables/${tableId}/export/json`);
        return response.data;
    }
    async exportCsv(tableId) {
        const response = await this.client.get(`/tables/${tableId}/export/csv`, {
            responseType: 'text',
        });
        return response.data;
    }
    async exportExcel(tableId) {
        const response = await this.client.get(`/tables/${tableId}/export/excel`, {
            responseType: 'arraybuffer',
        });
        return response.data;
    }
    // ─── Files ─────────────────────────────────────────────────────────
    async getTableFiles(tableId, limit = 5) {
        const response = await this.client.get(`/tables/${tableId}/files`, {
            params: { limit },
        });
        return response.data;
    }
    // ─── Skill Management ──────────────────────────────────────────────
    async listSkills(projectId) {
        const response = await this.client.get(`/projects/${projectId}/skills`);
        return response.data;
    }
    async getSkill(projectId, skillId) {
        const response = await this.client.get(`/projects/${projectId}/skills/${skillId}`);
        return response.data;
    }
    async createSkill(projectId, data) {
        const response = await this.client.post(`/projects/${projectId}/skills`, data);
        return response.data;
    }
    async updateSkill(projectId, skillId, data) {
        const response = await this.client.put(`/projects/${projectId}/skills/${skillId}`, data);
        return response.data;
    }
    async deleteSkill(projectId, skillId) {
        await this.client.delete(`/projects/${projectId}/skills/${skillId}`);
    }
    async reloadSkills(projectId) {
        const response = await this.client.post(`/projects/${projectId}/skills/reload`);
        return response.data;
    }
}
