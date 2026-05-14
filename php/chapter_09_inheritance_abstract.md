# Chapter 9 — Inheritance & Abstract Classes

> **Goal:** Build class hierarchies with `extends`, call parent implementations with `parent::`, prevent unwanted overrides with `final`, and enforce contracts with abstract classes and methods.

## 9.1 Extending a Class

PHP uses `extends` exactly like TypeScript. A child class inherits all `public` and `protected` members of the parent.

```php
<?php
declare(strict_types=1);

class Animal
{
    public function __construct(protected string $name) {}

    public function speak(): string
    {
        return "{$this->name} makes a sound.";
    }
}

class Dog extends Animal
{
    public function speak(): string
    {
        return "{$this->name} barks.";
    }
}

$dog = new Dog('Rex');
echo $dog->speak(); // Rex barks.
```

**TypeScript analogy:** `class Dog extends Animal` is identical syntax. The key difference is that PHP does not require calling `super()` in a child constructor unless the child defines its own constructor.

## 9.2 Calling the Parent with `parent::`

When you override a method but still want the parent implementation, use `parent::methodName()`. For constructors, use `parent::__construct()`.

```php
<?php
declare(strict_types=1);

class Vehicle
{
    public function __construct(
        protected string $make,
        protected int $year
    ) {}

    public function describe(): string
    {
        return "{$this->year} {$this->make}";
    }
}

class ElectricVehicle extends Vehicle
{
    public function __construct(
        string $make,
        int $year,
        private int $rangeKm
    ) {
        parent::__construct($make, $year);
    }

    public function describe(): string
    {
        return parent::describe() . " (EV, {$this->rangeKm}km range)";
    }
}

$ev = new ElectricVehicle('Tesla', 2024, 500);
echo $ev->describe(); // 2024 Tesla (EV, 500km range)
```

**TypeScript analogy:** `super()` and `super.methodName()` in TypeScript map directly to `parent::__construct()` and `parent::methodName()` in PHP.

## 9.3 Preventing Overrides with `final`

Mark a method `final` to prevent child classes from overriding it. Mark the entire class `final` to prevent it from being extended at all.

```php
<?php
declare(strict_types=1);

class Template
{
    // Subclasses must override this
    protected function step(): string
    {
        return 'base step';
    }

    // Subclasses cannot override this — it owns the algorithm
    final public function run(): string
    {
        return 'Running: ' . $this->step();
    }
}

class ConcreteTemplate extends Template
{
    protected function step(): string
    {
        return 'concrete step';
    }
    // Trying to override run() here would cause a fatal error
}

$t = new ConcreteTemplate();
echo $t->run(); // Running: concrete step
```

## 9.4 Abstract Classes and Methods

An abstract class cannot be instantiated directly. It may contain a mix of concrete methods and abstract method signatures that subclasses must implement. This pattern is identical in TypeScript.

```php
<?php
declare(strict_types=1);

abstract class Shape
{
    // Must be implemented by every concrete subclass
    abstract public function area(): float;

    // Concrete method shared by all shapes
    final public function describe(): string
    {
        return get_class($this) . ' with area ' . round($this->area(), 2);
    }
}

class Circle extends Shape
{
    public function __construct(private float $radius) {}

    public function area(): float
    {
        return M_PI * $this->radius ** 2;
    }
}

class Rectangle extends Shape
{
    public function __construct(
        private float $width,
        private float $height
    ) {}

    public function area(): float
    {
        return $this->width * $this->height;
    }
}

$shapes = [new Circle(5.0), new Rectangle(4.0, 6.0)];

foreach ($shapes as $shape) {
    echo $shape->describe() . PHP_EOL;
}
// Circle with area 78.54
// Rectangle with area 24
```

**TypeScript analogy:** `abstract class Shape { abstract area(): number; }` is the direct equivalent. PHP requires the `abstract` keyword on both the class and each unimplemented method.

## 9.5 Abstract Classes vs Interfaces

Abstract classes can hold state (properties) and provide concrete implementations; interfaces cannot (until traits are involved — see Chapter 10). Use an abstract class when your subtypes share real implementation, and an interface when you only want to describe a capability contract.

```php
<?php
declare(strict_types=1);

abstract class Logger
{
    private array $history = [];

    // Shared implementation — writes to history
    public function log(string $message): void
    {
        $this->history[] = $message;
        $this->write($message);
    }

    // Subclasses decide how to actually write
    abstract protected function write(string $message): void;

    public function getHistory(): array
    {
        return $this->history;
    }
}

class ConsoleLogger extends Logger
{
    protected function write(string $message): void
    {
        echo "[LOG] $message" . PHP_EOL;
    }
}

$logger = new ConsoleLogger();
$logger->log('Application started');
$logger->log('User logged in');
print_r($logger->getHistory());
```

## Key Takeaways

- `extends` works the same as in TypeScript; one class can extend exactly one parent.
- Use `parent::__construct()` and `parent::methodName()` to call parent implementations — equivalent to TypeScript's `super()` and `super.method()`.
- `final` on a method prevents override; `final` on a class prevents extension entirely.
- Abstract classes define a partial implementation; abstract methods are a compile-time contract for subclasses.
- Abstract classes hold state and shared logic; interfaces are pure contracts — choose based on whether shared implementation exists.
- Polymorphism works naturally: loop over `Shape[]` and call `area()` without knowing the concrete type.

## What's Next

Chapter 10 introduces interfaces and traits — PHP's answer to multiple inheritance — and shows how traits enable code reuse across unrelated class hierarchies.
