// ============================================================
// Chapter 12 — Declaration Files (.d.ts)
// NOTE: Some exercises require creating separate files.
// Run: tsx exercises/chapter_12.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Write a .d.ts for a plain JavaScript function
// Imagine this JS function exists in a file `exercises/ch12/currency.js`:
//
//   function formatCurrency(amount, currencyCode, locale) {
//     return new Intl.NumberFormat(locale, {
//       style: "currency", currency: currencyCode
//     }).format(amount);
//   }
//   module.exports = { formatCurrency };
//
// Create `exercises/ch12/currency.d.ts` that types this module properly.
// Then in this file, write what the import and usage would look like.
// ----------------------------------------------------------------

// TODO: create exercises/ch12/currency.d.ts
// Then write the typed usage below as a comment block:

// import { formatCurrency } from "./ch12/currency";
// const price: string = formatCurrency(1234.56, "USD", "en-US");
// console.log(price); // "$1,234.56"


// ----------------------------------------------------------------
// Exercise 2: Ambient global declarations
// Create `exercises/ch12/globals.d.ts` that declares:
//   - const __APP_VERSION__: string
//   - const __IS_DEV__: boolean
//   - function log(message: string, level?: "info" | "warn" | "error"): void
//
// Then use them below (they'll error at runtime without real values,
// so just write them as comments to show the types work).
// ----------------------------------------------------------------

// TODO: create exercises/ch12/globals.d.ts
// Then demonstrate usage in a comment:

// console.log(`App v${__APP_VERSION__} — dev: ${__IS_DEV__}`);
// log("Server started", "info");


// ----------------------------------------------------------------
// Exercise 3: Declare an untyped npm module
// Imagine you installed a package called `simple-math` that has no
// @types package. It exports: add(a, b), subtract(a, b), multiply(a, b)
//
// Create `exercises/ch12/simple-math.d.ts` (using `declare module`)
// that gives it proper types.
// ----------------------------------------------------------------

// TODO: create exercises/ch12/simple-math.d.ts
// Show what the typed import would look like:

// import { add, subtract, multiply } from "simple-math";
// const result: number = add(2, 3);


// ----------------------------------------------------------------
// Exercise 4: Module augmentation
// The `Date` object is missing a method you want: `toRelative(): string`
// that returns strings like "2 hours ago" or "3 days ago".
//
// a) Create `exercises/ch12/date-augment.d.ts` that adds this method
//    to the global Date interface.
// b) Implement the method via prototype in this file.
// c) Use it below.
// ----------------------------------------------------------------

// TODO: create exercises/ch12/date-augment.d.ts

// Implementation (add this in this file):
// Date.prototype.toRelative = function (): string {
//     const diffMs = Date.now() - this.getTime();
//     const diffMins = Math.floor(diffMs / 60000);
//     if (diffMins < 60) return `${diffMins} minute(s) ago`;
//     const diffHours = Math.floor(diffMins / 60);
//     if (diffHours < 24) return `${diffHours} hour(s) ago`;
//     return `${Math.floor(diffHours / 24)} day(s) ago`;
// };

// const past = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
// console.log(past.toRelative()); // "2 hour(s) ago"


// ----------------------------------------------------------------
// Exercise 5: Generate declaration files
// Create a `tsconfig.json` inside `exercises/ch12/` with these options:
//   - declaration: true
//   - declarationDir: "./types"
//   - outDir: "./dist"
//   - strict: true
//
// Then run `tsc` inside that folder and observe the generated .d.ts files.
// Write a comment explaining what each generated file contains.
// ----------------------------------------------------------------

// TODO: create exercises/ch12/tsconfig.json and run tsc
// Write your observations as comments here:

// The generated .d.ts file for currency.ts contains:
// ...
