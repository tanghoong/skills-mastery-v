<?php
declare(strict_types=1);
/**
 * Chapter 23 — Structural Patterns
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_23.php
 */

// ── TODO 1: Adapter ───────────────────────────────────────────────────────────
// The modern codebase uses LoggerInterface below.
// The legacy XmlLogger cannot be modified.
// Implement XmlLoggerAdapter (object adapter, not class adapter) that:
//   - Wraps XmlLogger via constructor injection
//   - Implements LoggerInterface
//   - Converts log(string $level, string $message) into an XML string
//     and delegates to XmlLogger::writeXml()

interface LoggerInterface {
    public function log(string $level, string $message): void;
}

class XmlLogger {
    public function writeXml(string $xml): void {
        echo $xml . PHP_EOL;
    }
}

// YOUR CODE HERE
// class XmlLoggerAdapter implements LoggerInterface { ... }

// Demonstration:
// $adapter = new XmlLoggerAdapter(new XmlLogger());
// $adapter->log('error', 'Something went wrong');
// Expected: <log level="error">Something went wrong</log>


// ── TODO 2: Decorator ─────────────────────────────────────────────────────────
// Implement a caching decorator over UserRepositoryInterface.
// UserRepositoryInterface has one method: findById(int $id): ?array
// DatabaseUserRepository simulates a slow DB call with a sleep(0) echo.
// CachingUserRepository wraps it and returns the cached result on repeat calls.
// Verify that a second call to findById(1) does NOT trigger the DB echo.

interface UserRepositoryInterface {
    public function findById(int $id): ?array;
}

class DatabaseUserRepository implements UserRepositoryInterface {
    public function findById(int $id): ?array {
        echo "DB: fetching user {$id}" . PHP_EOL;
        return ['id' => $id, 'name' => 'Alice'];
    }
}

// YOUR CODE HERE
// class CachingUserRepository implements UserRepositoryInterface { ... }

// Demonstration:
// $repo = new CachingUserRepository(new DatabaseUserRepository());
// $repo->findById(1); // prints "DB: fetching user 1"
// $repo->findById(1); // prints nothing (cache hit)
// $repo->findById(2); // prints "DB: fetching user 2"


// ── TODO 3: Facade ────────────────────────────────────────────────────────────
// Build PaymentFacade with one public method:
//   charge(string $token, string $email, int $amountCents): bool
//
// Internally it must use all three subsystems:
//   - FraudDetector::isSafe(string $token): bool
//   - StripeGateway::charge(string $token, int $cents): bool
//   - ReceiptMailer::send(string $email, int $cents): void
// If fraud check fails, return false immediately (no charge, no email).
// If charge fails, return false (no email).
// Subsystems are instantiated inside the Facade constructor.

class FraudDetector {
    public function isSafe(string $token): bool {
        return $token !== 'tok_stolen';
    }
}

class StripeGateway {
    public function charge(string $token, int $cents): bool {
        echo "Stripe: charged {$cents} cents" . PHP_EOL;
        return true;
    }
}

class ReceiptMailer {
    public function send(string $email, int $cents): void {
        echo "Mailer: receipt sent to {$email} for {$cents} cents" . PHP_EOL;
    }
}

// YOUR CODE HERE
// class PaymentFacade { ... }

// Demonstration:
// $facade = new PaymentFacade();
// $facade->charge('tok_visa', 'alice@example.com', 4999);  // succeeds
// $facade->charge('tok_stolen', 'bad@actor.com', 9999);    // blocked by fraud check


// ── TODO 4: Composite ─────────────────────────────────────────────────────────
// Model a file-system tree where both files and folders respond to:
//   name(): string
//   size(): int
//
// FileSystemNode interface declares both methods.
// File stores a name and fixed byte size.
// Folder stores a name and a list of children (files or other folders).
//   Folder::size() returns the sum of all children's sizes recursively.
//
// Build this tree and assert total size == 1792:
//   / (Folder)
//   └── src/ (Folder)
//       ├── app.php    (1024 bytes)
//       └── config.php ( 512 bytes)
//   └── README.md      ( 256 bytes)

// YOUR CODE HERE
// interface FileSystemNode { ... }
// class File implements FileSystemNode { ... }
// class Folder implements FileSystemNode { ... }

// Demonstration:
// $root = new Folder('/');
// ... build tree ...
// echo $root->size() . PHP_EOL; // 1792


// ── TODO 5: Proxy (Lazy-load) ─────────────────────────────────────────────────
// HeavyReportGenerator is expensive to instantiate (echoes a message on new).
// Implement LazyReportProxy that:
//   - Implements ReportGeneratorInterface
//   - Does NOT instantiate HeavyReportGenerator in its constructor
//   - Creates HeavyReportGenerator on the FIRST call to generate()
//   - Returns the same real instance on subsequent calls
//
// Verify: constructing the proxy prints nothing; calling generate() prints the init message.

interface ReportGeneratorInterface {
    public function generate(): string;
}

class HeavyReportGenerator implements ReportGeneratorInterface {
    public function __construct() {
        echo "HeavyReportGenerator: expensive init" . PHP_EOL;
    }
    public function generate(): string {
        return 'Annual Report Data';
    }
}

// YOUR CODE HERE
// class LazyReportProxy implements ReportGeneratorInterface { ... }

// Demonstration:
// $proxy = new LazyReportProxy();
// echo "Proxy created — no init yet" . PHP_EOL;
// echo $proxy->generate() . PHP_EOL; // triggers init, then returns report
// echo $proxy->generate() . PHP_EOL; // no second init

echo PHP_EOL . "All TODOs complete!" . PHP_EOL;
