# Datalog Studio MCP Server

This MCP server allows you to integrate with the Datalog Studio REST API. It provides tools to explore projects, tables, columns, and assets, as well as tools to upload content.

## Features

- **List Projects**: Discover available projects in your workspace.
- **List Tables**: View collections and data structures within a project.
- **List Columns**: Understand the schema and AI prompt templates for each table.
- **List Assets**: See uploaded documents and files.
- **Upload Content**: Push plain text directly into a collection for AI processing.

## Setup

### Environment Variables

- `DATALOG_API_KEY`: Your Datalog Studio API Key (e.g., `catalog_ak_...`).

### Installation

```bash
cd datalog-mcp-server
npm install
npm run build
```

## Integration with gemini-cli

Add the following to your MCP configuration (e.g., `~/.config/gemini-cli/mcp.json` or similar):

```json
{
  "mcpServers": {
    "datalog": {
      "command": "node",
      "args": ["/absolute/path/to/datalog-mcp-server/dist/index.js"],
      "env": {
        "DATALOG_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Tools

- `list_projects(workspace_id?)`
- `list_tables(project_id)`
- `list_columns(project_name, collection_name)`
- `list_assets(project_name, collection_name)`
- `upload_text(project_name, collection_name, text, transform?)`
