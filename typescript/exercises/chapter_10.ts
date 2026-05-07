// ============================================================
// Chapter 10 — Modules & tsconfig
// NOTE: This exercise is file-based. Create the files described
// below inside a folder: exercises/ch10/
// Run: tsx exercises/ch10/index.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Create and export typed utilities
// Create file: exercises/ch10/utils/math.ts
// Export:
//   - add(a: number, b: number): number
//   - subtract(a: number, b: number): number
//   - multiply(a: number, b: number): number
//   - divide(a: number, b: number): number  (throws if b === 0)
//   - const PI: number
// ----------------------------------------------------------------

// TODO: create exercises/ch10/utils/math.ts


// ----------------------------------------------------------------
// Exercise 2: Export types separately
// Create file: exercises/ch10/types.ts
// Export these interfaces using `export type`:
//   - Shape: { kind: string; color: string }
//   - Circle extends Shape: { kind: "circle"; radius: number }
//   - Rectangle extends Shape: { kind: "rectangle"; width: number; height: number }
// ----------------------------------------------------------------

// TODO: create exercises/ch10/types.ts


// ----------------------------------------------------------------
// Exercise 3: Default export
// Create file: exercises/ch10/utils/logger.ts
// Export a default class `Logger` with methods:
//   - log(message: string): void   — prefix "[LOG]"
//   - warn(message: string): void  — prefix "[WARN]"
//   - error(message: string): void — prefix "[ERROR]"
// ----------------------------------------------------------------

// TODO: create exercises/ch10/utils/logger.ts


// ----------------------------------------------------------------
// Exercise 4: Barrel file
// Create file: exercises/ch10/utils/index.ts
// Re-export everything from math.ts and logger.ts
// so consumers can do: import { add, Logger } from "./utils"
// ----------------------------------------------------------------

// TODO: create exercises/ch10/utils/index.ts


// ----------------------------------------------------------------
// Exercise 5: Consume everything in index.ts
// Create file: exercises/ch10/index.ts that:
//   - imports add, multiply, PI from "./utils"
//   - imports type { Circle } from "./types"
//   - imports Logger (default) from "./utils"
//   - uses all of them and logs results
// ----------------------------------------------------------------

// TODO: create exercises/ch10/index.ts

// Expected output:
// [LOG] 3 + 4 = 7
// [LOG] Area of circle with r=5: 78.54
// [WARN] PI approximation: 3.14159...

// ----------------------------------------------------------------
// Bonus: tsconfig
// Create a tsconfig.json inside exercises/ch10/ with:
//   - strict: true
//   - target: ES2020
//   - module: NodeNext
//   - outDir: ./dist
//   - paths alias: "@utils/*" → ["./utils/*"]
// ----------------------------------------------------------------

// TODO: create exercises/ch10/tsconfig.json
