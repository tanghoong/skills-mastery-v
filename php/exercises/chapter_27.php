<?php
declare(strict_types=1);
/**
 * Chapter 27 — Architecture Patterns
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_27.php
 */

// ── TODO 1: Repository ────────────────────────────────────────────────────────
// Define:
//   class User { int $id, string $email }
//
//   interface UserRepositoryInterface {
//     findById(int $id): ?User
//     findByEmail(string $email): ?User
//     save(User $user): void
//   }
//
//   class InMemoryUserRepository implements UserRepositoryInterface
//     - Stores users in a private array keyed by id
//     - nextId(): int — auto-increment helper (starts at 1)
//
// This repository will be used by UserService in TODO 5.

// YOUR CODE HERE
// class User { ... }
// interface UserRepositoryInterface { ... }
// class InMemoryUserRepository implements UserRepositoryInterface { ... }

// Demonstration:
// $repo = new InMemoryUserRepository();
// $id   = $repo->nextId();
// $repo->save(new User($id, 'alice@example.com'));
// $user = $repo->findByEmail('alice@example.com');
// echo $user->email . PHP_EOL; // alice@example.com
// var_dump($repo->findById(99)); // NULL


// ── TODO 2: DTO ───────────────────────────────────────────────────────────────
// Implement a UserDto using PHP 8.2+ readonly class with constructor promotion:
//   int $id, string $email, string $createdAt
//
// Add a static named constructor:
//   UserDto::fromUser(User $user): self
//   — sets createdAt to date('Y-m-d')
//
// DTOs are immutable data carriers — no setters, no business logic.

// YOUR CODE HERE
// readonly class UserDto {
//     public function __construct(
//         public readonly int    $id,
//         public readonly string $email,
//         public readonly string $createdAt,
//     ) {}
//
//     public static function fromUser(User $user): self { ... }
// }

// Demonstration:
// $user = new User(1, 'alice@example.com');
// $dto  = UserDto::fromUser($user);
// echo "{$dto->id} — {$dto->email} — {$dto->createdAt}" . PHP_EOL;


// ── TODO 3: Value Object ──────────────────────────────────────────────────────
// Implement readonly class Email:
//   Constructor accepts a raw string, normalises it (lowercase + trim),
//   validates via filter_var(FILTER_VALIDATE_EMAIL), and stores in $this->value.
//   Throws \InvalidArgumentException on invalid input.
//
//   equals(Email $other): bool — compares normalised values
//   __toString(): string       — returns $this->value
//
// Two Email instances with different casings of the same address must be equal.
// An invalid address must throw.

// YOUR CODE HERE
// readonly class Email {
//     public readonly string $value;
//     public function __construct(string $raw) { ... }
//     public function equals(Email $other): bool { ... }
//     public function __toString(): string { ... }
// }

// Demonstration:
// $a = new Email('Alice@Example.COM');
// $b = new Email('alice@example.com');
// var_dump($a->equals($b)); // true
// echo (string) $a . PHP_EOL; // alice@example.com
//
// try {
//     new Email('not-an-email');
// } catch (\InvalidArgumentException $e) {
//     echo "Caught: {$e->getMessage()}" . PHP_EOL;
// }


// ── TODO 4: Result Pattern ────────────────────────────────────────────────────
// Implement Ok and Err as readonly classes:
//
//   readonly class Ok {
//     public function __construct(public readonly mixed $value) {}
//     public function isOk(): bool  { return true; }
//     public function isErr(): bool { return false; }
//   }
//
//   readonly class Err {
//     public function __construct(public readonly mixed $error) {}
//     public function isOk(): bool  { return false; }
//     public function isErr(): bool { return true; }
//   }
//
// Write a helper function divide(float $a, float $b): Ok|Err
//   - Returns Err('Division by zero') when b === 0.0
//   - Returns Ok($a / $b) otherwise

// YOUR CODE HERE
// readonly class Ok { ... }
// readonly class Err { ... }
// function divide(float $a, float $b): Ok|Err { ... }

// Demonstration:
// $good = divide(10, 4);
// if ($good->isOk()) { echo $good->value . PHP_EOL; }   // 2.5
//
// $bad = divide(1, 0);
// if ($bad->isErr()) { echo $bad->error . PHP_EOL; }    // Division by zero


// ── TODO 5: Service Layer (wire everything together) ──────────────────────────
// Implement UserService::register(string $rawEmail): Ok|Err
//
// Steps inside register():
//   1. Construct Email value object — if invalid, return Err(message)
//   2. Check repo for existing user by email — if found, return Err('Email already registered.')
//   3. Create User with next ID from repo and save to repo
//   4. Log "Registered: {email}" via logger
//   5. Return Ok(UserDto::fromUser($user))
//
// LoggerInterface: log(string $message): void
// EchoLogger: prints "[log] {message}"
//
// Wire up: InMemoryUserRepository + EchoLogger -> UserService
// Call register() twice with the same email to show duplicate detection.

// YOUR CODE HERE
// interface LoggerInterface { ... }
// class EchoLogger implements LoggerInterface { ... }
//
// class UserService {
//     public function __construct(
//         private readonly InMemoryUserRepository $repo,
//         private readonly LoggerInterface        $logger
//     ) {}
//
//     public function register(string $rawEmail): Ok|Err { ... }
// }

// Demonstration:
// $repo    = new InMemoryUserRepository();
// $logger  = new EchoLogger();
// $service = new UserService($repo, $logger);
//
// $result = $service->register('alice@example.com');
// if ($result->isOk()) {
//     $dto = $result->value;
//     echo "Created user #{$dto->id}: {$dto->email}" . PHP_EOL;
// }
//
// $dup = $service->register('ALICE@EXAMPLE.COM'); // same email, different case
// if ($dup->isErr()) {
//     echo "Error: {$dup->error}" . PHP_EOL; // Email already registered.
// }
//
// $bad = $service->register('not-valid');
// if ($bad->isErr()) {
//     echo "Error: {$bad->error}" . PHP_EOL; // Invalid email: not-valid
// }

echo PHP_EOL . "All TODOs complete!" . PHP_EOL;
