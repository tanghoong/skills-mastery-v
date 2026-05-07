// ============================================================
// Chapter 3 — Functions, Arrays & Tuples
// Run: tsx exercises/chapter_03.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Typed function
// Write a function `celsiusToFahrenheit(c: number): number`
// and its inverse `fahrenheitToCelsius(f: number): number`.
// Formula: F = (C × 9/5) + 32
// ----------------------------------------------------------------

// TODO: implement both functions

// Test:
// console.log(celsiusToFahrenheit(0));   // 32
// console.log(celsiusToFahrenheit(100)); // 212
// console.log(fahrenheitToCelsius(32));  // 0
// console.log(fahrenheitToCelsius(212)); // 100


// ----------------------------------------------------------------
// Exercise 2: Optional & default parameters
// Write `formatName(first: string, last: string, title?: string): string`
// If title is provided: "Dr. John Smith"
// If not: "John Smith"
// ----------------------------------------------------------------

// TODO: implement formatName

// console.log(formatName("John", "Smith"));        // "John Smith"
// console.log(formatName("Jane", "Doe", "Dr."));   // "Dr. Jane Doe"


// ----------------------------------------------------------------
// Exercise 3: Array operations
// Given the numbers array below, write functions (all properly typed) to:
//   a) filter out numbers below a threshold
//   b) return the sum of all numbers
//   c) return a new array with each number doubled
// ----------------------------------------------------------------

const numbers: number[] = [3, 7, 1, 14, 9, 2, 11, 6];

// TODO: implement filterAbove(nums, threshold), sum(nums), doubled(nums)

// console.log(filterAbove(numbers, 6));  // [7, 14, 9, 11]
// console.log(sum(numbers));             // 53
// console.log(doubled(numbers));         // [6, 14, 2, 28, 18, 4, 22, 12]


// ----------------------------------------------------------------
// Exercise 4: Tuple
// Write a function `splitFullName(fullName: string): [string, string]`
// that splits "John Smith" into ["John", "Smith"].
// Then write `minMax(nums: number[]): [number, number]`
// that returns [min, max] of an array.
// ----------------------------------------------------------------

// TODO: implement splitFullName and minMax

// const [first, last] = splitFullName("Charlie Tang");
// console.log(first, last); // "Charlie" "Tang"

// const [min, max] = minMax(numbers);
// console.log(min, max); // 1  14


// ----------------------------------------------------------------
// Exercise 5: Rest parameters
// Write `buildSentence(verb: string, ...nouns: string[]): string`
// that returns e.g. "I like TypeScript, React, and NestJS"
// Handle 1 noun, 2 nouns, and 3+ nouns correctly.
// ----------------------------------------------------------------

// TODO: implement buildSentence

// console.log(buildSentence("like", "TypeScript"));               // "I like TypeScript"
// console.log(buildSentence("enjoy", "coding", "coffee"));        // "I enjoy coding and coffee"
// console.log(buildSentence("use", "React", "NestJS", "Prisma")); // "I use React, NestJS, and Prisma"
