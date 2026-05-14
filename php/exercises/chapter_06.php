<?php
declare(strict_types=1);

/**
 * Chapter 6 — Strings: heredoc, sprintf, regex, and modern helpers
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_06.php
 */

// ── TODO 1: Heredoc — multi-line address ─────────────────────────────────────
// Use a heredoc (<<<EOT ... EOT;) to assign a multi-line address string to
// $address, then print it. The address should be at least 4 lines:
//   Name, Street, City + Postcode, Country
// Note: heredoc respects newlines and supports variable interpolation.

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 2: sprintf — formatted receipt line ──────────────────────────────────
// Use sprintf with the format string below to print a receipt line.
// Format: "Item: %-20s Price: %8.2f"
//   %-20s  → left-aligned string, padded to 20 chars
//   %8.2f  → right-aligned float with 2 decimal places, 8 chars wide
// Print at least 3 receipt lines (different items and prices).

$receiptItems = [
    ['name' => 'Mechanical Keyboard', 'price' => 129.99],
    ['name' => 'USB Hub',             'price' => 34.50],
    ['name' => 'Webcam',              'price' => 89.95],
];

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 3: Write slugify(string $title): string ──────────────────────────────
// Convert a blog post title into a URL slug:
//   1. strtolower()        — lowercase everything
//   2. preg_replace()      — replace any non-alphanumeric chars with a hyphen
//   3. preg_replace()      — collapse multiple consecutive hyphens into one
//   4. trim($slug, '-')    — strip leading/trailing hyphens
// Test with: "  Hello, World! This is PHP 8.4  "
// Expected:  "hello-world-this-is-php-8-4"

function slugify(string $title): string
{
    // your code here
    return ''; // replace this
}

// your code here — call slugify() and print the result

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 4: preg_match — basic email validation ───────────────────────────────
// Write a function isValidEmail(string $email): bool that uses preg_match
// to check for a basic email pattern: something@something.something
// Pattern suggestion: /^[\w.\-+]+@[\w\-]+\.[a-z]{2,}$/i
// Test with at least 3 valid and 2 invalid email addresses. Print PASS/FAIL.

function isValidEmail(string $email): bool
{
    // your code here
    return false; // replace this
}

$emailTests = [
    'charlie@tanghoong.com' => true,
    'user.name+tag@example.co.uk' => true,
    'no-at-sign.com' => false,
    'missing@tld' => false,
    'valid@subdomain.example.org' => true,
];

// your code here — loop $emailTests, call isValidEmail(), print PASS/FAIL

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 5: Modern string helpers ─────────────────────────────────────────────
// Given the sample string below, use str_contains, str_starts_with, and
// str_ends_with to answer three questions. Print each result as a sentence.
//
// Questions:
//   a) Does $sentence contain "PHP"?
//   b) Does $sentence start with "Modern"?
//   c) Does $sentence end with "world."?

$sentence = "Modern PHP 8.4 is a joy to work with in the real world.";

// your code here

/*
 * Expected output (approximate):
 *
 * Charlie Tang
 * 123 Example Street
 * Sydney NSW 2000
 * Australia
 * ----------------------------------------
 * Item: Mechanical Keyboard   Price:   129.99
 * Item: USB Hub                Price:    34.50
 * Item: Webcam                 Price:    89.95
 * ----------------------------------------
 * slugify result: "hello-world-this-is-php-8-4"
 * ----------------------------------------
 * charlie@tanghoong.com       => PASS
 * user.name+tag@example.co.uk => PASS
 * no-at-sign.com              => FAIL
 * missing@tld                 => FAIL
 * valid@subdomain.example.org => PASS
 * ----------------------------------------
 * Contains "PHP": true
 * Starts with "Modern": true
 * Ends with "world.": true
 */
