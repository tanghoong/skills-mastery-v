// ============================================================
// Chapter 16 — Symbols, Iterators & Generators
// Run: tsx exercises/chapter_16.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Symbol as unique keys
// a) Create two Symbols with the same description and prove they are not equal.
// b) Create an interface that uses a Symbol as a key.
// c) Create an object using that Symbol key and show that Object.keys()
//    does NOT include the Symbol key.
// ----------------------------------------------------------------

// TODO: implement symbol exercises

// const s1 = Symbol("id");
// const s2 = Symbol("id");
// console.log(s1 === s2); // false


// ----------------------------------------------------------------
// Exercise 2: Custom iterable — Range
// Build a `Range` class that implements `Iterable<number>` and
// produces integers from `start` to `end` (inclusive) when used with `for...of`.
// Also make it work with the spread operator: [...new Range(1, 5)]
// ----------------------------------------------------------------

// TODO: implement Range class

// for (const n of new Range(1, 5)) process.stdout.write(n + " "); // 1 2 3 4 5
// console.log();
// console.log([...new Range(3, 7)]); // [3, 4, 5, 6, 7]


// ----------------------------------------------------------------
// Exercise 3: Generator function
// Write these generator functions:
//   a) naturals(): Generator<number>    — 1, 2, 3, 4, ... (infinite)
//   b) take<T>(gen: Generator<T>, n: number): T[]
//      — collect first n values from any generator
//   c) map<T, U>(gen: Generator<T>, fn: (val: T) => U): Generator<U>
//      — lazily transform each yielded value
// ----------------------------------------------------------------

// TODO: implement naturals, take, map

// console.log(take(naturals(), 5));                    // [1, 2, 3, 4, 5]
// console.log(take(map(naturals(), n => n * n), 5));   // [1, 4, 9, 16, 25]


// ----------------------------------------------------------------
// Exercise 4: Fibonacci generator
// Write `fibonacci(): Generator<number>` that yields the Fibonacci
// sequence infinitely: 0, 1, 1, 2, 3, 5, 8, 13, 21, ...
// Then use it with your `take` function to print the first 10 values.
// ----------------------------------------------------------------

// TODO: implement fibonacci generator

// console.log(take(fibonacci(), 10)); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]


// ----------------------------------------------------------------
// Exercise 5: Async generator — paginated data
// Write an async generator `paginate<T>(fetchPage: (page: number) => Promise<T[]>): AsyncGenerator<T>`
// that:
//   - calls fetchPage(1), fetchPage(2), ... in sequence
//   - yields each item individually (not the whole page)
//   - stops when fetchPage returns an empty array
//
// Test it with a mock fetchPage that returns:
//   page 1: ["apple", "banana", "cherry"]
//   page 2: ["date", "elderberry"]
//   page 3: []  (stop here)
// ----------------------------------------------------------------

// TODO: implement paginate

// (async () => {
//     const mockFetch = async (page: number): Promise<string[]> => {
//         const pages: Record<number, string[]> = {
//             1: ["apple", "banana", "cherry"],
//             2: ["date", "elderberry"],
//         };
//         return pages[page] ?? [];
//     };
//
//     for await (const item of paginate(mockFetch)) {
//         console.log(item);
//     }
//     // apple, banana, cherry, date, elderberry
// })();
