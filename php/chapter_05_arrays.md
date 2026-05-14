# Chapter 5 — Arrays

> **Goal:** Work confidently with PHP's unified array type across indexed, associative, and multidimensional shapes, and use the standard library's higher-order functions to transform and reduce data without writing manual loops.

## 5.1 PHP's Single Array Type

In TypeScript you have distinct types for ordered lists (`Array<T>`) and key-value maps (`Record<string, T>` or `Map`). PHP collapses both into a single `array` type. Internally PHP arrays are ordered hash maps, which means they can act as indexed lists, associative maps, or a mix of both simultaneously.

```php
<?php
declare(strict_types=1);

// Indexed array (integer keys 0, 1, 2, ...)
$colors = ["red", "green", "blue"];
echo $colors[0];  // red

// Associative array (string keys)
$user = [
    "name"  => "Alice",
    "email" => "alice@example.com",
    "age"   => 30,
];
echo $user["name"];  // Alice

// Mixed — valid PHP, but usually a code smell
$mixed = [0 => "zero", "label" => "one", 2 => "two"];
```

Use `[]` syntax for array literals (older code used `array()`; avoid it in new code).

## 5.2 Common Array Operations

```php
<?php
declare(strict_types=1);

$stack = [1, 2, 3];

// Add / remove at the end
array_push($stack, 4);        // [1, 2, 3, 4]
$last = array_pop($stack);    // $last = 4, $stack = [1, 2, 3]

// Add / remove at the beginning
array_unshift($stack, 0);     // [0, 1, 2, 3]
$first = array_shift($stack); // $first = 0, $stack = [1, 2, 3]

// Merge two arrays
$merged = array_merge([1, 2], [3, 4]);  // [1, 2, 3, 4]

// Check for a key or value
var_dump(array_key_exists("name", $user));  // bool(true)
var_dump(in_array("red", $colors));         // bool(true)

// Count elements
echo count($colors);  // 3

// Slice out a portion
$slice = array_slice([10, 20, 30, 40, 50], offset: 1, length: 3);
// [20, 30, 40]
```

## 5.3 Multidimensional Arrays

Arrays of arrays are the PHP equivalent of TypeScript's `Array<Record<string, unknown>>` or nested object structures:

```php
<?php
declare(strict_types=1);

$users = [
    ["id" => 1, "name" => "Alice", "score" => 88],
    ["id" => 2, "name" => "Bob",   "score" => 72],
    ["id" => 3, "name" => "Carol", "score" => 95],
];

foreach ($users as $u) {
    echo "{$u['name']}: {$u['score']}\n";
}
```

## 5.4 array_map

`array_map` applies a callback to every element and returns a new array. It does not modify the original.

```php
<?php
declare(strict_types=1);

$names  = ["alice", "bob", "carol"];
$upper  = array_map(fn(string $n): string => ucfirst($n), $names);
// ["Alice", "Bob", "Carol"]

// Map over multiple arrays simultaneously (callback receives one element from each)
$a = [1, 2, 3];
$b = [10, 20, 30];
$sums = array_map(fn(int $x, int $y): int => $x + $y, $a, $b);
// [11, 22, 33]
```

**TypeScript analogy:** Direct equivalent of `Array.prototype.map`. Same concept, slightly different syntax.

## 5.5 array_filter

`array_filter` keeps only the elements for which the callback returns `true`. Keys are preserved by default — call `array_values()` afterward if you need a re-indexed result.

```php
<?php
declare(strict_types=1);

$scores = [45, 72, 88, 31, 95, 60];

$passing = array_filter($scores, fn(int $s): bool => $s >= 70);
// Keys are preserved: [1 => 72, 2 => 88, 4 => 95]

$passing = array_values($passing);  // Re-index to 0-based
// [72, 88, 95]

// Without a callback, array_filter removes falsy values
$sparse = [0, 1, "", "hello", null, false, 42];
$dense  = array_values(array_filter($sparse));
// [1, "hello", 42]
```

**TypeScript analogy:** Equivalent of `Array.prototype.filter`, but note the key-preservation quirk that TypeScript does not have.

## 5.6 array_reduce

`array_reduce` folds an array down to a single value by passing an accumulator through the callback on each element.

```php
<?php
declare(strict_types=1);

$orders = [
    ["product" => "Widget", "total" => 29.99],
    ["product" => "Gadget", "total" => 49.99],
    ["product" => "Doohickey", "total" => 9.99],
];

$grandTotal = array_reduce(
    $orders,
    fn(float $carry, array $order): float => $carry + $order["total"],
    0.0,   // initial value
);

echo number_format($grandTotal, 2);  // 89.97
```

**TypeScript analogy:** Direct equivalent of `Array.prototype.reduce`. The argument order differs slightly — in PHP the callback's first argument is the accumulator (`$carry`), which matches TypeScript. The initial value is the third argument to `array_reduce` (not the second as in JavaScript's `reduce`).

## 5.7 usort and Sorting

`sort()` sorts an indexed array in place ascending by value. `asort()` preserves keys. `ksort()` sorts by key. When you need custom sort logic, use `usort()`:

```php
<?php
declare(strict_types=1);

$users = [
    ["name" => "Carol", "score" => 95],
    ["name" => "Bob",   "score" => 72],
    ["name" => "Alice", "score" => 88],
];

// Sort by score descending
usort($users, fn(array $a, array $b): int => $b["score"] <=> $a["score"]);

foreach ($users as $u) {
    echo "{$u['name']}: {$u['score']}\n";
}
// Carol: 95
// Alice: 88
// Bob: 72
```

The spaceship operator `<=>` returns `-1`, `0`, or `1` and is the idiomatic way to write comparison callbacks. `$a <=> $b` sorts ascending; `$b <=> $a` sorts descending.

## 5.8 The Spread Operator

The spread operator (`...`) works in function calls and in array literals:

```php
<?php
declare(strict_types=1);

$first  = [1, 2, 3];
$second = [4, 5, 6];
$merged = [...$first, ...$second];  // [1, 2, 3, 4, 5, 6]

// Spread into a function call
function add3(int $a, int $b, int $c): int { return $a + $b + $c; }
$args = [10, 20, 30];
echo add3(...$args);  // 60
```

**TypeScript analogy:** Identical to TypeScript's spread syntax. Both `[...a, ...b]` and `fn(...args)` work the same way.

## Key Takeaways

- PHP's `array` is both an ordered list and a hash map; you rarely need a separate Map type.
- `array_map`, `array_filter`, and `array_reduce` are the functional trio for transforming data without manual loops.
- `array_filter` preserves keys; follow with `array_values()` when you need a re-indexed array.
- `usort()` with the spaceship operator `<=>` handles any custom sort; `$b <=> $a` reverses the order.
- The spread operator works in both array literals and function calls, behaving exactly like TypeScript.
- Prefer immutable transformations (returning new arrays) over in-place mutation where possible.

## What's Next

Chapter 6 covers PHP's rich string toolbox — heredoc/nowdoc syntax, `sprintf` for formatted output, and the regex functions (`preg_match`, `preg_replace`, `preg_split`) that make text processing straightforward.
