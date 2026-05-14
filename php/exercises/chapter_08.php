<?php
declare(strict_types=1);

/**
 * Chapter 8 — Classes Basics
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_08.php
 */

// ── TODO 1: BankAccount class ────────────────────────────────────────────────
// Create a BankAccount class with:
//   - private float $balance
//   - public __construct(float $initialBalance = 0.0)
//   - public deposit(float $amount): void
//   - public withdraw(float $amount): void  → throw \UnderflowException if insufficient
//   - public getBalance(): float

// your code here


// ── TODO 2: Static account counter ──────────────────────────────────────────
// Add to BankAccount:
//   - private static int $count = 0, incremented in __construct
//   - public static getCount(): int

// your code here (modify the class above)


// ── TODO 3: Class constant MIN_BALANCE ──────────────────────────────────────
// Add to BankAccount:
//   - public const float MIN_BALANCE = 0.0
//   - Use self::MIN_BALANCE in withdraw() instead of the literal 0.0

// your code here (modify the class above)


// ── TODO 4: SavingsAccount with late static binding ──────────────────────────
// Create SavingsAccount extends BankAccount with:
//   - An additional private float $interestRate property (e.g. 0.05)
//   - Override/add a static factory method create(float $initial, float $rate): static
//     that uses `new static(...)` and returns the instance
//   - The method should echo the result of `static::class` so you can see late binding in action

// your code here


// ── TODO 5: Instantiate and test everything ──────────────────────────────────
// a) Create a BankAccount with initial balance 500.0
// b) deposit 200.0, withdraw 100.0, print balance
// c) Try withdrawing more than the balance — catch the UnderflowException and print the message
// d) Create a SavingsAccount using the factory method
// e) Print BankAccount::getCount() — should be 2 (one BankAccount, one SavingsAccount)

// your code here
