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

- **Extracted structured values** — when the user wants to find, filter, or explore the data that has been extracted and stored (e.g. "show me transactions from Starbucks", "find products where price is above 100", "get records where status is active"), the answer lives in the **physical SQL table**, not in the source files.

  - For **plain filtering / row retrieval** use `query_physical_table`.
  - For **distinct combinations** of column values (e.g. *"all unique categories"*, *"distinct merchants"*) use `query_physical_table` with `group_by`.
  - For **aggregations** (SUM, COUNT, AVG, MIN, MAX) or **HAVING** clauses use `aggregate_physical_table`.

The key distinction is intent:
- *"What files were uploaded?"* → asset tools
- *"What is the data inside those files?"* → `query_physical_table`
- *"How many / total / average / distinct groups?"* → `aggregate_physical_table`

Conflating these will produce results that look plausible but are factually incorrect.

### Tools

| Tool | Description |
|---|---|
| `list_physical_tables` | Lists all collections that have a physical SQL table for a given project. Returns `table_id`, `table_name`, `physical_table_name`, `description`, `row_count`, and `column_count`. |
| `describe_physical_table` | Returns the full column schema (name, PostgreSQL type, nullable) and row count of a specific physical table. **Always call this before querying.** |
| `query_physical_table` | Executes a structured read-only SELECT against a physical table. Supports optional GROUP BY (no aggregate functions), filtering, ordering and pagination. |
| `aggregate_physical_table` | Executes a GROUP BY + aggregate (COUNT / SUM / AVG / MIN / MAX) query. Supports pre-aggregation WHERE filters and post-aggregation HAVING filters. |

### Recommended Workflow

1. `list_catalogs` → get the `project_id`
2. `list_physical_tables` with `project_id` → find the target table and note its `table_id`
3. `describe_physical_table` with `table_id` → inspect available columns and their types
4a. `query_physical_table` → plain rows or distinct column combinations
4b. `aggregate_physical_table` → totals, counts, averages, grouped summaries

### `query_physical_table` Parameters

| Parameter | Type | Description |
|---|---|---|
| `table_id` | string (required) | UUID of the catalog collection to query |
| `group_by` | string[] (optional) | Columns to GROUP BY. Returns one row per distinct combination. Omit for plain `SELECT *`. When set, only those columns appear in rows. **Do not combine with aggregate functions — use `aggregate_physical_table` instead.** |
| `filters` | object (optional) | A `FilterGroup` — `{ operator, conditions }`. Supports nested AND/OR groups. `operator`: `"and"` or `"or"`. `conditions`: list of `{ column, op, value }` or nested `FilterGroup`. |
| `order_by` | string (optional) | Column name to sort by. When `group_by` is set, must be one of the grouped columns. |
| `order_dir` | `asc` \| `desc` (optional) | Sort direction (default: `asc`) |
| `limit` | number (optional) | Max rows to return (default: `50`, max: `1000`) |
| `offset` | number (optional) | Rows to skip for pagination (default: `0`) |

**Example — distinct categories (group_by, no aggregates):**
```json
{
  "table_id": "...",
  "group_by": ["txn_category_v1_0_0"],
  "order_by": "txn_category_v1_0_0"
}
```

**Example — top N rows** — *"show me the top 5 most recent transactions"*: use `limit` + `order_by`. Never fetch all rows and slice in memory.
```json
{
  "table_id": "...",
  "order_by": "txn_date_v1_0_0",
  "order_dir": "desc",
  "limit": 5
}
```

**Multi-condition example with OR** — *"filter category is meals or software, date in February 2026, and taxable is false"*:
```json
{
  "table_id": "...",
  "filters": {
    "operator": "and",
    "conditions": [
      {
        "operator": "or",
        "conditions": [
          { "column": "txn_category_v1_0_0", "op": "ilike", "value": "meals" },
          { "column": "txn_category_v1_0_0", "op": "ilike", "value": "software" }
        ]
      },
      { "column": "txn_date_v1_0_0",    "op": "gte", "value": "2026-02-01" },
      { "column": "txn_date_v1_0_0",    "op": "lte", "value": "2026-02-28" },
      { "column": "txn_taxable_v1_0_0", "op": "eq",  "value": "false" }
    ]
  }
}
```

> Never fetch all rows and filter the result in memory. Always push filter conditions into `filters` and let the database do the work.

---

## Aggregate Queries (`aggregate_physical_table`)

Use this tool — **not** `query_physical_table` — when you need a GROUP BY with aggregate functions (COUNT, SUM, AVG, MIN, MAX) or a post-aggregation HAVING filter.

### Quick Routing Guide

| User intent | Tool | Key parameters |
|---|---|---|
| "Show me all rows where …" | `query_physical_table` | `filters` |
| "What are all unique categories?" | `query_physical_table` | `group_by=["category"]` |
| "How many rows per category?" | `aggregate_physical_table` | `group_by=["category"]`, `aggregates=[{func:"count",alias:"n"}]` |
| "Total amount per merchant?" | `aggregate_physical_table` | `group_by=["merchant"]`, `aggregates=[{func:"sum",column:"amount",alias:"total"}]` |
| "Average score globally?" | `aggregate_physical_table` | `aggregates=[{func:"avg",column:"score",alias:"avg_score"}]` |
| "Categories with total > 500?" | `aggregate_physical_table` | above + `having` on alias |

### `aggregate_physical_table` Parameters

| Parameter | Type | Description |
|---|---|---|
| `table_id` | string (required) | UUID of the catalog collection |
| `aggregates` | array (required) | At least one `{ func, column, alias }`. `func`: `count`\|`sum`\|`avg`\|`min`\|`max`. `column`: physical column name, or `"*"` for COUNT(*). `alias`: valid identifier used as output key and referenced in `order_by` / `having`. |
| `group_by` | string[] (optional) | Columns to group by. Omit or pass `[]` for a global aggregation (single result row). |
| `filters` | object (optional) | Pre-aggregation WHERE filter — same `FilterGroup` format as `query_physical_table`. Applied **before** grouping. Use physical column names. |
| `having` | object (optional) | Post-aggregation HAVING filter — same `FilterGroup` format. Applied **after** grouping. Use aggregate **alias** names as column references, NOT original column names. |
| `order_by` | string (optional) | Must be a `group_by` column name OR an aggregate alias. |
| `order_dir` | `asc` \| `desc` (optional) | Sort direction (default: `asc`) |
| `limit` | number (optional) | Max rows (default: `50`, max: `1000`) |
| `offset` | number (optional) | Pagination offset (default: `0`) |

### Examples

**Count rows per category:**
```json
{
  "table_id": "...",
  "group_by": ["txn_category_v1_0_0"],
  "aggregates": [
    { "func": "count", "column": "*", "alias": "row_count" }
  ],
  "order_by": "row_count",
  "order_dir": "desc"
}
```

**Total and average amount per merchant, filtered to only PROD records:**
```json
{
  "table_id": "...",
  "group_by": ["txn_merchant_v1_0_0"],
  "aggregates": [
    { "func": "sum", "column": "txn_amount_v1_0_0", "alias": "total_amount" },
    { "func": "avg", "column": "txn_amount_v1_0_0", "alias": "avg_amount" },
    { "func": "count", "alias": "row_count" }
  ],
  "filters": {
    "operator": "and",
    "conditions": [
      { "column": "txn_status_v1_0_0", "op": "eq", "value": "PROD" }
    ]
  },
  "order_by": "total_amount",
  "order_dir": "desc"
}
```

**Categories where total amount > 500 (HAVING):**
```json
{
  "table_id": "...",
  "group_by": ["txn_category_v1_0_0"],
  "aggregates": [
    { "func": "sum", "column": "txn_amount_v1_0_0", "alias": "total_amount" }
  ],
  "having": {
    "operator": "and",
    "conditions": [
      { "column": "total_amount", "op": "gte", "value": "500" }
    ]
  },
  "order_by": "total_amount",
  "order_dir": "desc"
}
```

> **HAVING rule**: In the `having` filter, `column` must be an aggregate **alias** (e.g. `"total_amount"`), never an original physical column name.

### Safety Rules
- **Read-only**: These tools only perform SELECT queries. No INSERT, UPDATE, or DELETE is possible.
- **Table whitelist**: The physical table name is always looked up from the database by `table_id` — it is never accepted directly from user input. This prevents SQL injection.
- **Limit guard**: `limit > 1000` will be rejected by the backend with a `400` error.
- **`order_by` scope**: When `group_by` is set in `query_physical_table`, `order_by` must be one of the grouped columns. In `aggregate_physical_table`, `order_by` must be a `group_by` column or an aggregate alias.

### When to Use
- User asks to "query", "filter", "find", or "search" records in a catalog collection by column value → `query_physical_table`
- User wants distinct values of a column ("all unique categories") → `query_physical_table` with `group_by`
- User asks for totals, counts, averages, or grouped summaries → `aggregate_physical_table`
- User needs to verify data consistency between catalog metadata and physical rows → `query_physical_table`
