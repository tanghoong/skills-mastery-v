<?php
declare(strict_types=1);
/**
 * Chapter 22 — Creational Patterns
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_22.php
 */

// ── TODO 1: Factory Method ────────────────────────────────────────────────────
// Implement NotifierFactory::create(string $type): NotifierInterface
// Supported types: 'email', 'sms', 'push'
// Throw \InvalidArgumentException for unknown types.
// Each concrete notifier echoes a type-prefixed message.

interface NotifierInterface {
    public function send(string $message): void;
}

// YOUR CODE HERE
// class EmailNotifier implements NotifierInterface { ... }
// class SmsNotifier   implements NotifierInterface { ... }
// class PushNotifier  implements NotifierInterface { ... }

// class NotifierFactory {
//     public static function create(string $type): NotifierInterface { ... }
// }

// Demonstration:
// $notifier = NotifierFactory::create('sms');
// $notifier->send('Your order has shipped.');


// ── TODO 2: Builder (Fluent Interface) ────────────────────────────────────────
// Implement QueryBuilder with:
//   ->select(string ...$columns): static
//   ->from(string $table): static
//   ->where(string $condition): static
//   ->orderBy(string $column, string $dir = 'ASC'): static
//   ->limit(int $n): static
//   ->build(): string   — returns the SQL string
//
// Example output:
//   SELECT id, email FROM users WHERE active = 1 ORDER BY email ASC LIMIT 10

// YOUR CODE HERE
// class QueryBuilder { ... }

// Demonstration:
// $sql = (new QueryBuilder())
//     ->select('id', 'email')
//     ->from('users')
//     ->where('active = 1')
//     ->orderBy('email')
//     ->limit(10)
//     ->build();
// echo $sql . PHP_EOL;


// ── TODO 3: Prototype (clone + __clone) ───────────────────────────────────────
// Implement:
//   class Page { public string $content }
//   class Document { public string $title, public Page[] $pages }
//     Override __clone() to deep-copy the pages array.
//
// Verify that after cloning a Document and modifying a page in the clone,
// the original Document's pages are unchanged.

// YOUR CODE HERE
// class Page { ... }
// class Document { public function __clone() { ... } }

// Demonstration:
// $original = new Document('Report', [new Page('Intro'), new Page('Data')]);
// $copy     = clone $original;
// $copy->title           = 'Draft';
// $copy->pages[0]->content = 'DRAFT Intro';
// echo $original->pages[0]->content . PHP_EOL; // Intro (unchanged)
// echo $copy->pages[0]->content . PHP_EOL;     // DRAFT Intro


// ── TODO 4: Singleton ─────────────────────────────────────────────────────────
// Implement Config::getInstance(): static
// Requirements:
//   - Private constructor and __clone
//   - set(string $key, mixed $value): void
//   - get(string $key, mixed $default = null): mixed
//   - getInstance() always returns the same instance
//
// NOTE: In production PHP applications, prefer DI container singleton scope
// (e.g. $container->singleton(...)) over this pattern, as Singleton hides
// global state and makes unit testing difficult.

// YOUR CODE HERE
// class Config { ... }

// Demonstration:
// $a = Config::getInstance();
// $a->set('env', 'production');
// $b = Config::getInstance();
// echo $b->get('env') . PHP_EOL;    // production
// var_dump($a === $b);              // true


// ── TODO 5: Patterns in Use ───────────────────────────────────────────────────
// Write a short script that uses at least three of the patterns above together
// to simulate a real workflow, e.g.:
//   1. Use Config (Singleton) to get the notifier type.
//   2. Use NotifierFactory (Factory Method) to create the right notifier.
//   3. Use QueryBuilder (Builder) to build a query and "fetch" user emails.
//   4. Send a notification to each "fetched" user.

// YOUR CODE HERE — short demonstration script using multiple patterns

echo PHP_EOL . "All TODOs complete!" . PHP_EOL;
