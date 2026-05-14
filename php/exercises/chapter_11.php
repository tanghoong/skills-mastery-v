<?php
declare(strict_types=1);

/**
 * Chapter 11 — Constructor Promotion, Readonly & Enums
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_11.php
 */

// ── TODO 1: readonly class Point ─────────────────────────────────────────────
// Create `readonly class Point` with:
//   - Promoted constructor parameters: float $x, float $y
//   - Method distanceTo(Point $other): float → Euclidean distance
//
// Instantiate two points and print the distance.
// Try to assign to $point->x after creation and observe the error (comment it out).

// your code here


// ── TODO 2: Backed enum Status: string ───────────────────────────────────────
// Define backed enum Status: string with cases:
//   Active   = 'active'
//   Inactive = 'inactive'
//   Pending  = 'pending'
//
// Add method label(): string that returns a human-friendly label for each case.
// Add method isTerminal(): bool that returns true only for Inactive.

// your code here


// ── TODO 3: Unit enum Direction ──────────────────────────────────────────────
// Define unit enum Direction with cases: North, South, East, West
// Write a function move(Direction $d): string using match() that returns a descriptive string.
// Call it for every case using Direction::cases().

// your code here


// ── TODO 4: Status implements HasLabel interface ──────────────────────────────
// Define interface HasLabel with method label(): string.
// Make Status implement HasLabel (you may need to adjust TODO 2 above).
// Write a function printLabel(HasLabel $item): void that prints the label.
// Call it for each Status case.

// your code here


// ── TODO 5: Status::from() and Status::tryFrom() ─────────────────────────────
// a) Use Status::from('active')     → should return Status::Active; print its label.
// b) Use Status::from('unknown')    → should throw \ValueError; catch and print the message.
// c) Use Status::tryFrom('pending') → should return Status::Pending; print its value.
// d) Use Status::tryFrom('ghost')   → should return null; print "not found".

// your code here
