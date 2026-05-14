# Chapter 17 — Fibers

> **Goal:** Understand PHP 8.1 Fibers as a cooperative concurrency primitive, use the `Fiber` API to suspend and resume execution, and see where Fibers fit in a real application.

## 17.1 What Is a Fiber?

A Fiber is a lightweight, manually scheduled coroutine. Unlike goroutines (Go) or `async/await` (TypeScript / PHP async libraries), Fibers do not run concurrently by themselves — the runtime stays single-threaded. Instead, a Fiber can voluntarily **suspend** itself, returning control to the caller, and later be **resumed** from exactly the point it left off.

Think of it as a function that can be paused mid-execution. Every Fiber has four state transitions:

| State | Description |
|-------|-------------|
| Created | Instantiated, not yet started |
| Running | Currently executing |
| Suspended | Paused via `Fiber::suspend()` |
| Terminated | Returned or threw |

TypeScript analogy: JavaScript's generator functions (`function*` / `yield`) are the closest analogue. `async/await` builds on top of generators to provide automatic scheduling via the event loop; PHP Fibers provide the raw primitive without a built-in scheduler.

## 17.2 The Fiber API

```php
<?php
declare(strict_types=1);

$fiber = new Fiber(function (): string {
    echo "Fiber started\n";

    $received = Fiber::suspend('first suspension');
    echo "Fiber resumed with: {$received}\n";

    Fiber::suspend('second suspension');
    echo "Fiber running to completion\n";

    return 'done';
});

$val1 = $fiber->start();      // starts the fiber; runs until first suspend
echo "Main got: {$val1}\n";   // first suspension

$val2 = $fiber->resume('hello from main');
echo "Main got: {$val2}\n";   // second suspension

$fiber->resume();              // fiber runs to completion

echo "Fiber return value: " . $fiber->getReturn() . "\n"; // done
```

Output:
```
Fiber started
Main got: first suspension
Fiber resumed with: hello from main
Main got: second suspension
Fiber running to completion
Fiber return value: done
```

Key methods:

| Method | Direction | Description |
|--------|-----------|-------------|
| `$fiber->start(...$args)` | caller → fiber | Starts the fiber; args become parameters of the callback |
| `Fiber::suspend($value)` | fiber → caller | Suspends and passes `$value` to the caller |
| `$fiber->resume($value)` | caller → fiber | Resumes; `$value` is the return value of `Fiber::suspend()` |
| `$fiber->getReturn()` | caller reads | Gets the fiber's return value after it terminates |
| `$fiber->isStarted()` | — | State inspection helpers |
| `$fiber->isSuspended()` | — | |
| `$fiber->isTerminated()` | — | |

## 17.3 Cooperative Scheduler Example

A simple round-robin scheduler demonstrates the power of cooperative multitasking:

```php
<?php
declare(strict_types=1);

function makeTask(string $name, int $steps): Fiber
{
    return new Fiber(function () use ($name, $steps): void {
        for ($i = 1; $i <= $steps; $i++) {
            echo "{$name}: step {$i}/{$steps}\n";
            Fiber::suspend();
        }
    });
}

$queue = [
    makeTask('TaskA', 3),
    makeTask('TaskB', 2),
    makeTask('TaskC', 4),
];

// Start all fibers
foreach ($queue as $fiber) {
    $fiber->start();
}

// Round-robin until all are done
while (true) {
    $remaining = array_filter($queue, fn(Fiber $f): bool => !$f->isTerminated());
    if (empty($remaining)) {
        break;
    }
    foreach ($remaining as $fiber) {
        if ($fiber->isSuspended()) {
            $fiber->resume();
        }
    }
}
echo "All tasks complete\n";
```

## 17.4 Error Handling in Fibers

If a Fiber throws, the exception propagates to the caller at the point of `start()` or `resume()`:

```php
<?php
declare(strict_types=1);

$fiber = new Fiber(function (): void {
    Fiber::suspend();
    throw new \RuntimeException('Something went wrong inside the fiber');
});

$fiber->start();

try {
    $fiber->resume();
} catch (\RuntimeException $e) {
    echo "Caught: " . $e->getMessage() . "\n";
    // Caught: Something went wrong inside the fiber
}
```

You can also throw *into* a fiber with `$fiber->throw(new \Exception(...))`, which causes `Fiber::suspend()` to re-throw at the suspension point — useful for cancellation.

## 17.5 Real-World Use Cases

Fibers are most valuable as building blocks for async frameworks, not day-to-day application code. Libraries like **ReactPHP**, **Amp**, and **Revolt** use Fibers internally so that `await`-style APIs look synchronous while running a non-blocking event loop underneath.

A common pattern: a Fiber wraps an I/O operation, suspends while waiting, and the event loop resumes it when data is ready. Your application code reads top-to-bottom with no callbacks.

```php
<?php
declare(strict_types=1);

// Conceptual — pseudocode for an async HTTP client built on Fibers
// $response = await(httpGet('https://api.example.com/data'));
// Under the hood: a Fiber suspends here; the event loop resumes it when
// the socket is readable.
```

## Key Takeaways

- Fibers enable cooperative (not preemptive) concurrency; PHP remains single-threaded.
- `Fiber::suspend($value)` pauses the fiber and passes a value out; `resume($value)` passes a value back in.
- `getReturn()` retrieves the fiber's return value only after it has terminated.
- Exceptions thrown inside a fiber surface at the `start()`/`resume()` call site.
- Fibers are a low-level primitive; most application developers use them via async libraries (ReactPHP, Amp) rather than directly.

## What's Next

Chapter 18 covers PHP Generators — a related but distinct concurrency primitive that uses `yield` to produce lazy sequences, stream large datasets, and power two-way communication through `send()`.
