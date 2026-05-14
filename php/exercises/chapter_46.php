<?php
declare(strict_types=1);
/**
 * Chapter 46 — Microframeworks
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_46.php
 *
 * Implements a Slim 4-inspired micro-app in pure PHP (no Composer needed).
 * Goal: understand PSR-7 shapes, middleware pipelines, and routing.
 */

// ── TODO 1: Slim-inspired micro-app skeleton ──────────────────────────────────
// Implement:
//   class App with:
//     get(string $path, callable $handler): void
//     post(string $path, callable $handler): void
//     run(string $method, string $path): void   (simulate dispatch)
//   class StubRequest  — holds method, path, query
//   class StubResponse — holds status, headers, body; withJson(), withStatus()
// Demonstrate GET /ping returning {'pong': true}

echo "── TODO 1: Micro-app skeleton ──────────────────────────────────────────\n";

final class StubRequest
{
    /** @var array<string, string> */
    public readonly array $params; // route params like {id}

    /**
     * @param array<string, string> $query
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query = [],
    ) {
        $this->params = [];
    }

    /** @param array<string, string> $params */
    public function withParams(array $params): static
    {
        $clone         = clone $this;
        /** @phpstan-ignore-next-line */
        $clone->params = $params;
        return $clone;
    }
}

final class StubResponse
{
    private int    $status  = 200;

    /** @var array<string, string> */
    private array  $headers = [];
    private string $body    = '';

    public function withJson(mixed $data, int $status = 200): static
    {
        $clone          = clone $this;
        $clone->status  = $status;
        $clone->headers = array_merge($clone->headers, ['Content-Type' => 'application/json']);
        $clone->body    = json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
        return $clone;
    }

    public function withStatus(int $status): static
    {
        $clone         = clone $this;
        $clone->status = $status;
        return $clone;
    }

    public function write(string $body): static
    {
        $clone       = clone $this;
        $clone->body = $body;
        return $clone;
    }

    public function send(): void
    {
        printf("[%d] ", $this->status);
        if (isset($this->headers['Content-Type'])) {
            printf("Content-Type: %s\n", $this->headers['Content-Type']);
        }
        echo $this->body . "\n";
    }

    public function getStatus(): int    { return $this->status; }
    public function getBody(): string   { return $this->body; }
}

final class App
{
    /** @var array<string, array<string, callable>> */
    private array $routes = [];

    /** @var list<callable> */
    private array $middleware = [];

    public function get(string $path, callable $handler): void
    {
        $this->routes['GET'][$path] = $handler;
    }

    public function post(string $path, callable $handler): void
    {
        $this->routes['POST'][$path] = $handler;
    }

    public function add(callable $middleware): void
    {
        $this->middleware[] = $middleware;
    }

    public function run(string $method, string $path): void
    {
        $request  = new StubRequest(strtoupper($method), $path);
        $response = new StubResponse();

        // Match route (supports {param} placeholders)
        $handler = null;
        $params  = [];
        foreach ($this->routes[$request->method] ?? [] as $routePath => $routeHandler) {
            $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $routePath);
            if (preg_match('#^' . $pattern . '$#', $path, $matches)) {
                $handler = $routeHandler;
                $params  = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                $request = $request->withParams($params);
                break;
            }
        }

        if ($handler === null) {
            (new StubResponse())->withJson(['error' => 'Not Found'], 404)->send();
            return;
        }

        // Build middleware pipeline (LIFO — last added, first executed)
        $core = fn(StubRequest $req, StubResponse $res): StubResponse => $handler($req, $res);

        $pipeline = array_reduce(
            array_reverse($this->middleware),
            fn(callable $next, callable $mw): callable =>
                fn(StubRequest $req, StubResponse $res): StubResponse => $mw($req, $res, $next),
            $core,
        );

        $result = $pipeline($request, $response);
        $result->send();
    }
}

$app = new App();

$app->get('/ping', fn(StubRequest $req, StubResponse $res): StubResponse =>
    $res->withJson(['pong' => true])
);

$app->get('/users/{id}', fn(StubRequest $req, StubResponse $res): StubResponse =>
    $res->withJson(['id' => (int) $req->params['id'], 'name' => 'Alice'])
);

$app->post('/notes', fn(StubRequest $req, StubResponse $res): StubResponse =>
    $res->withJson(['created' => true, 'id' => 42], 201)
);

$app->run('GET', '/ping');
$app->run('GET', '/users/7');
$app->run('POST', '/notes');
$app->run('GET', '/missing');

// ── TODO 2: Middleware pipeline ───────────────────────────────────────────────
// Add two middleware to the app:
//   1. Logging middleware — prints "[REQ] METHOD /path" before and "[RES] STATUS" after
//   2. Timing middleware — prints elapsed ms after the handler runs
// Confirm the LIFO order: timing wraps logging which wraps the handler.

echo "\n── TODO 2: Middleware pipeline ─────────────────────────────────────────\n";

$app2 = new App();

$app2->get('/api/health', fn(StubRequest $req, StubResponse $res): StubResponse =>
    $res->withJson(['status' => 'ok', 'php' => PHP_VERSION])
);

// Middleware 1: Logging
$loggingMiddleware = function (
    StubRequest $req,
    StubResponse $res,
    callable $next,
): StubResponse {
    printf("  [LOG]  --> %s %s\n", $req->method, $req->path);
    $response = $next($req, $res);
    printf("  [LOG]  <-- %d\n", $response->getStatus());
    return $response;
};

// Middleware 2: Timing
$timingMiddleware = function (
    StubRequest $req,
    StubResponse $res,
    callable $next,
): StubResponse {
    $start    = microtime(true);
    $response = $next($req, $res);
    $elapsed  = round((microtime(true) - $start) * 1000, 3);
    printf("  [TIME] %.3f ms\n", $elapsed);
    return $response;
};

// LIFO: timing added last → runs outermost → wraps logging
$app2->add($loggingMiddleware);
$app2->add($timingMiddleware);

$app2->run('GET', '/api/health');

// ── TODO 3: PSR-7 ServerRequestInterface shape ────────────────────────────────
// Write a stub class that documents the PSR-7 ServerRequestInterface shape.
// Implement the key methods as stubs (return dummy values).
// The goal is to understand the contract — not to implement it fully.

echo "\n── TODO 3: PSR-7 ServerRequest stub ────────────────────────────────────\n";

interface MessageInterface
{
    public function getProtocolVersion(): string;
    public function getHeaders(): array;
    public function getHeader(string $name): array;
    public function getHeaderLine(string $name): string;
    public function hasHeader(string $name): bool;
    public function getBody(): string;
}

interface RequestInterface extends MessageInterface
{
    public function getRequestTarget(): string;
    public function getMethod(): string;
    public function getUri(): string;
}

interface ServerRequestInterface extends RequestInterface
{
    public function getServerParams(): array;
    public function getCookieParams(): array;
    public function getQueryParams(): array;
    /** @return array<string, mixed>|null|object */
    public function getParsedBody(): array|null|object;
    public function getUploadedFiles(): array;
    public function getAttributes(): array;
    public function getAttribute(string $name, mixed $default = null): mixed;
}

final class StubServerRequest implements ServerRequestInterface
{
    public function getProtocolVersion(): string { return '1.1'; }

    public function getHeaders(): array
    {
        return ['Content-Type' => ['application/json'], 'Accept' => ['application/json']];
    }

    public function getHeader(string $name): array      { return [$name => 'stub']; }
    public function getHeaderLine(string $name): string { return 'stub'; }
    public function hasHeader(string $name): bool       { return true; }
    public function getBody(): string                   { return '{"key":"value"}'; }
    public function getRequestTarget(): string          { return '/api/notes?page=1'; }
    public function getMethod(): string                 { return 'GET'; }
    public function getUri(): string                    { return 'https://app.example.com/api/notes'; }
    public function getServerParams(): array            { return $_SERVER; }
    public function getCookieParams(): array            { return $_COOKIE; }
    public function getQueryParams(): array             { return ['page' => '1', 'sort' => 'name']; }
    public function getParsedBody(): array|null|object  { return ['title' => 'My Note']; }
    public function getUploadedFiles(): array           { return []; }
    public function getAttributes(): array              { return ['id' => 42]; }
    public function getAttribute(string $name, mixed $default = null): mixed
    {
        return $this->getAttributes()[$name] ?? $default;
    }
}

$psr7Request = new StubServerRequest();
printf("Method      : %s\n", $psr7Request->getMethod());
printf("URI         : %s\n", $psr7Request->getUri());
printf("Query params: %s\n", json_encode($psr7Request->getQueryParams()));
printf("Attribute id: %s\n", $psr7Request->getAttribute('id', 'none'));

// ── TODO 4: Real Slim 4 code as comment block ─────────────────────────────────
// Show how a real Slim 4 app maps to the stubs above.

/*
 * ── Real Slim 4 equivalent ───────────────────────────────────────────────────
 *
 * composer require slim/slim slim/psr7 php-di/slim-bridge
 *
 * <?php
 * use Slim\Factory\AppFactory;
 * use Psr\Http\Message\ResponseInterface as Response;
 * use Psr\Http\Message\ServerRequestInterface as Request;
 *
 * $app = AppFactory::create();
 *
 * // Built-in middleware (maps to our loggingMiddleware + errorHandling)
 * $app->addBodyParsingMiddleware();
 * $app->addRoutingMiddleware();
 * $app->addErrorMiddleware(displayErrorDetails: true, logErrors: true, logErrorDetails: true);
 *
 * // Custom middleware — same LIFO order as our stub
 * $app->add(function (Request $request, Handler $handler): Response {
 *     $start    = microtime(true);
 *     $response = $handler->handle($request);
 *     $elapsed  = round((microtime(true) - $start) * 1000, 3);
 *     return $response->withHeader('X-Response-Time', "{$elapsed}ms");
 * });
 *
 * // Routes
 * $app->get('/ping', function (Request $req, Response $res): Response {
 *     $res->getBody()->write(json_encode(['pong' => true]));
 *     return $res->withHeader('Content-Type', 'application/json');
 * });
 *
 * $app->get('/users/{id:\d+}', function (Request $req, Response $res, array $args): Response {
 *     $id = (int) $args['id'];
 *     $res->getBody()->write(json_encode(['id' => $id, 'name' => 'Alice']));
 *     return $res->withHeader('Content-Type', 'application/json');
 * });
 *
 * $app->run();
 *
 * Key differences from our stub:
 *   - Real Slim uses nyholm/psr7 (or laminas/diactoros) for true PSR-7 objects.
 *   - Response body is a StreamInterface, not a plain string — write() appends.
 *   - Route params arrive as $args array in the handler, not via $request->params.
 *   - addErrorMiddleware() gives a JSON error body for unhandled exceptions.
 *   - Slim supports route groups, named routes, and URL generation.
 * ──────────────────────────────────────────────────────────────────────────────
 */

echo "\nReal Slim 4 code documented in comment block above TODO 4.\n";

// ── TODO 5: 3 scenarios where a microframework beats full-stack ───────────────

/*
 * ── Scenarios where Slim/Lumen beats Laravel/Symfony ────────────────────────
 *
 * 1. Serverless / cold-start sensitive deployments (AWS Lambda, Google Cloud Run).
 *    Laravel boots in ~150 ms; Slim boots in ~5 ms.
 *    At scale, that 145 ms difference directly hits P99 latency and cost per request.
 *    A Slim app running on Lambda with provisioned concurrency handles spiky traffic
 *    cheaply with near-zero cold starts.
 *
 * 2. Single-responsibility internal services.
 *    A PDF generation service, image resize worker, or webhook relay has no need for
 *    an ORM, queue system, or session management. Each Laravel package you don't install
 *    is one less attack surface and one fewer dependency to keep updated.
 *    Slim routes HTTP → your library (mPDF, Imagick, Guzzle). That's the whole app.
 *
 * 3. Embedding PHP in an existing non-PHP architecture.
 *    You have a Java monolith and want to expose a new PHP-based endpoint alongside it.
 *    Slim can be dropped into a directory, given a single nginx location block, and
 *    run independently. Introducing a full Laravel app requires migrating session
 *    management, CORS, and auth middleware that already exists in the Java layer.
 *    A microframework adds only what is truly missing.
 */

echo "Microframework scenarios documented in comment block above TODO 5.\n";
