<?php
declare(strict_types=1);
/**
 * Chapter 17 — Fibers
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_17.php
 */

echo "=== Chapter 17: Fibers ===\n\n";

// ── TODO 1: Basic Fiber — suspend and resume ──────────────────────────────────
// Create a Fiber that:
//   1. Prints "Fiber: step 1"
//   2. Suspends with the value 'checkpoint-1'
//   3. Prints "Fiber: step 2"
//   4. Suspends with the value 'checkpoint-2'
//   5. Prints "Fiber: done"
//
// From outside, start the fiber, print each suspended value, and resume until
// the fiber terminates.

// $fiber = new Fiber(function (): void {
//     ...
// });
//
// $val1 = $fiber->start();
// echo "TODO 1 — main received: {$val1}\n"; // checkpoint-1
// $val2 = $fiber->resume();
// echo "TODO 1 — main received: {$val2}\n"; // checkpoint-2
// $fiber->resume();                          // fiber prints "Fiber: done"


// ── TODO 2: Cooperative scheduler — 3 Fibers round-robin ─────────────────────
// Build a simple scheduler that runs three Fibers in round-robin order.
// Each Fiber should:
//   - Print its name and current step number
//   - Suspend after each step
//   - Run for a different number of steps (e.g., A=3, B=2, C=4)
//
// The scheduler should continue cycling until all Fibers are terminated.

// function makeTask(string $name, int $steps): Fiber { ... }
//
// $queue = [
//     makeTask('TaskA', 3),
//     makeTask('TaskB', 2),
//     makeTask('TaskC', 4),
// ];
//
// // Start all
// foreach ($queue as $fiber) { $fiber->start(); }
//
// // Round-robin
// while (true) {
//     $remaining = array_filter($queue, fn(Fiber $f): bool => !$f->isTerminated());
//     if (empty($remaining)) break;
//     foreach ($remaining as $fiber) {
//         if ($fiber->isSuspended()) { $fiber->resume(); }
//     }
// }
// echo "TODO 2 — scheduler complete\n";


// ── TODO 3: Passing data into a Fiber via resume() ───────────────────────────
// Create a Fiber that:
//   1. Suspends waiting for a name (string)
//   2. Receives the name via resume()
//   3. Suspends waiting for an age (int)
//   4. Receives the age via resume()
//   5. Prints "Hello, {name}! You are {age} years old."
//
// From outside: start the fiber, then send 'Charlie', then send 30.

// $fiber = new Fiber(function (): void {
//     $name = Fiber::suspend('ready for name');
//     $age  = Fiber::suspend('ready for age');
//     echo "TODO 3 — Hello, {$name}! You are {$age} years old.\n";
// });
//
// $prompt1 = $fiber->start();
// echo "Fiber says: {$prompt1}\n";
// $prompt2 = $fiber->resume('Charlie');
// echo "Fiber says: {$prompt2}\n";
// $fiber->resume(30);


// ── TODO 4: getReturn() after Fiber completion ────────────────────────────────
// Create a Fiber whose callback returns a string result (e.g., a computed
// checksum or summary). After the fiber terminates, retrieve the value with
// getReturn() and print it.
//
// The fiber should: add three numbers sent via resume() and return their sum.

// $fiber = new Fiber(function (): int {
//     $a = Fiber::suspend();
//     $b = Fiber::suspend();
//     $c = Fiber::suspend();
//     return $a + $b + $c;
// });
//
// $fiber->start();
// $fiber->resume(10);
// $fiber->resume(25);
// $fiber->resume(5);
// echo "TODO 4 — sum: " . $fiber->getReturn() . "\n"; // 40


// ── TODO 5: Error handling — Fiber throws ────────────────────────────────────
// Create a Fiber that suspends once, then throws a RuntimeException with the
// message 'fiber error'. Demonstrate that:
//   a) The exception propagates to the resume() call site
//   b) After throwing, $fiber->isTerminated() is true

// $fiber = new Fiber(function (): void {
//     Fiber::suspend();
//     throw new \RuntimeException('fiber error');
// });
//
// $fiber->start();
//
// try {
//     $fiber->resume();
// } catch (\RuntimeException $e) {
//     echo "TODO 5 — caught: " . $e->getMessage() . "\n"; // fiber error
// }
//
// var_dump($fiber->isTerminated()); // bool(true)

echo "\nAll TODOs complete!\n";
