# Chapter 2 — Types and Variables

> **Goal:** Declare variables with PHP's scalar types, understand how type juggling works (and why `strict_types` saves you from it), and use `var_dump`, `gettype`, and casting to inspect and convert values confidently.

## 2.1 Scalar Types

PHP has four scalar (primitive) types: `int`, `float`, `string`, and `bool`. Variables are declared by assignment — no `let`, `const`, or `var` keyword is required. Names start with a `$` sign.

```php
<?php
declare(strict_types=1);

$age: int = 30;           // not valid — PHP does not support inline annotations on variables
$age = 30;                // correct: PHP infers the type from the assigned value
$price = 9.99;            // float
$name = "Alice";          // string (double or single quotes)
$active = true;           // bool

var_dump($age);    // int(30)
var_dump($price);  // float(9.99)
var_dump($name);   // string(5) "Alice"
var_dump($active); // bool(true)
```

**TypeScript analogy:** PHP variables are like TypeScript variables with `let` and no type annotation — the type is inferred from the initial value. Unlike TypeScript, PHP does not enforce the inferred type on later reassignments: you can write `$age = "thirty"` on the next line and PHP will not complain. The variable simply becomes a `string`.

## 2.2 Type Juggling

Without `strict_types=1`, PHP will coerce values between types automatically when it thinks that is what you meant. This is called type juggling.

```php
<?php
// No strict_types here — watch what happens

function double(int $n): int {
    return $n * 2;
}

echo double("5");   // outputs 10 — PHP coerced "5" (string) to 5 (int)
echo double(3.9);   // outputs 6  — PHP truncated 3.9 to 3
```

Juggling follows a priority chain: `bool` < `int` < `float` < `string`. When PHP needs to compare or combine values of different types it promotes the lower-priority type. This produces surprising results:

```php
<?php
var_dump(0 == "foo");   // bool(true)  in PHP 7; bool(false) in PHP 8 — it changed!
var_dump(0 == "0");     // bool(true)
var_dump("1" == "01");  // bool(true)  — both coerce to int 1
var_dump(100 == "1e2"); // bool(true)  — "1e2" is scientific notation for 100
```

PHP 8.0 fixed the `0 == "foo"` case, but the broader juggling behaviour remains. With `strict_types=1` enabled, passing a `string` to a function that expects an `int` throws a `TypeError` immediately — the juggling never happens.

## 2.3 Explicit Casting

When you genuinely need to convert between types, cast explicitly rather than relying on juggling:

```php
<?php
declare(strict_types=1);

$input = "42";         // arrives as string from a form or query param

$asInt   = (int)    $input;   // 42
$asFloat = (float)  $input;   // 42.0
$asBool  = (bool)   $input;   // true  — any non-empty, non-"0" string is truthy
$asStr   = (string) 100;      // "100"

var_dump($asInt);   // int(42)
var_dump($asBool);  // bool(true)
```

Falsy values in PHP: `0`, `0.0`, `""`, `"0"`, `[]`, `null`. Everything else is truthy. This is similar to JavaScript's falsy list, but note that `"0"` (the string) is falsy in PHP — a fact that catches developers coming from JavaScript.

## 2.4 gettype and settype

`gettype()` returns the type of a value as a lowercase string. `settype()` coerces a variable in-place and returns a bool indicating success.

```php
<?php
declare(strict_types=1);

$value = 3.14;
echo gettype($value);  // "double"  (PHP says "double" for float — historical quirk)

$data = "99";
settype($data, "integer");
var_dump($data);  // int(99)
```

In practice, prefer explicit casts (`(int) $data`) over `settype()`. Casts are more readable and do not modify the original variable in place.

## 2.5 var_dump vs print_r vs var_export

These three functions all inspect values, but serve slightly different purposes:

```php
<?php
declare(strict_types=1);

$user = ["name" => "Bob", "score" => 42, "active" => false];

var_dump($user);
// array(3) {
//   ["name"]  => string(3) "Bob"
//   ["score"] => int(42)
//   ["active"]=> bool(false)
// }

print_r($user);
// Array ( [name] => Bob [score] => 42 [active] => )

var_export($user);
// array ( 'name' => 'Bob', 'score' => 42, 'active' => false, )
```

Use `var_dump` during debugging — it shows types alongside values. Use `var_export` when you need output that is valid PHP syntax (useful for generating config arrays). Use `print_r` when you only need a readable summary without type info.

## 2.6 Constants

Constants are defined with `const` (at the top level or inside classes) or `define()` (at runtime). They are not prefixed with `$`.

```php
<?php
declare(strict_types=1);

const MAX_RETRIES = 3;
define('APP_ENV', 'production');  // runtime definition, useful inside conditionals

echo MAX_RETRIES;   // 3
echo APP_ENV;       // production
```

**TypeScript analogy:** PHP's `const` at file scope is closest to TypeScript's `const` for a primitive value — a named, immutable binding. There is no equivalent to TypeScript's `as const` for objects; PHP uses class constants or enums for that pattern.

## Key Takeaways

- PHP's four scalar types are `int`, `float`, `string`, and `bool`; variables need no type annotation at declaration.
- Type juggling silently coerces values across type boundaries; `strict_types=1` converts these silent coercions into `TypeError` exceptions.
- Explicit casts like `(int)`, `(float)`, and `(string)` are safer and more readable than relying on juggling or `settype()`.
- `"0"` is falsy in PHP; keep this in mind when processing user input.
- `var_dump()` is the best debug tool because it shows both the value and its type.
- `const` at file scope declares true constants; no `$` prefix, no reassignment.

## What's Next

Chapter 3 covers control flow — `if/elseif/else`, the `match` expression, and PHP's various loop constructs — and explains when to prefer `match` over a `switch` statement.
