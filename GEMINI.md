# Datalog Studio Integration - Gemini Instructions

This file contains specific instructions for the agent when working with the Datalog Studio MCP extension for managing projects, tables, and assets in Datalog Studio.

## Core Principles

### 1. Data Context Awareness

When the user asks about data or projects, always check the available projects and tables first using `list_projects` and `list_tables`. This ensures you have the most up-to-date schema information before performing operations.

### 2. Schema Discovery

Before attempting to upload data or query specific collections, use `list_columns` to understand the table's structure and any associated AI prompt templates. This helps in formatting data correctly for ingestion.

### 3. Asset Management

Use `list_assets` to verify existing documents in a collection. This prevents redundant uploads and helps in identifying relevant files for data analysis tasks.

## Ingestion Guidelines

### 1. Text Uploads (`upload_text`)

- When uploading text, ensure it is clean and relevant to the target collection's purpose.
- By default, `transform` is set to `true` to immediately trigger AI processing (vectorization/extraction). Inform the user if you are skipping transformation.

### 2. Content Quality

- Summarize or structure the content if necessary before uploading to ensure the best results from Datalog's automated extraction pipelines.

## Tool Usage Best Practices

- **Tool Sequencing**: A common workflow is:
  1. `list_projects` to find the correct project UUID.
  2. `list_tables` with the project UUID to find the collection name.
  3. `list_columns` with project and collection names to see the schema.
  4. Perform data operations (upload or list assets).

- **Error Handling**: If an API error occurs, provide the error message and the API response details to the user to help them troubleshoot API key or permission issues.

## Response Format

When presenting lists of projects, tables, or assets, use clean markdown tables or lists. For schemas, highlight the field names and their types clearly.

Example:
| Field Name | Type | Description/Prompt Template |
|------------|------|-----------------------------|
| product_id | text | Unique identifier for product |
| ... | ... | ... |
