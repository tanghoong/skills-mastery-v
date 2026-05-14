# Chapter 24 — Behavioral Patterns Part 1

> **Goal:** Understand how Strategy, Observer, Command, Chain of Responsibility, and Iterator define the communication contracts between objects.

## 24.1 Strategy

Strategy defines a family of algorithms, encapsulates each one, and makes them interchangeable. The context delegates the algorithm to a composed strategy object rather than branching with conditionals.

```php
<?php
declare(strict_types=1);

interface PaymentStrategy {
    public function pay(int $amountCents): void;
}

class StripeStrategy implements PaymentStrategy {
    public function pay(int $amountCents): void {
        echo "Stripe: charged {$amountCents} cents" . PHP_EOL;
    }
}

class PayPalStrategy implements PaymentStrategy {
    public function pay(int $amountCents): void {
        echo "PayPal: charged {$amountCents} cents" . PHP_EOL;
    }
}

class PaymentProcessor {
    public function __construct(private PaymentStrategy $strategy) {}

    public function setStrategy(PaymentStrategy $strategy): void {
        $this->strategy = $strategy;
    }

    public function checkout(int $amountCents): void {
        $this->strategy->pay($amountCents);
    }
}

$processor = new PaymentProcessor(new StripeStrategy());
$processor->checkout(4999);

$processor->setStrategy(new PayPalStrategy());
$processor->checkout(1999);
```

Strategy eliminates `if/elseif` chains around payment types and lets you add new payment methods without touching `PaymentProcessor`.

## 24.2 Observer

Observer defines a one-to-many dependency: when one object (subject/emitter) changes state, all registered observers are notified automatically. PHP's SPL provides `SplSubject`/`SplObserver`; in practice, a simple event dispatcher is more flexible.

```php
<?php
declare(strict_types=1);

interface EventListener {
    public function handle(string $event, mixed $payload): void;
}

class EventDispatcher {
    /** @var array<string, EventListener[]> */
    private array $listeners = [];

    public function addListener(string $event, EventListener $listener): void {
        $this->listeners[$event][] = $listener;
    }

    public function dispatch(string $event, mixed $payload = null): void {
        foreach ($this->listeners[$event] ?? [] as $listener) {
            $listener->handle($event, $payload);
        }
    }
}

class SendWelcomeEmail implements EventListener {
    public function handle(string $event, mixed $payload): void {
        echo "Sending welcome email to {$payload['email']}" . PHP_EOL;
    }
}

class CreateAuditLog implements EventListener {
    public function handle(string $event, mixed $payload): void {
        echo "Audit: user.registered for {$payload['email']}" . PHP_EOL;
    }
}

$dispatcher = new EventDispatcher();
$dispatcher->addListener('user.registered', new SendWelcomeEmail());
$dispatcher->addListener('user.registered', new CreateAuditLog());
$dispatcher->dispatch('user.registered', ['email' => 'alice@example.com']);
```

## 24.3 Command

Command encapsulates a request as an object, allowing you to parameterise clients with queues, logs, or undoable operations. A command bus is a common PHP application of this pattern.

```php
<?php
declare(strict_types=1);

interface Command {
    public function execute(): void;
    public function undo(): void;
}

class UserStore {
    private array $users = [];
    public function add(string $email): void { $this->users[] = $email; }
    public function remove(string $email): void {
        $this->users = array_filter($this->users, fn($u) => $u !== $email);
    }
    public function all(): array { return array_values($this->users); }
}

class CreateUserCommand implements Command {
    public function __construct(
        private readonly UserStore $store,
        private readonly string $email
    ) {}

    public function execute(): void { $this->store->add($this->email); }
    public function undo(): void   { $this->store->remove($this->email); }
}

class CommandInvoker {
    private array $history = [];

    public function run(Command $command): void {
        $command->execute();
        $this->history[] = $command;
    }

    public function undoLast(): void {
        $command = array_pop($this->history);
        $command?->undo();
    }
}

$store   = new UserStore();
$invoker = new CommandInvoker();
$invoker->run(new CreateUserCommand($store, 'alice@example.com'));
$invoker->run(new CreateUserCommand($store, 'bob@example.com'));
print_r($store->all()); // [alice, bob]
$invoker->undoLast();
print_r($store->all()); // [alice]
```

## 24.4 Chain of Responsibility (PSR-15 Middleware Stack)

Chain of Responsibility passes a request through a chain of handlers. Each handler either processes the request or passes it to the next handler. PSR-15 formalises this as middleware in PHP HTTP applications.

```php
<?php
declare(strict_types=1);

class Request {
    public function __construct(
        public readonly string $path,
        public readonly array  $headers = []
    ) {}
}

class Response {
    public function __construct(public readonly string $body) {}
}

interface Middleware {
    public function handle(Request $request, callable $next): Response;
}

class AuthMiddleware implements Middleware {
    public function handle(Request $request, callable $next): Response {
        if (!isset($request->headers['Authorization'])) {
            return new Response('401 Unauthorized');
        }
        return $next($request);
    }
}

class RateLimitMiddleware implements Middleware {
    public function handle(Request $request, callable $next): Response {
        // Simplified — always allows
        echo "RateLimit: request allowed" . PHP_EOL;
        return $next($request);
    }
}

class Pipeline {
    /** @param Middleware[] $middlewares */
    public function __construct(private readonly array $middlewares) {}

    public function run(Request $request, callable $finalHandler): Response {
        $chain = array_reduce(
            array_reverse($this->middlewares),
            fn(callable $next, Middleware $mw) => fn(Request $req) => $mw->handle($req, $next),
            $finalHandler
        );
        return $chain($request);
    }
}

$pipeline = new Pipeline([new AuthMiddleware(), new RateLimitMiddleware()]);
$response = $pipeline->run(
    new Request('/api/users', ['Authorization' => 'Bearer token123']),
    fn(Request $r) => new Response("200 OK: {$r->path}")
);
echo $response->body . PHP_EOL;
```

## 24.5 Iterator (SPL + Custom)

Iterator provides a sequential interface to a collection without exposing its underlying structure. PHP's `\Iterator` interface requires five methods; SPL provides ready-made implementations for common cases.

```php
<?php
declare(strict_types=1);

/** Lazily paginates results without loading all pages into memory */
class PaginatedIterator implements \Iterator {
    private int $page    = 1;
    private int $index   = 0;
    private array $items = [];

    public function __construct(
        private readonly int $perPage,
        private readonly int $totalItems
    ) {
        $this->loadPage();
    }

    private function loadPage(): void {
        $offset      = ($this->page - 1) * $this->perPage;
        $count       = min($this->perPage, max(0, $this->totalItems - $offset));
        $this->items = range($offset + 1, $offset + $count);
    }

    public function current(): mixed { return $this->items[$this->index] ?? null; }
    public function key(): int       { return ($this->page - 1) * $this->perPage + $this->index; }
    public function next(): void {
        $this->index++;
        if ($this->index >= count($this->items) && $this->valid()) {
            $this->page++;
            $this->index = 0;
            $this->loadPage();
        }
    }
    public function rewind(): void { $this->page = 1; $this->index = 0; $this->loadPage(); }
    public function valid(): bool  { return $this->key() < $this->totalItems; }
}

$iter = new PaginatedIterator(perPage: 3, totalItems: 7);
foreach ($iter as $key => $value) {
    echo "{$key}: {$value}" . PHP_EOL;
}
```

## Key Takeaways

- Strategy replaces conditional dispatch with composable algorithm objects; swap strategies at runtime without changing the context.
- Observer decouples emitters from listeners — the emitter does not know who is listening, enabling open-ended extension.
- Command turns actions into first-class objects that support queuing, logging, and undo.
- Chain of Responsibility builds ordered processing pipelines where each step can short-circuit or delegate; PSR-15 middleware is its canonical PHP form.
- Iterator hides collection internals and enables lazy, memory-efficient traversal via PHP's `foreach` protocol.

## What's Next

Chapter 25 completes the Behavioural patterns with State, Template Method, Mediator, Memento, Visitor, and Null Object — patterns that model complex lifecycles and eliminate scattered conditional logic.
