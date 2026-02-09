# Catalog MCP Extension

Professional MCP server for integrating Catalog tasks into the Gemini CLI. Manage data catalogs, collections, and master data using natural language.

## Features

- **Catalog Discovery**: List and find data catalogs within your workspace.
- **Master Data Management**: Explore collections, attributes, and AI prompt templates.
- **Data Asset Control**: List uploaded documents and analyze data structures.
- **Data Ingestion**: Direct data ingestion with automated AI transformation.

## Quick Start

### 1. Prerequisites

- [Node.js](https://nodejs.org) (v18+) and npm installed.

### 2. Installation

Install the extension and its dependencies:

```bash
npm run install-deps
npm run build
gemini extensions install .
```

### 3. Configuration

The extension requires a `DATALOG_API_KEY`. By default, it connects to `https://studio.igot.ai/v1/catalog`. 

For custom enterprise installations, you can configure the endpoint using:
- `DATALOG_API`: The domain endpoint (e.g., `https://enterprise.com`).
- `CATALOG_URI`: The API path suffix (e.g., `/v1/catalog`).

## Development

Use the provided scripts for a professional development workflow:

- `npm run dev`: Start MCP server in watch mode.
- `npm run lint`: Run ESLint to find and fix issues.
- `npm run format`: Format code with Prettier.
- `npm run typecheck`: Run TypeScript type checking.
- `npm run preflight`: Run a full cleanup, install, lint, and build cycle.

## Tools Summary

- `list_catalogs()`: List all accessible data catalogs.
- `list_collections(catalog_id)`: List collections in a specific catalog.
- `list_attributes(catalog_name, collection_name)`: View collection schema and attributes.
- `list_data_assets(catalog_name, collection_name)`: List uploaded files within a collection.
- `ingest_data(catalog_name, collection_name, text, transform?)`: Ingest master data into a collection.

