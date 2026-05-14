<?php
declare(strict_types=1);

/**
 * Chapter 2 — Types, Type Juggling & Casting
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_02.php
 */

// ── TODO 1: Declare scalar-typed variables and print their types ──────────────
// Declare one variable for each scalar type: int, float, string, bool.
// For each, call gettype($variable) and print the result.
// Example output: "int: integer", "float: double", etc.

// your code here

// ── TODO 2: Demonstrate type juggling ────────────────────────────────────────
// In a file WITHOUT strict_types (or by using a non-strict context via shell),
// PHP would silently coerce "42" + 8 → 50. With strict_types=1 arithmetic
// still coerces for operators (not function args). Show this:
//   $result = 8 + "34 apples";  // PHP still coerces the string operand
// Use var_dump($result) to show the type and value of the result.
// Add a comment explaining WHY this works even under strict_types.

// your code here

// ── TODO 3: Cast float 9.99 to int — show what happens ───────────────────────
// Store 9.99 in $price (float). Cast it to (int) and store in $dollars.
// var_dump both variables. Add a comment: does PHP round or truncate?

$price = 9.99; // starter — apply the cast below

// your code here

// ── TODO 4: Write describeValue(mixed $val): string ──────────────────────────
// Return a string like "integer: 42" or "string: hello".
// Use gettype() to get the type name, then cast $val to string for the value
// part (use (string) casting or strval()).
// Handle booleans explicitly: show "true" or "false" instead of "1" or "".

function describeValue(mixed $val): string
{
    // your code here
    return ''; // replace this
}

// Test it:
// echo describeValue(42) . PHP_EOL;
// echo describeValue(3.14) . PHP_EOL;
// echo describeValue("hello") . PHP_EOL;
// echo describeValue(true) . PHP_EOL;
// echo describeValue(false) . PHP_EOL;

// your code here — uncomment and call the tests above

/*
 * Expected output (approximate):
 *
 * integer
 * double
 * string
 * boolean
 * ---
 * var_dump: int(42)
 * ---
 * float(9.99)  →  int(9)   [truncated, not rounded]
 * ---
 * integer: 42
 * double: 3.14
 * string: hello
 * boolean: true
 * boolean: false
 */
