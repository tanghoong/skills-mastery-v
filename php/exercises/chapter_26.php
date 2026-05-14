<?php
declare(strict_types=1);
/**
 * Chapter 26 — Dependency Injection
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_26.php
 */

// ── TODO 1: Minimal Container ─────────────────────────────────────────────────
// Build a Container class with:
//   bind(string $id, callable $factory): void
//     — registers a factory; the callable receives the Container as its argument
//   get(string $id): mixed
//     — resolves the binding; throws \RuntimeException if not found
//
// The container itself is passed to each factory so factories can resolve
// their own dependencies via $container->get(...).

// YOUR CODE HERE
// class Container {
//     public function bind(string $id, callable $factory): void { ... }
//     public function get(string $id): mixed { ... }
// }

// Demonstration (basic — no singleton scope yet):
// $c = new Container();
// $c->bind('greeting', fn() => 'Hello, World!');
// echo $c->get('greeting') . PHP_EOL; // Hello, World!


// ── TODO 2: Constructor Injection vs Internal new ─────────────────────────────
// Show the anti-pattern first, then the correct approach.
//
// Anti-pattern: PoorOrderService creates FileLogger internally.
//   Problem: impossible to test without writing to the real filesystem.
//
// Correct: GoodOrderService accepts LoggerInterface via constructor.
//   Benefit: inject NullLogger in tests, FileLogger in production.
//
// LoggerInterface: log(string $message): void
// FileLogger: logs with prefix "[file]"
// NullLogger: does nothing (useful in tests)

// YOUR CODE HERE
// interface LoggerInterface { ... }
// class FileLogger implements LoggerInterface { ... }
// class NullLogger implements LoggerInterface { ... }
//
// class PoorOrderService {
//     public function __construct() {
//         $this->logger = new FileLogger(); // anti-pattern
//     }
//     public function place(int $id): void { ... }
// }
//
// class GoodOrderService {
//     public function __construct(private readonly LoggerInterface $logger) {}
//     public function place(int $id): void { ... }
// }

// Demonstration:
// $prod = new GoodOrderService(new FileLogger());
// $prod->place(1);
//
// $test = new GoodOrderService(new NullLogger()); // no file writes in tests
// $test->place(2);


// ── TODO 3: Register and Resolve via Container ────────────────────────────────
// Using the Container from TODO 1 and the classes from TODO 2:
//   1. Bind LoggerInterface::class -> FileLogger (transient, new instance each time)
//   2. Bind UserService::class -> closure that gets LoggerInterface from container
//      and injects it into UserService
//
// UserService:
//   - Constructor: LoggerInterface $logger
//   - register(string $email): void — calls $logger->log("Registered: {email}")

// YOUR CODE HERE
// class UserService {
//     public function __construct(private readonly LoggerInterface $logger) {}
//     public function register(string $email): void { ... }
// }

// Demonstration:
// $container = new Container();
// $container->bind(LoggerInterface::class, fn() => new FileLogger());
// $container->bind(UserService::class, fn(Container $c) =>
//     new UserService($c->get(LoggerInterface::class))
// );
// $service = $container->get(UserService::class);
// $service->register('alice@example.com');


// ── TODO 4: Singleton Scope ───────────────────────────────────────────────────
// Extend your Container with:
//   singleton(string $id, callable $factory): void
//     — like bind(), but the resolved instance is cached;
//       every call to get($id) returns the same object.
//
// Verify that two calls to get(LoggerInterface::class) return the same instance.

// YOUR CODE HERE — add singleton() to Container

// Demonstration:
// $c = new Container();
// $c->singleton(LoggerInterface::class, fn() => new FileLogger());
// $a = $c->get(LoggerInterface::class);
// $b = $c->get(LoggerInterface::class);
// var_dump($a === $b); // true


// ── TODO 5: PSR-11 ContainerInterface ────────────────────────────────────────
// PSR-11 defines two methods that a standards-compliant container must implement:
//   get(string $id): mixed
//   has(string $id): bool   — returns true if a binding or cached instance exists
//
// Since we cannot install the psr/container package here, define a local
// ContainerInterface in a Container namespace, then make your Container implement it.
//
// After implementing has():
//   - has('something') before binding -> false
//   - has('something') after binding  -> true
//   - has('something') after resolving singleton -> true (cached in instances)

// YOUR CODE HERE
// namespace Container;
// interface ContainerInterface {
//     public function get(string $id): mixed;
//     public function has(string $id): bool;
// }
//
// Or define it in global namespace and update your Container class to implement it.

// Demonstration:
// $c = new Container();
// var_dump($c->has(LoggerInterface::class));  // false
// $c->singleton(LoggerInterface::class, fn() => new FileLogger());
// var_dump($c->has(LoggerInterface::class));  // true
// $c->get(LoggerInterface::class);
// var_dump($c->has(LoggerInterface::class));  // true (also in instances cache)

echo PHP_EOL . "All TODOs complete!" . PHP_EOL;
