# Chapter 23 — Structural Patterns

> **Goal:** Learn how Adapter, Decorator, Facade, Proxy, and Composite reorganise existing objects into larger, more capable structures.

## 23.1 Adapter (Class & Object)

Adapter translates one interface into another. The **object adapter** wraps an instance (composition); the **class adapter** uses multiple inheritance — PHP only supports single class inheritance, so object adapters are the idiomatic choice.

```php
<?php
declare(strict_types=1);

// Modern interface callers expect
interface LoggerInterface {
    public function log(string $level, string $message): void;
}

// Legacy class we cannot modify
class XmlLogger {
    public function writeXml(string $xml): void {
        echo $xml . PHP_EOL;
    }
}

// Object Adapter: wraps XmlLogger, implements LoggerInterface
class XmlLoggerAdapter implements LoggerInterface {
    public function __construct(private readonly XmlLogger $legacy) {}

    public function log(string $level, string $message): void {
        $xml = "<log level=\"{$level}\">{$message}</log>";
        $this->legacy->writeXml($xml);
    }
}

$logger = new XmlLoggerAdapter(new XmlLogger());
$logger->log('info', 'Application started');
```

## 23.2 Decorator

Decorator attaches additional behaviour to an object dynamically by wrapping it in another object that implements the same interface. It is the composable alternative to subclassing.

The PSR-15 middleware pattern is a real-world PHP application of Decorator: each middleware wraps the next handler, adding cross-cutting behaviour like authentication or caching.

```php
<?php
declare(strict_types=1);

interface UserRepositoryInterface {
    public function findById(int $id): ?array;
}

class DatabaseUserRepository implements UserRepositoryInterface {
    public function findById(int $id): ?array {
        // Simulate DB call
        return ['id' => $id, 'name' => 'Alice'];
    }
}

class CachingUserRepository implements UserRepositoryInterface {
    private array $cache = [];

    public function __construct(private readonly UserRepositoryInterface $inner) {}

    public function findById(int $id): ?array {
        if (!isset($this->cache[$id])) {
            $this->cache[$id] = $this->inner->findById($id);
        }
        return $this->cache[$id];
    }
}

$repo = new CachingUserRepository(new DatabaseUserRepository());
$user = $repo->findById(1); // hits DB
$user = $repo->findById(1); // served from cache
```

## 23.3 Facade

Facade provides a simple, unified interface over a complex subsystem. Laravel's facades are the most prominent PHP example — they expose a tidy static API backed by the service container.

```php
<?php
declare(strict_types=1);

class StripeGateway {
    public function charge(string $token, int $amountCents): bool {
        echo "Stripe: charging {$amountCents} cents via token {$token}" . PHP_EOL;
        return true;
    }
}

class FraudDetector {
    public function isSafe(string $token): bool { return true; }
}

class ReceiptMailer {
    public function send(string $email, int $amountCents): void {
        echo "Mailer: receipt sent to {$email}" . PHP_EOL;
    }
}

class PaymentFacade {
    private StripeGateway $gateway;
    private FraudDetector $fraud;
    private ReceiptMailer $mailer;

    public function __construct() {
        $this->gateway = new StripeGateway();
        $this->fraud   = new FraudDetector();
        $this->mailer  = new ReceiptMailer();
    }

    public function charge(string $token, string $email, int $amountCents): bool {
        if (!$this->fraud->isSafe($token)) {
            return false;
        }
        $success = $this->gateway->charge($token, $amountCents);
        if ($success) {
            $this->mailer->send($email, $amountCents);
        }
        return $success;
    }
}

$facade = new PaymentFacade();
$facade->charge('tok_visa', 'alice@example.com', 4999);
```

## 23.4 Proxy (Lazy-load & Access Control)

Proxy controls access to another object. A **virtual proxy** defers expensive object creation until it is actually used; an **protection proxy** enforces access rules.

```php
<?php
declare(strict_types=1);

interface ReportGeneratorInterface {
    public function generate(): string;
}

class HeavyReportGenerator implements ReportGeneratorInterface {
    public function __construct() {
        // Imagine expensive DB queries here
        echo "HeavyReportGenerator: initialised" . PHP_EOL;
    }

    public function generate(): string {
        return 'Report data...';
    }
}

class LazyReportProxy implements ReportGeneratorInterface {
    private ?HeavyReportGenerator $real = null;

    public function generate(): string {
        if ($this->real === null) {
            $this->real = new HeavyReportGenerator(); // created only on first use
        }
        return $this->real->generate();
    }
}

$proxy = new LazyReportProxy(); // nothing expensive happens yet
echo $proxy->generate();        // HeavyReportGenerator initialised here
```

## 23.5 Composite (Tree Structures)

Composite lets you treat individual objects and compositions of objects uniformly. It models part-whole hierarchies — file system trees, UI widget trees, and menu structures.

```php
<?php
declare(strict_types=1);

interface FileSystemNode {
    public function name(): string;
    public function size(): int;
}

class File implements FileSystemNode {
    public function __construct(
        private readonly string $filename,
        private readonly int $bytes
    ) {}

    public function name(): string { return $this->filename; }
    public function size(): int   { return $this->bytes; }
}

class Folder implements FileSystemNode {
    /** @var FileSystemNode[] */
    private array $children = [];

    public function __construct(private readonly string $dirname) {}

    public function add(FileSystemNode $node): void {
        $this->children[] = $node;
    }

    public function name(): string { return $this->dirname; }

    public function size(): int {
        return array_sum(array_map(fn($c) => $c->size(), $this->children));
    }
}

$root = new Folder('/');
$src  = new Folder('src');
$src->add(new File('app.php', 1024));
$src->add(new File('config.php', 512));
$root->add($src);
$root->add(new File('README.md', 256));

echo $root->size() . PHP_EOL; // 1792
```

## Key Takeaways

- Adapter bridges incompatible interfaces using composition — prefer object adapter over class adapter in PHP.
- Decorator adds behaviour by wrapping objects that share the same interface; it is the composable alternative to subclassing.
- Facade simplifies a complex subsystem behind a single, readable entry point.
- Proxy intercepts access to an object to add lazy-loading, caching, or access control without changing client code.
- Composite enables uniform treatment of leaf objects and containers in tree structures.

## What's Next

Chapter 24 covers the first half of Behavioural patterns — Strategy, Observer, Command, Chain of Responsibility, and Iterator — which define how objects communicate and divide responsibilities at runtime.
