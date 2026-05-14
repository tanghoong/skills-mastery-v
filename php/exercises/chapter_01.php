<?php
declare(strict_types=1);

/**
 * Chapter 1 — Getting Started with PHP 8.4
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_01.php
 */

// ── TODO 1: Print your name and PHP version using phpversion() ───────────────
// Use echo or print to display your name and the result of phpversion().
// Example: "My name is Alice, running PHP 8.4.x"

// your code here

// ── TODO 2: Use php_uname() to print the OS ──────────────────────────────────
// php_uname() returns info about the host OS. Print a friendly message
// that includes the result. Try php_uname('s') for just the OS name.

// your code here

// ── TODO 3: Define a constant APP_NAME and print it ──────────────────────────
// Use the define() function or the `const` keyword to define APP_NAME.
// Then print it with a label, e.g. "App: MyApp".

// your code here

// ── TODO 4: Write a strict-types function greet(string $name): string ─────────
// The function must accept a string $name and return "Hello, {name}!"
// Because strict_types=1 is declared, passing a non-string must cause a TypeError.

// your code here

// ── TODO 5: Print the result of greet() ──────────────────────────────────────
// Call greet() with your name (or any string) and echo the return value.
// Then try calling greet() with an integer — observe the TypeError.
// (Wrap the bad call in a try/catch so the script doesn't crash.)

// your code here

/*
 * Expected output (approximate):
 *
 * My name is Charlie, running PHP 8.4.2
 * OS: Linux
 * App: PHPMastery
 * Hello, Charlie!
 * TypeError caught: greet(): Argument #1 ($name) must be of type string, int given
 */
