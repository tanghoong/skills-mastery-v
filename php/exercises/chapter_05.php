<?php
declare(strict_types=1);

/**
 * Chapter 5 — Arrays: filter, map, reduce, and sorting
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_05.php
 */

// Starter data — do NOT modify this array.
$products = [
    ['name' => 'Mechanical Keyboard', 'price' => 129.99, 'category' => 'Tech'],
    ['name' => 'USB Hub',             'price' => 34.50,  'category' => 'Tech'],
    ['name' => 'Desk Lamp',           'price' => 55.00,  'category' => 'Office'],
    ['name' => 'Notebook',            'price' => 12.99,  'category' => 'Office'],
    ['name' => 'Webcam',              'price' => 89.95,  'category' => 'Tech'],
];

// ── TODO 1: Print all products using foreach ──────────────────────────────────
// For each product print a line like:
//   Mechanical Keyboard  |  Tech  |  $129.99

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 2: Filter — keep only products with price > 50 ──────────────────────
// Use array_filter() with a callback. Store the result in $expensive.
// Print the names of the filtered products.

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 3: Map — apply a 10% discount to every product's price ───────────────
// Use array_map() to create $discounted — a new array where each product's
// price is reduced by 10%. Do NOT mutate $products.
// Print the name and new discounted price for each item.
// Hint: you can use array_map with a closure that returns a modified copy of
// the element array.

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 4: Reduce — sum all prices ──────────────────────────────────────────
// Use array_reduce() to compute the total price of all items in $products.
// Print the total formatted to 2 decimal places.
// Hint: the callback receives ($carry, $item) — start with an initial value of 0.0.

// your code here

echo str_repeat('-', 40) . PHP_EOL;

// ── TODO 5: Sort products by price ascending using usort ──────────────────────
// Use usort() with a callback that uses the spaceship operator (<=>)
// to compare prices. Sort $products IN PLACE (usort mutates the array).
// After sorting, print the products in order (name + price).

// your code here

/*
 * Expected output (approximate):
 *
 * Mechanical Keyboard  |  Tech    |  $129.99
 * USB Hub              |  Tech    |  $34.50
 * Desk Lamp            |  Office  |  $55.00
 * Notebook             |  Office  |  $12.99
 * Webcam               |  Tech    |  $89.95
 * ----------------------------------------
 * Products over $50:
 *   Mechanical Keyboard ($129.99)
 *   Desk Lamp ($55.00)
 *   Webcam ($89.95)
 * ----------------------------------------
 * After 10% discount:
 *   Mechanical Keyboard  =>  $116.99
 *   USB Hub              =>  $31.05
 *   Desk Lamp            =>  $49.50
 *   Notebook             =>  $11.69
 *   Webcam               =>  $80.96
 * ----------------------------------------
 * Total price: $322.43
 * ----------------------------------------
 * Sorted by price (asc):
 *   Notebook             $12.99
 *   USB Hub              $34.50
 *   Desk Lamp            $55.00
 *   Webcam               $89.95
 *   Mechanical Keyboard  $129.99
 */
