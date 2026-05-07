// ============================================================
// Chapter 20 — NestJS + TypeScript
// Setup: npm i -g @nestjs/cli && nest new ch20
// All exercises are implemented inside the NestJS project.
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Products module — CRUD
// Generate and implement a full CRUD module for Products:
//   nest g module products
//   nest g controller products
//   nest g service products
//
// Product: { id: number; name: string; price: number; stock: number; category: string }
// CreateProductDto — use class-validator:
//   @IsString() @MinLength(2) name
//   @IsNumber() @Min(0) price
//   @IsInt() @Min(0) stock
//   @IsString() category
//
// Endpoints:
//   GET    /products          → list all
//   GET    /products/:id      → get one (throw NotFoundException if missing)
//   POST   /products          → create
//   PATCH  /products/:id      → partial update (use PartialType)
//   DELETE /products/:id      → delete
// ----------------------------------------------------------------

// TODO: implement the Products module inside the NestJS project


// ----------------------------------------------------------------
// Exercise 2: Validation pipe & ParseIntPipe
// a) Enable ValidationPipe globally in main.ts with whitelist: true
// b) Make GET /products/:id throw a clear 400 error if :id is not a number
//    using ParseIntPipe
// c) Test that sending extra fields in POST body are stripped (whitelist)
// ----------------------------------------------------------------

// TODO: update main.ts and the controller to add pipes


// ----------------------------------------------------------------
// Exercise 3: AuthGuard
// Create a simple guard that reads an `x-api-key` header and compares
// it to a value stored in an environment variable API_KEY.
// Protect only POST, PATCH, DELETE endpoints with the guard.
// GET endpoints remain public.
// ----------------------------------------------------------------

// TODO: create src/guards/api-key.guard.ts and apply it


// ----------------------------------------------------------------
// Exercise 4: Custom pipe — ParsePositiveInt
// Write a custom pipe `ParsePositiveIntPipe` that:
//   - Parses the value as an integer
//   - Throws BadRequestException if it is not a positive integer (> 0)
//   - Returns the parsed number
// Apply it to the :id param in your controller.
// ----------------------------------------------------------------

// TODO: create src/pipes/parse-positive-int.pipe.ts


// ----------------------------------------------------------------
// Exercise 5: Exception filter
// Create a global exception filter that:
//   - catches all HttpExceptions and returns: { statusCode, message, timestamp, path }
//   - catches all other errors and returns: { statusCode: 500, message: "Internal server error", timestamp, path }
// Register it globally in main.ts.
// ----------------------------------------------------------------

// TODO: create src/filters/http-exception.filter.ts and register globally

// Test by hitting a non-existent product:
// curl http://localhost:3000/products/9999
// Expected: { "statusCode": 404, "message": "Product #9999 not found", "timestamp": "...", "path": "/products/9999" }
