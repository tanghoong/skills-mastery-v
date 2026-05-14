# Chapter 22 — Creational Patterns

> **Goal:** Master the five canonical creational patterns and understand when each one earns its complexity.

## 22.1 Factory Method

Factory Method defines an interface for creating an object but lets subclasses decide which class to instantiate. In PHP you often see this as a static named constructor or a dedicated factory class keyed on a type string.

```php
<?php
declare(strict_types=1);

interface NotifierInterface {
    public function send(string $message): void;
}

class EmailNotifier implements NotifierInterface {
    public function send(string $message): void {
        echo "[Email] {$message}" . PHP_EOL;
    }
}

class SmsNotifier implements NotifierInterface {
    public function send(string $message): void {
        echo "[SMS] {$message}" . PHP_EOL;
    }
}

class NotifierFactory {
    public static function create(string $type): NotifierInterface {
        return match ($type) {
            'email' => new EmailNotifier(),
            'sms'   => new SmsNotifier(),
            default => throw new \InvalidArgumentException("Unknown notifier: {$type}"),
        };
    }
}

$notifier = NotifierFactory::create('email');
$notifier->send('Your order has shipped.');
```

The factory method centralises object creation. Adding a new channel means adding one `case` — no callers change.

## 22.2 Abstract Factory

Abstract Factory groups related factories behind a common interface, ensuring that objects from the same "family" are always used together (e.g., all dark-theme UI components or all PostgreSQL database objects).

```php
<?php
declare(strict_types=1);

interface Button { public function render(): string; }
interface Checkbox { public function render(): string; }

class DarkButton implements Button {
    public function render(): string { return '<button class="dark">Click</button>'; }
}
class DarkCheckbox implements Checkbox {
    public function render(): string { return '<input type="checkbox" class="dark">'; }
}

class LightButton implements Button {
    public function render(): string { return '<button class="light">Click</button>'; }
}
class LightCheckbox implements Checkbox {
    public function render(): string { return '<input type="checkbox" class="light">'; }
}

interface ThemeFactory {
    public function createButton(): Button;
    public function createCheckbox(): Checkbox;
}

class DarkThemeFactory implements ThemeFactory {
    public function createButton(): Button { return new DarkButton(); }
    public function createCheckbox(): Checkbox { return new DarkCheckbox(); }
}

class LightThemeFactory implements ThemeFactory {
    public function createButton(): Button { return new LightButton(); }
    public function createCheckbox(): Checkbox { return new LightCheckbox(); }
}
```

## 22.3 Builder (Fluent Interface)

Builder separates the construction of a complex object from its representation. A fluent interface (each setter returns `$this`) lets callers compose the object in readable, chainable steps.

```php
<?php
declare(strict_types=1);

class QueryBuilder {
    private string $table = '';
    private array $columns = ['*'];
    private array $conditions = [];

    public function select(string ...$columns): static {
        $this->columns = $columns;
        return $this;
    }

    public function from(string $table): static {
        $this->table = $table;
        return $this;
    }

    public function where(string $condition): static {
        $this->conditions[] = $condition;
        return $this;
    }

    public function build(): string {
        $cols  = implode(', ', $this->columns);
        $sql   = "SELECT {$cols} FROM {$this->table}";
        if ($this->conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $this->conditions);
        }
        return $sql;
    }
}

$sql = (new QueryBuilder())
    ->select('id', 'email')
    ->from('users')
    ->where('active = 1')
    ->where('age > 18')
    ->build();

echo $sql . PHP_EOL;
// SELECT id, email FROM users WHERE active = 1 AND age > 18
```

## 22.4 Prototype (`clone`)

Prototype creates new objects by copying an existing instance. PHP's `clone` keyword performs a shallow copy; override `__clone()` to deep-copy nested objects.

```php
<?php
declare(strict_types=1);

class Page {
    public function __construct(public string $content) {}
}

class Document {
    /** @param Page[] $pages */
    public function __construct(
        public string $title,
        public array $pages = []
    ) {}

    public function __clone() {
        // Deep copy — each cloned document gets independent Page objects
        $this->pages = array_map(fn(Page $p) => clone $p, $this->pages);
    }
}

$original = new Document('Annual Report', [new Page('Introduction'), new Page('Financials')]);
$copy     = clone $original;
$copy->title = 'Draft Copy';
$copy->pages[0]->content = 'DRAFT Introduction';

echo $original->pages[0]->content . PHP_EOL; // Introduction (unchanged)
echo $copy->pages[0]->content . PHP_EOL;     // DRAFT Introduction
```

## 22.5 Singleton

Singleton ensures only one instance of a class exists per process. In PHP this is sometimes used for configuration registries or connection pools.

> **Note:** Singleton is a well-known anti-pattern when it hides global state and makes testing hard. In modern PHP applications, prefer a **DI container** configured with singleton scope (one instance shared per container lifetime). The example below is illustrative — reach for a container instead.

```php
<?php
declare(strict_types=1);

class Config {
    private static ?self $instance = null;
    private array $data = [];

    private function __construct() {}
    private function __clone() {}

    public static function getInstance(): static {
        if (static::$instance === null) {
            static::$instance = new static();
        }
        return static::$instance;
    }

    public function set(string $key, mixed $value): void {
        $this->data[$key] = $value;
    }

    public function get(string $key, mixed $default = null): mixed {
        return $this->data[$key] ?? $default;
    }
}

$config = Config::getInstance();
$config->set('debug', true);
echo var_export(Config::getInstance()->get('debug'), true) . PHP_EOL; // true
```

## Key Takeaways

- Factory Method centralises object creation behind a single call; swap implementations without touching callers.
- Abstract Factory guarantees consistent "families" of related objects.
- Builder with a fluent interface is ideal for objects requiring many optional parameters.
- `clone` + `__clone()` implements Prototype; always override `__clone()` when nested objects must be independent.
- Singleton ensures one instance per process — but prefer DI container singleton scope in real applications to avoid hidden global state and untestable code.

## What's Next

Chapter 23 covers Structural patterns — Adapter, Decorator, Facade, Proxy, and Composite — which organise existing objects into larger, more useful structures without changing their core behaviour.
