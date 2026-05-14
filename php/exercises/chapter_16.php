<?php
declare(strict_types=1);
/**
 * Chapter 16 — Match, Nullsafe & PHP 8.0 Additions
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_16.php
 */

echo "=== Chapter 16: Match, Nullsafe & PHP 8.0 Additions ===\n\n";

// ── TODO 1: Rewrite switch → match, demonstrate no type coercion ─────────────
// The switch below has a type-coercion bug: passing the string "1" incorrectly
// matches the integer 1 arm. Rewrite it using match and show that "1" does NOT
// match 1.
//
// Then call your match version with both (int) 1 and (string) "1" and print
// the results.

function statusLabelSwitch(mixed $code): string
{
    switch ($code) {
        case 1:  return 'pending';
        case 2:  return 'active';
        case 3:  return 'closed';
        default: return 'unknown';
    }
}

// TODO 1: write statusLabelMatch(mixed $code): string using match
// function statusLabelMatch(mixed $code): string { ... }

// Uncomment to test:
// echo "TODO 1 (switch) — string '1': " . statusLabelSwitch("1") . "\n"; // pending (bug!)
// echo "TODO 1 (match)  — string '1': " . statusLabelMatch("1") . "\n";  // unknown (correct)
// echo "TODO 1 (match)  — int 1:      " . statusLabelMatch(1) . "\n";    // pending


// ── TODO 2: Nullable object chain with ?-> ────────────────────────────────────
// Create the three classes below and a helper function getAvatarUrl(?User $user)
// that safely navigates $user?->profile?->avatar?->url.
// Test with: a fully populated user, a user with no profile, and null itself.

class Avatar
{
    public function __construct(public readonly string $url) {}
}

class Profile
{
    public function __construct(public readonly ?Avatar $avatar = null) {}
}

class User
{
    public function __construct(public readonly ?Profile $profile = null) {}
}

// TODO 2: write getAvatarUrl(?User $user): ?string
// function getAvatarUrl(?User $user): ?string { ... }

// Uncomment to test:
// $full  = new User(new Profile(new Avatar('https://example.com/pic.jpg')));
// $noAvatar = new User(new Profile());
// $noProfile = new User();

// echo "TODO 2 — full:      " . (getAvatarUrl($full) ?? 'null') . "\n";
// echo "TODO 2 — noAvatar:  " . (getAvatarUrl($noAvatar) ?? 'null') . "\n";
// echo "TODO 2 — noProfile: " . (getAvatarUrl($noProfile) ?? 'null') . "\n";
// echo "TODO 2 — null:      " . (getAvatarUrl(null) ?? 'null') . "\n";


// ── TODO 3: throw as an expression inside a ternary and a match arm ───────────
// 1. Write a function assertPositive(int $n): int that uses a ternary with
//    throw to reject non-positive numbers.
// 2. Write a function permissionFor(string $role): string that uses match with
//    throw in the default arm for unknown roles.

// TODO 3a: assertPositive
// function assertPositive(int $n): int { ... }

// TODO 3b: permissionFor
// function permissionFor(string $role): string { ... }

// Uncomment to test:
// echo "TODO 3a — assertPositive(5): " . assertPositive(5) . "\n"; // 5
// try {
//     assertPositive(-1);
// } catch (\InvalidArgumentException $e) {
//     echo "TODO 3a — caught: " . $e->getMessage() . "\n";
// }
// echo "TODO 3b — admin: " . permissionFor('admin') . "\n"; // write
// try {
//     permissionFor('superuser');
// } catch (\DomainException $e) {
//     echo "TODO 3b — caught: " . $e->getMessage() . "\n";
// }


// ── TODO 4: Validator using str_contains, str_starts_with, str_ends_with ─────
// Write a function validateEmail(string $email): array that returns an array
// of error messages (empty if valid). Rules:
//   - Must contain '@'
//   - Must not start with '@'
//   - Must end with a TLD of 2+ chars after the last '.' (e.g. '.com', '.io')
//   - Must not contain spaces

// TODO 4: write validateEmail(string $email): array
// function validateEmail(string $email): array { ... }

// Uncomment to test:
// $cases = ['charlie@example.com', '@bad.com', 'no-at-sign', 'space @x.io', 'a@b.c'];
// foreach ($cases as $email) {
//     $errors = validateEmail($email);
//     $status = empty($errors) ? 'valid' : 'invalid: ' . implode(', ', $errors);
//     echo "TODO 4 — {$email}: {$status}\n";
// }


// ── TODO 5: Demonstrate UnhandledMatchError ───────────────────────────────────
// Write a match expression with arms for 'foo' and 'bar' but NO default.
// Call it with 'baz' and catch the UnhandledMatchError to print a friendly
// message. Show that match truly throws when no arm matches.

// Uncomment to test:
// try {
//     $value = 'baz';
//     $result = match($value) {
//         'foo' => 'matched foo',
//         'bar' => 'matched bar',
//         // no default — intentional
//     };
// } catch (\UnhandledMatchError $e) {
//     echo "TODO 5 — UnhandledMatchError caught for value '{$value}'\n";
// }

echo "\nAll TODOs complete!\n";
