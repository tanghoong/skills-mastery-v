# Chapter 6 — Strings

> **Goal:** Manipulate strings confidently using PHP's built-in string functions, heredoc and nowdoc syntax, formatted output with `sprintf`, and PCRE regular expressions.

## 6.1 String Basics and Variable Interpolation

Strings in PHP can be wrapped in either single quotes or double quotes. The difference matters for interpolation:

```php
<?php
declare(strict_types=1);

$name = "Alice";

echo "Hello, $name!";          // Hello, Alice!   — interpolation happens
echo 'Hello, $name!';          // Hello, $name!   — no interpolation, literal
echo "Score: {$name}Points";   // curly-brace syntax for disambiguation
```

For simple variables, `"$var"` works. Use `"{$var}"` when the variable is directly adjacent to other characters that could be confused with the variable name, or when accessing array keys or object properties inside the string:

```php
<?php
declare(strict_types=1);

$user = ["first" => "Bob", "last" => "Smith"];
echo "Welcome, {$user['first']} {$user['last']}!";  // Welcome, Bob Smith!
```

## 6.2 Heredoc and Nowdoc

When a string spans multiple lines or contains many quotes, heredoc and nowdoc eliminate the need for escaping:

```php
<?php
declare(strict_types=1);

$product = "Widget";
$price   = 9.99;

// Heredoc — behaves like a double-quoted string (interpolation ON)
$html = <<<HTML
    <div class="product">
        <h2>$product</h2>
        <p>Price: \$$price</p>
    </div>
    HTML;

echo $html;

// Nowdoc — behaves like a single-quoted string (interpolation OFF)
$template = <<<'SQL'
    SELECT * FROM products
    WHERE name = '$product'
    AND price < $price;
    SQL;

echo $template;
// SELECT * FROM products
// WHERE name = '$product'
// AND price < $price;
```

The closing identifier must appear on its own line, optionally indented. The indentation of the closing identifier is stripped from all lines in the body (PHP 7.3+). Use nowdoc (`<<<'LABEL'`) for SQL, shell scripts, or any text you do not want PHP to scan for variables.

## 6.3 Essential String Functions

PHP has around 100 string functions. These are the ones you will reach for constantly:

```php
<?php
declare(strict_types=1);

$s = "  Hello, World!  ";

// Length and case
echo strlen(trim($s));              // 13
echo strtolower("HELLO");          // hello
echo strtoupper("hello");          // HELLO
echo ucfirst("hello world");       // Hello world
echo ucwords("hello world");       // Hello World

// Search
echo strpos("hello", "ll");        // 2  (false if not found)
echo str_contains("hello", "ell"); // true  (PHP 8.0+)
echo str_starts_with("hello", "he"); // true
echo str_ends_with("hello", "lo");   // true

// Replace and split
echo str_replace("World", "PHP", "Hello, World!");  // Hello, PHP!
$parts = explode(",", "a,b,c,d");   // ["a", "b", "c", "d"]
echo implode(" | ", $parts);        // a | b | c | d

// Trim
echo trim("  hello  ");            // "hello"
echo ltrim("  hello  ");           // "hello  "
echo rtrim("  hello  ");           // "  hello"

// Substring
echo substr("Hello, World!", 7, 5);  // World

// Repeat and pad
echo str_repeat("-", 10);            // ----------
echo str_pad("42", 5, "0", STR_PAD_LEFT);  // 00042
```

`str_contains`, `str_starts_with`, and `str_ends_with` were added in PHP 8.0 and replace the older idiom of checking `strpos() !== false`.

## 6.4 sprintf and printf

`sprintf` builds a formatted string without printing it. `printf` prints it directly. Both use format specifiers prefixed with `%`:

```php
<?php
declare(strict_types=1);

$name  = "Alice";
$score = 94.5678;
$rank  = 3;

$report = sprintf(
    "%-10s scored %06.2f and ranked #%d",
    $name, $score, $rank
);
echo $report;
// Alice      scored 094.57 and ranked #3

// Common specifiers:
// %s  — string
// %d  — integer (decimal)
// %f  — float (%.2f = 2 decimal places)
// %06.2f — zero-padded, 6 total width, 2 decimal places
// %-10s — left-aligned in 10-character field

// number_format for locale-aware formatting
echo number_format(1234567.891, 2, '.', ',');  // 1,234,567.89
```

**TypeScript analogy:** TypeScript does not have `sprintf` natively. The closest equivalents are template literals for simple cases and libraries like `sprintf-js` for format strings. `Intl.NumberFormat` maps to PHP's `number_format`.

## 6.5 Regular Expressions — PCRE

PHP uses Perl-Compatible Regular Expressions (PCRE). All three core functions take the pattern as a string wrapped in delimiters (commonly `/`):

**preg_match** — test whether a pattern matches, optionally capturing groups:

```php
<?php
declare(strict_types=1);

$email = "user@example.com";

if (preg_match('/^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i', $email)) {
    echo "Valid email\n";
}

// Capture groups — $matches[0] is full match, $matches[1] is group 1
$date = "2026-05-14";
preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $matches);
echo $matches[1];  // 2026
echo $matches[2];  // 05
echo $matches[3];  // 14
```

**preg_replace** — replace all matches with a replacement string:

```php
<?php
declare(strict_types=1);

$text  = "Call us at 555-1234 or 555-5678.";
$clean = preg_replace('/\d{3}-\d{4}/', '[REDACTED]', $text);
echo $clean;  // Call us at [REDACTED] or [REDACTED].

// Backreferences in the replacement: $1 or \\1
$formatted = preg_replace('/(\d{4})-(\d{2})-(\d{2})/', '$3/$2/$1', "2026-05-14");
echo $formatted;  // 14/05/2026
```

**preg_split** — split a string by a pattern:

```php
<?php
declare(strict_types=1);

$csv  = "alpha, beta ,  gamma , delta";
$tags = preg_split('/\s*,\s*/', trim($csv));
// ["alpha", "beta", "gamma", "delta"]

print_r($tags);
```

**Tips for regex in PHP:**

- Wrap patterns in `/delimiters/` and add flags after the closing delimiter: `i` (case-insensitive), `m` (multiline), `s` (dot matches newline).
- `preg_match` returns `1` on match, `0` on no match, `false` on error. Use `=== 1` for a strict check.
- For performance-critical loops, PCRE patterns are compiled and cached, so re-using the same pattern string is efficient.

## Key Takeaways

- Double-quoted strings interpolate variables; single-quoted strings do not — pick the right one for the job.
- Heredoc (`<<<LABEL`) and nowdoc (`<<<'LABEL'`) handle multi-line strings cleanly; nowdoc is safe for SQL and shell snippets.
- `str_contains`, `str_starts_with`, and `str_ends_with` (PHP 8.0+) replace the brittle `strpos() !== false` idiom.
- `sprintf` produces formatted strings with width, padding, and decimal precision — use it wherever `"$var"` would produce inconsistent output.
- PCRE functions (`preg_match`, `preg_replace`, `preg_split`) cover all serious text-processing needs; learn the delimiter syntax and common flags.
- Always validate user-supplied strings with regex before trusting them in business logic or database queries.

## What's Next

Chapter 7 covers error and exception handling — `try/catch/finally`, custom exception classes, the PHP exception hierarchy, and runtime error handlers — giving you a robust strategy for dealing with failures in real applications.
