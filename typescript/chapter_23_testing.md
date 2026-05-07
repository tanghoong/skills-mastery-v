# Chapter 23: Testing in TypeScript (Hour 23)

Tests verify that your code behaves correctly. TypeScript makes tests more reliable by catching errors in the tests themselves — a wrong mock or a missing property fails at compile time, not at runtime.

## 1. Setup — Vitest (Recommended)

Vitest is the modern choice for TypeScript projects. It's fast, Jest-compatible, and requires no extra Babel config.

```bash
npm install --save-dev vitest @vitest/coverage-v8
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,        // no need to import describe/it/expect
        environment: "node",  // use "jsdom" for React component tests
        coverage: { provider: "v8" },
    },
});
```

```json
// package.json
{
  "scripts": {
    "test":     "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

## 2. Writing Typed Tests

```typescript
// src/utils/math.ts
export function divide(a: number, b: number): number {
    if (b === 0) throw new Error("Cannot divide by zero");
    return a / b;
}
```

```typescript
// src/utils/math.test.ts
import { describe, it, expect } from "vitest";
import { divide } from "./math";

describe("divide", () => {
    it("divides two numbers correctly", () => {
        expect(divide(10, 2)).toBe(5);
        expect(divide(9, 3)).toBe(3);
    });

    it("throws when dividing by zero", () => {
        expect(() => divide(10, 0)).toThrow("Cannot divide by zero");
    });

    // TypeScript catches mistakes in the test itself
    // divide("10", 2); // Error: argument of type 'string' not assignable to 'number'
});
```

## 3. Typing Mocks with `vi.mocked`

Mocks replace real implementations during tests. `vi.mocked` gives you full type safety on mocked functions.

```typescript
// src/services/email.service.ts
export async function sendEmail(to: string, subject: string): Promise<void> {
    // real email sending logic
}
```

```typescript
// src/services/user.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUser } from "./user.service";
import * as emailService from "./email.service";

vi.mock("./email.service"); // replace the entire module with auto-mocks

describe("createUser", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("sends a welcome email after creating a user", async () => {
        // vi.mocked gives the mocked function its original TypeScript types
        const sendEmailMock = vi.mocked(emailService.sendEmail);
        sendEmailMock.mockResolvedValue(undefined);

        await createUser({ name: "Alice", email: "alice@example.com" });

        expect(sendEmailMock).toHaveBeenCalledOnce();
        expect(sendEmailMock).toHaveBeenCalledWith(
            "alice@example.com",
            "Welcome to the app!"
        );
    });
});
```

## 4. Testing Async Code

```typescript
// src/services/api.service.ts
export async function fetchUser(id: number): Promise<{ name: string }> {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error("User not found");
    return res.json();
}
```

```typescript
// src/services/api.service.test.ts
import { describe, it, expect, vi } from "vitest";
import { fetchUser } from "./api.service";

// Mock the global fetch
global.fetch = vi.fn();

describe("fetchUser", () => {
    it("returns user data on success", async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ name: "Alice" }),
        } as Response);

        const user = await fetchUser(1);
        expect(user.name).toBe("Alice");
    });

    it("throws when the response is not ok", async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
        } as Response);

        await expect(fetchUser(999)).rejects.toThrow("User not found");
    });
});
```

## 5. Testing with the Repository Pattern

Using interfaces (Chapter 15) makes unit testing trivial — swap the real implementation for a typed in-memory mock.

```typescript
// src/users/user.repository.ts
export interface UserRepository {
    findById(id: number): Promise<{ id: number; name: string } | null>;
    save(user: { name: string; email: string }): Promise<{ id: number; name: string; email: string }>;
}
```

```typescript
// src/users/user.service.test.ts
import { describe, it, expect } from "vitest";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";

// Create a typed in-memory mock that satisfies the interface
function createMockRepo(overrides: Partial<UserRepository> = {}): UserRepository {
    return {
        findById: async () => null,
        save: async (u) => ({ id: 1, ...u }),
        ...overrides,
    };
}

describe("UserService", () => {
    it("throws when user is not found", async () => {
        const service = new UserService(createMockRepo({
            findById: async () => null,
        }));

        await expect(service.getUserOrThrow(99)).rejects.toThrow("User 99 not found");
    });

    it("returns user when found", async () => {
        const service = new UserService(createMockRepo({
            findById: async (id) => ({ id, name: "Alice" }),
        }));

        const user = await service.getUserOrThrow(1);
        expect(user.name).toBe("Alice");
    });
});
```

## 6. Testing React Components

```bash
npm install --save-dev @testing-library/react @testing-library/user-event jsdom
```

```typescript
// vitest.config.ts — change environment for component tests
export default defineConfig({
    test: { environment: "jsdom" },
});
```

```typescript
// src/components/Counter.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Counter } from "./Counter";

describe("Counter", () => {
    it("starts at zero", () => {
        render(<Counter />);
        expect(screen.getByText("Count: 0")).toBeInTheDocument();
    });

    it("increments when button is clicked", async () => {
        const user = userEvent.setup();
        render(<Counter />);

        await user.click(screen.getByRole("button", { name: /count/i }));
        expect(screen.getByText("Count: 1")).toBeInTheDocument();
    });
});
```

## 7. Type-Level Testing

You can test that types resolve correctly using `expectTypeOf` (built into Vitest).

```typescript
import { expectTypeOf } from "vitest";
import { divide } from "./math";
import type { Result } from "./result";

it("divide returns a number", () => {
    expectTypeOf(divide(1, 2)).toBeNumber();
});

it("Result success branch has value", () => {
    type R = Result<string, Error>;
    expectTypeOf<R>().toMatchTypeOf<
        { success: true; value: string } | { success: false; error: Error }
    >();
});
```

## Action Item for Hour 23:

- Write unit tests for the `Basket` class from your `test.ts` file, covering:
  - `add()` — adds a new item
  - `add()` — merges quantity when item already exists
  - `remove()` — removes an item
  - `total()` — calculates correct total
- Mock the `Basket` dependency in a hypothetical `CheckoutService` that takes a `Basket` and processes payment.
