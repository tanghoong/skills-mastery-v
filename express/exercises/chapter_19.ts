/**
 * Chapter 19 — OpenAPI Docs
 *
 * Run: tsx exercises/chapter_19.ts
 */

// =============================================================================
// EXERCISE 1 — OpenAPI schema builder (minimal)
// =============================================================================
// TODO: Define `OpenApiType` union: "string" | "number" | "integer" | "boolean" | "array" | "object"
// TODO: Define `OpenApiProperty` interface:
//       { type: OpenApiType; description?: string; example?: unknown; enum?: unknown[]; nullable?: boolean }
// TODO: Define `OpenApiSchema` interface:
//       { type: "object"; properties: Record<string, OpenApiProperty>; required?: string[] }

export type OpenApiType = never; // replace

export interface OpenApiProperty {
  // TODO
}

export interface OpenApiSchema {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Schema generator from interface shape
// =============================================================================
// TODO: Define `FieldType` union: "string" | "number" | "boolean" | "Date" | "string?" | "number?" | "boolean?"
// TODO: Implement `buildSchema(fields: Record<string, FieldType>): OpenApiSchema`
//       - Required fields: those without "?" suffix
//       - Optional fields: those with "?" suffix
//       - Map types: string/string? → "string", number/number? → "number", boolean/boolean? → "boolean", Date → "string" with format "date-time"

export type FieldType = never; // replace

export function buildSchema(fields: Record<string, FieldType>): OpenApiSchema {
  // TODO
  return { type: "object", properties: {} };
}

// =============================================================================
// EXERCISE 3 — Response object builder
// =============================================================================
// TODO: Define `OpenApiResponse` interface:
//       { description: string; content?: { "application/json": { schema: unknown } } }
//
// TODO: Implement `buildJsonResponse(description: string, schema: unknown): OpenApiResponse`
// TODO: Implement `buildErrorResponse(statusCode: number): OpenApiResponse`
//       Uses a standard error envelope schema

export interface OpenApiResponse {
  // TODO
}

export function buildJsonResponse(description: string, schema: unknown): OpenApiResponse {
  // TODO
  return { description };
}

export function buildErrorResponse(statusCode: number): OpenApiResponse {
  // TODO
  return { description: `Error ${statusCode}` };
}

// =============================================================================
// EXERCISE 4 — Endpoint definition
// =============================================================================
// TODO: Define `OpenApiEndpoint` interface:
//       { method: string; path: string; summary: string; tags: string[];
//         security?: Array<Record<string, string[]>>;
//         responses: Record<string, OpenApiResponse> }
//
// TODO: Implement `addBearerSecurity(endpoint: OpenApiEndpoint): OpenApiEndpoint`
//       Returns a new endpoint with security: [{ BearerAuth: [] }] added

export interface OpenApiEndpoint {
  // TODO
}

export function addBearerSecurity(endpoint: OpenApiEndpoint): OpenApiEndpoint {
  // TODO
  return endpoint;
}

// =============================================================================
// EXERCISE 5 — Spec assembler
// =============================================================================
// TODO: Define `OpenApiSpec` interface:
//       { openapi: "3.1.0"; info: { title: string; version: string }; paths: Record<string, unknown> }
//
// TODO: Implement `assembleSpec(title: string, version: string, endpoints: OpenApiEndpoint[]): OpenApiSpec`
//       Groups endpoints by path (each path has method-keyed entries)

export interface OpenApiSpec {
  // TODO
}

export function assembleSpec(title: string, version: string, endpoints: OpenApiEndpoint[]): OpenApiSpec {
  // TODO
  return { openapi: "3.1.0", info: { title, version }, paths: {} };
}

// =============================================================================
// EXERCISE 6 — Zod-like schema to OpenAPI property converter
// =============================================================================
// TODO: Define `ZodLikeField` type: { _type: string; _optional?: boolean; _min?: number; _max?: number; _enum?: string[] }
// TODO: Implement `zodToOpenApi(field: ZodLikeField): OpenApiProperty`
//       - _type "string"  → type: "string"
//       - _type "number"  → type: "number"
//       - _type "boolean" → type: "boolean"
//       - _type "date"    → type: "string" with format "date-time" in description
//       - _enum           → include enum array
//       - _optional       → nullable: true

export interface ZodLikeField {
  _type:      string;
  _optional?: boolean;
  _min?:      number;
  _max?:      number;
  _enum?:     string[];
}

export function zodToOpenApi(field: ZodLikeField): OpenApiProperty {
  // TODO
  return { type: "string" };
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — buildSchema
  const taskSchema = buildSchema({
    id:          "number",
    title:       "string",
    status:      "string",
    description: "string?",
    dueDate:     "Date",
  });
  console.assert(taskSchema.type === "object",                        "Ex2: type should be object");
  console.assert(taskSchema.required?.includes("id"),                 "Ex2: id should be required");
  console.assert(taskSchema.required?.includes("title"),              "Ex2: title should be required");
  console.assert(!taskSchema.required?.includes("description"),       "Ex2: description should be optional");
  console.assert(taskSchema.properties.id.type === "number",          "Ex2: id type should be number");
  console.assert(taskSchema.properties.dueDate.type === "string",     "Ex2: Date maps to string");

  // Exercise 3 — response builder
  const r200 = buildJsonResponse("Task created", { type: "object" });
  console.assert(r200.description === "Task created", "Ex3: description matches");
  console.assert(r200.content?.["application/json"] !== undefined, "Ex3: content/json present");

  const r404 = buildErrorResponse(404);
  console.assert(r404.description.includes("404"), "Ex3: error description includes status code");

  // Exercise 4 — addBearerSecurity
  const endpoint: OpenApiEndpoint = {
    method: "get", path: "/tasks", summary: "List tasks",
    tags: ["Tasks"], responses: { "200": buildJsonResponse("OK", {}) }
  };
  const secured = addBearerSecurity(endpoint);
  console.assert(Array.isArray(secured.security),   "Ex4: security should be array");
  console.assert(secured.security?.length === 1,    "Ex4: one security scheme");
  console.assert("BearerAuth" in (secured.security?.[0] ?? {}), "Ex4: BearerAuth scheme");

  // Exercise 5 — assembleSpec
  const e1: OpenApiEndpoint = { method: "get",  path: "/tasks", summary: "List",   tags: [], responses: {} };
  const e2: OpenApiEndpoint = { method: "post", path: "/tasks", summary: "Create", tags: [], responses: {} };
  const spec = assembleSpec("TaskFlow", "1.0.0", [e1, e2]);
  console.assert(spec.openapi === "3.1.0",           "Ex5: openapi version");
  console.assert(spec.info.title === "TaskFlow",     "Ex5: title");
  console.assert("/tasks" in spec.paths,             "Ex5: /tasks path in spec");
  console.assert("get"  in (spec.paths["/tasks"] as any), "Ex5: GET method in /tasks");
  console.assert("post" in (spec.paths["/tasks"] as any), "Ex5: POST method in /tasks");

  // Exercise 6 — zodToOpenApi
  const strField = zodToOpenApi({ _type: "string" });
  console.assert(strField.type === "string",                 "Ex6: string maps to string");

  const optNum = zodToOpenApi({ _type: "number", _optional: true });
  console.assert(optNum.type === "number",                   "Ex6: number type");
  console.assert(optNum.nullable === true,                   "Ex6: optional → nullable");

  const enumField = zodToOpenApi({ _type: "string", _enum: ["a","b","c"] });
  console.assert(Array.isArray(enumField.enum),              "Ex6: enum array present");
  console.assert(enumField.enum?.length === 3,               "Ex6: 3 enum values");

  console.log("Chapter 19 verification complete ✓");
}

verify();
