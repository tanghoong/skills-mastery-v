# Chapter 37 — HTTP & cURL

> **Goal:** Make reliable outbound HTTP requests in PHP using both cURL and stream contexts, handle JSON, and implement retry logic for resilient API integrations.

## 37.1 cURL Fundamentals

cURL is the standard PHP extension for making HTTP requests. It is lower-level than Node's `fetch` or `axios`, but equally powerful. Every cURL flow follows the same four steps: initialise, configure, execute, close.

```php
<?php
declare(strict_types=1);

$ch = curl_init('https://httpbin.org/get');

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,   // return body as string, don't print
    CURLOPT_FOLLOWLOCATION => true,   // follow redirects
    CURLOPT_TIMEOUT        => 10,     // total request timeout in seconds
    CURLOPT_CONNECTTIMEOUT => 5,      // connection timeout in seconds
    CURLOPT_USERAGENT      => 'MyApp/1.0',
]);

$body = curl_exec($ch);
$info = curl_getinfo($ch);

if (curl_errno($ch)) {
    throw new RuntimeException('cURL error: ' . curl_error($ch));
}

curl_close($ch);

$statusCode = $info['http_code'];
echo "Status: {$statusCode}" . PHP_EOL;
```

Always check `curl_errno` before using `$body` — `curl_exec` returns `false` on network failure.

## 37.2 `curl_setopt` Cheatsheet

The most commonly needed options:

| Option | Purpose |
|---|---|
| `CURLOPT_RETURNTRANSFER` | Return response as string (not print) |
| `CURLOPT_POST` | Set request method to POST |
| `CURLOPT_POSTFIELDS` | Set request body (string or array) |
| `CURLOPT_HTTPHEADER` | Set request headers as `['Name: Value']` array |
| `CURLOPT_TIMEOUT` | Max seconds for the entire request |
| `CURLOPT_CONNECTTIMEOUT` | Max seconds to establish connection |
| `CURLOPT_FOLLOWLOCATION` | Follow HTTP redirects |
| `CURLOPT_SSL_VERIFYPEER` | Verify SSL certificate (never disable in production) |
| `CURLOPT_VERBOSE` | Print debug info to STDERR (debugging only) |
| `CURLOPT_HEADER` | Include response headers in output |
| `CURLOPT_CUSTOMREQUEST` | Set arbitrary method (`PUT`, `PATCH`, `DELETE`) |

## 37.3 Making a POST Request with JSON

Sending a JSON body requires setting the `Content-Type` header and encoding the payload with `json_encode`.

```php
<?php
declare(strict_types=1);

function postJson(string $url, array $payload): array
{
    $json = json_encode($payload, JSON_THROW_ON_ERROR);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $json,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json',
            'Content-Length: ' . strlen($json),
        ],
        CURLOPT_TIMEOUT        => 15,
    ]);

    $body = curl_exec($ch);

    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException("cURL error: {$error}");
    }

    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($statusCode < 200 || $statusCode >= 300) {
        throw new RuntimeException("HTTP {$statusCode}: {$body}");
    }

    return json_decode((string)$body, associative: true, flags: JSON_THROW_ON_ERROR);
}

$result = postJson('https://httpbin.org/post', ['name' => 'Charlie', 'score' => 99]);
echo "Received: " . $result['json']['name'] . PHP_EOL;
```

This is the PHP equivalent of:

```typescript
const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
});
```

## 37.4 Retry Logic with Exponential Backoff

Transient network errors and rate-limit responses (HTTP 429) warrant automatic retries. Exponential backoff with jitter is the standard approach.

```php
<?php
declare(strict_types=1);

function getWithRetry(string $url, int $maxRetries = 3): string
{
    $attempt = 0;

    while (true) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
        ]);

        $body       = curl_exec($ch);
        $errno      = curl_errno($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $isRetryable = $errno !== 0
            || $statusCode === 429
            || ($statusCode >= 500 && $statusCode < 600);

        if (!$isRetryable || $attempt >= $maxRetries) {
            if ($errno !== 0) {
                throw new RuntimeException("cURL failed after {$attempt} retries.");
            }
            return (string)$body;
        }

        $delay = (int)(2 ** $attempt * 1000 + random_int(0, 500)); // ms
        echo "Retry {$attempt} in {$delay}ms..." . PHP_EOL;
        usleep($delay * 1_000); // usleep takes microseconds
        $attempt++;
    }
}
```

## 37.5 HTTP Requests with `stream_context_create`

For simple GET requests where you do not want to depend on the cURL extension, PHP's stream wrappers provide a lightweight alternative using `file_get_contents` with an HTTP context.

```php
<?php
declare(strict_types=1);

$context = stream_context_create([
    'http' => [
        'method'  => 'GET',
        'header'  => "Accept: application/json\r\nUser-Agent: MyApp/1.0\r\n",
        'timeout' => 10,
    ],
    'ssl' => [
        'verify_peer'      => true,
        'verify_peer_name' => true,
    ],
]);

$body = file_get_contents('https://httpbin.org/get', context: $context);

if ($body === false) {
    throw new RuntimeException('Request failed.');
}

$data = json_decode($body, associative: true, flags: JSON_THROW_ON_ERROR);
echo 'Origin IP: ' . $data['origin'] . PHP_EOL;
```

Use cURL for production — it gives you better error reporting, connection pooling, and timeout granularity. Use stream contexts for quick scripts where the cURL extension may not be available.

## 37.6 JSON Validation with `json_validate` (PHP 8.3+)

PHP 8.3 added `json_validate()` — a fast, allocation-free check that a string is valid JSON without decoding it. This is useful for validating incoming webhook payloads before doing any processing.

```php
<?php
declare(strict_types=1);

function parsePayload(string $raw): array
{
    if (!json_validate($raw)) {
        throw new InvalidArgumentException('Invalid JSON payload.');
    }

    return json_decode($raw, associative: true, flags: JSON_THROW_ON_ERROR);
}

$good = '{"event":"push","ref":"refs/heads/main"}';
$bad  = '{bad json}';

var_dump(json_validate($good)); // bool(true)
var_dump(json_validate($bad));  // bool(false)

$payload = parsePayload($good);
echo $payload['event'] . PHP_EOL; // push
```

## Key Takeaways

- The cURL lifecycle is always: `curl_init` → `curl_setopt_array` → `curl_exec` → check `curl_errno` → `curl_close`.
- Use `JSON_THROW_ON_ERROR` with `json_encode`/`json_decode` so encoding failures throw exceptions rather than returning `false`.
- Always set `CURLOPT_TIMEOUT` and `CURLOPT_CONNECTTIMEOUT` — without them, a slow server can stall your script indefinitely.
- Implement retry logic for 5xx and 429 responses; use exponential backoff with a small random jitter to avoid thundering herd.
- `stream_context_create` + `file_get_contents` is a cURL-free alternative for simple GET requests.
- `json_validate()` (PHP 8.3+) validates JSON without decoding — use it as a fast guard before `json_decode`.

## What's Next

Chapter 38 covers security essentials: password hashing, SQL injection prevention, XSS escaping, CSRF tokens, and secure HTTP headers.
