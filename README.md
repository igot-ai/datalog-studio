# Datalog Studio MCP Extension

Professional MCP server for integrating Datalog Studio tasks into the Gemini CLI. Manage projects, tables, and assets using natural language.

## Features

- **Project Discovery**: List and find projects within your Datalog workspace.
- **Schema Management**: Explore collections, columns, and AI prompt templates.
- **Asset Control**: List uploaded documents and analyze data structures.
- **Data Ingestion**: Direct plain text upload with optional AI transformation.

## Quick Start

### 1. Prerequisites

- [Bun](https://bun.sh) runtime installed.

### 2. Installation

Install the extension and its dependencies:

```bash
bun run install-deps
bun run build
gemini extensions install .
```

### 3. Configuration

The extension requires a `DATALOG_API_KEY`. You will be prompted for this during installation, or you can set it as an environment variable.

## Development

Use the provided scripts for a professional development workflow:

- `bun run dev`: Start MCP server in watch mode.
- `bun run lint`: Run ESLint to find and fix issues.
- `bun run format`: Format code with Prettier.
- `bun run typecheck`: Run TypeScript type checking.
- `bun run preflight`: Run a full cleanup, install, lint, and build cycle.

## Tools Summary

- `list_projects()`: List all accessible projects.
- `list_tables(project_id)`: List collections in a specific project.
- `list_columns(project_name, collection_name)`: View table schema.
- `list_assets(project_name, collection_name)`: List uploaded files.
- `upload_text(project_name, collection_name, text, transform?)`: Ingest data.
