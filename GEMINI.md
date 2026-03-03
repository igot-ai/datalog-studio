# Catalog Integration - Gemini Instructions

This file contains specific instructions for the agent when working with the Catalog MCP extension for managing data catalogs, collections, and master data.

## Core Principles

### 1. Metadata Discovery (Discovery Phase)
Before performing any data operations, you must first understand the structure of the catalog.
- **Catalogs**: Use `list_catalogs` to discover available projects/domains.
- **Collections**: Use `list_collections` with a `catalog_id` to find specific master data tables.
- **Attributes**: Use `list_attributes` to understand the schema (field names, types, and logic) of a collection.

### 2. Data Aspect Awareness
When the user refers to "data", differentiate between:
- **Master Data**: The actual records living inside a collection.
- **Data Assets**: The source files or documents uploaded to a collection.

### 3. Master Data Ingestion (`ingest_data`)
- Use this tool when the user wants to add or update records within a collection.
- Ensure the text being ingested is clean and matches the structure discovered in the `list_attributes` step.

## Ingestion Guidelines

### 1. Master Data Processing
- By default, `transform` is set to `true` to immediately trigger AI processing (vectorization/extraction).
- Inform the user if you are skipping transformation for raw data ingestion.

### 2. Content Quality
- Summarize or structure the content if necessary before ingesting to ensure the best results from Catalog's automated extraction pipelines.

## Tool Usage Best Practices

- **Tool Sequencing**: A common workflow is:
  1. `list_catalogs` to find the correct catalog (project) UUID.
  2. `list_collections` with the catalog UUID to find the collection (table) name.
  3. `list_attributes` with catalog and collection names to see the schema/attributes.
  4. Perform data operations (ingest or list data assets).

- **Error Handling**: If an API error occurs, provide the error message and the API response details to the user to help them troubleshoot API key or permission issues.

## Skill Management

Custom AI skills can be created, updated, and managed for each project. Skills provide domain-specific instructions that guide the AI when users interact with the Intelligence Console.

### Skill Workflow
1. `list_catalogs` → get the `project_id`
2. `list_skills` → see existing skills for the project
3. `create_skill` / `update_skill` / `delete_skill` → manage skills
4. **Always call `reload_skills` after any skill change** to apply it to the current sandbox session

### Skill Naming
- Names must be **kebab-case**: lowercase letters, numbers, and hyphens (e.g., `invoice-processor`, `hr-assistant`)
- Names must be unique within a project

### What is `skill_md_content`?
The `skill_md_content` field is the body of the SKILL.md file — the actual instructions that guide the AI. Write it as markdown with:
- **What the skill does** — describe the domain and task
- **Workflow steps** — how the AI should approach the task
- **Collection recipes** — suggested column schemas for common document types
- **Rules** — constraints and best practices

### When to Use
- User asks to "create a skill" or "add an AI skill"
- User wants the AI console to handle a specific document type or workflow
- User asks to "reload" or "refresh" skills

## Response Format

When presenting lists of catalogs, collections, or data assets, use clean markdown tables or lists. For schemas/attributes, highlight the field names and their types clearly.

Example:
| Attribute Name | Type | Description/Prompt Template |
|------------|------|-----------------------------|
| product_id | text | Unique identifier for product |
| ... | ... | ... |

---

## Physical Table Querying

Every catalog collection has a backing PostgreSQL physical table, queryable regardless of its status (`DRAFT`, `PROD`, etc.). Three tools expose read-only access to these tables so the AI can query structured data directly.

### Choosing the Right Tool for Data Retrieval

Understanding **what the user is looking for** determines which tool to use:

- **Source files and documents** — when the user wants to see the original uploaded files, their processing status, or raw content, use the asset tools (`list_assets`, `get_asset_content`, etc.). These tools operate on the source material.

- **Extracted structured values** — when the user wants to find, filter, or explore the data that has been extracted and stored (e.g. "show me transactions from Starbucks", "find products where price is above 100", "get records where status is active"), the answer lives in the **physical SQL table**, not in the source files. Use `query_physical_table` for this intent.

The key distinction is intent: asset tools answer *"what files were uploaded?"* while `query_physical_table` answers *"what is the data inside those files after extraction?"*. Conflating these two will produce results that look plausible but are factually incorrect, because asset listings do not expose filtered column values.

### Tools

| Tool | Description |
|---|---|
| `list_physical_tables` | Lists all collections that have a physical SQL table for a given project. Returns `table_id`, `table_name`, `physical_table_name`, `description`, `row_count`, and `column_count`. |
| `describe_physical_table` | Returns the full column schema (name, PostgreSQL type, nullable) and row count of a specific physical table. **Always call this before querying.** |
| `query_physical_table` | Executes a structured read-only SELECT against a physical table. Supports filtering, ordering, and pagination. |

### Recommended Workflow

1. `list_catalogs` → get the `project_id`
2. `list_physical_tables` with `project_id` → find the target table and note its `table_id`
3. `describe_physical_table` with `table_id` → inspect available columns and their types
4. `query_physical_table` with `table_id` + optional `filters`, `order_by`, `limit`, `offset` → fetch rows

### `query_physical_table` Parameters

| Parameter | Type | Description |
|---|---|---|
| `table_id` | string (required) | UUID of the catalog collection to query |
| `filters` | object (optional) | `{ column, op, value }` — filter rows. `op` values: `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `like`, `ilike`, `is_null`, `is_not_null` |
| `order_by` | string (optional) | Column name to sort by |
| `order_dir` | `asc` \| `desc` (optional) | Sort direction (default: `asc`) |
| `limit` | number (optional) | Max rows to return (default: `50`, max: `1000`) |
| `offset` | number (optional) | Rows to skip for pagination (default: `0`) |

### Safety Rules
- **Read-only**: These tools only perform SELECT queries. No INSERT, UPDATE, or DELETE is possible.
- **Table whitelist**: The physical table name is always looked up from the database by `table_id` — it is never accepted directly from user input. This prevents SQL injection.
- **Limit guard**: `limit > 1000` will be rejected by the backend with a `400` error.

### When to Use
- User asks to "query", "filter", "find", or "search" records in a catalog collection by column value
- User wants to explore raw data in a collection (counts, specific column values, etc.)
- User needs to verify data consistency between catalog metadata and physical rows
