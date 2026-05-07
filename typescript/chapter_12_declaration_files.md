# Chapter 12: Declaration Files (.d.ts) (Hour 12)

Declaration files tell TypeScript the types of code that exists outside of TypeScript — typically plain JavaScript libraries. Understanding them lets you work confidently with any library, even untyped ones.

## 1. What Is a Declaration File?

A `.d.ts` file contains only type information — no executable code. TypeScript uses these files to understand the shape of a module without seeing the implementation.

```typescript
// math.d.ts — describes a JavaScript file called math.js
declare function add(a: number, b: number): number;
declare const PI: number;

export { add, PI };
```

When you install a library via npm and see `@types/library-name`, that package contains declaration files for the library.

## 2. How TypeScript Finds Types

When you import a module, TypeScript looks for types in this order:

1. `index.d.ts` inside the package (shipped by the library author)
2. The `types` field in the package's `package.json`
3. The corresponding `@types/package-name` package in `node_modules/@types`

```bash
# If a library has no types, install community types from DefinitelyTyped
npm install --save-dev @types/lodash
npm install --save-dev @types/node
```

## 3. Writing Ambient Declarations

Use the `declare` keyword to tell TypeScript something exists at runtime without defining it.

```typescript
// globals.d.ts
declare const __APP_VERSION__: string;  // injected by build tool
declare const __DEV__: boolean;

// Now you can use these anywhere without TypeScript complaining
console.log(__APP_VERSION__); // OK
```

```typescript
// Declaring an external JS module that has no types
declare module "old-js-library" {
    export function legacyHelper(input: string): string;
    export const version: string;
}
```

## 4. Typing a Third-Party JavaScript File

Imagine you have a plain JavaScript utility file `utils.js` with no types.

```javascript
// utils.js (JavaScript — no types)
function formatCurrency(amount, currency) {
    return `${currency}${amount.toFixed(2)}`;
}
module.exports = { formatCurrency };
```

You create a declaration file alongside it:

```typescript
// utils.d.ts
export function formatCurrency(amount: number, currency: string): string;
```

Now TypeScript knows the types when you import it:

```typescript
import { formatCurrency } from "./utils";
const price = formatCurrency(9.99, "$"); // type: string
```

## 5. Module Augmentation

You can extend the types of an existing library without modifying its source. This is called module augmentation.

```typescript
// Extending Express's Request type to include a custom `user` property
import "express";

declare module "express" {
    interface Request {
        user?: {
            id: string;
            role: "admin" | "user";
        };
    }
}

// Now in your Express route handler:
import { Request, Response } from "express";

function getProfile(req: Request, res: Response) {
    console.log(req.user?.role); // TypeScript knows this exists
}
```

## 6. Global Augmentation

You can also add properties to global objects like `Window` or `Array`.

```typescript
// globals.d.ts
declare global {
    interface Window {
        analytics: {
            track(event: string, data?: object): void;
        };
    }

    interface Array<T> {
        last(): T | undefined;
    }
}

export {}; // This file must be a module for `declare global` to work
```

```typescript
// usage.ts
window.analytics.track("page_view", { path: "/home" });

Array.prototype.last = function () { return this[this.length - 1]; };
const nums = [1, 2, 3];
console.log(nums.last()); // TypeScript knows this returns number | undefined
```

## 7. Generating Declaration Files Automatically

If you are building a TypeScript library, let the compiler generate `.d.ts` files for you.

```json
{
  "compilerOptions": {
    "declaration": true,         // Generate .d.ts files
    "declarationDir": "./types", // Output directory for .d.ts files
    "emitDeclarationOnly": false // Set to true if a bundler handles JS
  }
}
```

This produces a `.d.ts` alongside each compiled `.js` file, which consumers of your library use for type checking.

## Action Item for Hour 12:

- Find a tiny untyped JavaScript file (or create one: a function that formats a date as `DD/MM/YYYY`).
- Write a `.d.ts` declaration file for it with full types.
- Import and use it in a TypeScript file — verify TypeScript gives you type completions.
