// ============================================================
// Chapter 1 — Types & Basic Syntax
// Run: tsx exercises/chapter_01.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Declare typed variables
// Declare 5 variables: your name, age, whether you like TS,
// your favourite number, and a variable that starts as null.
// Give each an explicit type annotation.
// ----------------------------------------------------------------

// TODO: declare your variables here


// ----------------------------------------------------------------
// Exercise 2: Type inference
// Let TypeScript infer the types — do NOT write type annotations.
// Then add a comment on each line stating what type was inferred.
// ----------------------------------------------------------------

// TODO: write the variables and their inferred type comments


// ----------------------------------------------------------------
// Exercise 3: The `unknown` type
// Write a function `describeValue(val: unknown): string` that:
//   - returns "number: X"  if val is a number
//   - returns "string: X"  if val is a string
//   - returns "boolean: X" if val is a boolean
//   - returns "other"      for everything else
// You must narrow the type before using it.
// ----------------------------------------------------------------

// TODO: implement describeValue

// Test — expected output:
// "number: 42"
// "string: hello"
// "boolean: true"
// "other"
// console.log(describeValue(42));
// console.log(describeValue("hello"));
// console.log(describeValue(true));
// console.log(describeValue({ a: 1 }));


// ----------------------------------------------------------------
// Exercise 4: Union types with null
// Write a function `getLength(value: string | null): number` that:
//   - returns the string length if value is a string
//   - returns 0 if value is null
// ----------------------------------------------------------------

// TODO: implement getLength

// Test — expected: 5, 0
// console.log(getLength("hello"));
// console.log(getLength(null));


// ----------------------------------------------------------------
// Exercise 5: Prevent `any`
// The function below uses `any` — fix it with proper types.
// ----------------------------------------------------------------

function addNumbers(a: any, b: any): any {
    return a + b;
}

// TODO: rewrite addNumbers with proper types above (edit the function)

// console.log(addNumbers(2, 3)); // 5
