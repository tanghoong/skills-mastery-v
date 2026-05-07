// ============================================================
// Chapter 23 — Testing in TypeScript
// Setup: npm install --save-dev vitest @vitest/coverage-v8
// Run:   npx vitest run exercises/chapter_23.test.ts
// NOTE:  Rename this file to chapter_23.test.ts before running.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// ----------------------------------------------------------------
// Exercise 1: Unit test a pure function
// Implement `clamp(value: number, min: number, max: number): number`
// below, then write at least 5 tests covering:
//   - value within range
//   - value below min
//   - value above max
//   - value equal to min
//   - value equal to max
// ----------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
    // TODO: implement clamp
    throw new Error("Not implemented");
}

describe("clamp", () => {
    // TODO: write tests
});


// ----------------------------------------------------------------
// Exercise 2: Test a class
// Implement a `Queue<T>` class with enqueue, dequeue, peek, size, isEmpty.
// Write tests for all methods including edge cases (e.g. dequeue from empty queue).
// ----------------------------------------------------------------

class Queue<T> {
    // TODO: implement Queue<T>
}

describe("Queue", () => {
    // TODO: write tests
});


// ----------------------------------------------------------------
// Exercise 3: Test async code
// Implement `fetchUserName(id: number): Promise<string>` that:
//   - calls fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
//   - returns the user's name
//   - throws Error("User not found") if status is 404
//
// Mock global fetch with vi.fn() and test:
//   - successful response
//   - 404 response
//   - network failure (fetch rejects)
// ----------------------------------------------------------------

async function fetchUserName(id: number): Promise<string> {
    // TODO: implement fetchUserName
    throw new Error("Not implemented");
}

describe("fetchUserName", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // TODO: write tests with mocked fetch
});


// ----------------------------------------------------------------
// Exercise 4: Test with a mock repository (dependency injection)
// Given these types, implement UserService and write tests for it
// by swapping in an in-memory mock repository.
// ----------------------------------------------------------------

interface UserRepo {
    findById(id: number): Promise<{ id: number; name: string } | null>;
    save(name: string): Promise<{ id: number; name: string }>;
}

class UserService {
    constructor(private repo: UserRepo) {}

    async getUser(id: number) {
        // TODO: return user or throw Error(`User ${id} not found`)
        throw new Error("Not implemented");
    }

    async createUser(name: string) {
        // TODO: validate name is non-empty, then save
        throw new Error("Not implemented");
    }
}

describe("UserService", () => {
    function makeMockRepo(overrides: Partial<UserRepo> = {}): UserRepo {
        return {
            findById: vi.fn(async () => null),
            save:     vi.fn(async (name) => ({ id: 1, name })),
            ...overrides,
        };
    }

    // TODO: write tests for getUser (found, not found) and createUser (valid, empty name)
});


// ----------------------------------------------------------------
// Exercise 5: Test a React component (bonus — requires jsdom setup)
// If you have a React project, write a test for a Button component:
//   - renders with the correct label
//   - calls onClick when clicked
//   - is disabled when the disabled prop is true
//   - does not call onClick when disabled
// ----------------------------------------------------------------

// TODO: write React component test (requires @testing-library/react + jsdom environment)
// Example structure:
// import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
// import { Button } from "./Button";
//
// describe("Button", () => {
//   it("renders label", ...);
//   it("calls onClick", ...);
//   it("disabled state", ...);
// });
