<?php
declare(strict_types=1);
/**
 * Chapter 45 — Symfony (High-Level Tour)
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_45.php
 *
 * No Symfony installed — we build stubs that mirror Symfony's API shape.
 */

// ── TODO 1: DI container simulation ─────────────────────────────────────────
// Simulate Symfony's DI container in two ways:
//   a) Show what the YAML service config looks like (as a PHP comment)
//   b) Build a working PHP alternative: a SimpleContainer with:
//        bind(string $abstract, callable $factory): void
//        make(string $abstract): mixed
//      Wire LoggerInterface → FileLogger and show autowiring

echo "── TODO 1: DI container simulation ────────────────────────────────────\n";

/*
 * Symfony services.yaml equivalent:
 * ─────────────────────────────────
 * services:
 *     _defaults:
 *         autowire: true
 *         autoconfigure: true
 *
 *     App\Service\PostPublisher:
 *         # Symfony resolves constructor args by type automatically
 *
 *     App\Repository\PostRepository:
 *         arguments:
 *             $entityManager: '@doctrine.orm.entity_manager'
 *
 *     Psr\Log\LoggerInterface: '@monolog.logger'
 *
 * With autowire: true, you simply type-hint the interface in a constructor
 * and Symfony resolves the concrete implementation — no explicit binding needed.
 */

interface LoggerInterface
{
    public function info(string $message, mixed ...$context): void;
    public function error(string $message, mixed ...$context): void;
}

final class FileLogger implements LoggerInterface
{
    public function __construct(private readonly string $channel = 'app') {}

    public function info(string $message, mixed ...$context): void
    {
        printf("[INFO][%s] %s %s\n", $this->channel, $message,
            $context !== [] ? json_encode($context) : '');
    }

    public function error(string $message, mixed ...$context): void
    {
        printf("[ERROR][%s] %s %s\n", $this->channel, $message,
            $context !== [] ? json_encode($context) : '');
    }
}

final class SimpleContainer
{
    /** @var array<string, callable> */
    private array $bindings = [];

    /** @var array<string, mixed> */
    private array $resolved = [];

    public function bind(string $abstract, callable $factory): void
    {
        $this->bindings[$abstract] = $factory;
    }

    public function make(string $abstract): mixed
    {
        if (isset($this->resolved[$abstract])) {
            return $this->resolved[$abstract];
        }

        if (!isset($this->bindings[$abstract])) {
            throw new \RuntimeException("No binding for: {$abstract}");
        }

        $this->resolved[$abstract] = ($this->bindings[$abstract])($this);
        return $this->resolved[$abstract];
    }
}

$container = new SimpleContainer();
$container->bind(LoggerInterface::class, fn(): FileLogger => new FileLogger('noteflow'));

$logger = $container->make(LoggerInterface::class);
$logger->info('Container resolved successfully');
$logger->error('Example error', ['code' => 500]);

// Singleton behaviour — same instance returned
$logger2 = $container->make(LoggerInterface::class);
printf("Same instance: %s\n", ($logger === $logger2) ? 'yes' : 'no');

// ── TODO 2: HttpFoundation-inspired Request::createFromGlobals() ─────────────
// Build a minimal Request class with a static createFromGlobals() constructor.
// Properties: method (string), path (string), query (array), body (array), headers (array)
// Populate from $_SERVER, $_GET, $_POST — or from a simulated environment.
// Add typed accessors: getMethod(), getPath(), query(string $key, mixed $default)

echo "\n── TODO 2: HttpFoundation-inspired Request ──────────────────────────────\n";

final class Request
{
    private function __construct(
        private readonly string $method,
        private readonly string $path,
        /** @var array<string, string> */
        private readonly array $query,
        /** @var array<string, mixed> */
        private readonly array $body,
        /** @var array<string, string> */
        private readonly array $headers,
    ) {}

    public static function createFromGlobals(): static
    {
        return new static(
            method:  strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            path:    parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/',
            query:   $_GET,
            body:    $_POST,
            headers: array_filter(
                $_SERVER,
                fn(string $key): bool => str_starts_with($key, 'HTTP_'),
                ARRAY_FILTER_USE_KEY,
            ),
        );
    }

    /**
     * Simulate a request — useful in tests or CLI.
     *
     * @param array<string, string> $query
     * @param array<string, mixed>  $body
     * @param array<string, string> $headers
     */
    public static function create(
        string $method,
        string $path,
        array $query   = [],
        array $body    = [],
        array $headers = [],
    ): static {
        return new static(
            method:  strtoupper($method),
            path:    $path,
            query:   $query,
            body:    $body,
            headers: $headers,
        );
    }

    public function getMethod(): string { return $this->method; }
    public function getPath(): string   { return $this->path; }

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    public function header(string $name, ?string $default = null): ?string
    {
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $this->headers[$serverKey] ?? $default;
    }
}

$req = Request::create('GET', '/api/posts', query: ['page' => '2', 'sort' => 'name']);
printf("Method : %s\n", $req->getMethod());
printf("Path   : %s\n", $req->getPath());
printf("page   : %s\n", $req->query('page', '1'));
printf("sort   : %s\n", $req->query('sort', 'id'));
printf("missing: %s\n", $req->query('missing', 'default'));

// ── TODO 3: Symfony Console — Command base class + GreetCommand ───────────────
// Implement:
//   abstract class Command with configure() and execute() template
//   GreetCommand extends Command — configures 'app:greet' with a 'name' argument
// Simulate running it by instantiating and calling run(['Alice'])

echo "\n── TODO 3: Symfony Console simulation ──────────────────────────────────\n";

abstract class Command
{
    protected string $name        = '';
    protected string $description = '';

    /** @var array<string, string> */
    protected array $argumentDefs = [];

    final public function __construct()
    {
        $this->configure();
    }

    abstract protected function configure(): void;

    /** @param array<string, string> $args */
    abstract protected function execute(array $args): int;

    protected function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    protected function setDescription(string $description): static
    {
        $this->description = $description;
        return $this;
    }

    protected function addArgument(string $name, string $description = ''): static
    {
        $this->argumentDefs[$name] = $description;
        return $this;
    }

    /** @param list<string> $argv */
    final public function run(array $argv = []): int
    {
        $args = [];
        $keys = array_keys($this->argumentDefs);
        foreach ($keys as $i => $key) {
            $args[$key] = $argv[$i] ?? '';
        }
        return $this->execute($args);
    }

    final public function getName(): string        { return $this->name; }
    final public function getDescription(): string { return $this->description; }
}

final class GreetCommand extends Command
{
    public const SUCCESS = 0;
    public const FAILURE = 1;

    protected function configure(): void
    {
        $this
            ->setName('app:greet')
            ->setDescription('Greet a user by name')
            ->addArgument('name', 'The name to greet');
    }

    protected function execute(array $args): int
    {
        $name = $args['name'] ?? '';
        if ($name === '') {
            echo "[ERROR] Name argument is required.\n";
            return self::FAILURE;
        }
        printf("[INFO] Hello, %s! Welcome to Symfony Console.\n", $name);
        return self::SUCCESS;
    }
}

$greet  = new GreetCommand();
printf("Command: %s — %s\n", $greet->getName(), $greet->getDescription());
$greet->run(['Alice']);
$greet->run(['Bob']);
$greet->run([]);  // missing argument

// ── TODO 4: Minimal EventDispatcher — addListener / dispatch ─────────────────
// Implement EventDispatcher with:
//   addListener(string $event, callable $listener, int $priority = 0): void
//   dispatch(object $event, string $eventName = ''): void
// Listeners with higher priority fire first.
// Note in a comment how this differs from the Observer pattern in Ch. 24.

echo "\n── TODO 4: EventDispatcher ─────────────────────────────────────────────\n";

final class GenericEvent
{
    private bool $propagationStopped = false;

    public function __construct(private readonly mixed $subject) {}

    public function getSubject(): mixed { return $this->subject; }

    public function stopPropagation(): void { $this->propagationStopped = true; }

    public function isPropagationStopped(): bool { return $this->propagationStopped; }
}

final class EventDispatcher
{
    /**
     * @var array<string, array<int, list<callable>>>
     *      eventName => [ priority => [listeners] ]
     */
    private array $listeners = [];

    public function addListener(string $event, callable $listener, int $priority = 0): void
    {
        $this->listeners[$event][$priority][] = $listener;
    }

    public function dispatch(object $event, string $eventName = ''): void
    {
        $name = $eventName !== '' ? $eventName : $event::class;

        if (!isset($this->listeners[$name])) {
            return;
        }

        // Sort by priority descending (higher number = runs first)
        krsort($this->listeners[$name]);

        foreach ($this->listeners[$name] as $group) {
            foreach ($group as $listener) {
                if ($event instanceof GenericEvent && $event->isPropagationStopped()) {
                    return;
                }
                $listener($event);
            }
        }
    }
}

/*
 * Difference from Ch. 24 Observer pattern:
 * ─────────────────────────────────────────
 * Observer (Ch. 24):  The Subject holds a direct reference to Observers and calls
 *                     them by interface method (update()). The subject and observers
 *                     are coupled by the Observer interface.
 *
 * EventDispatcher:    The dispatcher is a separate object — neither the emitter nor
 *                     the listener knows about each other. Listeners are plain callables,
 *                     not implementations of a specific interface. The dispatcher also
 *                     supports priorities and propagation stopping, which the basic
 *                     Observer pattern does not.
 *
 *                     EventDispatcher = Observer + decoupling + priorities + stopPropagation.
 */

$dispatcher = new EventDispatcher();

$dispatcher->addListener('post.published', function (GenericEvent $e): void {
    printf("  [priority 0]  Sending email for: %s\n", $e->getSubject()['title']);
}, priority: 0);

$dispatcher->addListener('post.published', function (GenericEvent $e): void {
    printf("  [priority 10] Purging CDN cache for: %s\n", $e->getSubject()['title']);
}, priority: 10);

$dispatcher->addListener('post.published', function (GenericEvent $e): void {
    printf("  [priority 5]  Updating search index for: %s\n", $e->getSubject()['title']);
    // Uncomment to test propagation stopping:
    // $e->stopPropagation();
}, priority: 5);

echo "Dispatching post.published:\n";
$dispatcher->dispatch(new GenericEvent(['title' => 'Hello Symfony']), 'post.published');

// ── TODO 5: When to choose Symfony over Laravel ───────────────────────────────
// Document 4 scenarios in a comment block where Symfony is the better choice.

/*
 * ── When Symfony beats Laravel ──────────────────────────────────────────────
 *
 * 1. Building a Drupal, API Platform, or Shopware extension.
 *    These platforms are built on Symfony components. Knowing Symfony's DI
 *    container, EventDispatcher, and Security layer is mandatory.
 *
 * 2. Enterprise projects with strict architecture requirements.
 *    Symfony forces explicit service definitions and configuration. There is no
 *    magic — every dependency is traceable to a service definition. Auditors
 *    and architects prefer this transparency.
 *
 * 3. Long-lived APIs where flexibility matters more than speed-to-market.
 *    Symfony's modular component architecture means you only install what you need.
 *    A team can swap the ORM (Doctrine → custom) or serialiser without framework fights.
 *
 * 4. Teams that need fine-grained Security configuration.
 *    Symfony's Security component with firewalls, voters, and access controls is
 *    more explicit and powerful than Laravel's gate/policy system for complex
 *    permission models (multi-tenancy, hierarchical roles, resource-level ACLs).
 *
 * Short rule of thumb:
 *   Laravel  = best default for new products with standard requirements.
 *   Symfony  = best when you need maximum control, are extending an existing
 *              Symfony ecosystem, or are building for the long term with a large team.
 */

echo "\nSymfony vs Laravel: reasoning in comment block above TODO 5.\n";
