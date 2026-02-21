#!/usr/bin/env node

/**
 * MCP server for Catalog integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { DataStudioClient } from './datalogClient.js';

class DataStudioServer {
  private server: Server;
  private dataClient: DataStudioClient;

  constructor() {
    const apiKey = process.env.DATALOG_API_KEY || '';
    const domain = process.env.DATALOG_API || 'https://studio.igot.ai';
    const uri = process.env.DATALOG_URI || '/v1/catalog';
    const session = process.env.SESSION_ID;
    this.dataClient = new DataStudioClient(apiKey, domain, uri, session);

    this.server = new Server(
      {
        name: 'catalog-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // ─── Existing tools ────────────────────────────────────
          {
            name: 'list_catalogs',
            description: 'List all available data catalogs',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'create_project',
            description: 'Create a new data catalog project',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The slug of the project title (e.g., "my-project")',
                },
                title: {
                  type: 'string',
                  description: 'The display title of the project',
                },
                description: {
                  type: 'string',
                  description: 'Optional description of the project',
                },
                project_type: {
                  type: 'string',
                  description: 'Type of project (DATA or ONTOLOGY)',
                  enum: ['DATA', 'ONTOLOGY'],
                },
                domain: {
                  type: 'string',
                  description: 'Optional vertical domain or department',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional data tags',
                },
              },
              required: ['name', 'title', 'project_type'],
            },
          },
          {
            name: 'create_table',
            description: 'Create a new table within a specific catalog',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The UUID of the catalog (project)',
                },
                name: {
                  type: 'string',
                  description: 'Name of the table',
                },
                table_type: {
                  type: 'string',
                  description: 'Type of table (default: TABLE)',
                  default: 'TABLE',
                },
                description: {
                  type: 'string',
                  description: 'Optional description of the table',
                },
                status: {
                  type: 'string',
                  description: 'Status of the table (default: DRAFT)',
                  default: 'DRAFT',
                },
                model_transform: {
                  type: 'string',
                  description: 'AI transform model (FLASH, BASIC, MAX)',
                  default: 'FLASH',
                },
                language: {
                  type: 'string',
                  description: 'Language of the content (default: English)',
                  default: 'English',
                },
                model_reasoning: {
                  type: 'string',
                  description: 'Optional reasoning model for BASIC',
                },
              },
              required: ['project_id', 'name'],
            },
          },
          {
            name: 'list_collections',
            description: 'List all collections (master data tables) within a specific catalog',
            inputSchema: {
              type: 'object',
              properties: {
                catalog_id: {
                  type: 'string',
                  description: 'The UUID of the catalog (project)',
                },
              },
              required: ['catalog_id'],
            },
          },
          {
            name: 'list_attributes',
            description: 'List attributes and schema for a specific collection (by project/collection name)',
            inputSchema: {
              type: 'object',
              properties: {
                catalog_name: {
                  type: 'string',
                  description: 'Name of the catalog',
                },
                collection_name: {
                  type: 'string',
                  description: 'Name of the collection',
                },
              },
              required: ['catalog_name', 'collection_name'],
            },
          },
          {
            name: 'list_data_assets',
            description: 'List all data assets (uploaded files) in a specific collection (by project/collection name)',
            inputSchema: {
              type: 'object',
              properties: {
                catalog_name: {
                  type: 'string',
                  description: 'Name of the catalog',
                },
                collection_name: {
                  type: 'string',
                  description: 'Name of the collection',
                },
              },
              required: ['catalog_name', 'collection_name'],
            },
          },
          {
            name: 'ingest_data',
            description: 'Ingest plain text data into a catalog collection for master data processing',
            inputSchema: {
              type: 'object',
              properties: {
                catalog_name: {
                  type: 'string',
                  description: 'Name of the catalog',
                },
                collection_name: {
                  type: 'string',
                  description: 'Name of the collection',
                },
                text: {
                  type: 'string',
                  description: 'Content to ingest',
                },
                transform: {
                  type: 'boolean',
                  description: 'Whether to trigger AI transformation immediately (default: true)',
                  default: true,
                },
              },
              required: ['catalog_name', 'collection_name', 'text'],
            },
          },
          {
            name: 'add_column',
            description: 'Add a new column to a catalog collection (by project/collection name)',
            inputSchema: {
              type: 'object',
              properties: {
                catalog_name: {
                  type: 'string',
                  description: 'Name of the catalog',
                },
                collection_name: {
                  type: 'string',
                  description: 'Name of the collection',
                },
                name: {
                  type: 'string',
                  description: 'Unique name for the column (alphanumeric, underscores)',
                },
                data_type: {
                  type: 'string',
                  description: 'Data type (number, text, boolean, datetime, table, table_markdown, json, markdown, static, agent)',
                  enum: [
                    'number',
                    'text',
                    'boolean',
                    'datetime',
                    'table',
                    'table_markdown',
                    'json',
                    'markdown',
                    'static',
                    'agent',
                  ],
                },
                content_location: {
                  type: 'string',
                  description: 'Visual alignment (top-left, center, top-right, etc.)',
                  default: 'top-left',
                },
                scan_ranges: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Pages or ranges to scan (e.g., ["all"], ["1"], ["1-5"])',
                },
                prompt_template: {
                  type: 'string',
                  description: 'AI task description or static value',
                },
                agent_id: {
                  type: 'string',
                  description: 'Required if data_type is agent',
                },
                config: {
                  type: 'object',
                  properties: {
                    multi_hop: {
                      type: 'number',
                      description: 'Reasoning level (0: Fast, 1: Normal, 2: High, 3: Max)',
                    },
                  },
                },
              },
              required: ['catalog_name', 'collection_name', 'name', 'data_type', 'content_location', 'scan_ranges'],
            },
          },
          {
            name: 'add_columns',
            description: 'Add multiple columns to a catalog collection (bulk, by project/collection name)',
            inputSchema: {
              type: 'object',
              properties: {
                catalog_name: {
                  type: 'string',
                  description: 'Name of the catalog',
                },
                collection_name: {
                  type: 'string',
                  description: 'Name of the collection',
                },
                columns: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Unique name for the column (alphanumeric, underscores)',
                      },
                      data_type: {
                        type: 'string',
                        description: 'Data type',
                        enum: [
                          'number',
                          'text',
                          'boolean',
                          'datetime',
                          'table',
                          'table_markdown',
                          'json',
                          'markdown',
                          'static',
                          'agent',
                        ],
                      },
                      content_location: {
                        type: 'string',
                        description: 'Visual alignment',
                        default: 'top-left',
                      },
                      scan_ranges: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Pages or ranges to scan',
                      },
                      prompt_template: {
                        type: 'string',
                        description: 'AI task description or static value',
                      },
                      agent_id: {
                        type: 'string',
                        description: 'Required if data_type is agent',
                      },
                      config: {
                        type: 'object',
                        properties: {
                          multi_hop: {
                            type: 'number',
                            description: 'Reasoning level',
                          },
                        },
                      },
                    },
                    required: ['name', 'data_type', 'content_location', 'scan_ranges'],
                  },
                },
              },
              required: ['catalog_name', 'collection_name', 'columns'],
            },
          },

          // ─── Table Management (by table_id) ──────────────────────
          {
            name: 'get_table_schema',
            description: 'Get the JSON schema of a table by its ID',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
              },
              required: ['table_id'],
            },
          },
          {
            name: 'update_table',
            description: 'Update table metadata (name, description, status, table_type)',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                name: {
                  type: 'string',
                  description: 'New name for the table',
                },
                description: {
                  type: 'string',
                  description: 'New description for the table',
                },
                table_type: {
                  type: 'string',
                  description: 'New table type',
                },
                status: {
                  type: 'string',
                  description: 'New status',
                },
              },
              required: ['table_id'],
            },
          },
          {
            name: 'delete_table',
            description: 'Delete a table and all its associated assets',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table to delete',
                },
              },
              required: ['table_id'],
            },
          },

          // ─── Asset Management (by table_id) ──────────────────────
          {
            name: 'list_assets',
            description: 'List assets (uploaded files) in a table with pagination',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                page: {
                  type: 'number',
                  description: 'Page number (default: 1)',
                  default: 1,
                },
                limit: {
                  type: 'number',
                  description: 'Items per page (default: 10)',
                  default: 10,
                },
              },
              required: ['table_id'],
            },
          },
          {
            name: 'get_assets_count',
            description: 'Get the count of assets in a table',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
              },
              required: ['table_id'],
            },
          },
          {
            name: 'get_asset_content',
            description: 'Get the content of a specific asset (file) as base64',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                asset_id: {
                  type: 'string',
                  description: 'The UUID of the asset',
                },
              },
              required: ['table_id', 'asset_id'],
            },
          },
          {
            name: 'create_assets',
            description: 'Create assets in a table by uploading text or providing plain text content',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                plain_text: {
                  type: 'string',
                  description: 'Plain text content to ingest as an asset',
                },
                source_id: {
                  type: 'string',
                  description: 'Optional source identifier',
                },
                column_static_data: {
                  type: 'object',
                  description: 'Optional static data for columns (key-value pairs)',
                },
                transform: {
                  type: 'boolean',
                  description: 'Whether to trigger AI transformation (default: false)',
                  default: false,
                },
              },
              required: ['table_id'],
            },
          },
          {
            name: 'delete_asset',
            description: 'Delete a specific asset from a table',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                asset_id: {
                  type: 'string',
                  description: 'The UUID of the asset to delete',
                },
              },
              required: ['table_id', 'asset_id'],
            },
          },

          // ─── Column Management (by table_id) ─────────────────────
          {
            name: 'get_columns',
            description: 'Get all columns for a table by its ID',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
              },
              required: ['table_id'],
            },
          },
          {
            name: 'get_columns_count',
            description: 'Get the count of columns in a table',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
              },
              required: ['table_id'],
            },
          },
          {
            name: 'create_column',
            description: 'Create a single column in a table by table ID',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                name: {
                  type: 'string',
                  description: 'Column name',
                },
                data_type: {
                  type: 'string',
                  description: 'Data type',
                  enum: ['number', 'text', 'boolean', 'datetime', 'table', 'table_markdown', 'json', 'markdown', 'static', 'agent'],
                },
                content_location: {
                  type: 'string',
                  description: 'Visual alignment (default: top-left)',
                  default: 'top-left',
                },
                scan_ranges: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Pages or ranges to scan',
                },
                prompt_template: { type: 'string', description: 'AI task description' },
                agent_id: { type: 'string', description: 'Agent ID if data_type is agent' },
                config: {
                  type: 'object',
                  properties: { multi_hop: { type: 'number' } },
                },
              },
              required: ['table_id', 'name', 'data_type', 'content_location', 'scan_ranges'],
            },
          },
          {
            name: 'create_columns_bulk',
            description: 'Create multiple columns in a table by table ID (bulk)',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                columns: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      data_type: {
                        type: 'string',
                        enum: ['number', 'text', 'boolean', 'datetime', 'table', 'table_markdown', 'json', 'markdown', 'static', 'agent'],
                      },
                      content_location: { type: 'string', default: 'top-left' },
                      scan_ranges: { type: 'array', items: { type: 'string' } },
                      prompt_template: { type: 'string' },
                      agent_id: { type: 'string' },
                      config: { type: 'object', properties: { multi_hop: { type: 'number' } } },
                    },
                    required: ['name', 'data_type', 'content_location', 'scan_ranges'],
                  },
                },
              },
              required: ['table_id', 'columns'],
            },
          },
          {
            name: 'update_column',
            description: 'Update a column in a table',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                id: {
                  type: 'string',
                  description: 'The column ID to update',
                },
                name: { type: 'string', description: 'New column name' },
                data_type: { type: 'string', description: 'New data type' },
                content_location: { type: 'string', description: 'New alignment' },
                scan_ranges: { type: 'array', items: { type: 'string' } },
                prompt_template: { type: 'string' },
                agent_id: { type: 'string' },
                config: { type: 'object', properties: { multi_hop: { type: 'number' } } },
              },
              required: ['table_id', 'id'],
            },
          },
          {
            name: 'delete_column',
            description: 'Delete a column from a table',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                column_id: {
                  type: 'string',
                  description: 'The UUID of the column to delete',
                },
              },
              required: ['table_id', 'column_id'],
            },
          },

          // ─── Data / Asset-Column Values ──────────────────────────
          {
            name: 'get_asset_column_values',
            description: 'Get all asset-column values (extracted data) for a table',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
              },
              required: ['table_id'],
            },
          },
          {
            name: 'get_data_assets',
            description: 'Get column values for specific assets in a table',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                asset_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of asset IDs to query',
                },
              },
              required: ['table_id', 'asset_ids'],
            },
          },
          {
            name: 'update_cell_value',
            description: 'Update a specific cell value (asset + column intersection)',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                asset_id: {
                  type: 'string',
                  description: 'The UUID of the asset (row)',
                },
                column_id: {
                  type: 'string',
                  description: 'The UUID of the column',
                },
                value: {
                  type: 'string',
                  description: 'The new value for the cell',
                },
              },
              required: ['table_id', 'asset_id', 'column_id', 'value'],
            },
          },
          {
            name: 'delete_asset_column_data',
            description: 'Delete all asset-column data for a table',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
              },
              required: ['table_id'],
            },
          },

          // ─── Export ──────────────────────────────────────────────
          {
            name: 'export_json',
            description: 'Export table data as JSON',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table to export',
                },
              },
              required: ['table_id'],
            },
          },
          {
            name: 'export_csv',
            description: 'Export table data as CSV',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table to export',
                },
              },
              required: ['table_id'],
            },
          },
          {
            name: 'export_excel',
            description: 'Export table data as Excel (xlsx)',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table to export',
                },
              },
              required: ['table_id'],
            },
          },

          // ─── Files ──────────────────────────────────────────────
          {
            name: 'get_table_files',
            description: 'List files for a specific table',
            inputSchema: {
              type: 'object',
              properties: {
                table_id: {
                  type: 'string',
                  description: 'The UUID of the table',
                },
                limit: {
                  type: 'number',
                  description: 'Max number of files to return (default: 5)',
                  default: 5,
                },
              },
              required: ['table_id'],
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
          content: [
            {
              type: 'text',
              text: 'Error: DATALOG_API_KEY is not set. Please configure your API key in settings or as an environment variable.',
            },
          ],
          isError: true,
        };
      }

      try {
        switch (name) {
          // ─── Existing tools ──────────────────────────────────
          case 'list_catalogs': {
            const catalogs = await this.dataClient.listCatalogs();
            return {
              content: [{ type: 'text', text: JSON.stringify(catalogs, null, 2) }],
            };
          }

          case 'create_project': {
            const project = await this.dataClient.createProject(args as any);
            return {
              content: [{ type: 'text', text: `Project created successfully: ${JSON.stringify(project, null, 2)}` }],
            };
          }

          case 'create_table': {
            const { project_id, ...tableData } = args as any;
            const table = await this.dataClient.createTable(project_id, args as any);
            return {
              content: [{ type: 'text', text: `Table created successfully: ${JSON.stringify(table, null, 2)}` }],
            };
          }

          case 'list_collections': {
            const collections = await this.dataClient.listCollections(args?.catalog_id as string);
            return {
              content: [{ type: 'text', text: JSON.stringify(collections, null, 2) }],
            };
          }

          case 'list_attributes': {
            const attributes = await this.dataClient.listAttributes(
              args?.catalog_name as string,
              args?.collection_name as string,
            );
            return {
              content: [{ type: 'text', text: JSON.stringify(attributes, null, 2) }],
            };
          }

          case 'list_data_assets': {
            const assets = await this.dataClient.listDataAssets(
              args?.catalog_name as string,
              args?.collection_name as string,
            );
            return {
              content: [{ type: 'text', text: JSON.stringify(assets, null, 2) }],
            };
          }

          case 'ingest_data': {
            const result = await this.dataClient.ingestData(
              args?.catalog_name as string,
              args?.collection_name as string,
              args?.text as string,
              args?.transform as boolean,
            );
            return {
              content: [{ type: 'text', text: `Ingestion successful: ${JSON.stringify(result)}` }],
            };
          }

          case 'add_column': {
            const { catalog_name, collection_name, ...columnData } = args as any;
            const result = await this.dataClient.addColumn(
              catalog_name as string,
              collection_name as string,
              columnData,
            );
            return {
              content: [{ type: 'text', text: `Column added successfully: ${JSON.stringify(result)}` }],
            };
          }

          case 'add_columns': {
            const result = await this.dataClient.addColumns(
              args?.catalog_name as string,
              args?.collection_name as string,
              args?.columns as any[],
            );
            return {
              content: [{ type: 'text', text: `Bulk columns added successfully: ${JSON.stringify(result)}` }],
            };
          }

          // ─── Table Management ────────────────────────────────
          case 'get_table_schema': {
            const schema = await this.dataClient.getTableJsonSchema(args?.table_id as string);
            return {
              content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }],
            };
          }

          case 'update_table': {
            const { table_id, ...updateInfo } = args as any;
            const table = await this.dataClient.updateTable(table_id, updateInfo);
            return {
              content: [{ type: 'text', text: `Table updated: ${JSON.stringify(table)}` }],
            };
          }

          case 'delete_table': {
            await this.dataClient.deleteTable(args?.table_id as string);
            return {
              content: [{ type: 'text', text: 'Table deleted successfully' }],
            };
          }

          // ─── Asset Management (by table_id) ──────────────────
          case 'list_assets': {
            const assets = await this.dataClient.listAssets(
              args?.table_id as string,
              args?.page as number,
              args?.limit as number,
            );
            return {
              content: [{ type: 'text', text: JSON.stringify(assets, null, 2) }],
            };
          }

          case 'get_assets_count': {
            const count = await this.dataClient.getAssetsCount(args?.table_id as string);
            return {
              content: [{ type: 'text', text: `Assets count: ${count}` }],
            };
          }

          case 'get_asset_content': {
            const assetContent = await this.dataClient.getAssetContent(
              args?.table_id as string,
              args?.asset_id as string,
            );
            return {
              content: [{ type: 'text', text: JSON.stringify(assetContent, null, 2) }],
            };
          }

          case 'create_assets': {
            const result = await this.dataClient.createAssets(
              args?.table_id as string,
              [], // file paths not supported via MCP tool — use plain_text instead
              {
                plainText: args?.plain_text as string,
                sourceId: args?.source_id as string,
                columnStaticData: args?.column_static_data as Record<string, any>,
                transform: args?.transform as boolean,
              },
            );
            return {
              content: [{ type: 'text', text: `Assets created: ${JSON.stringify(result)}` }],
            };
          }

          case 'delete_asset': {
            await this.dataClient.deleteAsset(
              args?.table_id as string,
              args?.asset_id as string,
            );
            return {
              content: [{ type: 'text', text: 'Asset deleted successfully' }],
            };
          }

          // ─── Column Management (by table_id) ─────────────────
          case 'get_columns': {
            const columns = await this.dataClient.getColumns(args?.table_id as string);
            return {
              content: [{ type: 'text', text: JSON.stringify(columns, null, 2) }],
            };
          }

          case 'get_columns_count': {
            const count = await this.dataClient.getColumnsCount(args?.table_id as string);
            return {
              content: [{ type: 'text', text: `Columns count: ${count}` }],
            };
          }

          case 'create_column': {
            const { table_id: tId, ...colData } = args as any;
            const col = await this.dataClient.createColumn(tId, colData);
            return {
              content: [{ type: 'text', text: `Column created: ${JSON.stringify(col)}` }],
            };
          }

          case 'create_columns_bulk': {
            const result = await this.dataClient.createColumnsBulk(
              args?.table_id as string,
              args?.columns as any[],
            );
            return {
              content: [{ type: 'text', text: `Bulk columns created: ${JSON.stringify(result)}` }],
            };
          }

          case 'update_column': {
            const { table_id: tableId, ...colUpdateData } = args as any;
            const updatedCol = await this.dataClient.updateColumn(tableId, colUpdateData);
            return {
              content: [{ type: 'text', text: `Column updated: ${JSON.stringify(updatedCol)}` }],
            };
          }

          case 'delete_column': {
            await this.dataClient.deleteColumn(
              args?.table_id as string,
              args?.column_id as string,
            );
            return {
              content: [{ type: 'text', text: 'Column deleted successfully' }],
            };
          }

          // ─── Data / Asset-Column Values ──────────────────────
          case 'get_asset_column_values': {
            const values = await this.dataClient.getAssetColumnValues(args?.table_id as string);
            return {
              content: [{ type: 'text', text: JSON.stringify(values, null, 2) }],
            };
          }

          case 'get_data_assets': {
            const values = await this.dataClient.getAssetColumnByAssets(
              args?.table_id as string,
              args?.asset_ids as string[],
            );
            return {
              content: [{ type: 'text', text: JSON.stringify(values, null, 2) }],
            };
          }

          case 'update_cell_value': {
            const result = await this.dataClient.updateAssetColumnValue(
              args?.table_id as string,
              args?.asset_id as string,
              args?.column_id as string,
              { value: args?.value as string },
            );
            return {
              content: [{ type: 'text', text: `Cell value updated: ${JSON.stringify(result)}` }],
            };
          }

          case 'delete_asset_column_data': {
            await this.dataClient.deleteAssetColumn(args?.table_id as string);
            return {
              content: [{ type: 'text', text: 'Asset column data deleted successfully' }],
            };
          }

          // ─── Export ──────────────────────────────────────────
          case 'export_json': {
            const data = await this.dataClient.exportJson(args?.table_id as string);
            return {
              content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
            };
          }

          case 'export_csv': {
            const csv = await this.dataClient.exportCsv(args?.table_id as string);
            return {
              content: [{ type: 'text', text: csv }],
            };
          }

          case 'export_excel': {
            const buffer = await this.dataClient.exportExcel(args?.table_id as string);
            const base64 = Buffer.from(buffer).toString('base64');
            return {
              content: [{ type: 'text', text: `Excel exported (base64, ${buffer.length} bytes): ${base64.substring(0, 100)}...` }],
            };
          }

          // ─── Files ──────────────────────────────────────────
          case 'get_table_files': {
            const files = await this.dataClient.getTableFiles(
              args?.table_id as string,
              args?.limit as number,
            );
            return {
              content: [{ type: 'text', text: JSON.stringify(files, null, 2) }],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
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

  private setupErrorHandling() {
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
    console.error('Catalog MCP server running on stdio');
  }
}

const server = new DataStudioServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
