# Chapter 16: Symbols, Iterators & Generators (Hour 16)

These are lower-level TypeScript features that power some of the language's most elegant APIs — `for...of`, spread syntax, and custom lazy sequences.

## 1. Symbols

A `Symbol` is a guaranteed unique primitive value. No two symbols are ever equal, even if created with the same description.

```typescript
const id1 = Symbol("id");
const id2 = Symbol("id");
console.log(id1 === id2); // false — always unique

// Use as unique object keys to avoid name collisions
const SECRET_KEY = Symbol("secretKey");

interface SecureObject {
    [SECRET_KEY]: string;
    publicData: string;
}

const obj: SecureObject = {
    [SECRET_KEY]: "top-secret",
    publicData: "visible",
};

console.log(obj[SECRET_KEY]); // "top-secret"
console.log(Object.keys(obj)); // ["publicData"] — Symbol keys are not enumerable
```

## 2. Well-Known Symbols

JavaScript/TypeScript has built-in symbols (`Symbol.iterator`, `Symbol.toPrimitive`, etc.) that let you hook into language-level behaviour.

```typescript
class Temperature {
    constructor(private celsius: number) {}

    // Hook into `+` operator and string coercion
    [Symbol.toPrimitive](hint: "number" | "string" | "default"): number | string {
        if (hint === "string") return `${this.celsius}°C`;
        return this.celsius;
    }
}

const temp = new Temperature(37);
console.log(`Body temp: ${temp}`); // "Body temp: 37°C"
console.log(temp + 10);            // 47
```

## 3. The Iterator Protocol

An object is iterable if it has a `[Symbol.iterator]()` method that returns an iterator. TypeScript uses `Iterable<T>` and `Iterator<T>` to type these.

```typescript
// A custom range iterable — produces numbers from `start` to `end`
class Range implements Iterable<number> {
    constructor(private start: number, private end: number) {}

    [Symbol.iterator](): Iterator<number> {
        let current = this.start;
        const end = this.end;

        return {
            next(): IteratorResult<number> {
                if (current <= end) {
                    return { value: current++, done: false };
                }
                return { value: undefined as never, done: true };
            }
        };
    }
}

const range = new Range(1, 5);

for (const n of range) {
    console.log(n); // 1, 2, 3, 4, 5
}

const arr = [...range]; // [1, 2, 3, 4, 5] — spread also uses Symbol.iterator
```

## 4. Generator Functions

Generators are functions that can pause execution and yield values one at a time. They implement the iterator protocol automatically.

```typescript
function* range(start: number, end: number): Generator<number> {
    for (let i = start; i <= end; i++) {
        yield i; // pauses here, returns i, resumes on next()
    }
}

const gen = range(1, 5);
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }

// Or just use for...of — it calls .next() for you
for (const n of range(1, 5)) {
    console.log(n); // 1, 2, 3, 4, 5
}
```

## 5. Infinite Generators

Because generators are lazy (they only compute values on demand), they can represent infinite sequences without crashing.

```typescript
function* fibonacci(): Generator<number> {
    let [a, b] = [0, 1];
    while (true) {
        yield a;
        [a, b] = [b, a + b];
    }
}

function take<T>(gen: Generator<T>, n: number): T[] {
    const result: T[] = [];
    for (const value of gen) {
        result.push(value);
        if (result.length >= n) break;
    }
    return result;
}

console.log(take(fibonacci(), 8)); // [0, 1, 1, 2, 3, 5, 8, 13]
```

## 6. Async Generators

Async generators combine `async/await` with generator syntax — perfect for paginated APIs or streaming data.

```typescript
async function* fetchPages<T>(baseUrl: string): AsyncGenerator<T[]> {
    let page = 1;
    while (true) {
        const res = await fetch(`${baseUrl}?page=${page}`);
        if (!res.ok) break;
        const data: T[] = await res.json();
        if (data.length === 0) break;
        yield data;
        page++;
    }
}

interface Post { id: number; title: string; }

// Consume all pages lazily
for await (const posts of fetchPages<Post>("/api/posts")) {
    console.log(`Got ${posts.length} posts`);
    // process each page without loading everything into memory
}
```

## Action Item for Hour 16:

1. Write a generator function `naturals()` that yields all natural numbers (1, 2, 3, …) infinitely.
2. Write a `take<T>(gen: Generator<T>, n: number): T[]` function that collects the first `n` values.
3. Write a `map<T, U>(gen: Generator<T>, fn: (val: T) => U): Generator<U>` generator that transforms each yielded value — without collecting the whole sequence into an array first.
