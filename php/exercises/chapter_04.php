<?php
declare(strict_types=1);

/**
 * Chapter 4 — Functions: Defaults, Variadics, References & Higher-Order
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_04.php
 */

// ── TODO 1: Write add() with a default parameter ──────────────────────────────
// Signature: add(int $a, int $b = 0): int
// Call it twice: once with two arguments, once with only one.
// Print both results.

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 2: Write a variadic sum() function ───────────────────────────────────
// Signature: sum(int ...$nums): int
// Use array_sum() or a foreach loop to add all arguments.
// Call it with 3 different argument counts (0 args, 3 args, 5 args) and print
// the results.

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 3: Pass-by-reference with increment() ────────────────────────────────
// Signature: increment(int &$n, int $by = 1): void
// The function modifies $n directly (no return value).
// After calling it, print $n to verify the mutation happened.
// Call it twice: once with the default $by, once with $by = 5.

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 4: Higher-order function applyTwice() ────────────────────────────────
// Signature: applyTwice(callable $fn, int $x): int
// Applies $fn to $x, then applies $fn to the result, and returns that.
// Example: applyTwice(fn($n) => $n * 2, 3)  →  12  (3*2=6, 6*2=12)
// Test it with:
//   a) an arrow function that doubles the number
//   b) a named function (you can define `function triple(int $n): int`)
// Print both results.

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 5: Named arguments with array_slice ──────────────────────────────────
// Given the array below, use array_slice with NAMED ARGUMENTS to extract
// elements from index 2, length 3, and set preserve_keys: true.
// Print the result using print_r().
// Named argument syntax: array_slice(array: $arr, offset: 2, ...)

$fruits = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig'];

// your code here

/*
 * Expected output (approximate):
 *
 * add(3, 4) = 7
 * add(5)    = 5
 * ----------------------------------------
 * sum()          = 0
 * sum(1,2,3)     = 6
 * sum(10,20,30,40,50) = 150
 * ----------------------------------------
 * After increment($n):     $n = 11
 * After increment($n, 5):  $n = 16
 * ----------------------------------------
 * applyTwice(double, 3)  = 12
 * applyTwice(triple, 2)  = 18
 * ----------------------------------------
 * Array
 * (
 *     [2] => cherry
 *     [3] => date
 *     [4] => elderberry
 * )
 */
