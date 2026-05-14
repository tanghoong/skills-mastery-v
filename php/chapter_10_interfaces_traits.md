# Chapter 10 — Interfaces & Traits

> **Goal:** Define capability contracts with interfaces, implement multiple interfaces on a single class, share concrete behaviour across unrelated classes with traits, and resolve trait method conflicts cleanly.

## 10.1 Defining and Implementing an Interface

A PHP interface is a pure capability contract: method signatures and constants, no implementation, no state. A class implements an interface using `implements`.

```php
<?php
declare(strict_types=1);

interface Serializable
{
    public function serialize(): string;
    public function unserialize(string $data): void;
}

class JsonDocument implements Serializable
{
    private array $data = [];

    public function serialize(): string
    {
        return json_encode($this->data, JSON_THROW_ON_ERROR);
    }

    public function unserialize(string $data): void
    {
        $this->data = json_decode($data, true, 512, JSON_THROW_ON_ERROR);
    }
}
```

**TypeScript analogy:** PHP interfaces map almost exactly to TypeScript interfaces used with `implements`. The difference is that PHP enforces interface compliance at runtime, not just at compile time.

## 10.2 Implementing Multiple Interfaces

A class can implement any number of interfaces separated by commas. This is PHP's primary form of multiple inheritance for types.

```php
<?php
declare(strict_types=1);

interface Loggable
{
    public function log(): void;
}

interface Cacheable
{
    public function cacheKey(): string;
}

class UserProfile implements Loggable, Cacheable
{
    public function __construct(private int $id, private string $name) {}

    public function log(): void
    {
        echo "UserProfile({$this->id}) accessed" . PHP_EOL;
    }

    public function cacheKey(): string
    {
        return "user_profile_{$this->id}";
    }
}

function renderCacheable(Cacheable $item): void
{
    echo "Cache key: " . $item->cacheKey() . PHP_EOL;
}

$profile = new UserProfile(42, 'Alice');
$profile->log();
renderCacheable($profile);
```

## 10.3 Interfaces Extending Interfaces

Interfaces can extend other interfaces, composing capability sets.

```php
<?php
declare(strict_types=1);

interface Readable
{
    public function read(): string;
}

interface Writable
{
    public function write(string $content): void;
}

interface ReadWritable extends Readable, Writable {}

class FileStream implements ReadWritable
{
    private string $buffer = '';

    public function read(): string
    {
        return $this->buffer;
    }

    public function write(string $content): void
    {
        $this->buffer .= $content;
    }
}
```

## 10.4 Traits — Horizontal Code Reuse

A trait is a mechanism for code reuse that does not create an inheritance relationship. Think of it as a mixin: you can drop concrete methods and properties into any class, regardless of its position in the hierarchy.

```php
<?php
declare(strict_types=1);

trait Timestampable
{
    private ?DateTimeImmutable $createdAt = null;
    private ?DateTimeImmutable $updatedAt = null;

    public function touch(): void
    {
        $now = new DateTimeImmutable();
        if ($this->createdAt === null) {
            $this->createdAt = $now;
        }
        $this->updatedAt = $now;
    }

    public function getCreatedAt(): ?DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?DateTimeImmutable
    {
        return $this->updatedAt;
    }
}

class Article
{
    use Timestampable;

    public function __construct(public string $title) {}
}

$article = new Article('Hello World');
$article->touch();
echo $article->getCreatedAt()?->format('Y-m-d H:i:s') . PHP_EOL;
```

**TypeScript analogy:** TypeScript has no direct equivalent for traits. The closest pattern is a mixin function that copies methods onto a prototype, but PHP's `use` keyword is far cleaner.

## 10.5 Using Multiple Traits

A class can `use` multiple traits. If two traits define a method with the same name, PHP raises a fatal error unless you resolve the conflict explicitly.

```php
<?php
declare(strict_types=1);

trait HasLogger
{
    public function log(string $msg): void
    {
        echo "[HasLogger] $msg" . PHP_EOL;
    }
}

trait HasAudit
{
    public function log(string $msg): void
    {
        echo "[HasAudit] $msg" . PHP_EOL;
    }
}

class OrderService
{
    use HasLogger, HasAudit {
        HasLogger::log insteadof HasAudit; // use HasLogger's log
        HasAudit::log   as auditLog;       // still access HasAudit's log under a new name
    }
}

$svc = new OrderService();
$svc->log('Order placed');    // [HasLogger] Order placed
$svc->auditLog('Order placed'); // [HasAudit] Order placed
```

## 10.6 Trait Constants (PHP 8.2)

Since PHP 8.2, traits can define constants. The constant is available through any class that uses the trait.

```php
<?php
declare(strict_types=1);

trait HasTimezone
{
    public const string DEFAULT_TIMEZONE = 'UTC';

    public function currentTime(): string
    {
        $tz = new DateTimeZone(self::DEFAULT_TIMEZONE);
        return (new DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');
    }
}

class EventScheduler
{
    use HasTimezone;
}

echo EventScheduler::DEFAULT_TIMEZONE . PHP_EOL; // UTC
echo (new EventScheduler())->currentTime() . PHP_EOL;
```

## 10.7 The Servant Pattern via Traits

Traits are ideal for the Servant pattern: a cross-cutting behaviour (logging, validation, serialization) that serves many unrelated classes.

```php
<?php
declare(strict_types=1);

trait JsonSerializable
{
    public function toJson(): string
    {
        return json_encode(get_object_vars($this), JSON_THROW_ON_ERROR);
    }
}

class Product
{
    use JsonSerializable;
    public function __construct(public string $name, public float $price) {}
}

class Order
{
    use JsonSerializable;
    public function __construct(public int $id, public string $status) {}
}

echo (new Product('Widget', 9.99))->toJson() . PHP_EOL;
echo (new Order(1, 'pending'))->toJson() . PHP_EOL;
```

## Key Takeaways

- Interfaces define pure capability contracts; a class can implement many interfaces.
- Interfaces can extend other interfaces to compose capabilities.
- Traits inject concrete methods and properties into any class via `use` — no inheritance relationship is created.
- Conflict resolution uses `insteadof` to pick one trait's method and `as` to alias the other.
- PHP 8.2 added constants to traits, accessible through any using class.
- The Servant pattern via traits avoids code duplication for cross-cutting concerns.

## What's Next

Chapter 11 covers PHP 8.0–8.2 quality-of-life features: constructor property promotion, readonly properties, readonly classes, and first-class enums.
