<?php
declare(strict_types=1);

/**
 * Chapter 13 — Type System
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_13.php
 */

// ── TODO 1: Union type int|string ────────────────────────────────────────────
// Write function formatId(int|string $id): string
//   - If int: zero-pad to 8 digits (e.g. 42 → "00000042")
//   - If string: trim and uppercase (e.g. "  abc  " → "ABC")
//
// Call it with an int and a string and print both results.

// your code here


// ── TODO 2: Intersection type Stringable&Countable ────────────────────────────
// PHP has built-in interfaces Stringable (requires __toString) and Countable (requires count).
// Write function summarize(Stringable&Countable $col): string
//   → returns "Count: {n}, String: {str}"
//
// Create a class WordList implements Stringable, Countable:
//   - Holds a list of words
//   - __toString(): returns words joined by ", "
//   - count(): returns word count  (note: return type is int)
//
// Pass a WordList to summarize() and print the result.

// your code here


// ── TODO 3: int|false vs int|null ────────────────────────────────────────────
// a) Write legacyFind(array $haystack, string $needle): int|false
//      Uses array_search; returns the int index or false if not found.
//
// b) Write modernFind(array $haystack, string $needle): int|null
//      Same logic but returns null instead of false.
//
// Test both with a hit and a miss; print results with var_dump to see the type difference.
// Add a brief comment explaining why null is preferred over false in new code.

// your code here


// ── TODO 4: never return type ────────────────────────────────────────────────
// Write function abort(int $code, string $message): never
//   → always throws \RuntimeException with format "[$code] $message"
//
// Write function requirePositive(int $n): int
//   → calls abort(422, "...) if $n <= 0, otherwise returns $n
//   → after the if block, a static analyser should know $n > 0
//
// Test with a valid and an invalid input; catch the exception for the invalid case.

// your code here


// ── TODO 5: Typed class constant (PHP 8.3) ────────────────────────────────────
// Create class ApiConfig with typed constants:
//   public const string VERSION     = '1.0.0'
//   public const int    TIMEOUT_MS  = 5000
//   public const bool   RETRY       = true
//
// Print each constant via ApiConfig::VERSION etc.
//
// Also define interface HasVersion { public const string VERSION; }
// Create class V2Client implements HasVersion { public const string VERSION = '2.0.0'; }
// Print V2Client::VERSION.

// your code here
