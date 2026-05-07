// ============================================================
// Chapter 4 — Generics
// Run: tsx exercises/chapter_04.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Generic identity & swap
// a) Write a generic function `identity<T>(value: T): T`
// b) Write a generic function `swap<A, B>(pair: [A, B]): [B, A]`
//    that reverses a two-element tuple.
// ----------------------------------------------------------------

// TODO: implement identity and swap

// console.log(identity("hello"));      // "hello"
// console.log(identity(42));           // 42
// console.log(swap(["a", 1]));         // [1, "a"]
// console.log(swap([true, "yes"]));    // ["yes", true]


// ----------------------------------------------------------------
// Exercise 2: Generic interface
// Create a generic interface `ApiResponse<T>` with:
//   - data: T
//   - status: number
//   - message: string
//   - timestamp: Date
// Then create two typed responses: one for a User, one for a Product.
// ----------------------------------------------------------------

interface User { id: number; name: string; email: string; }
interface Product { id: number; name: string; price: number; }

// TODO: define ApiResponse<T> and create one User response and one Product response


// ----------------------------------------------------------------
// Exercise 3: Generic class
// Build a generic `Stack<T>` class with:
//   - push(item: T): void
//   - pop(): T | undefined
//   - peek(): T | undefined  (returns top without removing)
//   - isEmpty(): boolean
//   - size(): number
// ----------------------------------------------------------------

// TODO: implement Stack<T>

// const stack = new Stack<number>();
// stack.push(1); stack.push(2); stack.push(3);
// console.log(stack.peek());  // 3
// console.log(stack.pop());   // 3
// console.log(stack.size());  // 2
// console.log(stack.isEmpty()); // false


// ----------------------------------------------------------------
// Exercise 4: Generic constraint
// Write `getProperty<T, K extends keyof T>(obj: T, key: K): T[K]`
// that safely reads any property from any object.
// ----------------------------------------------------------------

// TODO: implement getProperty

// const user: User = { id: 1, name: "Alice", email: "alice@example.com" };
// console.log(getProperty(user, "name"));  // "Alice"
// console.log(getProperty(user, "id"));    // 1
// getProperty(user, "age"); // should be a TypeScript ERROR


// ----------------------------------------------------------------
// Exercise 5: Generic utility function
// Write `groupBy<T>(array: T[], key: keyof T): Record<string, T[]>`
// that groups an array of objects by a given key.
// ----------------------------------------------------------------

// TODO: implement groupBy

const people = [
    { name: "Alice", department: "Engineering" },
    { name: "Bob",   department: "Design" },
    { name: "Carol", department: "Engineering" },
    { name: "Dave",  department: "Design" },
    { name: "Eve",   department: "Engineering" },
];

// console.log(groupBy(people, "department"));
// Expected:
// {
//   Engineering: [ Alice, Carol, Eve ],
//   Design:      [ Bob, Dave ]
// }
