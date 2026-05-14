<?php
declare(strict_types=1);

/**
 * Chapter 7 — Exceptions: Custom Hierarchy, try/catch/finally, Exception Handlers
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_07.php
 */

// ── TODO 1: Define a custom exception hierarchy ───────────────────────────────
// Create three exception classes:
//
//   AppException extends RuntimeException
//     └── ValidationException extends AppException
//           - Add a public readonly string $field property
//           - Override __construct to accept ($field, $message, $code = 0, $previous = null)
//           - Pass $message, $code, $previous to parent::__construct()
//     └── NotFoundException extends AppException
//           - No extra properties needed; can use as-is or add a small helper
//
// Tip: use `readonly` properties (PHP 8.1+) for the $field on ValidationException.

// your code here

// ── TODO 2: Write findUser(int $id): array ────────────────────────────────────
// Simulate a user lookup:
//   - If $id <= 0, throw new NotFoundException("User with id {$id} not found.")
//   - Otherwise, return a fake user array: ['id' => $id, 'name' => 'Alice']
//
// The return type must be array (PHP does not yet have generics, so we annotate
// with a docblock: @return array{id: int, name: string})

/**
 * @return array{id: int, name: string}
 * @throws NotFoundException
 */
function findUser(int $id): array
{
    // your code here
    return []; // replace this
}

// ── TODO 3: Write validateAge(int $age): void ─────────────────────────────────
// Validates that age is between 0 and 150 (inclusive).
//   - If $age < 0 or $age > 150, throw new ValidationException('age', "Age {$age} is out of range.")
//   - Otherwise, return without throwing.

/**
 * @throws ValidationException
 */
function validateAge(int $age): void
{
    // your code here
}

// ── TODO 4: try/catch/finally — call both functions ───────────────────────────
// Test case A: findUser(-1) — should throw NotFoundException
// Test case B: validateAge(200) — should throw ValidationException
// Test case C: findUser(42) — should succeed
// Test case D: validateAge(25) — should succeed
//
// Use a try block with multiple catch clauses:
//   catch (ValidationException $e) — print field + message
//   catch (NotFoundException $e)   — print message
//   catch (AppException $e)        — catch-all for any other AppException
// Add a finally block that prints "--- done ---" after each test case.
//
// Run all four test cases. You can wrap each in its own try/catch block or
// handle them in sequence.

echo "=== Test A: findUser(-1) ===" . PHP_EOL;
// your code here

echo PHP_EOL . "=== Test B: validateAge(200) ===" . PHP_EOL;
// your code here

echo PHP_EOL . "=== Test C: findUser(42) ===" . PHP_EOL;
// your code here

echo PHP_EOL . "=== Test D: validateAge(25) ===" . PHP_EOL;
// your code here

echo PHP_EOL . str_repeat('-', 40) . PHP_EOL;

// ── TODO 5: Register a global uncaught-exception handler ─────────────────────
// Use set_exception_handler() to register a callable that:
//   1. Writes a formatted message to STDERR using fwrite(STDERR, ...) or error_log()
//   2. Includes the exception class name, message, file, and line number
//   3. Exits with code 1 (exit(1))
//
// After registering, throw a new AppException("Uncaught test exception")
// WITHOUT wrapping it in a try/catch, so your handler is invoked.
//
// Note: set_exception_handler only fires for exceptions that bubble all the
// way to the top — it does NOT replace try/catch.

// your code here

/*
 * Expected output (approximate):
 *
 * === Test A: findUser(-1) ===
 * [NotFoundException] User with id -1 not found.
 * --- done ---
 *
 * === Test B: validateAge(200) ===
 * [ValidationException] field=age  Age 200 is out of range.
 * --- done ---
 *
 * === Test C: findUser(42) ===
 * Found user: Alice (id=42)
 * --- done ---
 *
 * === Test D: validateAge(25) ===
 * Age 25 is valid.
 * --- done ---
 *
 * ----------------------------------------
 * [UNCAUGHT AppException] Uncaught test exception
 *   in /path/to/chapter_07.php on line 123
 */
