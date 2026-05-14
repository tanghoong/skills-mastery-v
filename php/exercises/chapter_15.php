<?php
declare(strict_types=1);
/**
 * Chapter 15 — Closures & Functional PHP
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_15.php
 */

echo "=== Chapter 15: Closures & Functional PHP ===\n\n";

// ── TODO 1: Closure with `use` binding ───────────────────────────────────────
// Create a closure that captures $multiplier via `use` and multiplies a number.
// Test it with $multiplier = 4 and the input 7. Expected output: 28.

$multiplier = 4;

// Your closure here:
// $multiply = function (int $n) use (...): int { ... };

// echo "TODO 1 — multiply(7): " . $multiply(7) . "\n"; // 28


// ── TODO 2: Closure::bind to access a private property ───────────────────────
// Given the class below, use Closure::bind to create a closure that reads the
// private $secret property from outside the class. Print the secret value.

class SecretBox
{
    private string $secret = 'php-is-powerful';
}

// Your Closure::bind call here:
// $readSecret = Closure::bind(
//     function (): string { return ...; },
//     new SecretBox(),
//     SecretBox::class
// );

// echo "TODO 2 — secret: " . $readSecret() . "\n"; // php-is-powerful


// ── TODO 3: Function composition (right-to-left) ─────────────────────────────
// Write a `compose(callable ...$fns): Closure` function that composes callables
// right-to-left. compose($f, $g, $h)($x) should equal $f($g($h($x))).
//
// Test case: compose trim, strtolower, then str_replace spaces with dashes
// on the string '  Hello World  ' → should produce 'hello-world'.

function compose(callable ...$fns): Closure
{
    // Hint: array_reduce over array_reverse($fns)
    // Start with the identity function: fn($x) => $x
    throw new \RuntimeException('TODO 3: implement compose()');
}

// Uncomment to test:
// $slugify = compose(
//     fn(string $s): string => str_replace(' ', '-', $s),
//     fn(string $s): string => strtolower($s),
//     fn(string $s): string => trim($s),
// );
// echo "TODO 3 — slug: " . $slugify('  Hello World  ') . "\n"; // hello-world


// ── TODO 4: First-class callable syntax with array_map ───────────────────────
// Use the first-class callable syntax (strlen(...)) to map over an array of
// strings and get their lengths. No anonymous function allowed — use strlen(...)
// directly.
//
// Input: ['PHP', 'is', 'awesome']
// Expected: [3, 2, 7]

$words = ['PHP', 'is', 'awesome'];

// $lengths = array_map(..., $words);

// echo "TODO 4 — lengths: ";
// print_r($lengths);


// ── TODO 5: Pipeline via array_reduce over callables ─────────────────────────
// Build a left-to-right pipeline function using array_reduce over an array of
// callables. The pipeline should pass the result of each step to the next.
//
// Apply this pipeline to the string '  PHP 8.4 IS GREAT  ':
//   Step 1: trim
//   Step 2: strtolower
//   Step 3: ucwords
//
// Expected: 'Php 8.4 Is Great'

function pipeline(mixed $initial, callable ...$steps): mixed
{
    // Hint: array_reduce over $steps
    throw new \RuntimeException('TODO 5: implement pipeline()');
}

// Uncomment to test:
// $result = pipeline(
//     '  PHP 8.4 IS GREAT  ',
//     trim(...),
//     strtolower(...),
//     ucwords(...),
// );
// echo "TODO 5 — pipeline: " . $result . "\n"; // Php 8.4 Is Great

echo "\nAll TODOs complete!\n";
