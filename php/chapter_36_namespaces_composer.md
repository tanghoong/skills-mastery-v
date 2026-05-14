# Chapter 36 — Namespaces & Composer

> **Goal:** Organise PHP code with namespaces and PSR-4 autoloading, and manage third-party packages confidently with Composer.

## 36.1 Namespaces

A namespace prevents name collisions between your code and third-party libraries. The PHP analogy to a TypeScript module path is a backslash-separated namespace string.

```php
<?php
declare(strict_types=1);

namespace App\Services;

final class Greeter
{
    public function greet(string $name): string
    {
        return "Hello, {$name}!";
    }
}
```

The `namespace` declaration must appear before any non-comment code. By convention, the namespace mirrors the directory path: `src/Services/Greeter.php` declares `namespace App\Services`.

## 36.2 Using Namespaces: `use`, `use function`, `use const`

The `use` statement imports a fully-qualified name and optionally aliases it. This is identical in purpose to ES module `import` statements in TypeScript.

```php
<?php
declare(strict_types=1);

namespace App\Http;

use App\Services\Greeter;                       // import class
use App\Services\Greeter as GreeterService;     // alias
use function App\Helpers\slugify;               // import function
use const App\Config\MAX_RETRIES;               // import constant

$g = new GreeterService();
echo $g->greet('Charlie') . PHP_EOL;

$slug    = slugify('Hello World');
$retries = MAX_RETRIES;
```

Without `use`, you can always write the fully-qualified name: `new \App\Services\Greeter()`. The leading backslash refers to the global namespace.

## 36.3 PSR-4 Autoloading

PSR-4 maps a namespace prefix to a base directory. Composer implements this mapping so you never need to write `require_once` manually — the same convenience as TypeScript's module resolution.

The mapping lives in `composer.json`:

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "App\\Tests\\": "tests/"
        }
    }
}
```

After adding or changing the mapping, regenerate the autoloader:

```bash
composer dump-autoload
```

Then include the autoloader once at the entry point:

```php
<?php
declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use App\Services\Greeter;

$g = new Greeter();
echo $g->greet('world') . PHP_EOL;
```

## 36.4 `composer.json` Anatomy

A minimal production `composer.json`:

```json
{
    "name":        "charlie/devlog-api",
    "description": "AI-powered developer journal API",
    "type":        "project",
    "license":     "MIT",
    "require": {
        "php":              "^8.4",
        "psr/log":          "^3.0",
        "guzzlehttp/guzzle":"^7.8"
    },
    "require-dev": {
        "phpunit/phpunit": "^11.0",
        "pestphp/pest":    "^2.0"
    },
    "autoload": {
        "psr-4": { "App\\": "src/" }
    },
    "autoload-dev": {
        "psr-4": { "App\\Tests\\": "tests/" }
    },
    "config": {
        "optimize-autoloader": true,
        "sort-packages":       true
    }
}
```

Essential Composer commands:

| Command | Purpose |
|---|---|
| `composer install` | Install locked versions (use in CI/deployment) |
| `composer update` | Resolve and update to latest allowed versions |
| `composer require vendor/pkg` | Add a runtime dependency |
| `composer require --dev vendor/pkg` | Add a dev-only dependency |
| `composer remove vendor/pkg` | Remove a package |
| `composer dump-autoload` | Regenerate the autoloader class map |
| `composer show` | List installed packages |

## 36.5 Semantic Versioning and Version Constraints

Composer uses semantic versioning (`MAJOR.MINOR.PATCH`). Constraints in `composer.json` use the following operators:

```
^8.4    → >=8.4.0 <9.0.0   (caret: allow minor and patch upgrades)
~8.4    → >=8.4.0 <8.5.0   (tilde: allow patch upgrades only)
>=8.3   → any version 8.3 or above
8.4.*   → exactly 8.4.x
```

The caret (`^`) is the recommended default — it is what `npm install` uses by default when writing to `package.json`.

## 36.6 Packagist and Finding Packages

[Packagist](https://packagist.org) is the default Composer package registry, equivalent to npm for Node. You can search it from the CLI:

```bash
composer search http-client
composer show guzzlehttp/guzzle
```

## 36.7 PSR Standards Overview

The PHP-FIG (Framework Interop Group) publishes PSR standards that enable interoperability between libraries. Understanding the most common ones is essential for reading modern PHP code.

| PSR | Title | Summary |
|---|---|---|
| PSR-1 | Basic Coding Standard | Files use `<?php`, classes in `StudlyCaps`, methods in `camelCase`, constants in `UPPER_CASE` |
| PSR-4 | Autoloading Standard | Namespace maps to directory; one class per file; filename matches class name |
| PSR-7 | HTTP Message Interfaces | `RequestInterface`/`ResponseInterface` for HTTP messages (Slim, Guzzle, Laminas) |
| PSR-11 | Container Interface | `ContainerInterface` for dependency injection containers (`get`/`has` methods) |
| PSR-12 | Extended Coding Style | Brace placement, spacing, blank lines — a superset of PSR-2 |
| PSR-15 | HTTP Server Handler | `MiddlewareInterface` and `RequestHandlerInterface` for HTTP middleware pipelines |

Libraries that declare they support a PSR interface can be swapped out without changing your application code — this is the PHP equivalent of programming to an interface rather than a concrete type.

## Key Takeaways

- Namespaces mirror directory structure; use `use` to import classes, functions, and constants exactly as you would ES `import` in TypeScript.
- PSR-4 autoloading eliminates manual `require_once` by mapping namespace prefixes to directories.
- `composer install` uses the lockfile (deterministic); `composer update` resolves fresh (for dev).
- Use the caret constraint (`^`) for most dependencies; it allows safe minor and patch upgrades.
- PSR-7, PSR-11, and PSR-15 define the interfaces that make modern PHP frameworks interoperable.
- `composer dump-autoload` must be run after any changes to the `autoload` section of `composer.json`.

## What's Next

Chapter 37 dives into HTTP and cURL — making outbound API requests, handling retries, and consuming JSON-based REST services.
