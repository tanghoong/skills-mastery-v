<?php
declare(strict_types=1);
/**
 * Chapter 20 — PHP 8.5 Features
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_20.php
 * Note: Requires PHP >= 8.5 for the pipe operator (|>)
 *       TODOs 1–3 use |> — run on PHP 8.5+ or read as conceptual exercises.
 */

echo "=== Chapter 20: PHP 8.5 Features ===\n\n";

// ── TODO 1: Pipe operator for string transformations ─────────────────────────
// Use the pipe operator |> to chain the following transforms on the input string
// '  HELLO WORLD  ' and produce 'Hello world':
//   1. trim
//   2. strtolower
//   3. ucfirst
//
// Write it as a single expression using |> and first-class callable syntax.

// Uncomment to test (PHP 8.5+):
// $result = '  HELLO WORLD  '
//     |> trim(...)
//     |> strtolower(...)
//     |> ucfirst(...);
//
// echo "TODO 1 — pipe result: " . $result . "\n"; // Hello world


// ── TODO 2: New PHP 8.5 array/string functions (exploratory) ─────────────────
// PHP 8.5 is adding new helpers. Explore their availability in your build.
// If a function does not exist yet, fall back to the pre-8.5 equivalent and
// add a comment explaining what the new function would do.
//
// Functions to explore:
//   - array_first($array)  — returns first element without mutating pointer
//   - array_last($array)   — returns last element without mutating pointer

$items = [10, 20, 30, 40, 50];

// TODO 2a: array_first — try native, fall back to array_slice approach
// if (function_exists('array_first')) {
//     $first = array_first($items);
//     echo "TODO 2a — array_first (native): {$first}\n";
// } else {
//     $first = array_slice($items, 0, 1)[0];
//     echo "TODO 2a — array_first (polyfill): {$first}\n";
// }

// TODO 2b: array_last — try native, fall back to array_slice approach
// if (function_exists('array_last')) {
//     $last = array_last($items);
//     echo "TODO 2b — array_last (native): {$last}\n";
// } else {
//     $last = array_slice($items, -1)[0];
//     echo "TODO 2b — array_last (polyfill): {$last}\n";
// }


// ── TODO 3: Pipe operator — readability comparison ────────────────────────────
// Write the same data sanitisation pipeline in two styles and compare.
//
// Input: '  php 8.5  is  great  '
// Transforms in order:
//   1. trim
//   2. collapse multiple spaces: preg_replace('/\s+/', ' ', $s)
//   3. ucwords
//   4. htmlspecialchars with ENT_QUOTES | UTF-8
// Expected output: 'Php 8.5 Is Great' (no HTML entities needed for this input)

// Old style (nested calls — read inside-out):
// function sanitizeOld(string $input): string
// {
//     return htmlspecialchars(
//         ucwords(
//             preg_replace('/\s+/', ' ', trim($input)) ?? ''
//         ),
//         ENT_QUOTES,
//         'UTF-8'
//     );
// }

// PHP 8.5 pipe style (read left-to-right):
// function sanitizeNew(string $input): string
// {
//     return $input
//         |> trim(...)
//         |> fn(string $s): string => preg_replace('/\s+/', ' ', $s) ?? $s
//         |> ucwords(...)
//         |> fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
// }

// Uncomment to test:
// $raw = '  php 8.5  is  great  ';
// echo "TODO 3 — old style: " . sanitizeOld($raw) . "\n";
// echo "TODO 3 — pipe style: " . sanitizeNew($raw) . "\n";
// // Both should print: Php 8.5 Is Great


// ── TODO 4: RFC tracker (comments only — no runnable code) ────────────────────
// List 3 tracked RFCs from Appendix B in chapter_20_php85_features.md.
// For each RFC, write a comment stating: name, description, current status.
// This is a reading and reflection exercise — no code to run.

// RFC 1: Generics
//   Description: Type-parameterised classes and functions (e.g., Stack<int>)
//   Status: Under discussion — no confirmed target version as of 2025.
//   Why it matters: Would eliminate the need for docblock @template workarounds
//                   and bring PHP's type system much closer to TypeScript generics.

// RFC 2: array_first / array_last
//   Description: Non-mutating functions to access the first or last element
//                of an array without side effects on the internal pointer.
//   Status: In voting — likely to land in PHP 8.5.
//   Why it matters: reset()/end() mutate internal state, making them unsafe
//                   in certain iteration contexts.

// RFC 3: Readonly class properties in clones (the `with` keyword)
//   Description: Allow clone-and-modify syntax for readonly properties:
//                $new = clone $obj with (property: $newValue)
//   Status: Draft — inspired by Kotlin's data class copy() and C# records.
//   Why it matters: Currently readonly properties cannot be changed even in
//                   clone, making immutable data structures verbose to update.

echo "\nAll TODOs complete!\n";
echo "\nNote: TODOs 1–3 require PHP 8.5+. On earlier versions, read them as\n";
echo "conceptual exercises and compare old-style vs pipe-style readability.\n";
