# Chapter 9: Async TypeScript (Hour 9)

Asynchronous code is everywhere in modern JavaScript. TypeScript gives you full type safety across Promises, async/await, and parallel execution.

## 1. Typing Promises

A `Promise<T>` resolves to a value of type `T`. Always annotate the generic so TypeScript knows what you'll receive.

```typescript
function fetchUser(id: number): Promise<{ name: string; email: string }> {
    return fetch(`/api/users/${id}`).then(res => res.json());
}

// Consuming it
fetchUser(1).then(user => {
    console.log(user.name);  // TypeScript knows this is a string
});
```

## 2. async / await

`async` functions always return a `Promise`. Annotate the return type as `Promise<T>` for clarity.

```typescript
interface Post {
    id: number;
    title: string;
    body: string;
}

async function getPost(id: number): Promise<Post> {
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
    const data: Post = await res.json();
    return data;
}
```

## 3. Type-Safe Fetch Wrapper

A generic fetch wrapper avoids repeating type casts everywhere.

```typescript
async function apiFetch<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
    }
    return res.json() as Promise<T>;
}

// Usage — T is inferred from the explicit type annotation
const post = await apiFetch<Post>("https://jsonplaceholder.typicode.com/posts/1");
console.log(post.title); // TypeScript knows this is a string
```

## 4. Error Handling in Async Code

In TypeScript, a `catch` block's error is typed as `unknown` (under strict mode), not `any`. Always narrow it before using it.

```typescript
async function loadData(): Promise<void> {
    try {
        const post = await apiFetch<Post>("/api/posts/1");
        console.log(post.title);
    } catch (error) {
        // error is `unknown` — you must narrow before using
        if (error instanceof Error) {
            console.error("Request failed:", error.message);
        } else {
            console.error("Unexpected error:", error);
        }
    }
}
```

## 5. Promise Combinators

TypeScript correctly infers return types for all built-in Promise combinators.

```typescript
async function loadDashboard(): Promise<void> {
    // Promise.all — runs in parallel, returns a tuple of results
    const [user, posts] = await Promise.all([
        apiFetch<{ name: string }>("/api/user"),
        apiFetch<Post[]>("/api/posts"),
    ]);
    // user: { name: string }
    // posts: Post[]

    // Promise.allSettled — never rejects, returns status of each
    const results = await Promise.allSettled([
        apiFetch<Post>("/api/posts/1"),
        apiFetch<Post>("/api/posts/999"), // might fail
    ]);

    results.forEach(result => {
        if (result.status === "fulfilled") {
            console.log(result.value.title);
        } else {
            console.error(result.reason);
        }
    });

    // Promise.race — resolves/rejects as soon as the first one settles
    const fastest = await Promise.race([
        apiFetch<Post>("/api/posts/1"),
        apiFetch<Post>("/api/posts/2"),
    ]);
    // fastest: Post
}
```

## 6. Typing Async Callbacks

```typescript
// A function that accepts an async callback
async function withRetry<T>(
    fn: () => Promise<T>,
    retries: number = 3
): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === retries) throw err;
            console.log(`Attempt ${attempt} failed, retrying...`);
        }
    }
    throw new Error("Unreachable");
}

// Usage
const post = await withRetry(() => apiFetch<Post>("/api/posts/1"));
```

## Action Item for Hour 9:

- Write a generic `fetchWithTimeout<T>(url: string, ms: number): Promise<T>` function that rejects if the fetch takes longer than `ms` milliseconds. Hint: use `Promise.race` with a `setTimeout` wrapped in a `new Promise`.
