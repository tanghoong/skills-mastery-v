# Chapter 21 — Design Principles

> **Goal:** Understand and apply the foundational principles that guide maintainable, extensible PHP code.

## 21.1 SOLID — Single Responsibility Principle (SRP)

A class should have one reason to change. When a class handles persistence, email delivery, and logging simultaneously, any change to any concern forces you to retest all three.

```php
<?php
declare(strict_types=1);

// Violation: one class, three reasons to change
class UserManager {
    public function save(array $data): void { /* writes to DB */ }
    public function sendWelcomeEmail(string $email): void { /* sends SMTP */ }
    public function log(string $message): void { /* writes to file */ }
}

// Correct: each class owns one concern
class UserRepository {
    public function save(array $data): void { /* writes to DB */ }
}

class Mailer {
    public function sendWelcome(string $to): void { /* sends SMTP */ }
}

class FileLogger {
    public function info(string $message): void { /* writes to file */ }
}
```

## 21.2 SOLID — Open/Closed Principle (OCP)

Software entities should be open for extension but closed for modification. Add behaviour by writing new code, not by editing existing, tested code.

```php
<?php
declare(strict_types=1);

interface DiscountStrategy {
    public function apply(float $price): float;
}

class PercentageDiscount implements DiscountStrategy {
    public function __construct(private readonly float $percent) {}
    public function apply(float $price): float {
        return $price * (1 - $this->percent / 100);
    }
}

// Adding a new discount type requires no changes to existing classes
class FlatDiscount implements DiscountStrategy {
    public function __construct(private readonly float $amount) {}
    public function apply(float $price): float {
        return max(0.0, $price - $this->amount);
    }
}

class PriceCalculator {
    public function calculate(float $price, DiscountStrategy $discount): float {
        return $discount->apply($price);
    }
}
```

## 21.3 SOLID — Liskov Substitution Principle (LSP)

Subtypes must be substitutable for their base types without altering the correctness of the program. A classic violation is `Square extends Rectangle` — setting width also sets height, breaking callers that expect independent dimensions.

```php
<?php
declare(strict_types=1);

// Fix: use a shared abstraction instead of inheritance
interface Shape {
    public function area(): float;
}

class Rectangle implements Shape {
    public function __construct(
        private float $width,
        private float $height
    ) {}
    public function area(): float { return $this->width * $this->height; }
}

class Square implements Shape {
    public function __construct(private float $side) {}
    public function area(): float { return $this->side ** 2; }
}

// Any caller typed to Shape works correctly with both
function printArea(Shape $shape): void {
    echo $shape->area() . PHP_EOL;
}
```

## 21.4 SOLID — Interface Segregation Principle (ISP)

Clients should not be forced to depend on interfaces they do not use. A fat interface forces implementing classes to provide stub methods for capabilities they do not support.

```php
<?php
declare(strict_types=1);

// Violation: a ReadOnlyCache must stub write methods
interface Cache {
    public function get(string $key): mixed;
    public function set(string $key, mixed $value): void;
    public function delete(string $key): void;
    public function flush(): void;
}

// Segregated
interface CacheReader {
    public function get(string $key): mixed;
}

interface CacheWriter {
    public function set(string $key, mixed $value): void;
    public function delete(string $key): void;
}

interface CacheFlusher {
    public function flush(): void;
}

class RedisCache implements CacheReader, CacheWriter, CacheFlusher {
    public function get(string $key): mixed { return null; }
    public function set(string $key, mixed $value): void {}
    public function delete(string $key): void {}
    public function flush(): void {}
}

class InMemoryReadCache implements CacheReader {
    private array $store = [];
    public function get(string $key): mixed { return $this->store[$key] ?? null; }
}
```

## 21.5 SOLID — Dependency Inversion Principle (DIP)

High-level modules should not depend on low-level modules. Both should depend on abstractions. Depend on interfaces, not concrete classes.

```php
<?php
declare(strict_types=1);

interface LoggerInterface {
    public function log(string $message): void;
}

class FileLogger implements LoggerInterface {
    public function log(string $message): void {
        file_put_contents('/tmp/app.log', $message . PHP_EOL, FILE_APPEND);
    }
}

// OrderService depends on an abstraction, not FileLogger directly
class OrderService {
    public function __construct(private readonly LoggerInterface $logger) {}

    public function place(int $orderId): void {
        // business logic...
        $this->logger->log("Order {$orderId} placed.");
    }
}

$service = new OrderService(new FileLogger());
$service->place(42);
```

## 21.6 DRY, KISS, YAGNI

**DRY (Don't Repeat Yourself):** Every piece of knowledge should have a single authoritative representation. Duplicated business rules drift apart and cause bugs.

**KISS (Keep It Simple, Stupid):** Prefer the simplest solution that works. Complexity is a liability; add it only when the problem demands it.

**YAGNI (You Aren't Gonna Need It):** Do not implement features until they are actually needed. Speculative generality increases maintenance cost for zero current benefit.

## 21.7 Law of Demeter & Separation of Concerns

The **Law of Demeter** (principle of least knowledge) says a method should only call methods on: itself, its parameters, objects it creates, or direct component objects. Chaining through multiple layers (`$order->getCustomer()->getAddress()->getCity()`) creates tight coupling.

**Separation of Concerns** groups related behaviour together and keeps unrelated behaviour apart. A controller should not contain SQL; a model should not render HTML.

```php
<?php
declare(strict_types=1);

// Demeter violation — controller reaches through three objects
// $city = $order->getCustomer()->getAddress()->getCity();

// Fix — expose what callers need directly
class Order {
    public function __construct(private readonly Customer $customer) {}
    public function shippingCity(): string {
        return $this->customer->city();
    }
}
```

## Key Takeaways

- SRP: one class, one reason to change — split concerns into focused classes.
- OCP: extend via new classes/interfaces, never by editing stable code.
- LSP: subtypes must honour the contract of their base type — prefer shared interfaces over fragile inheritance.
- ISP: keep interfaces narrow; clients should not implement methods they do not use.
- DIP: depend on abstractions; inject concrete implementations from the outside.
- DRY, KISS, YAGNI: eliminate duplication, resist complexity, and build only what is needed today.

## What's Next

Chapter 22 applies these principles to the Creational design patterns — Factory Method, Builder, Prototype, and Singleton — showing how well-designed object construction avoids tight coupling from the start.
