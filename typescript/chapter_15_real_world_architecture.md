# Chapter 15: Real-World Architecture Patterns (Hour 15)

This chapter brings everything together. These are the patterns you will see — and be expected to write — in professional TypeScript projects.

## 1. The Repository Pattern

Separate data access logic from business logic. A repository provides a typed interface to your data source, making it easy to swap implementations (database, API, mock).

```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

// The contract — business logic depends on this, not the implementation
interface UserRepository {
    findById(id: number): Promise<User | null>;
    findAll(): Promise<User[]>;
    save(user: Omit<User, "id">): Promise<User>;
    delete(id: number): Promise<void>;
}

// Implementation for a real database
class PostgresUserRepository implements UserRepository {
    async findById(id: number): Promise<User | null> {
        // db query here
        return null;
    }
    async findAll(): Promise<User[]> { return []; }
    async save(user: Omit<User, "id">): Promise<User> {
        return { id: Date.now(), ...user };
    }
    async delete(id: number): Promise<void> {}
}

// Mock implementation for tests
class InMemoryUserRepository implements UserRepository {
    private users: User[] = [];

    async findById(id: number) {
        return this.users.find(u => u.id === id) ?? null;
    }
    async findAll() { return [...this.users]; }
    async save(user: Omit<User, "id">) {
        const newUser = { id: this.users.length + 1, ...user };
        this.users.push(newUser);
        return newUser;
    }
    async delete(id: number) {
        this.users = this.users.filter(u => u.id !== id);
    }
}
```

## 2. Dependency Injection (Manual)

Instead of instantiating dependencies inside a class, inject them via the constructor. This makes code testable and loosely coupled.

```typescript
class UserService {
    // UserService depends on the interface, not a concrete class
    constructor(private readonly repo: UserRepository) {}

    async getUserOrThrow(id: number): Promise<User> {
        const user = await this.repo.findById(id);
        if (!user) throw new Error(`User ${id} not found`);
        return user;
    }

    async registerUser(name: string, email: string): Promise<User> {
        return this.repo.save({ name, email });
    }
}

// Production
const service = new UserService(new PostgresUserRepository());

// Tests — swap the dependency with no code changes in UserService
const testService = new UserService(new InMemoryUserRepository());
```

## 3. The Service Layer

A common architecture separates concerns into three layers:

```
HTTP Layer (Controllers / Routes)
        ↓
Service Layer (Business Logic)
        ↓
Data Layer (Repositories)
```

```typescript
// Each layer only knows about the layer directly below it
class UserController {
    constructor(private readonly userService: UserService) {}

    async handleGetUser(id: number): Promise<{ status: number; body: User | { error: string } }> {
        try {
            const user = await this.userService.getUserOrThrow(id);
            return { status: 200, body: user };
        } catch {
            return { status: 404, body: { error: "Not found" } };
        }
    }
}
```

## 4. Typed Configuration with `satisfies`

The `satisfies` operator (TypeScript 4.9+) validates a value against a type without widening it — you get both type safety and the most specific type possible.

```typescript
type AppConfig = {
    port: number;
    database: { host: string; port: number };
    features: Record<string, boolean>;
};

// `satisfies` checks the shape but preserves the literal types
const config = {
    port: 3000,
    database: { host: "localhost", port: 5432 },
    features: {
        darkMode: true,
        betaSignup: false,
    },
} satisfies AppConfig;

// TypeScript knows `config.port` is `3000` (number literal), not just `number`
// TypeScript knows `config.features.darkMode` is `boolean`
// config.features.unknownFeature; // Error: property doesn't exist
```

## 5. Branded Types (Nominal Typing)

TypeScript uses structural typing — two types with the same shape are interchangeable. Branded types add a "brand" to create nominally distinct types that prevent accidental mixing.

```typescript
type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId  = Brand<number, "UserId">;
type OrderId = Brand<number, "OrderId">;

function createUserId(id: number): UserId   { return id as UserId; }
function createOrderId(id: number): OrderId { return id as OrderId; }

function getUser(id: UserId): void { /* ... */ }

const userId  = createUserId(1);
const orderId = createOrderId(42);

getUser(userId);  // OK
// getUser(orderId); // Error: Argument of type 'OrderId' is not assignable to parameter of type 'UserId'
// getUser(1);       // Error: plain number is not a UserId
```

## 6. Module Barrel Files

A barrel file (`index.ts`) re-exports everything from a folder, giving consumers a single clean import path.

```typescript
// src/models/index.ts
export type { User } from "./user";
export type { Order } from "./order";
export type { Product } from "./product";
```

```typescript
// Instead of messy deep imports:
import { User } from "../models/user";
import { Order } from "../models/order";

// You get one clean import:
import { User, Order, Product } from "../models";
```

## 7. Strict TypeScript Checklist for Production

Enable these in your `tsconfig.json` for a production-grade project:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

| Option | What it catches |
|--------|----------------|
| `noUncheckedIndexedAccess` | `arr[0]` returns `T \| undefined`, not just `T` |
| `exactOptionalPropertyTypes` | Prevents setting optional properties to `undefined` explicitly |
| `noImplicitReturns` | Every code path in a function must return a value |
| `noUnusedLocals` | Errors on declared but unused variables |

## Action Item for Hour 15:

- Build a small typed in-memory product store using the Repository pattern.
- Create `ProductRepository` interface and `InMemoryProductRepository` class.
- Create a `ProductService` that depends on the interface and provides `addProduct`, `getProduct`, and `getTotalInventoryValue` methods.
- Use branded types for `ProductId`.
