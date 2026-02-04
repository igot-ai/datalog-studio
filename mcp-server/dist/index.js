#!/usr/bin/env node
/**
 * MCP server for Datalog Studio integration
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { DatalogClient } from './datalogClient.js';
class DatalogServer {
    constructor() {
        const apiKey = process.env.DATALOG_API_KEY || '';
        this.datalogClient = new DatalogClient(apiKey);
        this.server = new Server({
            name: 'datalog-studio-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        this.setupErrorHandling();
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'list_projects',
                        description: 'List all projects in Datalog Studio',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                    {
                        name: 'list_tables',
                        description: 'List all tables (collections) in a specific project',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                project_id: {
                                    type: 'string',
                                    description: 'The UUID of the project',
                                },
                            },
                            required: ['project_id'],
                        },
                    },
                    {
                        name: 'list_columns',
                        description: 'List columns and schema for a specific table',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                project_name: {
                                    type: 'string',
                                    description: 'Name of the project',
                                },
                                collection_name: {
                                    type: 'string',
                                    description: 'Name of the collection/table',
                                },
                            },
                            required: ['project_name', 'collection_name'],
                        },
                    },
                    {
                        name: 'list_assets',
                        description: 'List all assets (uploaded files) in a specific table',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                project_name: {
                                    type: 'string',
                                    description: 'Name of the project',
                                },
                                collection_name: {
                                    type: 'string',
                                    description: 'Name of the collection/table',
                                },
                            },
                            required: ['project_name', 'collection_name'],
                        },
                    },
                    {
                        name: 'upload_text',
                        description: 'Upload plain text content to a Datalog table',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                project_name: {
                                    type: 'string',
                                    description: 'Name of the project',
                                },
                                collection_name: {
                                    type: 'string',
                                    description: 'Name of the collection/table',
                                },
                                text: {
                                    type: 'string',
                                    description: 'Content to upload',
                                },
                                transform: {
                                    type: 'boolean',
                                    description: 'Whether to trigger transformation immediately (default: true)',
                                    default: true,
                                },
                            },
                            required: ['project_name', 'collection_name', 'text'],
                        },
                    },
                ],
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            // Validate API key exists before execution
            if (!process.env.DATALOG_API_KEY) {
                return {
                    content: [{
                            type: 'text',
                            text: 'Error: DATALOG_API_KEY is not set. Please configure your API key in settings or as an environment variable.'
                        }],
                    isError: true,
                };
            }
            try {
                switch (name) {
                    case 'list_projects': {
                        const projects = await this.datalogClient.listProjects();
                        return {
                            content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
                        };
                    }
                    case 'list_tables': {
                        const tables = await this.datalogClient.listTables(args?.project_id);
                        return {
                            content: [{ type: 'text', text: JSON.stringify(tables, null, 2) }],
                        };
                    }
                    case 'list_columns': {
                        const columns = await this.datalogClient.listColumns(args?.project_name, args?.collection_name);
                        return {
                            content: [{ type: 'text', text: JSON.stringify(columns, null, 2) }],
                        };
                    }
                    case 'list_assets': {
                        const assets = await this.datalogClient.listAssets(args?.project_name, args?.collection_name);
                        return {
                            content: [{ type: 'text', text: JSON.stringify(assets, null, 2) }],
                        };
                    }
                    case 'upload_text': {
                        const result = await this.datalogClient.uploadPlainText(args?.project_name, args?.collection_name, args?.text, args?.transform);
                        return {
                            content: [{ type: 'text', text: `Upload successful: ${JSON.stringify(result)}` }],
                        };
                    }
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}${error.response ? `\nAPI Response: ${JSON.stringify(error.response.data)}` : ''}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Datalog Studio MCP server running on stdio');
    }
}
const server = new DatalogServer();
server.run().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
