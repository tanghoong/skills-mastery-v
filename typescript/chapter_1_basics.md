# Chapter 1: Types & Basic Syntax (Hour 1)

Welcome to your 5-hour TypeScript mastery journey. In this first hour, we will cover the core primitives and why TypeScript exists.

## 1. What is TypeScript?
TypeScript is a syntactic superset of JavaScript that adds **static typing**. This means you can catch errors at compile-time rather than runtime.

## 2. Basic Types
TypeScript introduces several basic types.
```typescript
// Primitives
let isDone: boolean = false;
let age: number = 25;
let firstName: string = "Charlie";

// any (Avoid using this if possible, it defeats the purpose of TS)
let looselyTyped: any = 4;
looselyTyped = "Now I am a string";

// unknown (Safer than any, forces you to check the type before using)
let notSure: unknown = 4;
if (typeof notSure === "number") {
  console.log(notSure * 2);
}
```

## 3. Type Inference
You don't always have to explicitly define types. TypeScript is smart enough to infer them.
```typescript
let message = "Hello World"; // inferred as string
// message = 5; // Error: Type 'number' is not assignable to type 'string'.
```

## 4. null and undefined
By default, `null` and `undefined` are subtypes of all other types. However, if you use the `strictNullChecks` flag (highly recommended), you must handle them explicitly.
```typescript
let optionalValue: string | null = null;
optionalValue = "I have a value now";
```

## 5. Frequently Asked Questions
**Q: Can we convert `.js` back into `.ts` exactly as it was? Is there a use case?**
No, you cannot perfectly "un-compile" JavaScript back into the exact TypeScript because of **Type Erasure**. When TypeScript compiles to JavaScript, all type information is completely deleted. The generated `.js` file has no memory of the original types.
However, there is a big use case for converting `.js` to `.ts`: **Migrating a Legacy Project**. Teams often rename `.js` files to `.ts`, enable the `allowJs` flag, and manually add missing types file-by-file to gradually migrate a codebase.

## Action Item for Hour 1:
- Install TypeScript globally (`npm install -g typescript`).
- Create a `test.ts` file, write some basic typed variables, and compile it using `tsc test.ts`. Notice the output JavaScript.
