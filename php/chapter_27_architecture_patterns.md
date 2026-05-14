# Chapter 27 — Architecture Patterns

> **Goal:** Implement the Repository, DTO, Value Object, Result pattern, and Service Layer in pure PHP — the building blocks of every well-structured PHP application.

## 27.1 Repository

Repository mediates between the domain and data-mapping layers. Callers work with domain objects; the repository hides all persistence details behind a collection-like interface.

```php
<?php
declare(strict_types=1);

class User {
    public function __construct(
        public readonly int    $id,
        public readonly string $email
    ) {}
}

interface UserRepositoryInterface {
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function save(User $user): void;
}

class InMemoryUserRepository implements UserRepositoryInterface {
    /** @var array<int, User> */
    private array $store = [];
    private int $nextId = 1;

    public function findById(int $id): ?User {
        return $this->store[$id] ?? null;
    }

    public function findByEmail(string $email): ?User {
        foreach ($this->store as $user) {
            if ($user->email === $email) {
                return $user;
            }
        }
        return null;
    }

    public function save(User $user): void {
        $this->store[$user->id] = $user;
    }

    public function nextId(): int { return $this->nextId++; }
}
```

`InMemoryUserRepository` is used in unit tests; swap it for a `DoctrineUserRepository` in production via DI — no service layer code changes.

## 27.2 Data Transfer Object (DTO)

A DTO is a simple, immutable carrier of data across layer boundaries. PHP 8.2+ `readonly class` with constructor promotion is the cleanest syntax.

```php
<?php
declare(strict_types=1);

readonly class UserDto {
    public function __construct(
        public readonly int    $id,
        public readonly string $email,
        public readonly string $createdAt
    ) {}

    public static function fromUser(User $user): self {
        return new self(
            id: $user->id,
            email: $user->email,
            createdAt: date('Y-m-d')
        );
    }
}
```

DTOs cross layer boundaries carrying only the data the layer needs. They prevent domain objects leaking into HTTP responses or form data leaking into the domain.

## 27.3 Value Object

A Value Object is defined entirely by its value, not its identity. Two `Email` instances with the same address are equal. Value Objects are always immutable and validate themselves in the constructor.

```php
<?php
declare(strict_types=1);

readonly class Email {
    public readonly string $value;

    public function __construct(string $raw) {
        $normalised = strtolower(trim($raw));
        if (!filter_var($normalised, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: {$raw}");
        }
        $this->value = $normalised;
    }

    public function equals(Email $other): bool {
        return $this->value === $other->value;
    }

    public function __toString(): string { return $this->value; }
}

$a = new Email('Alice@Example.COM');
$b = new Email('alice@example.com');
var_dump($a->equals($b)); // true
```

## 27.4 Result Pattern `Result<T, E>`

The Result pattern makes errors explicit in the return type, eliminating invisible thrown exceptions from business logic. Two readonly classes represent the two possible outcomes.

```php
<?php
declare(strict_types=1);

readonly class Ok {
    public function __construct(public readonly mixed $value) {}
    public function isOk(): bool  { return true; }
    public function isErr(): bool { return false; }
}

readonly class Err {
    public function __construct(public readonly mixed $error) {}
    public function isOk(): bool  { return false; }
    public function isErr(): bool { return true; }
}

// Type alias via docblock — PHP does not have true generic types
// @template T
// @template E
// function returns Ok<T>|Err<E>

function divide(float $a, float $b): Ok|Err {
    if ($b === 0.0) {
        return new Err('Division by zero');
    }
    return new Ok($a / $b);
}

$result = divide(10, 2);
if ($result->isOk()) {
    echo $result->value . PHP_EOL; // 5
}

$bad = divide(1, 0);
if ($bad->isErr()) {
    echo $bad->error . PHP_EOL; // Division by zero
}
```

Because callers receive `Ok|Err`, PHPStan and Psalm enforce that both branches are handled. Contrast with `throw` — the compiler cannot tell you a function throws.

## 27.5 Service Layer

The Service Layer orchestrates domain objects and infrastructure (repository, email, events) to fulfil a single use-case. Services hold no state; they transform inputs into outputs.

```php
<?php
declare(strict_types=1);

class UserService {
    public function __construct(
        private readonly InMemoryUserRepository $repo,
        private readonly LoggerInterface        $logger
    ) {}

    public function register(string $rawEmail): Ok|Err {
        try {
            $email = new Email($rawEmail);
        } catch (\InvalidArgumentException $e) {
            return new Err($e->getMessage());
        }

        if ($this->repo->findByEmail($email->value) !== null) {
            return new Err('Email already registered.');
        }

        $user = new User($this->repo->nextId(), $email->value);
        $this->repo->save($user);
        $this->logger->info("Registered: {$email}");

        return new Ok(UserDto::fromUser($user));
    }
}
```

Wiring it together:

```php
<?php
declare(strict_types=1);

$repo    = new InMemoryUserRepository();
$logger  = new FileLogger();
$service = new UserService($repo, $logger);

$result = $service->register('alice@example.com');
if ($result->isOk()) {
    /** @var UserDto $dto */
    $dto = $result->value;
    echo "Created user #{$dto->id}: {$dto->email}" . PHP_EOL;
}

$duplicate = $service->register('alice@example.com');
if ($duplicate->isErr()) {
    echo "Error: {$duplicate->error}" . PHP_EOL;
}
```

## 27.6 Unit of Work (Concept)

Unit of Work tracks all domain objects read within a transaction and flushes inserts, updates, and deletes as a single atomic operation. In PHP this is typically provided by Doctrine's `EntityManager::flush()`. The key insight is that the service layer calls `flush()` once per use-case, not after every individual save — ensuring atomicity.

## Key Takeaways

- Repository hides persistence behind a collection-like interface; swap implementations via DI without changing business logic.
- DTOs are immutable data carriers that cross layer boundaries; `readonly class` with constructor promotion is idiomatic PHP 8.2+.
- Value Objects are self-validating, equality-based, and immutable — model domain concepts like `Email`, `Money`, and `DateRange` as Value Objects.
- `Ok|Err` Result pattern makes error paths explicit in the type system; callers cannot ignore errors as they can with exceptions.
- Service Layer orchestrates repositories, value objects, and infrastructure into cohesive use-case methods — each method does one thing and returns a `Result`.

## What's Next

You have completed Phase 4. The next phase (Chapters 28+) applies these patterns to real PHP frameworks — Laravel and Symfony — where the service container, ORM, and HTTP layer come pre-built, and your job is to wire your clean domain code into them.
