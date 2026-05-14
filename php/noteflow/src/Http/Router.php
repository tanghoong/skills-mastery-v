<?php

declare(strict_types=1);

namespace NoteFlow\Http;

use NoteFlow\Container\Container;

class Router
{
    /** @var array<int, array{method: string, pattern: string, handler: array, middleware: array}> */
    private array $routes = [];

    public function __construct(private readonly Container $container) {}

    /**
     * Register a GET route.
     *
     * @param array<class-string> $middleware
     */
    public function get(string $uri, array $handler, array $middleware = []): void
    {
        $this->addRoute('GET', $uri, $handler, $middleware);
    }

    /**
     * Register a POST route.
     *
     * @param array<class-string> $middleware
     */
    public function post(string $uri, array $handler, array $middleware = []): void
    {
        $this->addRoute('POST', $uri, $handler, $middleware);
    }

    /**
     * Register a PUT route.
     *
     * @param array<class-string> $middleware
     */
    public function put(string $uri, array $handler, array $middleware = []): void
    {
        $this->addRoute('PUT', $uri, $handler, $middleware);
    }

    /**
     * Register a DELETE route.
     *
     * @param array<class-string> $middleware
     */
    public function delete(string $uri, array $handler, array $middleware = []): void
    {
        $this->addRoute('DELETE', $uri, $handler, $middleware);
    }

    /**
     * Dispatch the incoming request to the matching route handler,
     * running all registered middleware first.
     */
    public function dispatch(Request $request): void
    {
        $method = strtoupper($request->method);

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $params = $this->matchUri($route['pattern'], $request->path);

            if ($params === null) {
                continue;
            }

            // Attach matched URI params to a new Request
            $request = new Request(
                method:  $request->method,
                path:    $request->path,
                body:    $request->body,
                params:  $params,
                headers: $request->headers,
            );

            // Build middleware pipeline
            $handler = function (Request $req) use ($route): void {
                [$controllerClass, $action] = $route['handler'];
                $controller = $this->container->get($controllerClass);
                $controller->$action($req);
            };

            $pipeline = array_reduce(
                array_reverse($route['middleware']),
                function (callable $next, string $middlewareClass): callable {
                    return function (Request $req) use ($next, $middlewareClass): void {
                        /** @var object $mw */
                        $mw = $this->container->has($middlewareClass)
                            ? $this->container->get($middlewareClass)
                            : new $middlewareClass();
                        $mw->handle($req, $next);
                    };
                },
                $handler
            );

            $pipeline($request);
            return;
        }

        // No route matched
        http_response_code(404);
        echo '404 Not Found';
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function addRoute(string $method, string $uri, array $handler, array $middleware): void
    {
        $pattern = $this->uriToRegex($uri);
        $this->routes[] = [
            'method'     => strtoupper($method),
            'pattern'    => $pattern,
            'handler'    => $handler,
            'middleware' => $middleware,
        ];
    }

    /**
     * Convert a URI template like `/notes/{id}` to a named-capture regex.
     * e.g. `#^/notes/(?P<id>[^/]+)$#`
     */
    private function uriToRegex(string $uri): string
    {
        $pattern = preg_replace('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', '(?P<$1>[^/]+)', $uri);
        return '#^' . $pattern . '$#';
    }

    /**
     * Match a URI against a compiled regex pattern.
     * Returns an associative array of named captures, or null on no match.
     *
     * @return array<string, string>|null
     */
    private function matchUri(string $pattern, string $uri): ?array
    {
        if (!preg_match($pattern, $uri, $matches)) {
            return null;
        }

        // Filter out numeric keys — keep only named captures
        return array_filter(
            $matches,
            fn($key) => is_string($key),
            ARRAY_FILTER_USE_KEY
        );
    }
}
