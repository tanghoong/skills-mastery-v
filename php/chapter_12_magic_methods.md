# Chapter 12 — Magic Methods

> **Goal:** Use PHP's double-underscore magic methods to control object construction, destruction, property access, string conversion, invocation, and cloning — and know when each is appropriate.

## 12.1 `__construct` and `__destruct`

`__construct` runs when an object is created. `__destruct` runs when the object goes out of scope or is explicitly unset. Destructors are useful for releasing file handles, closing connections, or logging cleanup events.

```php
<?php
declare(strict_types=1);

class DatabaseConnection
{
    private mixed $handle;

    public function __construct(private string $dsn)
    {
        // In a real app: $this->handle = new PDO($dsn);
        $this->handle = "connection_to_{$dsn}";
        echo "Connected to {$dsn}" . PHP_EOL;
    }

    public function __destruct()
    {
        $this->handle = null;
        echo "Connection to {$this->dsn} closed" . PHP_EOL;
    }
}

$db = new DatabaseConnection('mysql:host=localhost');
// ... use db ...
// When $db goes out of scope, __destruct fires automatically
```

**TypeScript analogy:** TypeScript has no destructor hook. The closest pattern is the `[Symbol.dispose]` proposal or manual `.close()` methods. PHP's `__destruct` is automatic.

## 12.2 Dynamic Properties: `__get`, `__set`, `__isset`, `__unset`

These four magic methods intercept access to non-existent or inaccessible properties, enabling dynamic property bags, proxies, and lazy loading.

```php
<?php
declare(strict_types=1);

class DynamicObject
{
    private array $data = [];

    public function __get(string $name): mixed
    {
        return $this->data[$name] ?? null;
    }

    public function __set(string $name, mixed $value): void
    {
        $this->data[$name] = $value;
    }

    public function __isset(string $name): bool
    {
        return isset($this->data[$name]);
    }

    public function __unset(string $name): void
    {
        unset($this->data[$name]);
    }
}

$obj = new DynamicObject();
$obj->username = 'alice';           // __set called
echo $obj->username . PHP_EOL;     // __get called → alice
echo isset($obj->username) ? 'set' : 'not set'; // __isset called → set
unset($obj->username);              // __unset called
echo isset($obj->username) ? 'set' : 'not set'; // not set
```

**Note:** In PHP 8.2+, accessing undeclared properties on regular classes emits a deprecation warning. Using `__get`/`__set` is the correct way to handle dynamic properties.

## 12.3 `__toString`

`__toString` is called when an object is cast to a string or used in a string context. It must return a `string`.

```php
<?php
declare(strict_types=1);

class Temperature
{
    public function __construct(
        private float $celsius
    ) {}

    public function __toString(): string
    {
        return round($this->celsius, 1) . '°C / ' . round($this->celsius * 9/5 + 32, 1) . '°F';
    }
}

$temp = new Temperature(100.0);
echo $temp . PHP_EOL;               // 100°C / 212°F
echo "Boiling point: $temp" . PHP_EOL; // string interpolation triggers __toString
```

**TypeScript analogy:** `toString(): string` on a class is the direct equivalent — JavaScript also calls it automatically in string coercion contexts.

## 12.4 `__invoke`

When a class defines `__invoke`, its instances can be called as if they were functions. This is useful for single-responsibility handlers, middleware, and callbacks.

```php
<?php
declare(strict_types=1);

class Multiplier
{
    public function __construct(private float $factor) {}

    public function __invoke(float $value): float
    {
        return $value * $this->factor;
    }
}

$double = new Multiplier(2.0);
$triple = new Multiplier(3.0);

echo $double(5.0) . PHP_EOL;  // 10
echo $triple(5.0) . PHP_EOL;  // 15

// Works anywhere a callable is expected
$values = [1.0, 2.0, 3.0];
$result = array_map($double, $values);
print_r($result); // [2, 4, 6]
```

**TypeScript analogy:** TypeScript supports `call signatures` on interfaces (`interface Fn { (x: number): number; }`), but PHP's `__invoke` is more ergonomic for classes.

## 12.5 `__clone` and Deep Copy

PHP's assignment and parameter passing for objects uses reference semantics: assigning an object variable copies the reference, not the object. Use `clone` to create a shallow copy. Override `__clone` to make properties that are themselves objects get deep-copied.

```php
<?php
declare(strict_types=1);

class Address
{
    public function __construct(public string $city) {}
}

class User
{
    public Address $address;

    public function __construct(public string $name, string $city)
    {
        $this->address = new Address($city);
    }

    public function __clone(): void
    {
        // Deep copy: clone the nested object too
        $this->address = clone $this->address;
    }
}

$alice = new User('Alice', 'Paris');
$bob   = clone $alice;
$bob->name           = 'Bob';
$bob->address->city  = 'London';

echo $alice->address->city . PHP_EOL; // Paris (not affected by Bob's change)
echo $bob->address->city   . PHP_EOL; // London
```

Without the `__clone` override, both `$alice` and `$bob` would share the same `Address` object, and changing `$bob->address->city` would affect `$alice` too.

## 12.6 Other Notable Magic Methods

| Method         | Triggered when                                      |
|----------------|-----------------------------------------------------|
| `__debugInfo`  | `var_dump()` is called — filter sensitive data      |
| `__serialize`  | `serialize()` is called (PHP 7.4+)                  |
| `__unserialize`| `unserialize()` is called (PHP 7.4+)                |
| `__sleep`      | Legacy: return array of property names to serialize |
| `__wakeup`     | Legacy: run code after unserialization              |

```php
<?php
declare(strict_types=1);

class SecretHolder
{
    public function __construct(
        public string $name,
        private string $password
    ) {}

    public function __debugInfo(): array
    {
        return ['name' => $this->name, 'password' => '***'];
    }
}

$s = new SecretHolder('alice', 'hunter2');
var_dump($s);
// object(SecretHolder)#1 (2) { ["name"]=> string(5) "alice" ["password"]=> string(3) "***" }
```

## Key Takeaways

- `__construct` / `__destruct` bracket the object lifecycle; destructors fire automatically when scope ends.
- `__get`, `__set`, `__isset`, `__unset` intercept property access and enable dynamic property bags.
- `__toString` lets an object participate naturally in string contexts.
- `__invoke` makes an object callable — useful for single-responsibility handlers and middleware.
- `clone` creates a shallow copy; override `__clone` to deep-copy nested objects and avoid shared state bugs.
- `__debugInfo` filters `var_dump` output — protect sensitive fields from leaking into logs.

## What's Next

Chapter 13 dives into PHP's type system in depth: union types, intersection types, DNF types, `never`, `mixed`, and typed class constants introduced in PHP 8.3.
