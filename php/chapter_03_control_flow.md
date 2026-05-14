# Chapter 3 — Control Flow

> **Goal:** Write conditional logic and loops in PHP fluently, know when to reach for `match` instead of `switch`, and understand how `break` and `continue` behave inside nested structures.

## 3.1 if / elseif / else

The basics are identical to most C-family languages:

```php
<?php
declare(strict_types=1);

$score = 74;

if ($score >= 90) {
    echo "A";
} elseif ($score >= 80) {
    echo "B";
} elseif ($score >= 70) {
    echo "C";
} else {
    echo "F";
}
// Output: C
```

Note that PHP uses `elseif` (one word) in standard style, though `else if` (two words) also works. The `elseif` form is preferred and consistent with `phpcs` style rules.

The ternary and null-coalescing operators work the same way as in TypeScript:

```php
<?php
declare(strict_types=1);

$label = ($score >= 70) ? "Pass" : "Fail";

// Null-coalescing — returns right side if left side is null
$username = $_GET['user'] ?? 'guest';

// Null-coalescing assignment — assign only if null
$config['timeout'] ??= 30;
```

## 3.2 switch vs match

`switch` has been in PHP since the beginning. It uses loose (`==`) comparison and falls through between cases unless you `break`:

```php
<?php
declare(strict_types=1);

$status = "active";

switch ($status) {
    case "active":
        echo "User is active";
        break;
    case "inactive":
    case "banned":
        echo "User is not active";
        break;
    default:
        echo "Unknown status";
}
```

`match` was introduced in PHP 8.0 and is strictly better in most situations. It uses strict (`===`) comparison, does not fall through, and is an expression (returns a value):

```php
<?php
declare(strict_types=1);

$status = "active";

$message = match($status) {
    "active"             => "User is active",
    "inactive", "banned" => "User is not active",
    default              => "Unknown status",
};

echo $message;
```

**TypeScript analogy:** PHP's `match` behaves like a more powerful version of TypeScript's `switch` used as an expression — similar to the pattern you see in TypeScript when people write `const result = (() => { switch(x) { ... } })()`. PHP makes this cleaner with `match`. A `match` with no matching arm and no `default` throws an `UnhandledMatchError`, which is better than `switch` silently falling off the end.

## 3.3 for and while

Standard C-style `for` loop:

```php
<?php
declare(strict_types=1);

for ($i = 0; $i < 5; $i++) {
    echo $i . " ";
}
// Output: 0 1 2 3 4
```

`while` and `do-while`:

```php
<?php
declare(strict_types=1);

$n = 1;
while ($n <= 4) {
    echo $n . " ";
    $n++;
}
// Output: 1 2 3 4

$count = 0;
do {
    echo "runs at least once\n";
    $count++;
} while ($count < 1);
// Prints once even though the condition is now false
```

Use `while` when you do not know the iteration count up front. Use `do-while` when the body must execute at least once regardless of the condition — reading from a stream or prompting for input are classic examples.

## 3.4 foreach

`foreach` is the primary tool for iterating over arrays and objects. It is far more common in PHP code than a `for` loop with an index.

```php
<?php
declare(strict_types=1);

$colors = ["red", "green", "blue"];

foreach ($colors as $color) {
    echo $color . "\n";
}

// Associative array — access both key and value
$person = ["name" => "Alice", "age" => 30, "city" => "Berlin"];

foreach ($person as $key => $value) {
    echo "$key: $value\n";
}
```

By default `foreach` copies each value. To modify the original array, iterate by reference:

```php
<?php
declare(strict_types=1);

$numbers = [1, 2, 3, 4];

foreach ($numbers as &$num) {
    $num *= 2;
}
unset($num);  // critical: break the reference after the loop

print_r($numbers);  // [2, 4, 6, 8]
```

Always call `unset()` on the reference variable after the loop. Leaving a dangling reference to the last element is a well-known PHP gotcha that causes hard-to-trace bugs if you iterate the same array again later.

## 3.5 break and continue

`break` exits the current loop. `continue` skips the rest of the current iteration and moves to the next one. Both accept an optional integer argument to act on an outer loop:

```php
<?php
declare(strict_types=1);

for ($i = 0; $i < 5; $i++) {
    if ($i === 2) continue;   // skip 2
    if ($i === 4) break;      // stop before 4
    echo $i . " ";
}
// Output: 0 1 3

// break 2 — exits two levels of nesting
foreach ([1, 2, 3] as $outer) {
    foreach ([10, 20, 30] as $inner) {
        if ($inner === 20) break 2;   // exits both loops
        echo "$outer-$inner\n";
    }
}
// Output: 1-10
```

**TypeScript analogy:** TypeScript supports labeled `break` and labeled `continue` for the same multi-level exit pattern. PHP's numeric argument is slightly more concise but does the same thing.

## Key Takeaways

- `if/elseif/else` follows standard C-family syntax; prefer `elseif` over `else if` in PHP.
- The null-coalescing operator `??` and `??=` behave the same as in TypeScript/JavaScript.
- `match` is strictly better than `switch` in most cases: strict comparison, no fall-through, returns a value, and throws on unhandled arms.
- `foreach` is the idiomatic way to iterate arrays; use `as $key => $value` for associative arrays.
- When iterating by reference with `&$var`, always `unset()` the variable after the loop.
- `break N` and `continue N` exit or skip N levels of nested loops.

## What's Next

Chapter 4 covers functions in depth — return type declarations, named arguments, variadic parameters, pass-by-reference, and PHP 7.4's concise arrow function syntax.
