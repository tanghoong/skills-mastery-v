# Chapter 26 — Dependency Injection

> **Goal:** Understand the three injection styles, build a PSR-11 container from scratch, and see why DI makes the Singleton anti-pattern unnecessary.

## 26.1 What Dependency Injection Is (and Is Not)

Dependency Injection (DI) is the practice of providing a class's dependencies from the outside rather than letting the class create them internally. It is not a framework feature — it is a discipline. The result is code where every dependency is explicit, visible, and replaceable.

There are three classic injection styles.

**Constructor injection** — the dependency is required at construction time. It is the preferred style because the object is always in a valid state and dependencies are impossible to miss.

```php
<?php
declare(strict_types=1);

interface LoggerInterface {
    public function info(string $message): void;
}

class FileLogger implements LoggerInterface {
    public function info(string $message): void {
        file_put_contents('/tmp/app.log', $message . PHP_EOL, FILE_APPEND);
    }
}

// Constructor injection — dependency is explicit and required
class UserService {
    public function __construct(private readonly LoggerInterface $logger) {}

    public function register(string $email): void {
        // ... create user
        $this->logger->info("Registered: {$email}");
    }
}

$service = new UserService(new FileLogger());
```

**Setter injection** — the dependency is optional or can change after construction. Use sparingly; it leaves the object in a partially-configured state until the setter is called.

```php
<?php
declare(strict_types=1);

class Mailer {
    private ?LoggerInterface $logger = null;

    public function setLogger(LoggerInterface $logger): void {
        $this->logger = $logger;
    }

    public function send(string $to, string $body): void {
        $this->logger?->info("Sent email to {$to}");
    }
}
```

**Interface injection** — the object implements an interface that the container calls to inject the dependency. Rarely used in PHP; constructor injection is almost always superior.

## 26.2 The Problem: `new Dependency()` Inside a Class

When a class instantiates its own dependencies it is impossible to substitute them in tests or configuration without modifying the class itself.

```php
<?php
declare(strict_types=1);

// Poor: tightly coupled — cannot swap FileLogger for a test double
class OrderService {
    private FileLogger $logger;

    public function __construct() {
        $this->logger = new FileLogger(); // hidden dependency
    }
}
```

## 26.3 Building a Minimal Container

A container is a registry that maps identifiers to factory callables and resolves them on demand.

```php
<?php
declare(strict_types=1);

class Container {
    private array $bindings  = [];
    private array $instances = [];

    public function bind(string $id, callable $factory): void {
        $this->bindings[$id] = $factory;
    }

    public function get(string $id): mixed {
        if (isset($this->instances[$id])) {
            return $this->instances[$id];
        }
        if (!isset($this->bindings[$id])) {
            throw new \RuntimeException("No binding for: {$id}");
        }
        return ($this->bindings[$id])($this);
    }

    /** Resolve and cache — singleton scope */
    public function singleton(string $id, callable $factory): void {
        $this->bind($id, function (Container $c) use ($id, $factory) {
            if (!isset($this->instances[$id])) {
                $this->instances[$id] = $factory($c);
            }
            return $this->instances[$id];
        });
    }
}
```

## 26.4 Registering and Resolving Services

```php
<?php
declare(strict_types=1);

// (Assume Container, LoggerInterface, FileLogger, UserService from above)

$container = new Container();

$container->singleton(LoggerInterface::class, fn() => new FileLogger());

$container->bind(UserService::class, fn(Container $c) =>
    new UserService($c->get(LoggerInterface::class))
);

$service = $container->get(UserService::class);
$service->register('alice@example.com');
```

Every call to `$container->get(LoggerInterface::class)` returns the same `FileLogger` instance because it was registered with `singleton()`. There is no global state, no hidden coupling, and swapping `FileLogger` for `NullLogger` in tests requires changing exactly one `singleton()` registration.

## 26.5 PSR-11 `ContainerInterface`

PSR-11 standardises two methods — `get(string $id): mixed` and `has(string $id): bool` — so libraries can type-hint on `Psr\Container\ContainerInterface` rather than a specific implementation.

```php
<?php
declare(strict_types=1);

namespace Psr\Container;

interface ContainerInterface {
    public function get(string $id): mixed;
    public function has(string $id): bool;
}
```

Implementing PSR-11 on the container built above:

```php
<?php
declare(strict_types=1);

use Psr\Container\ContainerInterface;

class Container implements ContainerInterface {
    private array $bindings  = [];
    private array $instances = [];

    public function bind(string $id, callable $factory): void {
        $this->bindings[$id] = $factory;
    }

    public function singleton(string $id, callable $factory): void {
        $this->bind($id, function (Container $c) use ($id, $factory) {
            if (!isset($this->instances[$id])) {
                $this->instances[$id] = $factory($c);
            }
            return $this->instances[$id];
        });
    }

    public function get(string $id): mixed {
        if (isset($this->instances[$id])) {
            return $this->instances[$id];
        }
        if (!$this->has($id)) {
            throw new \RuntimeException("No binding for: {$id}");
        }
        return ($this->bindings[$id])($this);
    }

    public function has(string $id): bool {
        return isset($this->bindings[$id]) || isset($this->instances[$id]);
    }
}
```

## 26.6 Why Singleton Disappears with DI

The Singleton pattern solves a real problem — "I need exactly one instance of this service". A DI container solves the same problem without global state: register as `singleton()` and the container owns the single instance. Callers never call `Config::getInstance()`; they declare their dependency and let the container provide it. The result is injectable, replaceable, and testable.

## Key Takeaways

- Constructor injection is the default; it forces all dependencies to be declared and makes invalid states impossible.
- Never use `new ConcreteClass()` for services inside a class — inject via constructor so the class remains decoupled and testable.
- A container is just a map of identifiers to factory functions; building one from scratch demystifies Laravel's service container or Symfony's DI component.
- `singleton()` scope in a container replaces the Singleton pattern entirely — same one-instance guarantee, zero global state.
- PSR-11 (`ContainerInterface`) lets libraries depend on a container abstraction rather than a specific implementation.

## What's Next

Chapter 27 brings the Phase 4 patterns together into real architectural building blocks: Repository, Unit of Work, DTO, Value Object, the Result pattern, and Service Layer — all in pure PHP.
