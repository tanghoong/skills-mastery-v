// ============================================================
// Chapter 13 — Advanced Generic Patterns
// Run: tsx exercises/chapter_13.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Recursive types
// a) Define a `JSONValue` type that represents any valid JSON value
//    (string, number, boolean, null, array of JSONValue, or object of JSONValue)
// b) Define a `TreeNode<T>` type where each node has a value and optional children
// c) Create a tree of numbers to verify it works
// ----------------------------------------------------------------

// TODO: define JSONValue and TreeNode<T>

// const data: JSONValue = { name: "Alice", scores: [10, 20], active: true };
// const tree: TreeNode<number> = {
//     value: 1,
//     children: [
//         { value: 2, children: [{ value: 4 }, { value: 5 }] },
//         { value: 3 }
//     ]
// };


// ----------------------------------------------------------------
// Exercise 2: DeepPartial and DeepReadonly
// a) Implement `DeepPartial<T>` — makes every nested property optional
// b) Implement `DeepReadonly<T>` — makes every nested property readonly
// Test with a nested config object.
// ----------------------------------------------------------------

interface AppConfig {
    server: { host: string; port: number; ssl: boolean };
    database: { url: string; poolSize: number };
    features: { darkMode: boolean; betaSignup: boolean };
}

// TODO: implement DeepPartial<T> and DeepReadonly<T>

// const partial: DeepPartial<AppConfig> = { server: { port: 3000 } }; // valid — all others optional
// const frozen: DeepReadonly<AppConfig> = { server: { host: "localhost", port: 3000, ssl: false }, ... };
// frozen.server.host = "other"; // should be a TypeScript ERROR


// ----------------------------------------------------------------
// Exercise 3: Builder pattern
// Build a typed `HttpRequestBuilder` class that constructs a request
// step by step. It should have:
//   - setUrl(url: string): this
//   - setMethod(method: "GET" | "POST" | "PUT" | "DELETE"): this
//   - setHeader(key: string, value: string): this
//   - setBody(body: unknown): this
//   - build(): { url: string; method: string; headers: Record<string, string>; body?: unknown }
// All setter methods return `this` to enable chaining.
// ----------------------------------------------------------------

// TODO: implement HttpRequestBuilder

// const request = new HttpRequestBuilder()
//     .setUrl("https://api.example.com/users")
//     .setMethod("POST")
//     .setHeader("Content-Type", "application/json")
//     .setHeader("Authorization", "Bearer token123")
//     .setBody({ name: "Alice" })
//     .build();
// console.log(request);


// ----------------------------------------------------------------
// Exercise 4: Parameters<T> and ReturnType<T>
// Given the two functions below, use Parameters<> and ReturnType<>
// to derive their types WITHOUT duplicating the type definitions.
// Then write a `withLogging` higher-order function that wraps any
// function and logs its arguments and return value.
// ----------------------------------------------------------------

function createOrder(userId: number, items: string[], total: number) {
    return { orderId: Math.random(), userId, items, total, createdAt: new Date() };
}

function sendEmail(to: string, subject: string, body: string): boolean {
    console.log(`Email sent to ${to}`);
    return true;
}

// TODO: derive CreateOrderParams, CreateOrderReturn, SendEmailParams, SendEmailReturn
// TODO: implement withLogging<T extends (...args: any[]) => any>(fn: T): T


// ----------------------------------------------------------------
// Exercise 5: Variadic tuple — zip
// Write a function `zip<A, B>(a: A[], b: B[]): [A, B][]`
// that combines two arrays into an array of pairs.
// Then write `unzip<A, B>(pairs: [A, B][]): [A[], B[]]`
// that reverses it.
// ----------------------------------------------------------------

// TODO: implement zip and unzip

// console.log(zip([1, 2, 3], ["a", "b", "c"]));       // [[1,"a"],[2,"b"],[3,"c"]]
// console.log(unzip([[1,"a"],[2,"b"],[3,"c"]]));        // [[1,2,3],["a","b","c"]]
