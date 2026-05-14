# Chapter 14 — Attributes & Reflection

> **Goal:** Define custom attributes, apply them to classes and methods, and read them at runtime via `ReflectionClass` and `ReflectionMethod` — the foundation of PHP framework magic like routing, validation, and dependency injection.

## 14.1 What Are Attributes?

Attributes (introduced in PHP 8.0) are structured metadata attached to classes, methods, properties, parameters, and functions using the `#[AttributeName]` syntax. They replace the old docblock annotation convention (`@Route(...)`) with a first-class, type-safe mechanism.

**TypeScript analogy:** TypeScript's experimental `@Decorator` syntax serves the same purpose — metadata attached to classes and methods read at runtime by a framework. PHP attributes are more constrained (they are pure metadata; they do not modify behaviour by themselves) but the conceptual role is identical.

## 14.2 Defining a Custom Attribute

An attribute is a regular class marked with the built-in `#[Attribute]` attribute. The `Attribute` flag restricts where it can be applied.

```php
<?php
declare(strict_types=1);

#[Attribute(Attribute::TARGET_METHOD)]
class Route
{
    public function __construct(
        public readonly string $path,
        public readonly string $method = 'GET',
    ) {}
}
```

Common target flags:
| Flag | Applies to |
|------|-----------|
| `Attribute::TARGET_CLASS` | Classes |
| `Attribute::TARGET_METHOD` | Methods |
| `Attribute::TARGET_PROPERTY` | Properties |
| `Attribute::TARGET_PARAMETER` | Function/method parameters |
| `Attribute::TARGET_ALL` | Everything |

## 14.3 Applying Attributes

```php
<?php
declare(strict_types=1);

#[Attribute(Attribute::TARGET_METHOD)]
class Route
{
    public function __construct(
        public readonly string $path,
        public readonly string $method = 'GET',
    ) {}
}

class UserController
{
    #[Route('/users', 'GET')]
    public function index(): void
    {
        echo "Listing users" . PHP_EOL;
    }

    #[Route('/users', 'POST')]
    public function store(): void
    {
        echo "Creating user" . PHP_EOL;
    }

    #[Route('/users/{id}', 'DELETE')]
    public function destroy(int $id): void
    {
        echo "Deleting user {$id}" . PHP_EOL;
    }
}
```

Multiple attributes can be applied to the same target, and a single `#[...]` block can contain multiple comma-separated attributes.

## 14.4 Reading Attributes with ReflectionClass

`ReflectionClass` provides runtime introspection of any class. To read attributes, call `getAttributes()` on a `ReflectionMethod`, `ReflectionProperty`, or the class itself, then call `newInstance()` to instantiate the attribute.

```php
<?php
declare(strict_types=1);

// Assume Route and UserController are defined above

$reflection = new ReflectionClass(UserController::class);

foreach ($reflection->getMethods() as $method) {
    $attributes = $method->getAttributes(Route::class);

    foreach ($attributes as $attribute) {
        $route = $attribute->newInstance(); // Returns a Route object
        echo "{$route->method} {$route->path} => {$method->getName()}()" . PHP_EOL;
    }
}
// GET /users => index()
// POST /users => store()
// DELETE /users/{id} => destroy()
```

`getAttributes()` returns `ReflectionAttribute[]`. Each has:
- `getName()` — fully-qualified attribute class name
- `getArguments()` — raw constructor arguments (no instantiation)
- `newInstance()` — instantiates the attribute class with the recorded arguments

## 14.5 Inspecting Properties with ReflectionProperty

```php
<?php
declare(strict_types=1);

class Product
{
    public function __construct(
        public readonly int $id,
        protected string $name,
        private float $price,
    ) {}
}

$ref = new ReflectionClass(Product::class);

foreach ($ref->getProperties() as $prop) {
    $visibility = match (true) {
        $prop->isPublic()    => 'public',
        $prop->isProtected() => 'protected',
        $prop->isPrivate()   => 'private',
        default              => 'unknown',
    };

    $readonly = $prop->isReadOnly() ? ' readonly' : '';
    $type     = $prop->getType()?->getName() ?? 'mixed';

    echo "{$visibility}{$readonly} {$type} \${$prop->getName()}" . PHP_EOL;
}
// public readonly int $id
// protected string $name
// private float $price
```

## 14.6 Building an AnnotationReader

A practical use of reflection is an `AnnotationReader` — a class that scans a controller and returns all route definitions, which a router can then register.

```php
<?php
declare(strict_types=1);

#[Attribute(Attribute::TARGET_METHOD)]
class Route
{
    public function __construct(
        public readonly string $path,
        public readonly string $method = 'GET',
    ) {}
}

class AnnotationReader
{
    /**
     * @return array<array{path: string, method: string, handler: string}>
     */
    public function getRoutes(string $controllerClass): array
    {
        $routes     = [];
        $reflection = new ReflectionClass($controllerClass);

        foreach ($reflection->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
            foreach ($method->getAttributes(Route::class) as $attribute) {
                $route    = $attribute->newInstance();
                $routes[] = [
                    'path'    => $route->path,
                    'method'  => $route->method,
                    'handler' => $controllerClass . '::' . $method->getName(),
                ];
            }
        }

        return $routes;
    }
}

class ArticleController
{
    #[Route('/articles', 'GET')]
    public function index(): void {}

    #[Route('/articles/{id}', 'GET')]
    public function show(): void {}

    #[Route('/articles', 'POST')]
    public function create(): void {}
}

$reader = new AnnotationReader();
$routes = $reader->getRoutes(ArticleController::class);

foreach ($routes as $route) {
    echo "{$route['method']} {$route['path']} -> {$route['handler']}" . PHP_EOL;
}
// GET /articles -> ArticleController::index
// GET /articles/{id} -> ArticleController::show
// POST /articles -> ArticleController::create
```

This is the core of how Symfony's routing component, Laravel's route attributes, and NestJS-style PHP ports work.

## 14.7 ReflectionMethod for Parameter Introspection

```php
<?php
declare(strict_types=1);

function describeParameters(string $class, string $methodName): void
{
    $method = new ReflectionMethod($class, $methodName);

    foreach ($method->getParameters() as $param) {
        $type    = $param->getType()?->getName() ?? 'mixed';
        $default = $param->isOptional()
            ? ' = ' . var_export($param->getDefaultValue(), true)
            : '';
        echo "  \${$param->getName()}: {$type}{$default}" . PHP_EOL;
    }
}

class OrderService
{
    public function create(int $userId, float $total, string $currency = 'USD'): void {}
}

echo "OrderService::create parameters:" . PHP_EOL;
describeParameters(OrderService::class, 'create');
// $userId: int
// $total: float
// $currency: string = 'USD'
```

## Key Takeaways

- Attributes are structured metadata applied with `#[AttributeName(...)]`; they replace docblock annotation conventions.
- Define an attribute with a regular class marked `#[Attribute(Attribute::TARGET_*)]` to restrict valid targets.
- Read attributes at runtime using `ReflectionClass`, `ReflectionMethod`, or `ReflectionProperty` — call `getAttributes()` then `newInstance()`.
- `ReflectionProperty` exposes visibility, type, and readonly status for any property.
- An `AnnotationReader` pattern — scanning a class's methods for attributes and returning structured data — is the foundation of routing, DI containers, and validation frameworks.
- Reflection has a performance cost; cache results in production applications.

## What's Next

Phase 2 is complete. Phase 3 will move into the PHP ecosystem: Composer, PSR standards, database access with PDO and Doctrine, and building HTTP applications with frameworks.
