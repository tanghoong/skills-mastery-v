// ============================================================
// Chapter 19 — Next.js + TypeScript
// Setup: npx create-next-app@latest ch19 --typescript
// All exercises are implemented inside the Next.js project.
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Static page with typed props
// Create: app/about/page.tsx
// - It is a Server Component (no "use client")
// - Exports metadata: { title: "About", description: "..." }
// - Renders a static about page with a typed `TeamMember` section
//   where TeamMember = { name: string; role: string; github: string }
// - Hard-code an array of 3 TeamMember objects and render them
// ----------------------------------------------------------------

// TODO: create app/about/page.tsx


// ----------------------------------------------------------------
// Exercise 2: Dynamic route with typed params
// Create: app/posts/[id]/page.tsx
// - Accepts typed params: { id: string }
// - Fetches post from https://jsonplaceholder.typicode.com/posts/:id
// - Renders the post title and body
// - Returns a "Post not found" message if fetch fails or returns 404
// - Exports generateMetadata() that sets the page title to the post title
// ----------------------------------------------------------------

// TODO: create app/posts/[id]/page.tsx


// ----------------------------------------------------------------
// Exercise 3: API Route Handler
// Create: app/api/calculator/route.ts
// - Handles POST requests with body: { operation: "add"|"sub"|"mul"|"div"; a: number; b: number }
// - Returns: { result: number } on success
// - Returns: { error: string } with status 400 for invalid input or division by zero
// - Returns: { error: "Method not allowed" } with status 405 for non-POST requests
// ----------------------------------------------------------------

// TODO: create app/api/calculator/route.ts

// Test with curl:
// curl -X POST http://localhost:3000/api/calculator \
//   -H "Content-Type: application/json" \
//   -d '{"operation":"add","a":10,"b":5}'
// Expected: {"result":15}


// ----------------------------------------------------------------
// Exercise 4: Server Action with form
// Create a Server Action: app/actions/contact.ts
//   sendContactMessage(prevState, formData): Promise<{ error?: string; success?: boolean }>
//   - Validates: name (min 2 chars), email (must contain @), message (min 10 chars)
//   - Returns error if validation fails
//   - Returns { success: true } if all valid (simulate sending — just log it)
//
// Create: app/contact/page.tsx (Client Component)
//   - A form with name, email, and message fields
//   - Uses useActionState to connect to the Server Action
//   - Shows validation errors inline
//   - Shows a success message after submission
// ----------------------------------------------------------------

// TODO: create app/actions/contact.ts and app/contact/page.tsx


// ----------------------------------------------------------------
// Exercise 5: searchParams filter page
// Create: app/products/page.tsx
// - Accepts searchParams: { category?: string; minPrice?: string; maxPrice?: string }
// - Has a hard-coded list of 10 products (id, name, price, category)
// - Filters the list based on the searchParams
// - Renders the filtered products
// - Renders a summary: "Showing X of Y products"
// ----------------------------------------------------------------

// TODO: create app/products/page.tsx

// Test URLs:
// http://localhost:3000/products
// http://localhost:3000/products?category=electronics
// http://localhost:3000/products?minPrice=100&maxPrice=500
