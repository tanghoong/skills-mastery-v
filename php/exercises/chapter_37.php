<?php
declare(strict_types=1);
/**
 * Chapter 37 — HTTP & cURL
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_37.php
 *
 * Requires: the curl and openssl extensions (standard on most PHP installs).
 * Network access to httpbin.org is needed for TODOs 1–3.
 */

// ── TODO 1: GET request with cURL ─────────────────────────────────────────────
// Make a GET request to https://httpbin.org/get using cURL.
// Decode the JSON response and print the 'url' and 'origin' fields.
// Check curl_errno() before using the response body.

echo "=== TODO 1: cURL GET ===" . PHP_EOL;

function curlGet(string $url): array
{
    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_USERAGENT      => 'PHP-Mastery-Exercise/1.0',
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);

    $body     = curl_exec($ch);
    $errno    = curl_errno($ch);
    $errMsg   = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno !== 0) {
        throw new RuntimeException("cURL error [{$errno}]: {$errMsg}");
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        throw new RuntimeException("HTTP {$httpCode}: {$body}");
    }

    return json_decode((string)$body, associative: true, flags: JSON_THROW_ON_ERROR);
}

try {
    $data = curlGet('https://httpbin.org/get');
    echo "URL    : " . $data['url']    . PHP_EOL;
    echo "Origin : " . $data['origin'] . PHP_EOL;
} catch (RuntimeException $e) {
    echo "GET failed: " . $e->getMessage() . PHP_EOL;
}

// ── TODO 2: POST request with JSON body ──────────────────────────────────────
// Make a POST request to https://httpbin.org/post.
// Send a JSON body: {"language": "php", "version": "8.4"}.
// Set Content-Type: application/json.
// Print the 'json' field from the decoded response (httpbin echoes your payload).

echo PHP_EOL . "=== TODO 2: cURL POST with JSON ===" . PHP_EOL;

function curlPostJson(string $url, array $payload): array
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
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);

    $body     = curl_exec($ch);
    $errno    = curl_errno($ch);
    $errMsg   = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno !== 0) {
        throw new RuntimeException("cURL error [{$errno}]: {$errMsg}");
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        throw new RuntimeException("HTTP {$httpCode}: {$body}");
    }

    return json_decode((string)$body, associative: true, flags: JSON_THROW_ON_ERROR);
}

try {
    $result = curlPostJson('https://httpbin.org/post', [
        'language' => 'php',
        'version'  => '8.4',
    ]);

    echo "Echoed JSON from server:" . PHP_EOL;
    foreach ($result['json'] as $key => $value) {
        echo "  {$key}: {$value}" . PHP_EOL;
    }
} catch (RuntimeException $e) {
    echo "POST failed: " . $e->getMessage() . PHP_EOL;
}

// ── TODO 3: Retry logic with exponential backoff ──────────────────────────────
// Write a getWithRetry(string $url, int $maxRetries = 3): string function.
// Retry on cURL error OR HTTP 5xx/429. Wait 2^attempt * 1000ms + random jitter.
// Print which attempt is being made. Return the response body on success.

echo PHP_EOL . "=== TODO 3: Retry logic ===" . PHP_EOL;

function getWithRetry(string $url, int $maxRetries = 3): string
{
    $attempt = 0;

    while (true) {
        echo "Attempt " . ($attempt + 1) . " → {$url}" . PHP_EOL;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);

        $body     = curl_exec($ch);
        $errno    = curl_errno($ch);
        $errMsg   = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $networkFail  = $errno !== 0;
        $serverError  = $httpCode === 429 || ($httpCode >= 500 && $httpCode < 600);
        $shouldRetry  = ($networkFail || $serverError) && $attempt < $maxRetries;

        if (!$shouldRetry) {
            if ($networkFail) {
                throw new RuntimeException("cURL error after {$attempt} retries: {$errMsg}");
            }
            if ($httpCode < 200 || $httpCode >= 300) {
                throw new RuntimeException("HTTP {$httpCode} after {$attempt} retries.");
            }
            return (string)$body;
        }

        $delayMs = (int)(2 ** $attempt * 1000) + random_int(0, 500);
        echo "  Retryable response (errno={$errno}, http={$httpCode}). Waiting {$delayMs}ms..." . PHP_EOL;
        usleep($delayMs * 1_000);
        $attempt++;
    }
}

try {
    $body = getWithRetry('https://httpbin.org/get');
    $data = json_decode($body, associative: true, flags: JSON_THROW_ON_ERROR);
    echo "Success! Origin: " . $data['origin'] . PHP_EOL;
} catch (RuntimeException $e) {
    echo "Retry exhausted: " . $e->getMessage() . PHP_EOL;
}

// ── TODO 4: HTTP GET via stream_context_create (no cURL) ─────────────────────
// Use stream_context_create() and file_get_contents() to make a GET request
// to https://httpbin.org/get. Set Accept and User-Agent headers via the context.
// Decode the JSON and print the 'url' field.

echo PHP_EOL . "=== TODO 4: stream_context_create ===" . PHP_EOL;

$context = stream_context_create([
    'http' => [
        'method'  => 'GET',
        'header'  => implode("\r\n", [
            'Accept: application/json',
            'User-Agent: PHP-Mastery-Exercise/1.0',
        ]),
        'timeout'       => 10,
        'ignore_errors' => true,
    ],
    'ssl'  => [
        'verify_peer'      => true,
        'verify_peer_name' => true,
    ],
]);

$rawBody = @file_get_contents('https://httpbin.org/get', context: $context);

if ($rawBody === false) {
    echo "stream_context GET failed." . PHP_EOL;
} else {
    $parsed = json_decode($rawBody, associative: true, flags: JSON_THROW_ON_ERROR);
    echo "URL (stream context): " . $parsed['url'] . PHP_EOL;
}

// ── TODO 5: json_validate() — PHP 8.3+ ───────────────────────────────────────
// Use json_validate() to check whether a string is valid JSON before decoding.
// Test with one valid and one invalid JSON string.
// Write a parsePayload(string $raw): array helper that throws on invalid JSON.

echo PHP_EOL . "=== TODO 5: json_validate (PHP 8.3+) ===" . PHP_EOL;

function parsePayload(string $raw): array
{
    if (!json_validate($raw)) {
        throw new InvalidArgumentException('Invalid JSON payload received.');
    }

    return json_decode($raw, associative: true, flags: JSON_THROW_ON_ERROR);
}

$validJson   = '{"event":"push","ref":"refs/heads/main","commits":3}';
$invalidJson = '{event: push, bad syntax}';

var_dump(json_validate($validJson));   // bool(true)
var_dump(json_validate($invalidJson)); // bool(false)

try {
    $payload = parsePayload($validJson);
    echo "Event: " . $payload['event'] . ", Commits: " . $payload['commits'] . PHP_EOL;
} catch (InvalidArgumentException $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}

try {
    parsePayload($invalidJson);
} catch (InvalidArgumentException $e) {
    echo "Caught expected error: " . $e->getMessage() . PHP_EOL;
}
