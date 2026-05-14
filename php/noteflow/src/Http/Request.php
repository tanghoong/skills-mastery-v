<?php

declare(strict_types=1);

namespace NoteFlow\Http;

readonly class Request
{
    /**
     * @param array<string, mixed>  $body    Parsed request body (POST fields or decoded JSON)
     * @param array<string, string> $params  URI route params extracted by the Router
     * @param array<string, string> $headers HTTP request headers
     */
    public function __construct(
        public string $method,
        public string $path,
        public array  $body    = [],
        public array  $params  = [],
        public array  $headers = [],
    ) {}

    /**
     * Build a Request from PHP superglobals.
     */
    public static function fromGlobals(): self
    {
        $method  = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $path    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
        $headers = self::parseHeaders();

        // Support method override via _method field (HTML forms can't send PUT/DELETE)
        $body = match ($method) {
            'POST' => self::parseBody($headers),
            default => [],
        };

        $override = strtoupper($body['_method'] ?? '');
        if ($override !== '' && in_array($override, ['PUT', 'PATCH', 'DELETE'], true)) {
            $method = $override;
        }

        return new self(
            method:  $method,
            path:    rtrim($path, '/') ?: '/',
            body:    $body,
            params:  [],
            headers: $headers,
        );
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Parse request body as either JSON (Content-Type: application/json)
     * or standard form-encoded ($_POST).
     *
     * @param array<string, string> $headers
     * @return array<string, mixed>
     */
    private static function parseBody(array $headers): array
    {
        $contentType = $headers['content-type'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input');
            return $raw !== false ? (json_decode($raw, true) ?? []) : [];
        }

        return $_POST;
    }

    /**
     * @return array<string, string>
     */
    private static function parseHeaders(): array
    {
        $headers = [];

        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name           = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = (string) $value;
            }
        }

        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }

        return $headers;
    }
}
