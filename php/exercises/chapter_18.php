<?php
declare(strict_types=1);
/**
 * Chapter 18 — Generators
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_18.php
 */

echo "=== Chapter 18: Generators ===\n\n";

// ── TODO 1: Infinite Fibonacci generator ─────────────────────────────────────
// Write a function fibonacci(): Generator that yields the Fibonacci sequence
// indefinitely. Use it to print the first 10 Fibonacci numbers on one line.
// Expected: 0 1 1 2 3 5 8 13 21 34

// function fibonacci(): Generator
// {
//     [$a, $b] = [0, 1];
//     while (true) {
//         yield $a;
//         [$a, $b] = [...];
//     }
// }

// Uncomment to test:
// $fib = fibonacci();
// $output = [];
// for ($i = 0; $i < 10; $i++) {
//     $output[] = $fib->current();
//     $fib->next();
// }
// echo "TODO 1 — fibonacci: " . implode(' ', $output) . "\n";


// ── TODO 2: CSV row streaming generator ───────────────────────────────────────
// Write a function csvRows(string $csvContent): Generator that accepts CSV
// content as a string (use a PHP temp stream so you don't need a real file),
// parses the first row as headers, and yields one associative array per data row.
//
// Use this inline CSV data:
$sampleCsv = <<<CSV
id,name,price
1,Widget,9.99
2,Gadget,49.99
3,Doohickey,4.99
CSV;

// Hint: use fopen('php://memory', 'r+') then fwrite + rewind to avoid a real file.
// function csvRows(string $csvContent): Generator { ... }

// Uncomment to test:
// echo "TODO 2 — CSV rows:\n";
// foreach (csvRows($sampleCsv) as $row) {
//     echo "  id={$row['id']}, name={$row['name']}, price={$row['price']}\n";
// }


// ── TODO 3: yield from — generator delegation ────────────────────────────────
// Write two generators:
//   - letters(): Generator  → yields 'a', 'b', 'c'
//   - digits(): Generator   → yields 1, 2, 3
// Then write combined(): Generator that uses `yield from` to delegate to both
// in sequence. Iterate combined() and print all 6 values on one line.
// Expected: a b c 1 2 3

// function letters(): Generator { ... }
// function digits(): Generator { ... }
// function combined(): Generator { ... }

// Uncomment to test:
// $output = [];
// foreach (combined() as $value) { $output[] = $value; }
// echo "TODO 3 — combined: " . implode(' ', $output) . "\n";


// ── TODO 4: Two-way communication with send() ─────────────────────────────────
// Write a generator runningTotal(): Generator that:
//   - Starts at 0
//   - On each iteration, yields the current total
//   - Receives a new number via send() and adds it to the total
//
// Use send() to add: 10, 25, 5. Print the running total after each send.
// Expected outputs: 10, 35, 40

// function runningTotal(): Generator
// {
//     $total = 0;
//     while (true) {
//         $value = yield $total;
//         if ($value === null) return $total;
//         $total += $value;
//     }
// }

// Uncomment to test:
// $acc = runningTotal();
// $acc->current(); // prime — reach first yield
// echo "TODO 4 — after +10: " . $acc->send(10) . "\n"; // 10
// echo "TODO 4 — after +25: " . $acc->send(25) . "\n"; // 35
// echo "TODO 4 — after +5:  " . $acc->send(5)  . "\n"; // 40


// ── TODO 5: Memory efficiency — range vs generator ───────────────────────────
// Write a generator lazyRange(int $start, int $end): Generator that yields
// integers from $start to $end inclusive.
//
// Compare peak memory usage between:
//   A) $arr = range(1, 100_000)  — eager, loads all into memory
//   B) Your lazyRange(1, 100_000) — lazy, one int at a time
//
// Print both peak usages in KB and verify the lazy version uses significantly less.

// function lazyRange(int $start, int $end): Generator { ... }

// Uncomment to test:
// // Eager
// $before = memory_get_usage();
// $arr = range(1, 100_000);
// $eagerKb = (memory_get_usage() - $before) / 1024;
// unset($arr);
//
// // Lazy
// $before = memory_get_usage();
// $sum = 0;
// foreach (lazyRange(1, 100_000) as $n) { $sum += $n; }
// $lazyKb = (memory_get_usage() - $before) / 1024;
//
// echo sprintf("TODO 5 — Eager: %.1f KB | Lazy: %.1f KB | Sum: %d\n",
//     $eagerKb, $lazyKb, $sum
// );
// // Lazy should be dramatically smaller (< 1 KB vs ~3000 KB+)

echo "\nAll TODOs complete!\n";
