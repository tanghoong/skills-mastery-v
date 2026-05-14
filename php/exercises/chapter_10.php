<?php
declare(strict_types=1);

/**
 * Chapter 10 — Interfaces & Traits
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_10.php
 */

// ── TODO 1: Define interfaces ─────────────────────────────────────────────────
// Define interface JsonSerializable (avoid name clash with PHP built-in):
//   - serialize(): string  → returns a JSON string
//
// Define interface Loggable:
//   - log(): void  → prints a line describing the object

// your code here


// ── TODO 2: User class implementing both interfaces ───────────────────────────
// Create class User implementing both interfaces above:
//   - Properties: int $id, string $name, string $email
//   - serialize(): string → json_encode of the three properties
//   - log(): void → prints "User[{$id}] {$name} <{$email}>"

// your code here


// ── TODO 3: Timestampable trait ───────────────────────────────────────────────
// Create trait Timestampable with:
//   - private ?DateTimeImmutable $createdAt = null
//   - private ?DateTimeImmutable $updatedAt = null
//   - public touch(): void  → sets createdAt on first call, always updates updatedAt
//   - public getCreatedAt(): ?DateTimeImmutable
//   - public getUpdatedAt(): ?DateTimeImmutable

// your code here


// ── TODO 4: Apply the trait to User ──────────────────────────────────────────
// Add `use Timestampable;` inside User.
//
// If User already has a method that conflicts with a trait method, resolve it:
//   - Use `insteadof` to prefer one implementation
//   - Use `as` to alias the discarded one under a new name
//
// (For this exercise, intentionally add a placeholder log() method to Timestampable
//  so you can practise the conflict resolution syntax, then resolve it.)

// your code here (modify User and Timestampable above, or add a second trait here)


// ── TODO 5: Trait constant DEFAULT_TIMEZONE (PHP 8.2) ────────────────────────
// Add to Timestampable:
//   - public const string DEFAULT_TIMEZONE = 'UTC'
//   - Update touch() to use new DateTimeZone(self::DEFAULT_TIMEZONE) when creating the timestamp
//
// After applying the trait, access User::DEFAULT_TIMEZONE and print it.
// Then call $user->touch() twice and print getUpdatedAt()->format('Y-m-d H:i:s').

// your code here
