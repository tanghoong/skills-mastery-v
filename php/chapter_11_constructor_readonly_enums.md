# Chapter 11 — Constructor Promotion, Readonly & Enums

> **Goal:** Write concise value objects with constructor property promotion and readonly, and model closed sets of values with PHP 8.1 enums — including backed enums with methods and interface implementations.

## 11.1 Constructor Property Promotion (PHP 8.0)

Before PHP 8.0, defining a simple value object required a property declaration, a constructor parameter, and an assignment — three places for the same information. Constructor promotion collapses all three into the constructor signature.

```php
<?php
declare(strict_types=1);

// Before PHP 8.0
class PointOld
{
    public float $x;
    public float $y;

    public function __construct(float $x, float $y)
    {
        $this->x = $x;
        $this->y = $y;
    }
}

// PHP 8.0+ with constructor promotion
class Point
{
    public function __construct(
        public float $x,
        public float $y,
    ) {}
}

$p = new Point(3.0, 4.0);
echo $p->x; // 3
```

**TypeScript analogy:** TypeScript has had this for years: `constructor(public x: number, public y: number) {}`. PHP 8.0 finally caught up with identical semantics.

## 11.2 Readonly Properties (PHP 8.1)

A `readonly` property can be assigned exactly once — during initialization. Subsequent assignments throw an `Error`. This makes value objects immutable without writing custom setter guards.

```php
<?php
declare(strict_types=1);

class Money
{
    public function __construct(
        public readonly int $amount,
        public readonly string $currency,
    ) {}
}

$price = new Money(1999, 'USD');
echo $price->amount;   // 1999
echo $price->currency; // USD

// $price->amount = 2000; // Error: Cannot modify readonly property
```

**TypeScript analogy:** TypeScript's `readonly` keyword on a property is the exact equivalent. The behavior is enforced at compile time in TypeScript; in PHP it is enforced at runtime.

## 11.3 Readonly Classes (PHP 8.2)

Rather than marking every property `readonly` individually, PHP 8.2 allows the entire class to be declared `readonly`. All promoted and explicitly declared properties become readonly automatically.

```php
<?php
declare(strict_types=1);

readonly class Coordinate
{
    public function __construct(
        public float $latitude,
        public float $longitude,
    ) {}

    public function distanceTo(Coordinate $other): float
    {
        // Haversine approximation (simplified)
        $latDiff = abs($this->latitude  - $other->latitude);
        $lonDiff = abs($this->longitude - $other->longitude);
        return sqrt($latDiff ** 2 + $lonDiff ** 2);
    }
}

$a = new Coordinate(48.8566, 2.3522);  // Paris
$b = new Coordinate(51.5074, -0.1278); // London
echo round($a->distanceTo($b), 4);     // ~3.7059 (degree units)
```

**TypeScript analogy:** TypeScript does not have a `readonly class` keyword, but the pattern is commonly approximated with `Object.freeze()` or a convention of all-readonly properties. PHP 8.2 makes it a first-class language feature.

## 11.4 Unit Enums

A unit enum is a closed set of named cases with no associated value. They are objects, not scalars — you compare them with `===`.

```php
<?php
declare(strict_types=1);

enum Direction
{
    case North;
    case South;
    case East;
    case West;
}

function move(Direction $dir): string
{
    return match ($dir) {
        Direction::North => 'Moving north',
        Direction::South => 'Moving south',
        Direction::East  => 'Moving east',
        Direction::West  => 'Moving west',
    };
}

echo move(Direction::North); // Moving north
```

**TypeScript analogy:** TypeScript's `const enum` or a plain `enum` both compile to numbers or strings. PHP unit enums are richer: they are class-like objects with no underlying scalar.

## 11.5 Backed Enums

A backed enum assigns a scalar value (`string` or `int`) to every case. This enables serialization, database storage, and API payloads.

```php
<?php
declare(strict_types=1);

enum Status: string
{
    case Active  = 'active';
    case Inactive = 'inactive';
    case Pending = 'pending';
}

// Convert from scalar
$status = Status::from('active');      // Status::Active
$maybe  = Status::tryFrom('unknown');  // null (no exception)

echo $status->value; // active
echo ($maybe === null ? 'not found' : $maybe->value); // not found
```

**TypeScript analogy:** A TypeScript string enum (`enum Status { Active = 'active' }`) is the direct equivalent. PHP's `from()` / `tryFrom()` correspond to manually written lookup functions in TypeScript.

## 11.6 Enum Methods and Interfaces

Enums can define methods and implement interfaces, making them far more powerful than traditional enum patterns.

```php
<?php
declare(strict_types=1);

interface HasLabel
{
    public function label(): string;
}

enum Status: string implements HasLabel
{
    case Active  = 'active';
    case Inactive = 'inactive';
    case Pending = 'pending';

    public function label(): string
    {
        return match ($this) {
            Status::Active   => 'Active',
            Status::Inactive => 'Inactive',
            Status::Pending  => 'Awaiting approval',
        };
    }

    public function isTerminal(): bool
    {
        return $this === Status::Inactive;
    }
}

foreach (Status::cases() as $case) {
    echo "{$case->value}: {$case->label()}" . PHP_EOL;
}
// active: Active
// inactive: Inactive
// pending: Awaiting approval
```

`Status::cases()` returns an array of all enum cases — useful for building select lists or validating input.

## Key Takeaways

- Constructor property promotion (PHP 8.0) eliminates boilerplate for simple value objects — identical to TypeScript's constructor shorthand.
- `readonly` properties (PHP 8.1) can be assigned only once; perfect for immutable value objects.
- `readonly` classes (PHP 8.2) make every property readonly without repeating the keyword.
- Unit enums are class-like objects with no underlying scalar; use `===` for comparison.
- Backed enums carry a `string` or `int` value and provide `from()` / `tryFrom()` for safe deserialization.
- Enums can implement interfaces and define methods, making them far more expressive than simple constant groups.

## What's Next

Chapter 12 explores magic methods — the special double-underscore hooks PHP calls automatically for object lifecycle events, property access, invocation, and cloning.
