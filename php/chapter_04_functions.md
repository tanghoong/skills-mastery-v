# Chapter 4 — Functions

> **Goal:** Write well-typed PHP functions using return type declarations, named arguments, variadic parameters, pass-by-reference, and arrow functions — and understand how these features map to patterns you already know from TypeScript.

## 4.1 Basic Function Signatures and Return Types

PHP functions are declared with the `function` keyword. Type hints on parameters and return types were introduced progressively from PHP 7.0 onward; PHP 8.x completed the picture with union types, `never`, and intersection types.

```php
<?php
declare(strict_types=1);

function greet(string $name): string {
    return "Hello, $name!";
}

echo greet("Alice");  // Hello, Alice!
```

**TypeScript analogy:** This maps almost one-to-one with a TypeScript function:

```typescript
function greet(name: string): string {
    return `Hello, ${name}!`;
}
```

The primary difference is syntax: PHP puts the type before the parameter name (`string $name`) while TypeScript puts it after (`name: string`).

Return type `void` signals the function returns nothing. The special type `never` (PHP 8.1+) indicates the function always throws or exits and never returns normally:

```php
<?php
declare(strict_types=1);

function logMessage(string $msg): void {
    echo "[LOG] $msg\n";
    // returning a value here would be a TypeError
}

function fail(string $reason): never {
    throw new RuntimeException($reason);
}
```

## 4.2 Default Parameters

Default values make parameters optional. Defaults must come after required parameters:

```php
<?php
declare(strict_types=1);

function createUser(string $name, string $role = "viewer", bool $active = true): string {
    $status = $active ? "active" : "inactive";
    return "$name ($role, $status)";
}

echo createUser("Bob");                      // Bob (viewer, active)
echo createUser("Eve", "admin");             // Eve (admin, active)
echo createUser("Mal", "guest", false);      // Mal (guest, inactive)
```

## 4.3 Named Arguments

Named arguments (PHP 8.0+) let you pass arguments by parameter name, skipping optional parameters you do not want to override:

```php
<?php
declare(strict_types=1);

function makeRequest(
    string $url,
    string $method = "GET",
    int    $timeout = 30,
    bool   $verify  = true,
): string {
    return "$method $url (timeout: {$timeout}s, verify: " . ($verify ? 'true' : 'false') . ")";
}

// Skip $method and $timeout, only override $verify
echo makeRequest(url: "https://api.example.com", verify: false);
// GET https://api.example.com (timeout: 30s, verify: false)
```

Named arguments also work with built-in functions, which is particularly handy for functions with many optional parameters like `array_slice` or `implode`.

**TypeScript analogy:** TypeScript does not have named arguments as a language feature, but the common workaround is passing an options object: `makeRequest({ url, verify: false })`. PHP's named arguments are cleaner because the parameter names are part of the function contract.

## 4.4 Variadic Parameters

A variadic parameter collects all remaining arguments into an array. It is declared with `...` before the parameter name:

```php
<?php
declare(strict_types=1);

function sum(int ...$numbers): int {
    return array_sum($numbers);
}

echo sum(1, 2, 3, 4);   // 10
echo sum(...[5, 10, 15]); // 30 — spread an array into individual arguments
```

You can mix regular parameters with a variadic, but the variadic must be last:

```php
<?php
declare(strict_types=1);

function log(string $level, string ...$messages): void {
    foreach ($messages as $msg) {
        echo "[$level] $msg\n";
    }
}

log("ERROR", "Disk full", "Write failed", "Service stopped");
```

**TypeScript analogy:** Identical to TypeScript's rest parameters: `function sum(...numbers: number[]): number`.

## 4.5 Pass-by-Reference

By default PHP passes scalars by value — the function gets a copy. Prefix a parameter with `&` to pass by reference, giving the function direct access to the caller's variable:

```php
<?php
declare(strict_types=1);

function increment(int &$value, int $by = 1): void {
    $value += $by;
}

$counter = 10;
increment($counter);
increment($counter, 5);
echo $counter;  // 16
```

Pass-by-reference is useful for functions that need to modify their input (like sorting), but in most application code you should prefer returning a new value rather than mutating the caller's variable — it is much easier to reason about.

Many of PHP's built-in functions use pass-by-reference internally; `sort()`, `arsort()`, and `preg_match()` (which populates its `$matches` array) are common examples.

## 4.6 Arrow Functions

Arrow functions (`fn =>`) were introduced in PHP 7.4. They are anonymous functions with a single expression body and they automatically capture variables from the enclosing scope by value — no `use` keyword required.

```php
<?php
declare(strict_types=1);

$multiplier = 3;

$triple = fn(int $n): int => $n * $multiplier;  // captures $multiplier automatically

echo $triple(4);   // 12
echo $triple(10);  // 30
```

Compare to a traditional anonymous function, which requires an explicit `use` clause to capture outer variables:

```php
<?php
declare(strict_types=1);

$multiplier = 3;

$triple = function(int $n) use ($multiplier): int {
    return $n * $multiplier;
};
```

Arrow functions are ideal as callbacks for array functions like `array_map` and `array_filter`:

```php
<?php
declare(strict_types=1);

$prices = [10.0, 25.5, 4.99, 100.0];
$tax    = 0.08;

$withTax = array_map(fn(float $p): float => round($p * (1 + $tax), 2), $prices);
print_r($withTax);  // [10.8, 27.54, 5.39, 108.0]
```

**TypeScript analogy:** PHP arrow functions are the equivalent of TypeScript's `=>` arrow functions. The key PHP-specific detail is automatic scope capture — TypeScript arrow functions also capture their lexical scope automatically, so the mental model transfers directly.

## Key Takeaways

- PHP type hints on parameters and return types work with `strict_types=1` to enforce contracts at runtime.
- `void` signals no return value; `never` signals the function throws or exits unconditionally.
- Default parameters work the same as in TypeScript; defaults must come after required parameters.
- Named arguments (PHP 8.0+) let you skip optional parameters by name — cleaner than options objects.
- Variadic parameters (`...$args`) collect remaining arguments into a typed array, identical to TypeScript rest parameters.
- Arrow functions (`fn =>`) auto-capture outer scope by value; traditional closures need an explicit `use` clause.

## What's Next

Chapter 5 dives into PHP arrays — the single most important data structure in the language — covering indexed arrays, associative arrays, multidimensional arrays, and the higher-order functions that operate on them.
