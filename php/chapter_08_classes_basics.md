# Chapter 8 — Classes Basics

> **Goal:** Define classes with properties, methods, visibility modifiers, static members, class constants, and understand late static binding so you can model real-world entities in PHP.

## 8.1 Defining a Class

A PHP class looks almost identical to a TypeScript class. The primary difference is that properties must be declared with a visibility keyword, and every instance variable is referenced through `$this`.

```php
<?php
declare(strict_types=1);

class BankAccount
{
    private float $balance;

    public function __construct(float $initialBalance = 0.0)
    {
        $this->balance = $initialBalance;
    }

    public function deposit(float $amount): void
    {
        $this->balance += $amount;
    }

    public function getBalance(): float
    {
        return $this->balance;
    }
}

$account = new BankAccount(100.0);
$account->deposit(50.0);
echo $account->getBalance(); // 150
```

**TypeScript analogy:** `private float $balance` is the same as `private balance: number` in TypeScript. PHP has no shorthand property declaration outside of constructor promotion (Chapter 11).

## 8.2 Visibility: public, protected, private

| Modifier    | Accessible from              |
|-------------|------------------------------|
| `public`    | Anywhere                     |
| `protected` | Class itself and subclasses  |
| `private`   | Class itself only            |

```php
<?php
declare(strict_types=1);

class Person
{
    public string $name;
    protected int $age;
    private string $ssn;

    public function __construct(string $name, int $age, string $ssn)
    {
        $this->name = $name;
        $this->age  = $age;
        $this->ssn  = $ssn;
    }
}
```

## 8.3 Static Properties and Methods

Static members belong to the class, not to any instance. Use `self::` to reference them from within the class.

```php
<?php
declare(strict_types=1);

class Counter
{
    private static int $count = 0;

    public function __construct()
    {
        self::$count++;
    }

    public static function getCount(): int
    {
        return self::$count;
    }
}

new Counter();
new Counter();
echo Counter::getCount(); // 2
```

**TypeScript analogy:** `static count: number = 0` translates directly. PHP uses `ClassName::$property` for access from outside.

## 8.4 Class Constants

Constants are defined with `const` and accessed via `ClassName::CONSTANT` or `self::CONSTANT` inside the class. They are always public by default but can have explicit visibility since PHP 7.1.

```php
<?php
declare(strict_types=1);

class MathHelper
{
    public const float PI = 3.14159265358979;
    protected const int MAX_ITERATIONS = 1000;

    public static function circleArea(float $r): float
    {
        return self::PI * $r * $r;
    }
}

echo MathHelper::PI;                    // 3.14159265358979
echo MathHelper::circleArea(5.0);      // 78.539816339745
```

## 8.5 Late Static Binding with `static::`

`self::` is resolved at compile time and always refers to the class where it is written. `static::` is resolved at runtime and refers to the class that was actually called — this is called **late static binding** and is essential for factory methods in class hierarchies.

```php
<?php
declare(strict_types=1);

class Base
{
    public static function create(): static
    {
        return new static(); // resolves to the calling class at runtime
    }

    public function whoAmI(): string
    {
        return static::class; // also uses late static binding
    }
}

class Child extends Base {}

$base  = Base::create();
$child = Child::create(); // returns Child instance, not Base

echo $base->whoAmI();  // "Base"
echo $child->whoAmI(); // "Child"
```

**TypeScript analogy:** TypeScript achieves this with generics on constructors (`new(): T`). PHP's `static` keyword makes it implicit and concise.

## 8.6 Returning `static` from Methods

Returning `static` instead of `self` allows fluent builder chains to preserve the concrete type in subclasses.

```php
<?php
declare(strict_types=1);

class QueryBuilder
{
    protected array $conditions = [];

    public function where(string $condition): static
    {
        $this->conditions[] = $condition;
        return $this;
    }

    public function build(): string
    {
        return 'WHERE ' . implode(' AND ', $this->conditions);
    }
}

class AdvancedQueryBuilder extends QueryBuilder
{
    public function orWhere(string $condition): static
    {
        $this->conditions[] = "OR $condition";
        return $this;
    }
}

$query = (new AdvancedQueryBuilder())
    ->where('age > 18')
    ->orWhere('role = "admin"')
    ->build();

echo $query; // WHERE age > 18 OR role = "admin"
```

## Key Takeaways

- Declare all properties with a visibility keyword; reference them via `$this->property`.
- `public`, `protected`, and `private` work the same as in TypeScript.
- Static members use `self::$prop` or `ClassName::$prop`; `self::` resolves at define time.
- Class constants are defined with `const` and accessed via `::`.
- Use `static::` instead of `self::` for late static binding in factory methods or when subclasses must resolve to themselves.
- Returning `static` (not `self`) from methods enables type-safe fluent interfaces in subclasses.

## What's Next

Chapter 9 explores how classes extend each other, how to override methods with `parent::`, and when to enforce structure through abstract classes.
