// ============================================================
// Chapter 9 — Async TypeScript
// Run: tsx exercises/chapter_09.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Type a Promise correctly
// Write `delay(ms: number): Promise<void>` that resolves after ms milliseconds.
// Write `delayedValue<T>(value: T, ms: number): Promise<T>` that resolves
// with the given value after a delay.
// ----------------------------------------------------------------

// TODO: implement delay and delayedValue

// (async () => {
//   await delay(100);
//   const result = await delayedValue("hello", 100);
//   console.log(result); // "hello"
// })();


// ----------------------------------------------------------------
// Exercise 2: Generic fetch wrapper
// Write `fetchJSON<T>(url: string): Promise<T>` that:
//   - fetches the URL
//   - throws a typed Error if response is not ok (include status code in message)
//   - returns the parsed JSON typed as T
// (Use https://jsonplaceholder.typicode.com/posts/1 to test)
// ----------------------------------------------------------------

// TODO: implement fetchJSON

interface Post { userId: number; id: number; title: string; body: string; }

// (async () => {
//   const post = await fetchJSON<Post>("https://jsonplaceholder.typicode.com/posts/1");
//   console.log(post.title);
// })();


// ----------------------------------------------------------------
// Exercise 3: Error handling in async code
// Wrap your fetchJSON call in a try/catch that:
//   - if error is an Error → logs "Fetch failed: <message>"
//   - otherwise → logs "Unknown error"
// Then fetch a URL that doesn't exist (posts/9999) and verify it catches.
// ----------------------------------------------------------------

// TODO: write the try/catch wrapper as an async IIFE


// ----------------------------------------------------------------
// Exercise 4: Promise.all with mixed types
// Make these three calls in parallel (not sequentially):
//   - fetch post with id 1   → Post
//   - fetch post with id 2   → Post
//   - fetch user with id 1   → { id: number; name: string; email: string }
// Log all three results when done.
// ----------------------------------------------------------------

interface JsonUser { id: number; name: string; email: string; }

// TODO: use Promise.all to fetch all three simultaneously


// ----------------------------------------------------------------
// Exercise 5: fetchWithTimeout
// Write `fetchWithTimeout<T>(url: string, ms: number): Promise<T>` that:
//   - rejects with Error("Request timed out") if fetch takes longer than ms
//   - otherwise resolves with the JSON response typed as T
// Hint: use Promise.race with a manual timeout Promise.
// ----------------------------------------------------------------

// TODO: implement fetchWithTimeout

// (async () => {
//   try {
//     const post = await fetchWithTimeout<Post>("https://jsonplaceholder.typicode.com/posts/1", 5000);
//     console.log(post.title);
//   } catch (e) {
//     console.error(e instanceof Error ? e.message : e);
//   }
// })();
