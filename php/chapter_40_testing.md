# Chapter 40 — Testing with PHPUnit & Pest

> **Goal:** Write unit and integration tests for PHP code using PHPUnit's assertion model and Pest's expressive syntax, and understand TDD's red-green-refactor cycle.

## 40.1 PHPUnit Setup

Install PHPUnit via Composer as a dev dependency:

```bash
composer require --dev phpunit/phpunit ^11.0
```

Configure it in `phpunit.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
    </testsuites>
    <source>
        <include><directory>src</directory></include>
    </source>
</phpunit>
```

Run tests:

```bash
./vendor/bin/phpunit
./vendor/bin/phpunit --testsuite Unit
./vendor/bin/phpunit tests/Unit/UserServiceTest.php
```

In Node/Jest terms, PHPUnit tests are `describe`/`it` blocks replaced with class methods prefixed `test`.

## 40.2 Assertions

PHPUnit's assertion methods are static methods on `TestCase`. The most common ones:

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class MathTest extends TestCase
{
    public function test_addition(): void
    {
        $this->assertSame(4, 2 + 2);
    }

    public function test_string_contains(): void
    {
        $this->assertStringContainsString('world', 'hello world');
    }

    public function test_array_has_key(): void
    {
        $this->assertArrayHasKey('name', ['name' => 'Charlie']);
    }

    public function test_exception_is_thrown(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email');
        validateEmail('not-an-email');
    }
}
```

Key assertions: `assertSame` (strict equality), `assertEquals` (loose), `assertTrue`, `assertFalse`, `assertNull`, `assertCount`, `assertInstanceOf`, `assertThrows`.

## 40.3 Data Providers

Data providers allow one test method to run with multiple input/output combinations — equivalent to Jest's `test.each`.

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;

final class SlugTest extends TestCase
{
    public static function slugCases(): array
    {
        return [
            'basic'        => ['Hello World',  'hello-world'],
            'trailing'     => ['  Trim Me  ',  'trim-me'],
            'special chars'=> ['Café & Résumé','cafe-resume'],
        ];
    }

    #[DataProvider('slugCases')]
    public function test_slugify(string $input, string $expected): void
    {
        $this->assertSame($expected, slugify($input));
    }
}
```

Data providers are declared `static` and return an array of named cases. PHPUnit 10+ uses the `#[DataProvider]` attribute instead of the older `@dataProvider` annotation.

## 40.4 Mocks and Stubs

PHPUnit's `createMock` generates a test double that implements an interface (or extends a class), with all methods returning `null` by default. `createStub` is similar but without expectation tracking — use it when you only care about the return value, not whether the method was called.

This is the PHP equivalent of Jest's `jest.fn()` and `jest.spyOn()`.

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

interface MailerInterface
{
    public function send(string $to, string $subject, string $body): bool;
}

final class UserServiceTest extends TestCase
{
    public function test_sends_welcome_email_on_register(): void
    {
        $mailer = $this->createMock(MailerInterface::class);

        $mailer
            ->expects($this->once())
            ->method('send')
            ->with(
                'charlie@example.com',
                'Welcome!',
                $this->stringContains('Charlie'),
            )
            ->willReturn(true);

        $service = new UserService($mailer);
        $service->register('charlie@example.com', 'Charlie');
    }

    public function test_stub_returns_canned_value(): void
    {
        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('send')->willReturn(true);

        $service = new UserService($mailer);
        $result  = $service->register('a@b.com', 'Test');

        $this->assertTrue($result->success);
    }
}
```

## 40.5 Testing PDO with SQLite In-Memory

For integration tests that touch the database, use SQLite's in-memory mode instead of a real database server. This is fast, zero-setup, and isolated per test run — analogous to Vitest with a per-test SQLite database in a Node project.

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class UserRepositoryTest extends TestCase
{
    private PDO $pdo;

    protected function setUp(): void
    {
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $this->pdo->exec('
            CREATE TABLE users (
                id    INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                name  TEXT NOT NULL
            )
        ');
    }

    public function test_can_insert_and_find_user(): void
    {
        $repo = new UserRepository($this->pdo);
        $repo->create('charlie@example.com', 'Charlie');

        $user = $repo->findByEmail('charlie@example.com');

        $this->assertNotNull($user);
        $this->assertSame('Charlie', $user['name']);
    }

    public function test_find_returns_null_for_missing_user(): void
    {
        $repo = new UserRepository($this->pdo);
        $this->assertNull($repo->findByEmail('ghost@example.com'));
    }
}
```

`setUp` runs before each test method, giving every test a fresh, empty database.

## 40.6 Pest: Expressive Syntax

Pest wraps PHPUnit and provides a functional, Vitest/Jest-like syntax. Install it alongside PHPUnit:

```bash
composer require --dev pestphp/pest ^2.0
./vendor/bin/pest --init
```

A Pest test file:

```php
<?php
declare(strict_types=1);

use function Pest\{expect, test, describe, it, beforeEach};

describe('UserService', function () {
    beforeEach(function () {
        $this->pdo     = new PDO('sqlite::memory:');
        $this->service = new UserService(new UserRepository($this->pdo));
    });

    it('registers a new user', function () {
        $result = $this->service->register('charlie@example.com', 'Charlie');

        expect($result->success)->toBeTrue()
            ->and($result->value['name'])->toBe('Charlie');
    });

    it('rejects duplicate emails', function () {
        $this->service->register('a@b.com', 'Alice');
        $result = $this->service->register('a@b.com', 'Alice Again');

        expect($result->success)->toBeFalse()
            ->and($result->error->getMessage())->toContain('duplicate');
    });
});
```

The `expect($value)->toBe()` chain reads like English and is identical in intent to Jest's `expect(value).toBe()`.

## 40.7 TDD: Red-Green-Refactor

Test-driven development follows three steps:

1. **Red** — Write a failing test for the next small piece of behaviour. Run it; it must fail.
2. **Green** — Write the minimum code to make the test pass.
3. **Refactor** — Clean up the implementation without breaking the test.

```php
<?php
// RED: this test fails because slugify() doesn't exist yet
it('converts a title to a slug', function () {
    expect(slugify('Hello World'))->toBe('hello-world');
});

// GREEN: minimal implementation
function slugify(string $title): string
{
    return strtolower(str_replace(' ', '-', trim($title)));
}

// REFACTOR: handle special characters, multiple spaces, etc.
function slugify(string $title): string
{
    $slug = mb_strtolower(trim($title), 'UTF-8');
    $slug = preg_replace('/[^\pL\pN\s-]/u', '', $slug);    // remove non-alphanumeric
    $slug = preg_replace('/[\s-]+/', '-', $slug);            // collapse spaces/hyphens
    return trim($slug, '-');
}
```

## Key Takeaways

- PHPUnit test classes extend `TestCase`; test methods are prefixed with `test` or annotated with `#[Test]`.
- Data providers run one test method across multiple input sets — use the `#[DataProvider]` attribute in PHPUnit 10+.
- `createMock` generates a spy with expectations; `createStub` generates a stub with canned return values.
- SQLite `sqlite::memory:` in `setUp` gives each test an isolated, fast, zero-config database.
- Pest provides a Vitest-compatible `describe`/`it`/`expect` syntax on top of PHPUnit's engine.
- TDD's red-green-refactor cycle keeps tests honest (failing first) and implementations minimal.

## What's Next

This chapter completes Phase 7. The next phase introduces advanced frameworks — Laravel, Symfony, and API Platform — where all the patterns from Chapters 36-40 come together at scale.
