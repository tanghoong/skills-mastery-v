# Chapter 13: Advanced Generic Patterns (Hour 13)

You learned the basics of generics in Chapter 4. This chapter goes deeper — recursive types, variadic tuples, and generic design patterns that appear in real production codebases.

## 1. Recursive Types

A type can reference itself. This is essential for modelling tree structures, nested configs, and JSON.

```typescript
// The JSON type — any valid JSON value
type JSONValue =
    | string
    | number
    | boolean
    | null
    | JSONValue[]
    | { [key: string]: JSONValue };

const data: JSONValue = {
    name: "Alice",
    scores: [10, 20, 30],
    address: { city: "Bangkok", zip: "10100" },
    active: true,
};
```

```typescript
// Deep recursive version of Partial<T>
type DeepPartial<T> = T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

interface Config {
    server: { host: string; port: number };
    database: { url: string; name: string };
}

// Every nested field is optional
const partialConfig: DeepPartial<Config> = {
    server: { port: 3000 }, // host is optional too
};
```

## 2. Variadic Tuple Types

Variadic tuples let you spread and compose tuple types — useful for typed middleware chains or argument forwarding.

```typescript
// Prepend a type to a tuple
type Prepend<T, Tuple extends unknown[]> = [T, ...Tuple];
type Result1 = Prepend<string, [number, boolean]>; // [string, number, boolean]

// Append a type to a tuple
type Append<Tuple extends unknown[], T> = [...Tuple, T];
type Result2 = Append<[string, number], boolean>; // [string, number, boolean]

// Concat two tuples
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type Result3 = Concat<[string, number], [boolean, Date]>; // [string, number, boolean, Date]
```

```typescript
// A typed pipeline that threads a value through functions
function pipe<A, B, C>(
    value: A,
    fn1: (a: A) => B,
    fn2: (b: B) => C
): C {
    return fn2(fn1(value));
}

const result = pipe(
    "  hello world  ",
    (s: string) => s.trim(),
    (s: string) => s.toUpperCase()
);
// result: "HELLO WORLD"
```

## 3. The Builder Pattern

The Builder pattern constructs complex objects step by step. TypeScript's generics can track which fields have been set at the type level.

```typescript
class QueryBuilder<T extends object> {
    private query: Partial<T> = {};

    set<K extends keyof T>(key: K, value: T[K]): this {
        this.query[key] = value;
        return this; // return `this` enables method chaining
    }

    build(): Partial<T> {
        return this.query;
    }
}

interface UserQuery {
    name: string;
    age: number;
    role: "admin" | "user";
}

const query = new QueryBuilder<UserQuery>()
    .set("name", "Alice")
    .set("role", "admin")
    .build();

// query: { name: "Alice", role: "admin" }
```

## 4. Generic Conditional Flattening

Flatten a nested array type at the type level.

```typescript
type Flatten<T> = T extends Array<infer Item> ? Item : T;

type A = Flatten<string[]>;     // string
type B = Flatten<number[][]>;   // number[]  (one level)
type C = Flatten<boolean>;      // boolean   (not an array, unchanged)

// Deep flatten using recursion
type DeepFlatten<T> = T extends Array<infer Item> ? DeepFlatten<Item> : T;

type D = DeepFlatten<number[][][]>; // number
```

## 5. Distributive Conditional Types

When a conditional type is applied to a union, it distributes over each member of the union.

```typescript
type ToArray<T> = T extends unknown ? T[] : never;

type E = ToArray<string | number>;
// string[] | number[]   (distributes over each union member)

// To prevent distribution, wrap T in a tuple
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;

type F = ToArrayNonDist<string | number>;
// (string | number)[]   (treats union as a single type)
```

## 6. `Parameters<T>` and `ReturnType<T>` — Built-in Inference Utilities

These built-in utilities use `infer` internally (like you saw in Chapter 8) and are very useful for adapting third-party function signatures.

```typescript
function createUser(name: string, age: number, role: "admin" | "user") {
    return { name, age, role };
}

type CreateUserParams = Parameters<typeof createUser>;
// [name: string, age: number, role: "admin" | "user"]

type CreateUserReturn = ReturnType<typeof createUser>;
// { name: string; age: number; role: "admin" | "user" }

// Now you can reuse these types without duplicating them
function auditCreateUser(...args: CreateUserParams): CreateUserReturn {
    console.log("Creating user:", args[0]);
    return createUser(...args);
}
```

## Action Item for Hour 13:

1. Write a `DeepReadonly<T>` type that makes every property at every nesting level `readonly`.
2. Write a generic `last<T extends unknown[]>(tuple: T): T[number]` function that returns the last element of any tuple.
3. Use `Parameters<T>` to create a wrapper function around any function of your choice that logs the arguments before delegating to the original.
