# Chapter 20 — PHP 8.5 Features

> **Goal:** Use PHP 8.5's pipe operator to build readable left-to-right data pipelines, and understand what is confirmed versus still tracked in active RFCs.

## 20.1 Status Note

PHP 8.5 is in active development (expected release: late 2025). The pipe operator described in Section 20.2 is **confirmed and merged**. Features marked **[RFC — not yet stable]** are under discussion or in voting; treat them as signals of future direction, not production-ready APIs.

## 20.2 The Pipe Operator `|>`

The pipe operator passes the result of the left-hand expression as the first argument to the right-hand callable. It enables left-to-right composition that reads like a Unix pipeline, without intermediate variables or deeply nested function calls.

TypeScript analogy: There is no native pipe operator in TypeScript/JavaScript (the TC39 proposal `|>` has been in Stage 2 for years). PHP ships it first. The closest idiom in TypeScript is a chain of `.map()/.filter()` calls on arrays, or a manually built `pipe` utility function.

```php
<?php
declare(strict_types=1);

// Old style — read inside-out
$result = ucfirst(strtolower(trim('  HELLO WORLD  ')));
echo $result; // Hello world

// PHP 8.5 pipe operator — read left-to-right
$result = '  HELLO WORLD  '
    |> trim(...)
    |> strtolower(...)
    |> ucfirst(...);

echo $result; // Hello world
```

The right-hand side of `|>` must be a callable. The first-class callable syntax (`trim(...)`) works naturally here. For callables that take additional arguments beyond the piped value, use an arrow function:

```php
<?php
declare(strict_types=1);

$result = 'hello, world'
    |> trim(...)
    |> fn(string $s): string => str_replace(',', ';', $s)
    |> strtoupper(...);

echo $result; // HELLO; WORLD
```

## 20.3 Pipeline Readability Comparison

A real-world example processing a raw user-submitted string:

```php
<?php
declare(strict_types=1);

// ── Old style: nested functions ──────────────────────────────────────────────
function sanitizeOld(string $input): string
{
    return htmlspecialchars(
        ucwords(
            preg_replace('/\s+/', ' ', trim($input)) ?? ''
        ),
        ENT_QUOTES,
        'UTF-8'
    );
}

// ── PHP 8.5 pipe style ───────────────────────────────────────────────────────
function sanitizeNew(string $input): string
{
    return $input
        |> trim(...)
        |> fn(string $s): string => preg_replace('/\s+/', ' ', $s) ?? $s
        |> ucwords(...)
        |> fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

$raw = '  hello   world  ';
echo sanitizeOld($raw) . "\n"; // Hello World
echo sanitizeNew($raw) . "\n"; // Hello World
```

The piped version is longer by line count but reads chronologically — each transformation is visible without tracing parentheses. It also simplifies debugging: you can insert a `var_dump(...)` step mid-pipeline without restructuring.

## 20.4 New Standard Library Additions (8.5)

PHP 8.5 ships several smaller additions. Note: the complete list will be finalised at release.

```php
<?php
declare(strict_types=1);

// array_first / array_last — confirmed helpers
// Return the first or last element without side effects (no array mutation)
$items = [3, 1, 4, 1, 5, 9, 2, 6];

// Exploratory — verify availability in your PHP 8.5 build:
// $first = array_first($items); // 3
// $last  = array_last($items);  // 6

// If not yet available, use:
$first = reset($items);         // mutates internal pointer
$last  = end($items);           // mutates internal pointer

// Alternatively with array_slice (no mutation):
$firstSafe = array_slice($items, 0, 1)[0];
$lastSafe  = array_slice($items, -1)[0];

echo "First: {$firstSafe}, Last: {$lastSafe}\n"; // First: 3, Last: 6
```

## 20.5 Type System Improvements [RFC — not yet stable]

The following are actively tracked RFCs that may land in 8.5 or a later minor version:

### Never-returning closures typed as `never`
Closures that always throw or loop forever can be annotated `never` for the same exhaustiveness signal available on functions.

### `true` and `false` standalone types (widening)
Already present in 8.0/8.1 as part of union types. RFCs are exploring stricter inference in more positions.

### Generics / Templates [RFC — not yet stable]
The most anticipated long-running RFC. PHP Generics would allow `Collection<User>` instead of `Collection`. As of early 2025 this RFC is in discussion with no confirmed target version.

## Appendix B — Tracked RFCs to Watch

The following RFCs are under active discussion as of the knowledge cutoff (August 2025). None are confirmed for any specific release. Monitor [https://wiki.php.net/rfc](https://wiki.php.net/rfc) for current status.

| RFC | Description | Status |
|-----|-------------|--------|
| Generics | Type-parameterised classes/functions (`Stack<int>`) | Discussion |
| `array_first` / `array_last` | Non-mutating first/last element access | Voting |
| Union type narrowing in `match` | Automatic type narrowing inside `match` arms | Draft |
| Readonly class properties in clones | `with` keyword to clone-and-mutate readonly objects | Draft |
| Pattern matching (destructuring) | Full `match` on shape of arrays/objects | Early discussion |

These RFCs signal where PHP's type system is heading. If you have a TypeScript background, generics and pattern matching will feel immediately familiar — they are the same features that TypeScript developers reach for when working in PHP and find missing.

## Key Takeaways

- The pipe operator `|>` is confirmed in PHP 8.5 and enables left-to-right, readable data transformation chains.
- The right-hand side of `|>` must be a callable; use first-class callable syntax or arrow functions for multi-argument transforms.
- Pipe does not replace `array_map`/`array_filter` for collections — it excels at single-value transformation pipelines.
- `array_first` / `array_last` and other small standard library additions are confirmed or near-confirmed for 8.5.
- Generics, pattern matching, and full type inference improvements remain active RFC discussions — not available in any stable release.

## What's Next

You have completed Phase 3 — Modern PHP 8.x Features. The next phase covers real-world application architecture: building type-safe APIs, integrating ORMs, and applying the patterns from this phase to production PHP projects.
