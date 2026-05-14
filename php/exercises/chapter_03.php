<?php
declare(strict_types=1);

/**
 * Chapter 3 — Control Flow: Loops, match, and switch
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_03.php
 */

// ── TODO 1: FizzBuzz 1–30 using a for loop and match expression ───────────────
// Loop from 1 to 30. For each number, use a match expression to decide:
//   - divisible by both 15 → "FizzBuzz"
//   - divisible by 3       → "Fizz"
//   - divisible by 5       → "Buzz"
//   - otherwise            → the number itself (cast to string)
// Hint: match(true) { $n % 15 === 0 => ..., ... }
// Print each result on its own line.

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 2: Iterate an associative array with foreach ─────────────────────────
// The array is pre-filled. Use foreach to print each language and its version
// in the format: "php => 8.4"

$languages = [
    'php'    => 8.4,
    'python' => 3.12,
    'node'   => 20,
    'go'     => 1.22,
    'rust'   => 1.78,
];

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 3: Fibonacci numbers under 100 using a while loop ────────────────────
// Start with $a = 0, $b = 1. While the next Fibonacci number is < 100,
// push it into $fibs array. After the loop, print the array as a
// comma-separated string using implode().

$fibs = [];
// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 4: Rewrite TODO 1's FizzBuzz as a switch statement ───────────────────
// Use a switch on true (switch(true)) to replicate the match logic.
// After the loop, add a multi-line comment comparing match vs switch:
//   - Does switch fall-through by default?
//   - Is match strict (===) or loose (==)?
//   - Which is an expression vs a statement?

for ($i = 1; $i <= 30; $i++) {
    // your switch here
}

/*
 * YOUR COMPARISON COMMENT HERE:
 *
 * switch vs match:
 * - ...
 * - ...
 * - ...
 */

/*
 * Expected output (approximate):
 *
 * 1
 * 2
 * Fizz
 * 4
 * Buzz
 * Fizz
 * 7
 * 8
 * Fizz
 * Buzz
 * 11
 * Fizz
 * 13
 * 14
 * FizzBuzz
 * ... (up to 30)
 * ----------------------------------------
 * php => 8.4
 * python => 3.12
 * node => 20
 * go => 1.22
 * rust => 1.78
 * ----------------------------------------
 * 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89
 * ----------------------------------------
 * (FizzBuzz repeated via switch)
 */
