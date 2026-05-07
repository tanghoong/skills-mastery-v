// ============================================================
// Chapter 15 — Real-World Architecture Patterns
// Run: tsx exercises/chapter_15.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Branded types
// Create branded types for:
//   UserId, ProductId, OrderId  (all based on number)
//
// Write factory functions: createUserId(n), createProductId(n), createOrderId(n)
// Write a function getUser(id: UserId): { id: UserId; name: string }
// Verify TypeScript errors if you pass a ProductId to getUser.
// ----------------------------------------------------------------

// TODO: define branded types and implement functions

// const uid = createUserId(1);
// const pid = createProductId(99);
// getUser(uid); // OK
// getUser(pid); // TypeScript ERROR — wrong brand


// ----------------------------------------------------------------
// Exercise 2: Repository pattern
// Define interface `ProductRepository` with:
//   findById(id: ProductId): Promise<Product | null>
//   findAll(): Promise<Product[]>
//   save(product: Omit<Product, "id">): Promise<Product>
//   delete(id: ProductId): Promise<void>
//
// Implement `InMemoryProductRepository` that satisfies the interface
// using a private array as the store.
// ----------------------------------------------------------------

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
}

// TODO: define ProductId brand, ProductRepository interface, InMemoryProductRepository


// ----------------------------------------------------------------
// Exercise 3: Service layer with dependency injection
// Build `ProductService` that:
//   - takes a ProductRepository in its constructor
//   - has: getProduct(id), listProducts(), addProduct(name, price, stock)
//   - has: restockProduct(id, quantity) — adds quantity to stock
//   - has: totalInventoryValue(): Promise<number> — sum of price * stock
// ----------------------------------------------------------------

// TODO: implement ProductService

// const repo = new InMemoryProductRepository();
// const service = new ProductService(repo);
// (async () => {
//     await service.addProduct("Laptop", 999, 10);
//     await service.addProduct("Mouse", 29, 50);
//     console.log(await service.totalInventoryValue()); // 9990 + 1450 = 11440
// })();


// ----------------------------------------------------------------
// Exercise 4: `satisfies` operator
// Define a type `ThemeConfig` with:
//   colors: Record<string, string>
//   fonts: { heading: string; body: string }
//   spacing: Record<string, number>
//
// Use `satisfies` to define a theme object so TypeScript validates
// the shape BUT retains the exact literal types of the values.
// Show that accessing theme.colors.primary gives a string literal
// type, not just `string`.
// ----------------------------------------------------------------

// TODO: define ThemeConfig and create a `theme` object using `satisfies`


// ----------------------------------------------------------------
// Exercise 5: Barrel file structure
// Design (in comments) the barrel file structure for a hypothetical
// `src/` folder with:
//   models/user.ts, models/product.ts, models/order.ts
//   services/userService.ts, services/productService.ts
//   repositories/userRepository.ts, repositories/productRepository.ts
//
// Write what each index.ts barrel file would contain,
// then write how a consumer would import from the top level.
// ----------------------------------------------------------------

// TODO: write the barrel file structure as comments

// models/index.ts exports:
//   ...

// services/index.ts exports:
//   ...

// Consumer import (single clean line):
//   import { User, Product, UserService } from "@/models";
