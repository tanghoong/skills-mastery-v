# Chapter 19 — PHP 8.4 Features

> **Goal:** Apply PHP 8.4's property hooks, asymmetric visibility, new array functions, lazy objects, and `new` in initializers to write cleaner, more expressive class definitions.

## 19.1 Property Hooks

Property hooks let you attach `get` and `set` logic directly to a property declaration — eliminating the need for a private backing field plus explicit getter/setter methods in many common cases.

TypeScript analogy: TypeScript class accessors (`get`/`set` methods) and JavaScript private fields with accessors are the equivalent pattern.

```php
<?php
declare(strict_types=1);

class Temperature
{
    public float $celsius {
        get => $this->celsius;
        set(float $value) {
            if ($value < -273.15) {
                throw new \ValueError("Temperature below absolute zero: {$value}");
            }
            $this->celsius = $value;
        }
    }

    // A virtual (computed) property — no backing field
    public float $fahrenheit {
        get => $this->celsius * 9/5 + 32;
    }

    public function __construct(float $celsius)
    {
        $this->celsius = $celsius; // triggers the set hook
    }
}

$t = new Temperature(100.0);
echo $t->fahrenheit; // 212
$t->celsius = 0.0;
echo $t->fahrenheit; // 32
```

A property with only a `get` hook is implicitly read-only from the outside. Properties in interfaces can declare hooks, enforcing that implementing classes provide them.

## 19.2 Asymmetric Visibility

Before PHP 8.4, a property was either fully public or you needed a getter method. Asymmetric visibility lets you set separate read and write visibility:

```php
<?php
declare(strict_types=1);

class Order
{
    public private(set) string $status = 'pending';
    public private(set) int    $itemCount = 0;

    public function addItem(): void
    {
        $this->itemCount++;      // allowed — inside the class
    }

    public function ship(): void
    {
        $this->status = 'shipped'; // allowed
    }
}

$order = new Order();
echo $order->status;    // 'pending' — public read
echo $order->itemCount; // 0 — public read

// $order->status = 'shipped'; // Fatal: cannot set private(set) property from outside
$order->addItem();
echo $order->itemCount; // 1
```

The modifier syntax is `{readVisibility}({writeVisibility})`. Common patterns:

- `public private(set)` — publicly readable, privately writable
- `public protected(set)` — publicly readable, writable by class and subclasses

## 19.3 New Array Functions

PHP 8.4 adds three long-awaited array inspection functions modelled on ECMAScript's `Array.prototype.find`, `some`, and `every`:

```php
<?php
declare(strict_types=1);

$products = [
    ['name' => 'Widget', 'price' => 9.99,  'inStock' => true],
    ['name' => 'Gadget', 'price' => 49.99, 'inStock' => false],
    ['name' => 'Doohickey', 'price' => 4.99, 'inStock' => true],
];

// array_find — returns the first matching element, or null
$cheap = array_find($products, fn(array $p): bool => $p['price'] < 10.0);
echo $cheap['name']; // Widget

// array_any — returns true if at least one element matches
$hasOutOfStock = array_any($products, fn(array $p): bool => !$p['inStock']);
var_dump($hasOutOfStock); // bool(true)

// array_all — returns true only if every element matches
$allInStock = array_all($products, fn(array $p): bool => $p['inStock']);
var_dump($allInStock); // bool(false)

// array_find_key — like array_find but returns the key instead of the value
$key = array_find_key($products, fn(array $p): bool => $p['name'] === 'Gadget');
var_dump($key); // int(1)
```

TypeScript analogy: `Array.prototype.find`, `Array.prototype.some`, `Array.prototype.every` — same semantics, same order of arguments (array, callback).

## 19.4 `new` in Initializers

Before PHP 8.4, property default values had to be compile-time constants. You could not write `private Logger $log = new NullLogger()`. PHP 8.4 lifts this restriction for `new` expressions:

```php
<?php
declare(strict_types=1);

class NullLogger
{
    public function log(string $message): void {} // no-op
}

class UserService
{
    public function __construct(
        private readonly NullLogger $logger = new NullLogger(),
    ) {}

    public function createUser(string $name): void
    {
        $this->logger->log("Creating user: {$name}");
    }
}

$service = new UserService();          // uses NullLogger by default
$service->createUser('Charlie');       // no-op log

// $service = new UserService(new RealLogger()); // inject a real logger in tests
```

This works in constructor promoted properties, regular property defaults, and attribute arguments.

## 19.5 Lazy Objects

Lazy objects defer instantiation until a property or method is first accessed. PHP 8.4 adds first-class support via `ReflectionClass`:

```php
<?php
declare(strict_types=1);

class ExpensiveService
{
    public function __construct()
    {
        echo "ExpensiveService initialized!\n";
    }

    public function getData(): string
    {
        return 'data from expensive service';
    }
}

$reflector = new ReflectionClass(ExpensiveService::class);

$lazy = $reflector->newLazyGhost(function (ExpensiveService $instance): void {
    // This initializer runs only on first property/method access
    $instance->__construct();
});

echo "Lazy object created — no initialization yet\n";
echo $lazy->getData() . "\n";
// "ExpensiveService initialized!" prints here, on first access
```

Two strategies exist:
- **Ghost objects** (`newLazyGhost`) — the object is the real instance; the initializer populates it in place. Use when you control the class.
- **Proxy objects** (`newLazyProxy`) — wraps a factory that returns a real instance. Use for external/final classes.

Lazy objects are foundational to dependency injection containers and ORM identity maps.

## Key Takeaways

- Property hooks (`get`/`set`) attach validation and computation directly to a property, removing the need for manual getter/setter boilerplate.
- Asymmetric visibility (`public private(set)`) expresses read-only-from-outside intent without a getter method.
- `array_find`, `array_any`, `array_all`, and `array_find_key` fill a long-standing gap; their signatures mirror JavaScript's equivalents.
- `new` in initializers enables clean default values like `new NullLogger()` without constructor body assignments.
- Lazy objects via `ReflectionClass::newLazyGhost()` provide transparent deferred initialization useful in DI containers.

## What's Next

Chapter 20 covers PHP 8.5 features, including the confirmed pipe operator `|>`, new standard library additions, and an appendix of tracked RFCs to watch.
