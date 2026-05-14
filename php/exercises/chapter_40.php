<?php
declare(strict_types=1);
/**
 * Chapter 40 — Testing with PHPUnit & Pest
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_40.php
 *
 * This file implements a self-contained mini test runner (no PHPUnit required)
 * that demonstrates the same concepts: assertions, mocks, data providers,
 * SQLite integration tests, and a Pest-inspired describe/it DSL.
 */

// ── TODO 1: assert_equals helper and pure function test ───────────────────────
// Write an assert_equals(mixed $expected, mixed $actual, string $label) helper
// that prints PASS or FAIL with the label. Test a pure slugify() function.

echo "=== TODO 1: Custom assertion helper ===" . PHP_EOL;

/** @var list<array{label: string, passed: bool, message: string}> */
$testResults = [];

function assert_equals(mixed $expected, mixed $actual, string $label): void
{
    global $testResults;

    $passed  = $expected === $actual;
    $message = $passed
        ? ''
        : sprintf(
            'Expected %s, got %s',
            json_encode($expected),
            json_encode($actual),
        );

    $testResults[] = ['label' => $label, 'passed' => $passed, 'message' => $message];
    echo ($passed ? '  PASS' : '  FAIL') . " — {$label}";
    if (!$passed) {
        echo " [{$message}]";
    }
    echo PHP_EOL;
}

function assert_true(mixed $actual, string $label): void
{
    assert_equals(true, $actual, $label);
}

function assert_false(mixed $actual, string $label): void
{
    assert_equals(false, $actual, $label);
}

function assert_null(mixed $actual, string $label): void
{
    assert_equals(null, $actual, $label);
}

// Pure function under test
function slugify(string $title): string
{
    $slug = mb_strtolower(trim($title), 'UTF-8');
    $slug = (string)preg_replace('/[^\pL\pN\s-]/u', '', $slug);
    $slug = (string)preg_replace('/[\s-]+/', '-', $slug);
    return trim($slug, '-');
}

assert_equals('hello-world',    slugify('Hello World'),     'basic slug');
assert_equals('trim-me',        slugify('  Trim Me  '),     'trim whitespace');
assert_equals('php-84',         slugify('PHP 8.4!'),        'strip special chars');
assert_equals('multiple-words', slugify('multiple   words'),'collapse spaces');

// ── TODO 2: UserService with Result type — happy path and duplicate email ─────
// Define a Result<T> type (as a readonly class pair: Ok and Err).
// Build a UserService with register(email): Result.
// Test that registering a new user succeeds and returns the user data.
// Test that registering a duplicate email fails with the right error message.

echo PHP_EOL . "=== TODO 2: UserService with Result type ===" . PHP_EOL;

final readonly class Ok
{
    public function __construct(public readonly mixed $value) {}
    public bool $success { get => true; }
}

final readonly class Err
{
    public function __construct(public readonly string $error) {}
    public bool $success { get => false; }
}

// PHP 8.4 property hooks used above; for PHP 8.1-8.3, use regular methods:
// public function isOk(): bool { return true; }

/** Simple in-memory user store for the service */
final class InMemoryUserStore
{
    /** @var array<string, array{id: int, email: string, name: string}> */
    private array $store  = [];
    private int   $nextId = 1;

    public function existsByEmail(string $email): bool
    {
        return isset($this->store[$email]);
    }

    public function save(string $email, string $name): array
    {
        $user                 = ['id' => $this->nextId++, 'email' => $email, 'name' => $name];
        $this->store[$email]  = $user;
        return $user;
    }
}

final class UserService
{
    public function __construct(private readonly InMemoryUserStore $store) {}

    public function register(string $email, string $name): Ok|Err
    {
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return new Err("Invalid email address: {$email}");
        }

        if ($this->store->existsByEmail($email)) {
            return new Err("Email already registered: {$email}");
        }

        $user = $this->store->save($email, $name);
        return new Ok($user);
    }
}

$store   = new InMemoryUserStore();
$service = new UserService($store);

$result1 = $service->register('charlie@example.com', 'Charlie');
assert_true($result1->success,                              'register new user succeeds');
assert_equals('Charlie', $result1->value['name'],           'registered user name is correct');
assert_equals(1,         $result1->value['id'],             'first user gets id=1');

$result2 = $service->register('charlie@example.com', 'Charlie Again');
assert_false($result2->success,                             'duplicate email fails');
assert_true(str_contains($result2->error, 'already'),       'error mentions "already"');

$result3 = $service->register('not-an-email', 'Bad');
assert_false($result3->success,                             'invalid email fails');
assert_true(str_contains($result3->error, 'Invalid'),       'error mentions "Invalid"');

// ── TODO 3: SQLite in-memory integration tests ────────────────────────────────
// Create an in-memory SQLite database, define a users table, and build a
// UserRepository class. Test insert, find-by-email, and missing record handling.

echo PHP_EOL . "=== TODO 3: SQLite in-memory integration test ===" . PHP_EOL;

final class UserRepository
{
    public function __construct(private readonly PDO $pdo) {}

    public function create(string $email, string $name): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO users (email, name) VALUES (:email, :name)',
        );
        $stmt->bindValue(':email', $email, PDO::PARAM_STR);
        $stmt->bindValue(':name',  $name,  PDO::PARAM_STR);
        $stmt->execute();

        $id = (int)$this->pdo->lastInsertId();
        return ['id' => $id, 'email' => $email, 'name' => $name];
    }

    public function findByEmail(string $email): array|null
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = :email');
        $stmt->bindValue(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row !== false ? $row : null;
    }

    public function count(): int
    {
        return (int)$this->pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    }
}

function makeTestPdo(): PDO
{
    $pdo = new PDO('sqlite::memory:', options: [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('
        CREATE TABLE users (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            name  TEXT NOT NULL
        )
    ');
    return $pdo;
}

// Each "test" gets a fresh PDO (simulating setUp())
$pdo1 = makeTestPdo();
$repo1 = new UserRepository($pdo1);
$user  = $repo1->create('alice@example.com', 'Alice');
assert_equals('Alice',             $user['name'],             'create returns name');
assert_equals(1,                   (int)$user['id'],          'create returns id=1');

$pdo2  = makeTestPdo();
$repo2 = new UserRepository($pdo2);
$repo2->create('bob@example.com', 'Bob');
$found = $repo2->findByEmail('bob@example.com');
assert_true($found !== null,                                  'findByEmail returns row');
assert_equals('Bob',   $found['name'],                        'found row has correct name');

$pdo3  = makeTestPdo();
$repo3 = new UserRepository($pdo3);
$missing = $repo3->findByEmail('ghost@example.com');
assert_null($missing,                                         'findByEmail returns null for missing');

// ── TODO 4: Mock/Test double — MockMailer ─────────────────────────────────────
// Define a MailerInterface with send(string $to, string $subject, string $body).
// Implement a MockMailer that records all calls to send().
// Use the mock in a UserNotifier class and verify it was called correctly.

echo PHP_EOL . "=== TODO 4: Test double (MockMailer) ===" . PHP_EOL;

interface MailerInterface
{
    public function send(string $to, string $subject, string $body): bool;
}

final class MockMailer implements MailerInterface
{
    /** @var list<array{to: string, subject: string, body: string}> */
    private array $sent = [];

    public function send(string $to, string $subject, string $body): bool
    {
        $this->sent[] = ['to' => $to, 'subject' => $subject, 'body' => $body];
        return true;
    }

    public function sentCount(): int
    {
        return count($this->sent);
    }

    public function lastSentTo(): ?string
    {
        return empty($this->sent) ? null : end($this->sent)['to'];
    }

    public function lastSubject(): ?string
    {
        return empty($this->sent) ? null : end($this->sent)['subject'];
    }

    /** @return list<array{to: string, subject: string, body: string}> */
    public function allSent(): array
    {
        return $this->sent;
    }
}

final class UserNotifier
{
    public function __construct(private readonly MailerInterface $mailer) {}

    public function sendWelcome(string $email, string $name): void
    {
        $this->mailer->send(
            $email,
            'Welcome to PHP Mastery!',
            "Hi {$name}, welcome aboard.",
        );
    }
}

$mockMailer = new MockMailer();
$notifier   = new UserNotifier($mockMailer);

$notifier->sendWelcome('charlie@example.com', 'Charlie');

assert_equals(1,                      $mockMailer->sentCount(),  'mailer was called once');
assert_equals('charlie@example.com',  $mockMailer->lastSentTo(), 'sent to correct email');
assert_true(
    str_contains($mockMailer->lastSubject() ?? '', 'Welcome'),
    'subject contains "Welcome"',
);

// No email sent if we never call sendWelcome
$freshMailer = new MockMailer();
assert_equals(0, $freshMailer->sentCount(), 'fresh mock has zero sent emails');

// ── TODO 5: Pest-inspired describe/it mini-framework ─────────────────────────
// Build a describe(string $label, Closure $suite) and it(string $label, Closure $test)
// function pair using closures. it() should catch Throwable and report PASS/FAIL.
// Demonstrate with a small test suite for the slugify() function.

echo PHP_EOL . "=== TODO 5: describe/it mini-framework ===" . PHP_EOL;

/** @var string $currentSuite Tracks the active describe block label */
$currentSuite = '';

function describe(string $label, Closure $suite): void
{
    global $currentSuite;
    $currentSuite = $label;
    echo PHP_EOL . "  {$label}" . PHP_EOL;
    $suite();
    $currentSuite = '';
}

function it(string $label, Closure $test): void
{
    try {
        $test();
        echo "    PASS — {$label}" . PHP_EOL;
    } catch (Throwable $e) {
        echo "    FAIL — {$label}" . PHP_EOL;
        echo "           " . $e->getMessage() . PHP_EOL;
    }
}

/**
 * Minimal expect()->toBe() style assertion.
 * Throws on failure so it() can catch it.
 */
function expect(mixed $value): object
{
    return new class ($value) {
        public function __construct(private readonly mixed $actual) {}

        public function toBe(mixed $expected): static
        {
            if ($this->actual !== $expected) {
                throw new RuntimeException(sprintf(
                    'Expected %s to be %s',
                    json_encode($this->actual),
                    json_encode($expected),
                ));
            }
            return $this;
        }

        public function toContain(string $needle): static
        {
            if (!str_contains((string)$this->actual, $needle)) {
                throw new RuntimeException(sprintf(
                    'Expected "%s" to contain "%s"',
                    $this->actual,
                    $needle,
                ));
            }
            return $this;
        }

        public function toBeTrue(): static
        {
            return $this->toBe(true);
        }

        public function toBeFalse(): static
        {
            return $this->toBe(false);
        }

        public function toBeNull(): static
        {
            return $this->toBe(null);
        }

        public function and(mixed $value): static
        {
            return new static($value);
        }
    };
}

describe('slugify()', function () {
    it('converts spaces to hyphens', function () {
        expect(slugify('Hello World'))->toBe('hello-world');
    });

    it('trims leading and trailing whitespace', function () {
        expect(slugify('  trim me  '))->toBe('trim-me');
    });

    it('strips non-alphanumeric characters', function () {
        expect(slugify('PHP 8.4!'))->toBe('php-84');
    });

    it('collapses multiple spaces', function () {
        expect(slugify('too    many   spaces'))->toBe('too-many-spaces');
    });

    it('fails intentionally to show FAIL output', function () {
        // This is a deliberately wrong expectation to demonstrate FAIL reporting
        expect(slugify('hello'))->toBe('should-fail');
    });
});

describe('UserService result pattern', function () {
    it('returns Ok on valid registration', function () {
        $svc = new UserService(new InMemoryUserStore());
        $r   = $svc->register('a@b.com', 'Alice');
        expect($r->success)->toBeTrue()
            ->and($r->value['name'])->toBe('Alice');
    });

    it('returns Err on duplicate email', function () {
        $store = new InMemoryUserStore();
        $svc   = new UserService($store);
        $svc->register('a@b.com', 'Alice');
        $r = $svc->register('a@b.com', 'Alice2');
        expect($r->success)->toBeFalse();
        expect($r->error)->toContain('already');
    });
});

// ── Summary report ────────────────────────────────────────────────────────────
echo PHP_EOL . "=== Test Summary ===" . PHP_EOL;
$passed = array_filter($testResults, fn($r) => $r['passed']);
$failed = array_filter($testResults, fn($r) => !$r['passed']);
echo "Passed: " . count($passed) . PHP_EOL;
echo "Failed: " . count($failed) . PHP_EOL;

if (count($failed) > 0) {
    echo PHP_EOL . "Failures:" . PHP_EOL;
    foreach ($failed as $f) {
        echo "  - {$f['label']}: {$f['message']}" . PHP_EOL;
    }
}
