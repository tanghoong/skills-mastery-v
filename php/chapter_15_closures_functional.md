# Chapter 15 — Closures & Functional PHP

> **Goal:** Use PHP's `Closure` class, higher-order functions, and first-class callable syntax to write composable, reusable functional-style code.

## 15.1 What Is a Closure in PHP?

In PHP, anonymous functions are instances of the built-in `Closure` class. Unlike TypeScript where arrow functions and regular functions are both plain function values, PHP draws a hard line: a named function defined with `function foo()` is not a `Closure` — it is a plain callable string. An anonymous function assigned to a variable is a `Closure` object.

```php
<?php
declare(strict_types=1);

$greet = function (string $name): string {
    return "Hello, {$name}!";
};

echo $greet('Charlie'); // Hello, Charlie!
var_dump($greet instanceof Closure); // bool(true)
```

The short arrow function (`fn =>`) introduced in PHP 7.4 is also a `Closure`, and it implicitly captures the enclosing scope by value — analogous to a TypeScript arrow function closing over outer variables:

```php
<?php
declare(strict_types=1);

$prefix = 'Dr.';
$format = fn(string $name): string => "{$prefix} {$name}";

echo $format('Strange'); // Dr. Strange
```

## 15.2 Capturing Variables with `use`

Regular anonymous functions do not capture the outer scope automatically. You must explicitly list variables in the `use` clause. Capture by value is the default; prepend `&` to capture by reference.

```php
<?php
declare(strict_types=1);

$multiplier = 3;

$triple = function (int $n) use ($multiplier): int {
    return $n * $multiplier;
};

echo $triple(7); // 21

// Capture by reference — mutations are visible outside
$count = 0;
$increment = function () use (&$count): void {
    $count++;
};
$increment();
$increment();
echo $count; // 2
```

TypeScript analogy: JS closures capture by reference automatically; PHP requires you to be explicit, which makes dependencies visible in the function signature.

## 15.3 `Closure::bind`, `bindTo`, and `fromCallable`

`Closure::bind` lets you attach a closure to an object instance and class scope, giving it access to private and protected members — something you cannot do in TypeScript without hacks.

```php
<?php
declare(strict_types=1);

class BankAccount
{
    private float $balance = 1000.0;
}

$readBalance = Closure::bind(
    function (): float { return $this->balance; },
    new BankAccount(),
    BankAccount::class
);

echo $readBalance(); // 1000
```

`Closure::fromCallable` converts any PHP callable (named function, static method string, `[$obj, 'method']` array) into a proper `Closure` object:

```php
<?php
declare(strict_types=1);

function double(int $n): int { return $n * 2; }

$closure = Closure::fromCallable('double');
echo $closure(5); // 10
```

## 15.4 Higher-Order Functions

PHP's standard library provides `array_map`, `array_filter`, and `array_reduce` — the functional trio familiar from TypeScript's `Array.prototype.map/filter/reduce`.

```php
<?php
declare(strict_types=1);

$numbers = [1, 2, 3, 4, 5, 6];

$evens  = array_filter($numbers, fn(int $n): bool => $n % 2 === 0);
$doubled = array_map(fn(int $n): int => $n * 2, $evens);
$sum    = array_reduce($doubled, fn(int $carry, int $n): int => $carry + $n, 0);

echo $sum; // (2+4+6)*2 = 24
```

Note: `array_filter` preserves keys. Wrap with `array_values(...)` when you need a re-indexed array.

## 15.5 First-Class Callable Syntax (PHP 8.1)

Before PHP 8.1, converting a named function to a closure required `Closure::fromCallable('strlen')`. PHP 8.1 introduced first-class callable syntax: append `(...)` to any callable to get a `Closure` with no runtime cost.

```php
<?php
declare(strict_types=1);

$lengths = array_map(strlen(...), ['hello', 'world', 'PHP']);
print_r($lengths); // [5, 5, 3]

// Works with static methods too
$cleaned = array_map(trim(...), ['  foo  ', '  bar  ']);
```

TypeScript analogy: `String.prototype.trim.bind(String.prototype)` is clunky; PHP's `trim(...)` is cleaner.

## 15.6 Function Composition

PHP has no built-in `compose` or `pipe`, but building one with `array_reduce` is idiomatic:

```php
<?php
declare(strict_types=1);

/**
 * compose($f, $g, $h) returns a closure equivalent to fn($x) => $f($g($h($x)))
 * Right-to-left, matching mathematical convention.
 */
function compose(callable ...$fns): Closure
{
    return array_reduce(
        array_reverse($fns),
        fn(Closure $carry, callable $fn): Closure
            => fn(mixed $x): mixed => $carry($fn($x)),
        fn(mixed $x): mixed => $x  // identity
    );
}

$process = compose(
    fn(string $s): string => strtoupper($s),
    fn(string $s): string => trim($s),
    fn(string $s): string => "  {$s}  "  // adds padding (then trim removes it)
);

echo $process('hello'); // HELLO
```

A left-to-right `pipeline` variant simply omits `array_reverse`, making it read like a Unix pipe.

## Key Takeaways

- Anonymous functions in PHP are first-class `Closure` objects; `fn =>` captures scope implicitly by value.
- The `use` clause makes captured variables explicit — an intentional design that improves readability.
- `Closure::bind` / `bindTo` grants closures access to private class members, enabling powerful meta-programming.
- PHP 8.1 first-class callable syntax (`strlen(...)`) removes the ceremony of `Closure::fromCallable`.
- `array_map`, `array_filter`, and `array_reduce` are the idiomatic trio for higher-order collection work.
- Function composition is userland code in PHP — easy to build, and worth putting in a shared utility.

## What's Next

Chapter 16 explores `match` expressions, the nullsafe operator `?->`, and other PHP 8.0 additions that modernise control flow and eliminate large classes of null-related bugs.
