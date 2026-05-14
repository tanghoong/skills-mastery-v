# Chapter 13 — Type System

> **Goal:** Use PHP 8.x's full type vocabulary — union types, intersection types, DNF types, `never`, `mixed`, standalone `null`/`false`/`true` types, and typed class constants — to write expressive and safe function signatures.

## 13.1 Union Types (PHP 8.0)

A union type accepts any one of several types. Declare it with `|`.

```php
<?php
declare(strict_types=1);

function formatId(int|string $id): string
{
    if (is_int($id)) {
        return sprintf('%08d', $id);
    }
    return strtoupper(trim($id));
}

echo formatId(42)      . PHP_EOL; // 00000042
echo formatId('abc123') . PHP_EOL; // ABC123
```

**TypeScript analogy:** `int|string` in PHP is identical to `number | string` in TypeScript. Use a type narrowing check (`is_int`, `is_string`) to access type-specific behaviour.

## 13.2 Nullable Types

`?Type` is shorthand for `Type|null`. You can also write `null|Type` explicitly with union type syntax.

```php
<?php
declare(strict_types=1);

function findUser(int $id): ?string
{
    $users = [1 => 'Alice', 2 => 'Bob'];
    return $users[$id] ?? null;
}

$name = findUser(1);
echo $name ?? 'unknown'; // Alice

$name = findUser(99);
echo $name ?? 'unknown'; // unknown
```

## 13.3 Intersection Types (PHP 8.1)

An intersection type requires a value to satisfy **all** listed interface constraints simultaneously. Declare with `&`. Only interfaces and class types may appear in intersections — not scalar types.

```php
<?php
declare(strict_types=1);

interface Stringable
{
    public function __toString(): string;
}

interface Countable
{
    public function count(): int;
}

function summarize(Stringable&Countable $collection): string
{
    return "Items: {$collection->count()}, Value: $collection";
}

class TagList implements Stringable, Countable
{
    private array $tags;

    public function __construct(string ...$tags)
    {
        $this->tags = $tags;
    }

    public function __toString(): string
    {
        return implode(', ', $this->tags);
    }

    public function count(): int
    {
        return count($this->tags);
    }
}

$tags = new TagList('php', 'oop', 'types');
echo summarize($tags) . PHP_EOL; // Items: 3, Value: php, oop, types
```

**TypeScript analogy:** TypeScript's intersection types (`A & B`) work the same way — require all members of both types to be present.

## 13.4 DNF Types — Disjunctive Normal Form (PHP 8.2)

DNF types combine union and intersection types. An intersection group must be wrapped in parentheses.

```php
<?php
declare(strict_types=1);

interface Loggable
{
    public function log(): void;
}

interface Serializable
{
    public function serialize(): string;
}

// Accept a value that is either:
// - an object implementing both Loggable and Serializable, OR
// - null
function processOrSkip((Loggable&Serializable)|null $item): void
{
    if ($item === null) {
        echo "Skipped" . PHP_EOL;
        return;
    }
    $item->log();
    echo $item->serialize() . PHP_EOL;
}
```

DNF types follow the mathematical form: intersections inside parentheses joined by `|`.

## 13.5 Standalone `false`, `true`, and `null` Types

PHP 8.0 introduced `false` and `null` as standalone return types; `true` was added in PHP 8.2. These appear often in legacy API compatibility but also have legitimate modern uses.

```php
<?php
declare(strict_types=1);

// Legacy pattern: return int on success, false on failure
function legacyFind(array $data, string $key): int|false
{
    $pos = array_search($key, $data);
    return $pos !== false ? (int)$pos : false;
}

// Modern pattern: return int|null instead
function modernFind(array $data, string $key): int|null
{
    $pos = array_search($key, $data);
    return $pos !== false ? (int)$pos : null;
}

// true as a return type: always succeeds or throws
function assertPositive(int $n): true
{
    if ($n <= 0) {
        throw new \InvalidArgumentException('Must be positive');
    }
    return true;
}
```

Prefer `int|null` over `int|false` in new code; reserve `false` for wrapping built-in PHP functions that historically return `false` on failure.

## 13.6 `never` Return Type

A function returning `never` never returns control to the caller — it always throws an exception or calls `exit`. This signals to static analysers and to readers that execution stops here.

```php
<?php
declare(strict_types=1);

function abort(int $code, string $message): never
{
    throw new \RuntimeException("[$code] $message");
}

function assertNotNull(mixed $value, string $context): void
{
    if ($value === null) {
        abort(500, "Null value in $context");
    }
    // After this point, static analysers know $value is not null
}
```

**TypeScript analogy:** TypeScript's `never` return type for functions that always throw is an exact match: `function fail(msg: string): never { throw new Error(msg); }`.

## 13.7 `mixed` Type

`mixed` accepts any value including `null`. It is the explicit opt-out from type checking — prefer specific types whenever possible.

```php
<?php
declare(strict_types=1);

function debug(mixed $value): string
{
    return var_export($value, true);
}

echo debug(42)        . PHP_EOL;
echo debug('hello')   . PHP_EOL;
echo debug([1, 2, 3]) . PHP_EOL;
```

**TypeScript analogy:** `mixed` in PHP corresponds to `unknown` in TypeScript (requires narrowing before use) rather than `any` (which bypasses checks). However, PHP's `mixed` does not force you to narrow before accessing — that discipline must come from your code.

## 13.8 Typed Class Constants (PHP 8.3)

PHP 8.3 allows class constants to have an explicit type annotation. This catches mistakes where a constant would be assigned an incompatible value.

```php
<?php
declare(strict_types=1);

class AppConfig
{
    public const string VERSION   = '1.0.0';
    public const int    MAX_RETRY = 3;
    public const bool   DEBUG     = false;
}

interface HasVersion
{
    public const string VERSION;
}

class ApiClient implements HasVersion
{
    public const string VERSION = '2.0.0';
}

echo AppConfig::VERSION . PHP_EOL;  // 1.0.0
echo ApiClient::VERSION . PHP_EOL;  // 2.0.0
```

Typed constants are also enforced in interfaces and trait definitions, so mismatched types in implementing classes are caught early.

## Key Takeaways

- Union types (`int|string`) let a parameter accept multiple scalar or object types; use type narrowing to handle each branch.
- Intersection types (`A&B`) require both interfaces to be satisfied — useful for function parameters in service layers.
- DNF types (`(A&B)|null`) combine intersections and unions; intersections must be parenthesized.
- `false`, `true`, and `null` are valid standalone types — prefer `null` over `false` in modern APIs.
- `never` signals a function that always throws or exits; static analysers use it for dead-code detection.
- `mixed` is the explicit type-system escape hatch — use it only when the type genuinely cannot be known.
- Typed class constants (PHP 8.3) add type safety to constant declarations in classes and interfaces.

## What's Next

Chapter 14 introduces PHP attributes and reflection — the runtime metadata system that powers frameworks like Symfony, Laravel, and NestJS-style dependency injection containers.
