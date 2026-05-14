# Chapter 38 — Security

> **Goal:** Apply PHP's built-in security primitives correctly — password hashing, parameterised queries, output escaping, CSRF protection, and secure HTTP headers — to build applications that are safe by default.

## 38.1 Password Hashing

Never store passwords in plain text or with reversible encryption. PHP's `password_hash` uses bcrypt (or Argon2) with an automatically-generated salt and an adjustable cost factor.

```php
<?php
declare(strict_types=1);

$rawPassword = 'hunter2';

// Hash on registration
$hash = password_hash($rawPassword, PASSWORD_BCRYPT, ['cost' => 12]);
// $hash looks like: $2y$12$...

// Verify on login
$isValid = password_verify($rawPassword, $hash);
var_dump($isValid); // bool(true)

// Check if the hash needs rehashing (e.g. cost factor increased)
if (password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => 12])) {
    $hash = password_hash($rawPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    // save new hash to database
}
```

`PASSWORD_DEFAULT` is also acceptable — it will use the strongest available algorithm for your PHP version. Use `PASSWORD_ARGON2ID` where Argon2 is available (PHP 7.3+).

Never roll your own hashing. `md5(password)` and `sha1(password)` are not acceptable for passwords.

## 38.2 SQL Injection Prevention

SQL injection occurs when user input is interpolated directly into a query string. The fix is always prepared statements with bound parameters — never string concatenation.

Vulnerable (never do this):

```php
<?php
declare(strict_types=1);

// VULNERABLE — do not use
$username = $_GET['username']; // could be: ' OR '1'='1
$query    = "SELECT * FROM users WHERE username = '{$username}'";
// This executes the attacker's SQL.
```

Safe with PDO prepared statements:

```php
<?php
declare(strict_types=1);

function findUser(PDO $pdo, string $username): array|false
{
    $stmt = $pdo->prepare('SELECT id, email FROM users WHERE username = :username');
    $stmt->bindValue(':username', $username, PDO::PARAM_STR);
    $stmt->execute();

    return $stmt->fetch(PDO::FETCH_ASSOC);
}
```

Set the PDO error mode to exceptions so failures are never silently swallowed:

```php
<?php
declare(strict_types=1);

$pdo = new PDO(
    'mysql:host=localhost;dbname=app;charset=utf8mb4',
    'user',
    'secret',
    [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false, // use real prepared statements
    ],
);
```

## 38.3 XSS Prevention

Cross-site scripting (XSS) injects malicious JavaScript into a page via user-supplied content rendered without escaping.

Vulnerable:

```php
<?php
// VULNERABLE — do not use
echo "<p>Hello, " . $_GET['name'] . "</p>";
// If name = <script>alert(1)</script>, the script executes.
```

Safe — always escape output in an HTML context:

```php
<?php
declare(strict_types=1);

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$name = $_GET['name'] ?? 'guest';
echo "<p>Hello, " . e($name) . "</p>";
// Renders: Hello, &lt;script&gt;alert(1)&lt;/script&gt;
```

Rules:
- Escape **all** untrusted data before inserting into HTML context.
- Use `ENT_QUOTES` to escape both single and double quotes.
- Always specify `UTF-8` as the encoding.
- Escaping is context-dependent: HTML escaping is different from JavaScript, URL, and CSS contexts.

## 38.4 CSRF Tokens

Cross-site request forgery tricks a logged-in user's browser into submitting a request to your application from a malicious site. The fix is a server-generated, session-bound, single-use token included in every state-changing form.

```php
<?php
declare(strict_types=1);

session_start();

function generateCsrfToken(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrfToken(string $submittedToken): bool
{
    $storedToken = $_SESSION['csrf_token'] ?? '';
    // hash_equals prevents timing attacks
    return hash_equals($storedToken, $submittedToken);
}

// In form rendering:
$token = generateCsrfToken();
// <input type="hidden" name="csrf_token" value="<?= e($token) ?>">

// In form handling:
$submitted = $_POST['csrf_token'] ?? '';
if (!verifyCsrfToken($submitted)) {
    http_response_code(403);
    die('CSRF validation failed.');
}
```

Always use `hash_equals` for token comparison — it is constant-time and prevents timing-based token enumeration.

## 38.5 Secure HTTP Headers

HTTP response headers are the first line of defence against browser-based attacks. Set them on every response.

```php
<?php
declare(strict_types=1);

function sendSecureHeaders(): void
{
    // Prevent MIME-type sniffing
    header('X-Content-Type-Options: nosniff');

    // Block clickjacking
    header('X-Frame-Options: DENY');

    // Enable browser XSS filter (legacy browsers)
    header('X-XSS-Protection: 1; mode=block');

    // Force HTTPS for one year (HSTS)
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');

    // Referrer policy
    header('Referrer-Policy: strict-origin-when-cross-origin');

    // Content Security Policy — restrict resource origins
    header(
        "Content-Security-Policy: " .
        "default-src 'self'; " .
        "script-src 'self'; " .
        "style-src 'self'; " .
        "img-src 'self' data:; " .
        "font-src 'self'; " .
        "frame-ancestors 'none'; " .
        "base-uri 'self'; " .
        "form-action 'self'"
    );

    // Disable browser features you don't need
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
}

sendSecureHeaders();
```

## 38.6 Input Validation and Rate Limiting

Validate all input at the boundary. PHP 8.4 has no built-in rate limiting — implement it with a cache layer (Redis/APCu) or at the web server level (nginx `limit_req`).

```php
<?php
declare(strict_types=1);

function validateEmail(string $email): string
{
    $clean = filter_var(trim($email), FILTER_VALIDATE_EMAIL);
    if ($clean === false) {
        throw new InvalidArgumentException("Invalid email: {$email}");
    }
    return $clean;
}

function validatePositiveInt(mixed $value, string $field): int
{
    $int = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($int === false) {
        throw new InvalidArgumentException("{$field} must be a positive integer.");
    }
    return $int;
}

// Simple APCu-based rate limiter
function rateLimit(string $key, int $maxRequests, int $windowSeconds): bool
{
    $count = apcu_fetch($key) ?: 0;
    if ($count >= $maxRequests) {
        return false; // rate limit exceeded
    }
    apcu_add($key, 0, $windowSeconds);
    apcu_inc($key);
    return true;
}
```

## Key Takeaways

- Use `password_hash(PASSWORD_BCRYPT)` with cost ≥ 12; verify with `password_verify`. Never use `md5` or `sha1` for passwords.
- Prepared statements with `bindValue` are the only safe way to include user data in SQL queries.
- Escape all output with `htmlspecialchars($val, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')` before rendering in HTML.
- CSRF tokens must be session-bound, cryptographically random (`random_bytes`), and compared with `hash_equals`.
- Set `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, and `X-Content-Type-Options` on every response.
- Validate input at the boundary with `filter_var`; never trust `$_GET`, `$_POST`, or `$_SERVER` data without sanitisation.

## What's Next

Chapter 39 puts these security fundamentals to work inside a native PHP REST API, building a front controller, URI router, and JSON response pipeline from scratch.
