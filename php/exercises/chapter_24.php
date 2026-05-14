<?php
declare(strict_types=1);
/**
 * Chapter 24 — Behavioral Patterns Part 1
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_24.php
 */

// ── TODO 1: Strategy ──────────────────────────────────────────────────────────
// Implement a payment processing system using the Strategy pattern.
//
// PaymentStrategy interface: pay(int $amountCents): void
// Implementations:
//   - StripeStrategy  — echoes "Stripe: charged N cents"
//   - PayPalStrategy  — echoes "PayPal: charged N cents"
//   - BankTransferStrategy — echoes "Bank transfer: N cents initiated"
//
// PaymentProcessor:
//   - Accepts PaymentStrategy in constructor
//   - setStrategy(PaymentStrategy): void — swap at runtime
//   - checkout(int $amountCents): void — delegates to strategy

// YOUR CODE HERE
// interface PaymentStrategy { ... }
// class StripeStrategy implements PaymentStrategy { ... }
// class PayPalStrategy implements PaymentStrategy { ... }
// class BankTransferStrategy implements PaymentStrategy { ... }
// class PaymentProcessor { ... }

// Demonstration:
// $processor = new PaymentProcessor(new StripeStrategy());
// $processor->checkout(4999);
// $processor->setStrategy(new PayPalStrategy());
// $processor->checkout(1999);
// $processor->setStrategy(new BankTransferStrategy());
// $processor->checkout(25000);


// ── TODO 2: Observer ──────────────────────────────────────────────────────────
// Build a simple EventDispatcher:
//   addListener(string $event, EventListener $listener): void
//   dispatch(string $event, mixed $payload = null): void
//
// EventListener interface: handle(string $event, mixed $payload): void
//
// Create two listeners for the 'user.registered' event:
//   - SendWelcomeEmail — echoes "Sending welcome email to {email}"
//   - CreateAuditLog   — echoes "Audit: user registered: {email}"
//
// Dispatch 'user.registered' with ['email' => 'alice@example.com']
// and verify both listeners fire.

// YOUR CODE HERE
// interface EventListener { ... }
// class EventDispatcher { ... }
// class SendWelcomeEmail implements EventListener { ... }
// class CreateAuditLog implements EventListener { ... }

// Demonstration:
// $dispatcher = new EventDispatcher();
// $dispatcher->addListener('user.registered', new SendWelcomeEmail());
// $dispatcher->addListener('user.registered', new CreateAuditLog());
// $dispatcher->dispatch('user.registered', ['email' => 'alice@example.com']);


// ── TODO 3: Command ───────────────────────────────────────────────────────────
// Implement the Command pattern with undo support.
//
// Command interface:
//   execute(): void
//   undo(): void
//
// UserStore: simple in-memory store with add(string), remove(string), all(): array
//
// CreateUserCommand:
//   - Constructor: UserStore $store, string $email
//   - execute(): adds email to store
//   - undo():    removes email from store
//
// CommandInvoker:
//   - run(Command): executes and pushes to history stack
//   - undoLast():   pops and calls undo() on the last command
//
// Verify: after two run() calls and one undoLast(), only one user remains.

// YOUR CODE HERE
// interface Command { ... }
// class UserStore { ... }
// class CreateUserCommand implements Command { ... }
// class CommandInvoker { ... }

// Demonstration:
// $store   = new UserStore();
// $invoker = new CommandInvoker();
// $invoker->run(new CreateUserCommand($store, 'alice@example.com'));
// $invoker->run(new CreateUserCommand($store, 'bob@example.com'));
// print_r($store->all()); // [alice, bob]
// $invoker->undoLast();
// print_r($store->all()); // [alice]


// ── TODO 4: Chain of Responsibility ──────────────────────────────────────────
// Build a middleware pipeline: AuthMiddleware -> RateLimitMiddleware -> final handler
//
// Request: readonly class with string $path, array $headers
// Response: readonly class with string $body
//
// Middleware interface: handle(Request $request, callable $next): Response
//
// AuthMiddleware:
//   - If 'Authorization' header missing, return Response('401 Unauthorized')
//   - Otherwise call $next($request)
//
// RateLimitMiddleware:
//   - Always allows (for this exercise), echoes "RateLimit: OK" and calls $next
//
// Pipeline:
//   - Constructor accepts Middleware[]
//   - run(Request $request, callable $finalHandler): Response
//     Uses array_reduce to build the chain
//
// Test with and without the Authorization header.

// YOUR CODE HERE
// readonly class Request { ... }
// readonly class Response { ... }
// interface Middleware { ... }
// class AuthMiddleware implements Middleware { ... }
// class RateLimitMiddleware implements Middleware { ... }
// class Pipeline { ... }

// Demonstration:
// $pipeline = new Pipeline([new AuthMiddleware(), new RateLimitMiddleware()]);
//
// $ok = $pipeline->run(
//     new Request('/api/orders', ['Authorization' => 'Bearer token']),
//     fn(Request $r) => new Response("200 OK: {$r->path}")
// );
// echo $ok->body . PHP_EOL;  // 200 OK: /api/orders
//
// $denied = $pipeline->run(
//     new Request('/api/orders', []),
//     fn(Request $r) => new Response("200 OK: {$r->path}")
// );
// echo $denied->body . PHP_EOL; // 401 Unauthorized


// ── TODO 5: Custom Iterator ───────────────────────────────────────────────────
// Implement PaginatedIterator that simulates lazy-loaded paginated results.
//
// Constructor: int $perPage, int $totalItems
//
// loadPage(): generates items for the current page as integers
//   e.g. page 1 of 3-per-page with 7 total: items = [1, 2, 3]
//        page 2: [4, 5, 6]
//        page 3: [7]
//
// Implement all five \Iterator methods: current, key, next, rewind, valid
// When index reaches the end of a page, advance $page and reload.
//
// Verify: iterating with foreach over PaginatedIterator(3, 7) yields 1..7

// YOUR CODE HERE
// class PaginatedIterator implements \Iterator { ... }

// Demonstration:
// $iter = new PaginatedIterator(perPage: 3, totalItems: 7);
// foreach ($iter as $key => $value) {
//     echo "{$key}: {$value}" . PHP_EOL;
// }
// Expected: 0:1  1:2  2:3  3:4  4:5  5:6  6:7

echo PHP_EOL . "All TODOs complete!" . PHP_EOL;
