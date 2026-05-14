# Chapter 18 — Generators

> **Goal:** Use PHP generators to produce lazy sequences, stream large datasets with constant memory, and enable two-way communication via `send()`.

## 18.1 What Is a Generator?

A generator is a function that can produce a sequence of values over time using `yield`, pausing execution between each value. Unlike a Fiber (Chapter 17), a generator does not require manual scheduling — it is driven by a `foreach` loop or explicit `Generator` method calls.

TypeScript analogy: PHP generators map almost perfectly to TypeScript / JavaScript generator functions (`function*` / `yield`). The `send()` method is also present in JS generators. The main difference is that PHP uses a class method interface rather than the `next()` / `return()` protocol.

```php
<?php
declare(strict_types=1);

function countdown(int $from): Generator
{
    while ($from > 0) {
        yield $from;
        $from--;
    }
}

foreach (countdown(5) as $n) {
    echo $n . "\n"; // 5, 4, 3, 2, 1
}
```

The function body does not run when called — it returns a `Generator` object. Execution begins on the first `current()` or `foreach` iteration.

## 18.2 Yielding Keys and Values

`yield` can produce both a key and a value, just like returning an associative array row:

```php
<?php
declare(strict_types=1);

function indexedColors(): Generator
{
    yield 'red'   => '#FF0000';
    yield 'green' => '#00FF00';
    yield 'blue'  => '#0000FF';
}

foreach (indexedColors() as $name => $hex) {
    echo "{$name}: {$hex}\n";
}
```

## 18.3 Infinite Sequences

Generators shine for infinite sequences because they hold only a single value in memory at a time:

```php
<?php
declare(strict_types=1);

function fibonacci(): Generator
{
    [$a, $b] = [0, 1];
    while (true) {
        yield $a;
        [$a, $b] = [$b, $a + $b];
    }
}

$fib = fibonacci();
for ($i = 0; $i < 10; $i++) {
    echo $fib->current() . " ";
    $fib->next();
}
// 0 1 1 2 3 5 8 13 21 34
```

## 18.4 Streaming Large Datasets

This is the most practical use case. Reading a multi-gigabyte CSV with `file()` loads the entire file into memory. A generator reads one line at a time:

```php
<?php
declare(strict_types=1);

function csvRows(string $filename): Generator
{
    $handle = fopen($filename, 'r');
    if ($handle === false) {
        throw new \RuntimeException("Cannot open {$filename}");
    }

    try {
        $headers = fgetcsv($handle);
        while (($row = fgetcsv($handle)) !== false) {
            yield array_combine($headers, $row);
        }
    } finally {
        fclose($handle);
    }
}

// Process a 10 GB file with constant ~1 KB memory:
// foreach (csvRows('/data/huge.csv') as $row) {
//     processRow($row);
// }
```

The `finally` block guarantees the file handle is closed even if the consumer breaks out of the loop early.

## 18.5 `yield from` — Generator Delegation

`yield from` delegates to another generator (or any iterable), flattening its values into the outer generator's stream. It also propagates return values:

```php
<?php
declare(strict_types=1);

function inner(): Generator
{
    yield 'a';
    yield 'b';
    return 'inner done';
}

function outer(): Generator
{
    yield 'start';
    $result = yield from inner(); // yields 'a', 'b', then receives inner's return
    echo "inner returned: {$result}\n";
    yield 'end';
}

foreach (outer() as $value) {
    echo $value . "\n";
}
// start
// a
// b
// inner returned: inner done
// end
```

TypeScript analogy: `yield*` in JS generator functions — same semantics, different syntax.

## 18.6 Two-Way Communication with `send()`

`send($value)` resumes a suspended generator and makes `$value` the result of the `yield` expression inside. This enables push-based pipelines:

```php
<?php
declare(strict_types=1);

function runningTotal(): Generator
{
    $total = 0;
    while (true) {
        $value = yield $total;  // yield sends current total out; receives next value
        if ($value === null) {
            return $total;
        }
        $total += $value;
    }
}

$accumulator = runningTotal();
$accumulator->current(); // prime the generator (reach first yield)

echo $accumulator->send(10) . "\n"; // 10
echo $accumulator->send(25) . "\n"; // 35
echo $accumulator->send(5)  . "\n"; // 40
```

## 18.7 Memory Efficiency Demonstration

```php
<?php
declare(strict_types=1);

function lazyRange(int $start, int $end): Generator
{
    for ($i = $start; $i <= $end; $i++) {
        yield $i;
    }
}

// Eager: loads 100,000 integers into memory
$beforeEager = memory_get_usage();
$arr = range(1, 100_000);
$eagerPeak = memory_get_usage() - $beforeEager;
unset($arr);

// Lazy: constant memory regardless of range size
$beforeLazy = memory_get_usage();
$sum = 0;
foreach (lazyRange(1, 100_000) as $n) {
    $sum += $n;
}
$lazyPeak = memory_get_usage() - $beforeLazy;

printf("Eager memory: %s KB\n", number_format($eagerPeak / 1024, 1));
printf("Lazy memory:  %s KB\n", number_format($lazyPeak / 1024, 1));
printf("Sum: %d\n", $sum); // 5000050000
```

## Key Takeaways

- A generator function returns a `Generator` object immediately; body execution is deferred until iteration.
- `yield` pauses execution and emits a value (and optionally a key) to the consumer.
- `yield from` delegates to a sub-generator, flattening its output and forwarding its return value.
- `send($value)` is the two-way channel — it resumes the generator and delivers a value as the result of `yield`.
- Generators consume constant memory regardless of sequence length, making them ideal for CSV streaming, pagination cursors, and event streams.

## What's Next

Chapter 19 covers the PHP 8.4 feature set — property hooks, asymmetric visibility, `array_find` / `array_any` / `array_all`, lazy objects, and `new` in initializers — the biggest ergonomic leap since PHP 8.0.
