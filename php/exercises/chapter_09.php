<?php
declare(strict_types=1);

/**
 * Chapter 9 — Inheritance & Abstract Classes
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_09.php
 */

// ── TODO 1: Abstract class Shape ─────────────────────────────────────────────
// Create abstract class Shape with:
//   - abstract public area(): float
//   - final public describe(): string
//     → returns e.g. "Circle with area 78.54" (use get_class($this) and round area to 2 dp)

// your code here


// ── TODO 2: Circle and Rectangle ─────────────────────────────────────────────
// Implement Circle extending Shape:
//   - Constructor accepts private float $radius
//   - Implements area(): float using M_PI
//
// Implement Rectangle extending Shape:
//   - Constructor accepts private float $width and private float $height
//   - Implements area(): float

// your code here


// ── TODO 3: final describe() in Shape ────────────────────────────────────────
// Verify that describe() is marked final in Shape (already done in TODO 1).
// To prove it works: try writing a subclass that attempts to override describe()
// and comment it out with an explanation of what would happen.

// your code here (comment only — PHP would fatal error if you tried to override a final method)


// ── TODO 4: parent:: call from a child method ────────────────────────────────
// Add a method info(): string to Circle that:
//   - Calls parent::describe() to get the base description
//   - Appends " | radius={$this->radius}" (make $radius protected or use a getter)

// your code here (modify Circle above, or extend it here)


// ── TODO 5: Polymorphic array of shapes ──────────────────────────────────────
// Create an array of at least three mixed shapes (Circle and Rectangle instances).
// Loop over them and print describe() for each.
// Also print the total area of all shapes.

// your code here
