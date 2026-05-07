// ============================================================
// Chapter 11 — Decorators
// Requires: "experimentalDecorators": true in tsconfig.json
// Run: tsx --experimentalDecorators exercises/chapter_11.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Class decorator — @Sealed
// Write a `@Sealed` class decorator that calls Object.seal() on
// the constructor and its prototype, preventing new properties
// from being added to instances.
// ----------------------------------------------------------------

// TODO: implement @Sealed decorator

// @Sealed
// class Config {
//   host = "localhost";
//   port = 3000;
// }
// const c = new Config();
// // (c as any).extra = "value"; // should silently fail or throw in strict mode


// ----------------------------------------------------------------
// Exercise 2: Method decorator — @Log
// Write a `@Log` method decorator that:
//   - logs the method name and arguments before calling it
//   - logs the return value after
//   - measures and logs the execution time in ms
// ----------------------------------------------------------------

// TODO: implement @Log decorator

// class MathService {
//     @Log
//     add(a: number, b: number): number {
//         return a + b;
//     }
// }
// new MathService().add(3, 4);
// Expected log:
// "[Log] add called with [3, 4]"
// "[Log] add returned 7 in 0.12ms"


// ----------------------------------------------------------------
// Exercise 3: Decorator factory — @MinLength(n)
// Write a `@MinLength(min: number)` property decorator that throws
// an error when you try to set the property to a string shorter
// than `min` characters. Use Object.defineProperty to intercept sets.
// ----------------------------------------------------------------

// TODO: implement @MinLength decorator factory

// class UserDto {
//     @MinLength(3)
//     username: string = "";
//
//     @MinLength(8)
//     password: string = "";
// }
// const u = new UserDto();
// u.username = "Al";        // Error: username must be at least 3 characters
// u.username = "Alice";     // OK
// u.password = "secret";    // Error: password must be at least 8 characters


// ----------------------------------------------------------------
// Exercise 4: @Memoize method decorator
// Write a `@Memoize` method decorator that caches return values
// based on the serialised arguments. On a cache hit, return the
// cached value without calling the original function.
// ----------------------------------------------------------------

// TODO: implement @Memoize decorator

// class Calculator {
//     callCount = 0;
//
//     @Memoize
//     expensiveCalc(n: number): number {
//         this.callCount++;
//         return n * n;
//     }
// }
// const calc = new Calculator();
// console.log(calc.expensiveCalc(5));  // 25  (computed)
// console.log(calc.expensiveCalc(5));  // 25  (cached)
// console.log(calc.expensiveCalc(6));  // 36  (computed)
// console.log(calc.callCount);         // 2   (only computed twice)


// ----------------------------------------------------------------
// Exercise 5: NestJS-style route collector
// Write two decorator factories:
//   @Controller(basePath: string) — class decorator, stores basePath
//   @Get(path: string)            — method decorator, registers route
//
// Collect all registered routes into a `routes` array and print them.
// ----------------------------------------------------------------

const routes: { method: string; basePath: string; path: string; handler: string }[] = [];

// TODO: implement @Controller and @Get decorators

// @Controller("/products")
// class ProductController {
//     @Get("/")
//     list() { return []; }
//
//     @Get("/:id")
//     findOne() { return {}; }
// }

// console.log(routes);
// Expected:
// [
//   { method: "GET", basePath: "/products", path: "/",    handler: "list" },
//   { method: "GET", basePath: "/products", path: "/:id", handler: "findOne" },
// ]
