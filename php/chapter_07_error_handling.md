# Chapter 7 — Error Handling

> **Goal:** Handle errors and exceptions defensively using `try/catch/finally`, build a meaningful custom exception hierarchy, and register global handlers so that uncaught problems produce useful output instead of a blank page or raw stack trace.

## 7.1 PHP's Two Error Systems

PHP has two parallel error systems that you need to understand before writing reliable code:

1. **Errors** — the older system. Functions like `file_get_contents` on a missing file, division by zero, or calling an undefined function emit PHP errors (notices, warnings, fatals). These do not throw exceptions; they are intercepted with `set_error_handler()`.

2. **Exceptions** — the modern, object-oriented system. You throw and catch instances of `Throwable` (the root interface, implemented by both `Exception` and `Error`).

PHP 8.x blurred this line significantly. Many operations that were fatal errors in PHP 5/7 now throw `Error` exceptions in PHP 8, making them catchable. Still, the two systems coexist, which is why both handlers matter.

## 7.2 try / catch / finally

```php
<?php
declare(strict_types=1);

function divide(float $a, float $b): float {
    if ($b === 0.0) {
        throw new InvalidArgumentException("Cannot divide by zero.");
    }
    return $a / $b;
}

try {
    echo divide(10.0, 2.0) . "\n";   // 5
    echo divide(10.0, 0.0) . "\n";   // throws
} catch (InvalidArgumentException $e) {
    echo "Caught: " . $e->getMessage() . "\n";
} finally {
    echo "This always runs.\n";
}
// Output:
// 5
// Caught: Cannot divide by zero.
// This always runs.
```

`finally` executes regardless of whether an exception was thrown or the `try` block completed normally — identical behaviour to TypeScript's `finally`. It is the right place to release resources (close a file handle, roll back a transaction) because it runs even if a `return` statement is reached inside `try`.

## 7.3 Multiple catch Blocks and catch Order

You can catch different exception types in sequence. PHP checks them top-to-bottom and executes the first matching block:

```php
<?php
declare(strict_types=1);

function fetchUser(int $id): array {
    if ($id <= 0) {
        throw new InvalidArgumentException("ID must be positive, got $id.");
    }
    if ($id > 1000) {
        throw new RuntimeException("Database connection failed.");
    }
    return ["id" => $id, "name" => "User $id"];
}

try {
    $user = fetchUser(-5);
} catch (InvalidArgumentException $e) {
    echo "Bad input: " . $e->getMessage() . "\n";
} catch (RuntimeException $e) {
    echo "Infrastructure error: " . $e->getMessage() . "\n";
} catch (\Throwable $e) {
    // Catch-all — covers both Exception and Error subtypes
    echo "Unexpected: " . $e->getMessage() . "\n";
}
```

Order matters: put more specific exception types before their parent classes. Catching `\Exception` before `InvalidArgumentException` would swallow the specific type.

PHP 8.0 introduced the union catch syntax for handling multiple types in one block:

```php
<?php
declare(strict_types=1);

try {
    riskyOperation();
} catch (InvalidArgumentException | RuntimeException $e) {
    echo "Handled: " . $e->getMessage() . "\n";
}
```

## 7.4 The Exception Hierarchy

```
Throwable (interface)
├── Error
│   ├── TypeError
│   ├── ValueError
│   ├── ArithmeticError
│   │   └── DivisionByZeroError
│   ├── ParseError
│   └── UnhandledMatchError  (PHP 8.0)
└── Exception
    ├── RuntimeException
    │   ├── OutOfBoundsException
    │   ├── OverflowException
    │   └── UnexpectedValueException
    ├── LogicException
    │   ├── InvalidArgumentException
    │   ├── DomainException
    │   ├── LengthException
    │   └── OutOfRangeException
    └── BadFunctionCallException
```

`Error` and its subtypes are thrown by the PHP engine itself (`TypeError` on type mismatch, `UnhandledMatchError` on unmatched `match`, etc.). Your application code typically throws `Exception` subtypes. Catching `\Throwable` catches everything from both branches.

**TypeScript analogy:** TypeScript has a flat exception model — everything `throw`n is caught by `catch`. PHP's two-branch hierarchy (`Error` vs `Exception`) has no direct TypeScript equivalent, but the concept of catching by type maps naturally to the `instanceof` checks you would write in TypeScript.

## 7.5 Custom Exception Classes

Define application-specific exceptions by extending `RuntimeException` or `LogicException` (or any appropriate base):

```php
<?php
declare(strict_types=1);

class AppException extends RuntimeException {}

class NotFoundException extends AppException {
    public function __construct(
        private readonly string $resource,
        private readonly int    $id,
    ) {
        parent::__construct("$resource with ID $id was not found.", 404);
    }

    public function getResource(): string { return $this->resource; }
    public function getId(): int          { return $this->id; }
}

class ValidationException extends AppException {
    /** @param array<string, string> $errors */
    public function __construct(private readonly array $errors) {
        parent::__construct("Validation failed.", 422);
    }

    /** @return array<string, string> */
    public function getErrors(): array { return $this->errors; }
}

// Usage
try {
    throw new ValidationException([
        "email" => "Invalid format",
        "age"   => "Must be at least 18",
    ]);
} catch (ValidationException $e) {
    foreach ($e->getErrors() as $field => $message) {
        echo "$field: $message\n";
    }
} catch (NotFoundException $e) {
    echo "Not found: {$e->getResource()} #{$e->getId()}\n";
} catch (AppException $e) {
    echo "App error: " . $e->getMessage() . "\n";
}
```

Giving exceptions structured properties (like `$errors` or `$resource`) lets callers extract useful information without parsing the message string.

## 7.6 set_error_handler and set_exception_handler

These two global handlers let you intercept errors and uncaught exceptions at the application boundary — useful in framework bootstraps and CLI scripts.

**Converting PHP errors into exceptions** (a common pattern in modern applications):

```php
<?php
declare(strict_types=1);

set_error_handler(function (
    int    $severity,
    string $message,
    string $file,
    int    $line,
): bool {
    if (!(error_reporting() & $severity)) {
        return false;  // respect the @ suppression operator
    }
    throw new \ErrorException($message, 0, $severity, $file, $line);
});

// Now notices and warnings become catchable exceptions
try {
    $result = file_get_contents("/non/existent/file.txt");
} catch (\ErrorException $e) {
    echo "File error caught: " . $e->getMessage() . "\n";
}
```

**Global uncaught exception handler** — the last line of defence before the process exits:

```php
<?php
declare(strict_types=1);

set_exception_handler(function (\Throwable $e): void {
    // In production: log to your error tracker, show a generic error page
    error_log(sprintf(
        "[UNCAUGHT] %s: %s in %s:%d\nStack trace:\n%s",
        get_class($e),
        $e->getMessage(),
        $e->getFile(),
        $e->getLine(),
        $e->getTraceAsString(),
    ));

    http_response_code(500);
    echo "An unexpected error occurred. We have been notified.\n";
    exit(1);
});
```

Register both handlers early in your application entry point (e.g., `public/index.php`) before any other code runs.

## Key Takeaways

- PHP has two error systems: legacy PHP errors (use `set_error_handler`) and exceptions (use `try/catch`). Convert errors to `ErrorException` to unify them.
- `finally` always executes — use it for resource cleanup, not business logic.
- Catch exceptions from most specific to least specific; PHP matches the first applicable `catch` block.
- `\Throwable` is the root of the entire exception hierarchy and catches both `Exception` and `Error` subtypes.
- Build a shallow custom exception hierarchy rooted at a single `AppException`; add typed properties for structured data.
- Register `set_exception_handler` at the application entry point to ensure every uncaught exception is logged rather than silently swallowed.

## What's Next

Chapter 8 introduces object-oriented PHP — classes, constructors, visibility modifiers, constructor property promotion, and interfaces — bringing together the type system and error handling patterns you have learned into a structured application design.
