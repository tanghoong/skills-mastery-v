# PHP 8.x Mastery — Complete Overview

A reference document capturing the full PHP curriculum, ecosystem map, portfolio project, and learning roadmap.

> **Version target:** PHP 8.4 (stable) + PHP 8.5 (released 2025). All code in this course runs on PHP 8.4+. Chapter 20 covers PHP 8.5 confirmed stable additions only.

---

## Full 47-Chapter Curriculum

### Phase 1 — Foundation (Ch. 1–7)

| Chapter | File | Topics |
|---------|------|--------|
| 1  | [chapter_01_setup_cli.md](chapter_01_setup_cli.md) | Install PHP 8.4+, `php -S`, `php -r`, `php -a` REPL, `php.ini`, `phpinfo()`, `declare(strict_types=1)` |
| 2  | [chapter_02_types_variables.md](chapter_02_types_variables.md) | Scalars (`int`, `float`, `string`, `bool`), type juggling, explicit casting, `gettype`, `settype`, `var_dump` |
| 3  | [chapter_03_control_flow.md](chapter_03_control_flow.md) | `if/elseif/else`, `match`, `for`, `foreach`, `while`, `do-while`, `break`/`continue`, `switch` vs `match` |
| 4  | [chapter_04_functions.md](chapter_04_functions.md) | Return types, default params, named arguments, variadic `...$args`, pass-by-reference `&$var`, `fn =>` arrow functions |
| 5  | [chapter_05_arrays.md](chapter_05_arrays.md) | Indexed, associative, multidimensional arrays, `array_map`, `array_filter`, `array_reduce`, `usort`, spread `...` |
| 6  | [chapter_06_strings.md](chapter_06_strings.md) | Built-in string functions, heredoc/nowdoc, `sprintf`/`printf`, regex (`preg_match`, `preg_replace`, `preg_split`) |
| 7  | [chapter_07_error_handling.md](chapter_07_error_handling.md) | `try/catch/finally`, multiple catch blocks, custom exceptions, exception hierarchy, `set_error_handler`, `set_exception_handler` |

### Phase 2 — Object-Oriented PHP (Ch. 8–14)

| Chapter | File | Topics |
|---------|------|--------|
| 8  | [chapter_08_classes_basics.md](chapter_08_classes_basics.md) | Classes, properties, methods, `$this`, `public`/`protected`/`private`, `static`, class constants, late static binding `static::` |
| 9  | [chapter_09_inheritance_abstract.md](chapter_09_inheritance_abstract.md) | `extends`, `parent::`, method overriding, `final`, abstract classes, abstract methods |
| 10 | [chapter_10_interfaces_traits.md](chapter_10_interfaces_traits.md) | Interfaces, implementing multiple interfaces, traits, trait conflict resolution, trait constants (PHP 8.2), Servant pattern via traits |
| 11 | [chapter_11_constructor_readonly_enums.md](chapter_11_constructor_readonly_enums.md) | Constructor property promotion (8.0), `readonly` properties (8.1), `readonly` classes (8.2), backed enums, unit enums, enum methods/interfaces |
| 12 | [chapter_12_magic_methods.md](chapter_12_magic_methods.md) | `__construct`, `__destruct`, `__get/__set/__isset/__unset`, `__invoke`, `__toString`, `__clone`, deep copy pattern |
| 13 | [chapter_13_type_system.md](chapter_13_type_system.md) | Union types `int\|string`, intersection types `A&B`, DNF types `(A&B)\|null`, `never`, `mixed`, standalone `null`/`false`/`true` types, typed class constants (8.3) |
| 14 | [chapter_14_attributes_reflection.md](chapter_14_attributes_reflection.md) | `#[Attribute]`, custom attribute classes, `ReflectionClass`, `ReflectionMethod`, `ReflectionProperty`, runtime introspection use cases |

### Phase 3 — Modern PHP 8.x Features (Ch. 15–20)

| Chapter | File | Topics |
|---------|------|--------|
| 15 | [chapter_15_closures_functional.md](chapter_15_closures_functional.md) | `Closure` class, `use` binding, `Closure::bind/bindTo/fromCallable`, higher-order functions, function composition, first-class callable syntax `strlen(...)` |
| 16 | [chapter_16_match_nullsafe.md](chapter_16_match_nullsafe.md) | `match` exhaustiveness & no type coercion, `?->` nullsafe operator chains, `throw` as expression, `str_contains/starts_with/ends_with` (8.0) |
| 17 | [chapter_17_fibers.md](chapter_17_fibers.md) | PHP 8.1 `Fiber` API, `start/resume/suspend/getReturn`, cooperative multitasking, comparison to goroutines, practical use cases |
| 18 | [chapter_18_generators.md](chapter_18_generators.md) | `yield`, `yield from`, `send()`, `Generator` interface, infinite sequences, streaming large CSV/DB result sets lazily |
| 19 | [chapter_19_php84_features.md](chapter_19_php84_features.md) | Property hooks (`get`/`set`), asymmetric visibility (`public(get) private(set)`), lazy objects, `new` in initializers, `array_find/array_any/array_all`, HTML5 parser, BCMath object API |
| 20 | [chapter_20_php85_features.md](chapter_20_php85_features.md) | Confirmed PHP 8.5 stable additions: pipe operator `\|>`, new standard library functions, type system improvements — *Appendix: tracked RFCs (no code, heads-up only)* |

### Phase 4 — Design Principles & Patterns (Ch. 21–27)

| Chapter | File | Topics |
|---------|------|--------|
| 21 | [chapter_21_design_principles.md](chapter_21_design_principles.md) | **SOLID** (SRP, OCP, LSP, ISP, DIP — one PHP example each), DRY, KISS, YAGNI, Law of Demeter, Separation of Concerns |
| 22 | [chapter_22_creational_patterns.md](chapter_22_creational_patterns.md) | **Factory Method**, **Abstract Factory**, **Builder** (fluent interface), **Prototype** (`clone`), **Singleton** — covered with note: prefer DI container for singleton scope |
| 23 | [chapter_23_structural_patterns.md](chapter_23_structural_patterns.md) | **Adapter** (class & object), **Decorator** (PSR-15 middleware example), **Facade** (Laravel-style), **Proxy** (lazy-load & access control), **Composite** (tree structures) — *Bridge: brief concept mention* |
| 24 | [chapter_24_behavioral_patterns_1.md](chapter_24_behavioral_patterns_1.md) | **Strategy** (payment example), **Observer** (event dispatcher), **Command** (CLI command bus), **Chain of Responsibility** (PSR-15 middleware stack), **Iterator** (SPL + custom) |
| 25 | [chapter_25_behavioral_patterns_2.md](chapter_25_behavioral_patterns_2.md) | **State** (order state machine), **Template Method** (abstract algorithm), **Mediator** (event bus / CQRS), **Memento** (undo snapshot), **Visitor** (report generator), **Null Object** (eliminate null guards) |
| 26 | [chapter_26_dependency_injection.md](chapter_26_dependency_injection.md) | Constructor vs setter vs interface injection, manual DI container from scratch, PSR-11 `ContainerInterface`, autowiring concept, why Singleton anti-pattern disappears with DI |
| 27 | [chapter_27_architecture_patterns.md](chapter_27_architecture_patterns.md) | **Repository**, **Unit of Work**, **DTO**, **Value Object**, **Result pattern** `Result<T,E>`, **Service Layer** — all implemented in pure PHP |

### Phase 5 — SQL & Database Mastery (Ch. 28–33)

| Chapter | File | Topics |
|---------|------|--------|
| 28 | [chapter_28_sql_fundamentals.md](chapter_28_sql_fundamentals.md) | DDL (`CREATE TABLE`, `ALTER`, `DROP`), MySQL data types, `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`, `DEFAULT`, database normalisation (1NF → 3NF) |
| 29 | [chapter_29_sql_queries.md](chapter_29_sql_queries.md) | `SELECT`, `WHERE`, `ORDER BY`, `LIMIT`/`OFFSET`, `INNER/LEFT/RIGHT/FULL JOIN`, `UNION`, subqueries, `EXISTS`/`IN` |
| 30 | [chapter_30_sql_aggregation_windows.md](chapter_30_sql_aggregation_windows.md) | `GROUP BY`, `HAVING`, `COUNT/SUM/AVG/MIN/MAX`, window functions: `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `PARTITION BY`, `OVER()` |
| 31 | [chapter_31_sql_indexes_transactions.md](chapter_31_sql_indexes_transactions.md) | `CREATE INDEX`, composite indexes, `EXPLAIN`, query execution plans, ACID properties, isolation levels, `START TRANSACTION`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`, deadlock handling |
| 32 | [chapter_32_pdo_deep_dive.md](chapter_32_pdo_deep_dive.md) | DSN strings, `PDO::ERRMODE_EXCEPTION`, named vs positional placeholders, fetch modes (`FETCH_ASSOC`, `FETCH_CLASS`, `FETCH_OBJ`), transactions in PDO, persistent connections |
| 33 | [chapter_33_query_builder_pattern.md](chapter_33_query_builder_pattern.md) | Building a fluent PHP query builder from scratch, method chaining, SQL injection prevention at the builder layer, `SELECT`/`INSERT`/`UPDATE`/`DELETE` support |

### Phase 6 — CLI & Automation (Ch. 34–35)

| Chapter | File | Topics |
|---------|------|--------|
| 34 | [chapter_34_cli_scripting.md](chapter_34_cli_scripting.md) | `$argv`/`$argc`, `getopt` (short & long options), `fgets(STDIN)`, ANSI escape codes (colours, bold), progress bars, table output, exit codes, structuring a CLI application class |
| 35 | [chapter_35_automation_tasks.md](chapter_35_automation_tasks.md) | Cron job scheduling, `exec`/`shell_exec`/`proc_open`, signal handling (`pcntl_signal`, `SIGTERM`/`SIGINT`), background workers, daemon pattern, lock files |

### Phase 7 — Real-World Web PHP (Ch. 36–40)

| Chapter | File | Topics |
|---------|------|--------|
| 36 | [chapter_36_namespaces_composer.md](chapter_36_namespaces_composer.md) | Namespaces, PSR-4 autoloading, `composer.json` anatomy, `require`/`require-dev`, Packagist, semantic versioning, PSR standards overview (PSR-1/4/7/11/12/15) |
| 37 | [chapter_37_http_curl.md](chapter_37_http_curl.md) | cURL fundamentals, `curl_setopt` cheatsheet, `stream_context_create`, `json_encode/decode`, `json_validate` (8.3), consuming REST APIs, retry logic, timeout handling |
| 38 | [chapter_38_security.md](chapter_38_security.md) | `password_hash`/`password_verify`, SQL injection prevention, XSS output escaping with `htmlspecialchars`, CSRF tokens, secure headers (`Content-Security-Policy`), input validation, rate limiting |
| 39 | [chapter_39_rest_api_native.md](chapter_39_rest_api_native.md) | Front controller pattern, URI router (regex-based), `Request`/`Response` value objects, JSON response helpers, middleware pipeline, HTTP status enum, error response format |
| 40 | [chapter_40_testing.md](chapter_40_testing.md) | PHPUnit setup & assertions, Pest expressive syntax, unit vs integration tests, `createMock`/`createStub`, data providers, testing PDO with SQLite in-memory, TDD red-green-refactor |

### Phase 8 — Performance & Infrastructure (Ch. 41–42)

| Chapter | File | Topics |
|---------|------|--------|
| 41 | [chapter_41_performance_caching.md](chapter_41_performance_caching.md) | OPcache config (`opcache.ini`), APCu in-memory cache, Redis from PHP (`predis`/`phpredis`), cache-aside pattern, Xdebug profiling, `memory_get_peak_usage`, benchmarking with `microtime` |
| 42 | [chapter_42_deployment_tooling.md](chapter_42_deployment_tooling.md) | PHP-FPM pools, Nginx + PHP-FPM config, Dockerfile for PHP apps, `.env` management (`vlucas/phpdotenv`), health check endpoint, graceful restart, production `php.ini` hardening |

### Phase 9 — Twig Template Engine (Ch. 43)

| Chapter | File | Topics |
|---------|------|--------|
| 43 | [chapter_43_twig.md](chapter_43_twig.md) | Twig setup via Composer, syntax (`{{ }}`, `{% %}`), variables & filters, `for`/`if` tags, template inheritance (`extends`/`block`/`parent()`), `include`/`embed`, macros, custom filters & functions, auto-escaping |

### Phase 10 — PHP Frameworks (Ch. 44–47)

| Chapter | File | Topics |
|---------|------|--------|
| 44 | [chapter_44_laravel.md](chapter_44_laravel.md) | Routing, Eloquent ORM, Blade templates, Artisan CLI, queues & jobs, service providers, Sanctum API authentication — high-level tour |
| 45 | [chapter_45_symfony.md](chapter_45_symfony.md) | DI container, HttpFoundation, Doctrine ORM, Console component, EventDispatcher, Security component — high-level tour |
| 46 | [chapter_46_microframeworks.md](chapter_46_microframeworks.md) | Slim 4 (PSR-7/15 middleware, routing), Lumen (Laravel-lite for microservices) — when lightweight wins over full-stack |
| 47 | [chapter_47_high_performance_capstone.md](chapter_47_high_performance_capstone.md) | Swoole coroutines, RoadRunner persistent workers, FrankenPHP — then **NoteFlow capstone project** (see below) |

---

## Design Pattern Coverage Summary

| Category | Patterns Covered | Patterns Omitted |
|----------|-----------------|-----------------|
| Creational | Factory Method, Abstract Factory, Builder, Prototype, Singleton (+ DI note) | — |
| Structural | Adapter, Decorator, Facade, Proxy, Composite | Flyweight (long-running PHP only — brief note), Bridge (brief mention) |
| Behavioral | Strategy, Observer, Command, Chain of Responsibility, Iterator, State, Template Method, Mediator, Memento, Visitor, Null Object | Interpreter (appendix note only), Servant (covered as Traits in Ch. 10) |
| Non-GoF | Dependency Injection (full chapter), Repository, Unit of Work, DTO, Value Object, Result Pattern | — |

---

## PHP 8.x Version History at a Glance

| Version | Released | Key Additions |
|---------|---------|---------------|
| 8.0 | Nov 2020 | JIT compiler, Union types, `match`, Named arguments, Nullsafe `?->`, `#[Attributes]`, Constructor promotion |
| 8.1 | Nov 2021 | Enums, `readonly` properties, Fibers, Intersection types, `never`, First-class callable syntax |
| 8.2 | Dec 2022 | `readonly` classes, DNF types, `null`/`false`/`true` standalone types, Constants in traits |
| 8.3 | Nov 2023 | Typed class constants, `#[Override]`, `json_validate()`, Dynamic class constant fetch (`$cls::CONST`) |
| 8.4 | Nov 2024 | Property hooks, Asymmetric visibility, `new` in initializers, Lazy objects, `array_find/any/all`, HTML5 parser |
| 8.5 | 2025 | Pipe operator `\|>`, new standard library functions, type system improvements — see Ch. 20 |

---

## PHP Ecosystem Map

### Full-Stack Frameworks
| Framework | Style | Best For |
|-----------|-------|----------|
| Laravel 11+ | Full-stack, batteries-included | SaaS, APIs, Blade/Livewire/Inertia apps |
| Symfony 7+ | Enterprise, modular components | Large teams, complex domains |
| Yii 3 | Fast, convention-based | CRUD-heavy apps |

### Microframeworks & API Frameworks
| Framework | Notes |
|-----------|-------|
| Slim 4 | Lightweight PSR-7/15 middleware framework |
| Lumen | Laravel-subset, microservice APIs |
| Mezzio (Laminas) | Middleware pipeline, enterprise PSR-15 |

### High-Performance / Async
| Tool | Notes |
|------|-------|
| Swoole | C-extension coroutines, persistent HTTP server, WebSockets |
| RoadRunner | Go-based app server — PHP workers stay alive between requests |
| FrankenPHP | Modern PHP app server built on Caddy, HTTP/3, early hints |
| ReactPHP | Pure PHP event loop, streams, promises |
| AmpPHP | Cooperative multitasking, Fibers-native |

### ORM / Database
| Tool | Notes |
|------|-------|
| Eloquent (Laravel) | Active Record pattern, clean DX |
| Doctrine ORM | Data Mapper pattern, enterprise-grade |
| Cycle ORM | Modern, schema-first, async-friendly |
| Doctrine DBAL | Doctrine's typed raw query layer |

### Template Engines
| Tool | Notes |
|------|-------|
| **Twig** | Sandboxed, inheritance-based, the standard outside Laravel |
| Blade (Laravel) | Directive-based, `@extends/@section/@yield` |
| Plates | Native PHP templates, lightweight |

### Testing
| Tool | Notes |
|------|-------|
| PHPUnit | The standard — `@dataProvider`, mocking, coverage reports |
| Pest | Expressive, Laravel-native, runs on top of PHPUnit |
| Mockery | Fluent mock objects for PHPUnit |

### Package Management
| Tool | Notes |
|------|-------|
| Composer | The PHP package manager (equivalent to npm) |
| Packagist | Central public package repository |

---

## Portfolio Project — NoteFlow

### Concept
**A full web note-taking application** built entirely in **native PHP 8.5 + Twig** — no framework. Demonstrates every phase of the course applied to a real, deployable project.

### Feature Set
- User registration, login, session management
- Create, read, update, delete notes with tags
- Full-text search across notes
- CLI tool: `php artisan`-style console runner for DB migrations and seeding
- Secure: CSRF protection, XSS-safe Twig rendering, rate-limited login

### Architecture
```
noteflow/
├── public/
│   └── index.php              ← Front controller (Ch. 39)
├── src/
│   ├── Http/
│   │   ├── Router.php         ← Regex router
│   │   ├── Request.php        ← Value object (Ch. 27)
│   │   └── Response.php
│   ├── Middleware/
│   │   ├── AuthMiddleware.php ← Chain of Responsibility (Ch. 24)
│   │   └── CsrfMiddleware.php
│   ├── Controllers/
│   │   ├── NoteController.php
│   │   └── AuthController.php
│   ├── Services/
│   │   ├── NoteService.php    ← Service Layer (Ch. 27)
│   │   └── AuthService.php
│   ├── Repository/
│   │   ├── NoteRepository.php ← Repository pattern (Ch. 27)
│   │   └── UserRepository.php
│   ├── Domain/
│   │   ├── Note.php           ← Readonly class + property hooks (Ch. 19)
│   │   ├── User.php
│   │   └── NoteStatus.php     ← Backed enum (Ch. 11)
│   ├── Database/
│   │   └── Connection.php     ← PDO (Ch. 32)
│   ├── Container/
│   │   └── Container.php      ← Manual DI container (Ch. 26)
│   └── Result.php             ← Result<T,E> pattern (Ch. 27)
├── templates/                 ← Twig templates (Ch. 43)
│   ├── layout/
│   │   └── base.html.twig
│   ├── notes/
│   │   ├── index.html.twig
│   │   └── edit.html.twig
│   └── auth/
│       └── login.html.twig
├── cli/
│   └── console.php            ← CLI runner (Ch. 34)
├── migrations/                ← Raw SQL migration files (Ch. 28–31)
├── tests/
│   ├── Unit/                  ← PHPUnit / Pest (Ch. 40)
│   └── Integration/
├── composer.json
└── .env
```

### Patterns Applied in NoteFlow
| Pattern | Where Used |
|---------|-----------|
| Repository | `NoteRepository`, `UserRepository` |
| Service Layer | `NoteService`, `AuthService` |
| DTO / Value Object | `Request`, `Response`, `NoteDto` |
| Result `Result<T,E>` | Service return types — no uncaught exceptions |
| Chain of Responsibility | Middleware pipeline |
| Strategy | Multiple search strategies (title, tag, full-text) |
| Observer | Domain events (`NoteCreated`, `UserLoggedIn`) |
| Factory Method | `Connection::create()` |
| Null Object | `GuestUser` implements `UserInterface` |
| Decorator | Caching decorator over `NoteRepository` |

---

## PHP Conventions in This Course

```php
<?php
declare(strict_types=1);  // Always — first line of every file

// Explicit return types on all functions
function createUser(string $name, int $age): User { ... }

// Readonly DTOs via constructor promotion
readonly class UserDto {
    public function __construct(
        public string $name,
        public int    $age,
    ) {}
}

// Backed enums over string/int constants
enum Status: string {
    case Active   = 'active';
    case Inactive = 'inactive';
}

// Nullsafe operator over nested null checks
$city = $user?->address?->city;

// Match over switch (expression, no type coercion, exhaustive)
$label = match($status) {
    Status::Active   => 'Online',
    Status::Inactive => 'Offline',
};

// Named arguments for long function calls
array_slice(array: $items, offset: 2, length: 5, preserve_keys: true);

// Result pattern — no throwing in service logic
/** @return Result<User, string> */
function registerUser(string $email): array {
    if (userExists($email)) {
        return ['ok' => false, 'error' => 'Email already taken'];
    }
    return ['ok' => true, 'value' => new User($email)];
}
```

---

## Prerequisites & Quick Start

**Required:**
- PHP 8.4+ — `php --version`
- Composer 2.x — `composer --version`
- MySQL 8.0+ (or Docker)
- VS Code + [PHP Intelephense](https://marketplace.visualstudio.com/items?itemName=bmewburn.vscode-intelephense-client) extension

**Optional but recommended:**
- [Laravel Herd](https://herd.laravel.com) — one-click PHP + Nginx on macOS
- [TablePlus](https://tableplus.com) — MySQL GUI

```bash
# Run a single exercise file
php php/exercises/chapter_01.php

# Start PHP built-in server (for web exercises Ch. 36+)
php -S localhost:8000 -t public/

# MySQL via Docker (if not using Herd)
docker run -d --name php-mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=noteflow \
  -p 3306:3306 mysql:8.0

# Install NoteFlow capstone dependencies
cd noteflow && composer install
```

---

## Appendix

### A — Interpreter Pattern (GoF)
The Interpreter pattern defines a grammar for a language and provides an interpreter for it. In PHP, this is relevant only when building domain-specific languages (DSLs), expression parsers, or template engines. It is not covered in this course as it falls outside typical PHP application development — but it exists in the wild inside tools like Doctrine's DQL parser and Twig's own lexer.

### B — PHP 8.5 Tracked RFCs (no code — heads-up only)
These are RFCs that were proposed or in voting as of 2025 but not confirmed stable in the 8.5 release. Monitor [wiki.php.net/rfc](https://wiki.php.net/rfc) for status:
- Generic types (long-standing proposal, not yet accepted)
- `@readonly` on promoted constructor parameters refinements
- `array_zip` / `array_zip_key` functions
- Improved `str_pad` multi-byte support
- `\Closure::partial()` for partial function application
