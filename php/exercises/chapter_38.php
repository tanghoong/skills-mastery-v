<?php
declare(strict_types=1);
/**
 * Chapter 38 — Security
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_38.php
 *
 * Note: This file runs in CLI context. Headers (TODO 5) are printed as strings
 * since there is no HTTP response to send from the CLI.
 */

// ── TODO 1: Password hashing and verification ─────────────────────────────────
// Hash a raw password string using password_hash() with PASSWORD_BCRYPT and
// cost 12. Verify it with password_verify(). Also demonstrate what happens
// when you verify the wrong password.

echo "=== TODO 1: password_hash / password_verify ===" . PHP_EOL;

$rawPassword  = 'super$ecret99!';
$wrongPassword = 'hunter2';

$hash = password_hash($rawPassword, PASSWORD_BCRYPT, ['cost' => 12]);

echo "Raw password : {$rawPassword}" . PHP_EOL;
echo "Hash         : {$hash}"        . PHP_EOL;

$correct = password_verify($rawPassword, $hash);
$wrong   = password_verify($wrongPassword, $hash);

echo "Correct password verifies : " . ($correct ? 'yes' : 'no') . PHP_EOL; // yes
echo "Wrong password verifies   : " . ($wrong   ? 'yes' : 'no') . PHP_EOL; // no

// Check whether the hash needs rehashing (e.g. if cost increases in future)
if (password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => 12])) {
    $hash = password_hash($rawPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    echo "Rehashed (cost was too low)." . PHP_EOL;
} else {
    echo "Hash is up to date — no rehash needed." . PHP_EOL;
}

// ── TODO 2: SQL injection — vulnerable vs. safe ───────────────────────────────
// First, show what a vulnerable SQL query looks like (as a comment/string, NOT
// executed). Then show the correct PDO prepared statement implementation using
// bindValue and :named placeholders.

echo PHP_EOL . "=== TODO 2: SQL injection prevention ===" . PHP_EOL;

// VULNERABLE — never do this in real code
$userInput     = "' OR '1'='1"; // classic injection payload
$unsafeQuery   = "SELECT * FROM users WHERE username = '{$userInput}'";
echo "VULNERABLE query: {$unsafeQuery}" . PHP_EOL;
echo "  ^^ This executes the attacker's logic if run against a real DB." . PHP_EOL;

// SAFE — PDO prepared statement with named placeholder
function findUserSafely(PDO $pdo, string $username): array|false
{
    $stmt = $pdo->prepare('SELECT id, email FROM users WHERE username = :username');
    $stmt->bindValue(':username', $username, PDO::PARAM_STR);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Demonstrate with SQLite in-memory (no MySQL required)
$pdo = new PDO('sqlite::memory:', options: [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, email TEXT)');
$pdo->exec("INSERT INTO users VALUES (1, 'charlie', 'charlie@example.com')");

$user = findUserSafely($pdo, $userInput); // injection attempt returns nothing
echo "Injection attempt result  : " . ($user === false ? 'no rows (safe!)' : 'VULNERABLE') . PHP_EOL;

$user = findUserSafely($pdo, 'charlie');
echo "Legitimate query result   : " . ($user ? $user['email'] : 'not found') . PHP_EOL;

// ── TODO 3: XSS — vulnerable vs. safe ────────────────────────────────────────
// Show what a vulnerable echo looks like. Then write an e() helper using
// htmlspecialchars() with ENT_QUOTES | ENT_SUBSTITUTE and UTF-8 encoding.
// Print both the unescaped (dangerous) and escaped (safe) versions.

echo PHP_EOL . "=== TODO 3: XSS prevention ===" . PHP_EOL;

$maliciousInput = '<script>alert("XSS")</script><b>Bold</b>';

// VULNERABLE — never echo untrusted input raw in HTML
echo "VULNERABLE output : {$maliciousInput}" . PHP_EOL;

// SAFE
function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$safeOutput = e($maliciousInput);
echo "SAFE output       : {$safeOutput}" . PHP_EOL;
// Renders: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&lt;b&gt;Bold&lt;/b&gt;

echo "In HTML, the safe version shows the text literally, not executing any JS." . PHP_EOL;

// ── TODO 4: CSRF token — generate and validate ────────────────────────────────
// Simulate session storage with a variable (since we're in CLI, not HTTP).
// Generate a CSRF token using bin2hex(random_bytes(32)).
// Validate a submitted token using hash_equals() to prevent timing attacks.
// Show what happens with a correct token and a tampered token.

echo PHP_EOL . "=== TODO 4: CSRF token ===" . PHP_EOL;

// Simulated session (in real code this would be $_SESSION)
$session = [];

function generateCsrfToken(array &$session): string
{
    if (empty($session['csrf_token'])) {
        $session['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $session['csrf_token'];
}

function verifyCsrfToken(array $session, string $submitted): bool
{
    $stored = $session['csrf_token'] ?? '';
    // hash_equals is constant-time — prevents timing-based token enumeration
    return hash_equals($stored, $submitted);
}

$token = generateCsrfToken($session);
echo "Generated token   : {$token}" . PHP_EOL;

// Correct submission
$valid = verifyCsrfToken($session, $token);
echo "Valid token check  : " . ($valid ? 'pass' : 'fail') . PHP_EOL; // pass

// Tampered submission
$tampered = substr($token, 0, -4) . 'XXXX';
$invalid  = verifyCsrfToken($session, $tampered);
echo "Tampered token check: " . ($invalid ? 'pass (BUG!)' : 'fail (correct)') . PHP_EOL; // fail (correct)

// Empty submission
$empty = verifyCsrfToken($session, '');
echo "Empty token check  : " . ($empty ? 'pass (BUG!)' : 'fail (correct)') . PHP_EOL; // fail (correct)

// ── TODO 5: Secure HTTP headers ───────────────────────────────────────────────
// Define the full set of recommended secure HTTP response headers.
// In CLI context, print each header string instead of calling header().
// Include: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options,
// Strict-Transport-Security, Referrer-Policy, and Permissions-Policy.

echo PHP_EOL . "=== TODO 5: Secure HTTP headers ===" . PHP_EOL;

$secureHeaders = [
    'X-Content-Type-Options'  => 'nosniff',
    'X-Frame-Options'         => 'DENY',
    'X-XSS-Protection'        => '1; mode=block',
    'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy'         => 'strict-origin-when-cross-origin',
    'Permissions-Policy'      => 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy' => implode('; ', [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ]),
];

foreach ($secureHeaders as $name => $value) {
    // In an HTTP context: header("{$name}: {$value}");
    echo "  {$name}: {$value}" . PHP_EOL;
}

echo PHP_EOL . "In a real HTTP response these would be sent with header()." . PHP_EOL;
