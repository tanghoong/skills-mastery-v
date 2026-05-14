# Chapter 16 — Match, Nullsafe & PHP 8.0 Additions

> **Goal:** Replace verbose `switch` blocks and fragile null chains with PHP 8.0's `match` expression, nullsafe operator, and the new string-inspection functions.

## 16.1 The `match` Expression

`match` looks like `switch` but behaves more like TypeScript's `switch` with the exhaustiveness checking turned up. Three critical differences:

1. **Strict comparison** — `match` uses `===`, not `==`. `"1"` never matches `1`.
2. **No fallthrough** — each arm is a single expression; there is no `break` and no accidental fallthrough.
3. **No match throws** — if no arm matches and there is no `default`, PHP throws `UnhandledMatchError`.

```php
<?php
declare(strict_types=1);

$status = 2;

$label = match($status) {
    1       => 'pending',
    2, 3    => 'active',   // comma-separated arms share an expression
    4       => 'closed',
    default => 'unknown',
};

echo $label; // active
```

Contrast with the classic `switch` footgun:

```php
<?php
declare(strict_types=1);

$value = "1";
switch ($value) {
    case 1: echo "matched int 1\n"; break;  // PRINTS — type coercion
}

$label = match($value) {
    1 => 'matched int 1',
    default => 'no match', // correctly reaches here
};
echo $label; // no match
```

TypeScript analogy: TypeScript's exhaustiveness checking requires a `never` assertion trick; PHP's `match` throws at runtime without a `default`.

## 16.2 `throw` as an Expression

Before PHP 8.0, `throw` was a statement — you could not use it inside a ternary, null coalescing operator, or arrow function. PHP 8.0 promotes it to an expression:

```php
<?php
declare(strict_types=1);

function findUser(int $id): string
{
    return $id > 0
        ? "User #{$id}"
        : throw new \InvalidArgumentException("ID must be positive, got {$id}");
}

echo findUser(5);  // User #5
// findUser(-1);   // throws InvalidArgumentException

// Also works inside match arms
$role = 'superuser';
$permission = match($role) {
    'admin'  => 'write',
    'viewer' => 'read',
    default  => throw new \DomainException("Unknown role: {$role}"),
};
```

TypeScript analogy: TypeScript arrow functions cannot `throw` directly in an expression; PHP 8.0 can, which keeps `match` arms terse and safe.

## 16.3 The Nullsafe Operator `?->`

Deep property chains on nullable objects are a common source of `Call to a member function on null` fatals. The `?->` operator short-circuits the entire chain and returns `null` the moment it encounters a `null` value — without any intermediate null checks.

```php
<?php
declare(strict_types=1);

class Avatar   { public function __construct(public string $url) {} }
class Profile  { public function __construct(public ?Avatar $avatar = null) {} }
class User     { public function __construct(public ?Profile $profile = null) {} }

function getAvatarUrl(?User $user): ?string
{
    return $user?->profile?->avatar?->url;
}

$user = new User(new Profile(new Avatar('https://example.com/pic.jpg')));
echo getAvatarUrl($user);  // https://example.com/pic.jpg

$empty = new User();
var_dump(getAvatarUrl($empty)); // NULL — no error
var_dump(getAvatarUrl(null));   // NULL — no error
```

TypeScript analogy: `user?.profile?.avatar?.url` — PHP's syntax is identical in intent, just with `->` instead of `.`.

The nullsafe operator works with method calls too: `$user?->getProfile()?->getAvatarUrl()`. It does not work on the left-hand side of an assignment — that is a deliberate design decision.

## 16.4 String-Inspection Functions (PHP 8.0)

Before PHP 8.0, checking for substrings required `strpos() !== false` — awkward and easy to misread. PHP 8.0 added three self-documenting functions:

```php
<?php
declare(strict_types=1);

$email = 'charlie@example.com';

var_dump(str_contains($email, '@'));          // bool(true)
var_dump(str_starts_with($email, 'charlie')); // bool(true)
var_dump(str_ends_with($email, '.org'));       // bool(false)

// Practical: simple URL validator
function isSecureUrl(string $url): bool
{
    return str_starts_with($url, 'https://') && str_contains($url, '.');
}

var_dump(isSecureUrl('https://php.net')); // bool(true)
var_dump(isSecureUrl('http://php.net'));  // bool(false)
```

TypeScript analogy: `String.prototype.includes`, `startsWith`, and `endsWith` — the naming is virtually identical.

## 16.5 Named Arguments (PHP 8.0)

Named arguments let you pass function arguments by parameter name, skipping optional parameters and improving readability:

```php
<?php
declare(strict_types=1);

// Without named args — cryptic positional booleans
$result = array_slice([1, 2, 3, 4, 5], offset: 1, length: 3, preserve_keys: true);
print_r($result); // [1=>2, 2=>3, 3=>4]
```

Combined with `match`, nullsafe chains, and string functions, named arguments round out the PHP 8.0 quality-of-life story.

## Key Takeaways

- `match` uses strict `===` comparison, has no fallthrough, and throws `UnhandledMatchError` when unhandled — safer than `switch` in every dimension.
- Multiple conditions can share a `match` arm with comma separation.
- `throw` as an expression enables terse `match` arms and ternary guards without extra lines.
- `?->` short-circuits a property/method chain at the first `null`, returning `null` — identical in spirit to TypeScript's optional chaining `?.`.
- `str_contains`, `str_starts_with`, and `str_ends_with` replace the `strpos !== false` anti-pattern with intent-revealing names.

## What's Next

Chapter 17 introduces PHP 8.1 Fibers — a cooperative concurrency primitive that gives PHP a stepping stone between synchronous code and a full async runtime, and draws direct comparisons to goroutines and async/await.
