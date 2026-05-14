<?php
declare(strict_types=1);

/**
 * Chapter 12 — Magic Methods
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_12.php
 */

// ── TODO 1: MagicBox with __get / __set / __isset / __unset ──────────────────
// Create class MagicBox with:
//   - private array $data = []
//   - __get(string $name): mixed     → return $this->data[$name] ?? null
//   - __set(string $name, mixed $value): void
//   - __isset(string $name): bool
//   - __unset(string $name): void
//
// Test: set $box->color = 'red', $box->size = 'large'
//       isset($box->color) → true
//       unset($box->size)
//       isset($box->size)  → false

// your code here


// ── TODO 2: __toString returning JSON ────────────────────────────────────────
// Add __toString(): string to MagicBox.
// It should return json_encode($this->data, JSON_THROW_ON_ERROR).
// Test by echoing the box directly and via string interpolation.

// your code here (modify class above)


// ── TODO 3: __invoke ─────────────────────────────────────────────────────────
// Add __invoke(string $key): mixed to MagicBox.
// Calling $box('color') should return $this->data[$key] ?? null.
//
// Test:
//   $box = new MagicBox();
//   $box->greeting = 'hello';
//   echo $box('greeting'); // hello
//
// Also pass $box as a callable to array_map over ['greeting', 'size'] and print results.

// your code here (modify class above)


// ── TODO 4: __clone for deep copy ────────────────────────────────────────────
// Add a nested object property to MagicBox:
//   - public ?object $metadata = null  (use a simple stdClass or a small inner class)
//
// Add __clone(): void to MagicBox that deep-copies $this->metadata with clone.
//
// Demonstrate:
//   $original = new MagicBox();
//   $original->metadata = new stdClass();
//   $original->metadata->version = 1;
//
//   $copy = clone $original;
//   $copy->metadata->version = 99;
//
//   echo $original->metadata->version; // must still be 1 (deep copy worked)
//   echo $copy->metadata->version;     // 99

// your code here (modify class above)


// ── TODO 5: __destruct cleanup message ───────────────────────────────────────
// Add __destruct(): void to MagicBox that prints "MagicBox destroyed with N items."
// where N is count($this->data).
//
// Create a MagicBox, add a few properties, then use unset() to trigger __destruct
// immediately rather than waiting for end of script.

// your code here (modify class above, then demo below)
