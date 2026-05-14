<?php
declare(strict_types=1);
/**
 * Chapter 34 — CLI Scripting
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_34.php -v --output=report.txt hello world
 */

// ── TODO 1: Read $argv ───────────────────────────────────────────────────────
// Print the script name (argv[0]) and all arguments that follow it.
// If no arguments are passed (beyond the script name), print a usage hint.

$scriptName = $argv[0];
$args       = array_slice($argv, 1);

echo "Script : {$scriptName}" . PHP_EOL;

if (count($args) === 0) {
    echo "Usage  : php {$scriptName} [-v] [--output=<file>] [arg...]" . PHP_EOL;
} else {
    echo "Args   : " . implode(', ', $args) . PHP_EOL;
}

// ── TODO 2: Parse options with getopt ────────────────────────────────────────
// Support: -v (verbose flag, no value) and --output=<file> (optional long option).
// Print whether verbose mode is on, and what the output target is.

$opts       = getopt('v', ['output:']);
$verbose    = isset($opts['v']);
$outputFile = isset($opts['output']) ? (string)$opts['output'] : 'stdout';

echo PHP_EOL . "-- Options --" . PHP_EOL;
echo "Verbose : " . ($verbose ? 'yes' : 'no') . PHP_EOL;
echo "Output  : {$outputFile}" . PHP_EOL;

// ── TODO 3: Coloured heading with ANSI escape codes ──────────────────────────
// Print a bold green heading "PHP CLI Mastery" followed by a reset sequence.
// The text after the heading should appear in the default terminal colour.

const RESET  = "\033[0m";
const BOLD   = "\033[1m";
const GREEN  = "\033[32m";
const CYAN   = "\033[36m";

echo PHP_EOL;
echo GREEN . BOLD . "=== PHP CLI Mastery ===" . RESET . PHP_EOL;
echo CYAN . "Phase 6 — Chapter 34" . RESET . PHP_EOL;

// ── TODO 4: ASCII table output ───────────────────────────────────────────────
// Print a padded ASCII table with these columns: Name, Version, Status.
// Use at least 3 rows of data. Columns should be left-aligned and padded
// so that the pipes line up regardless of content length.

echo PHP_EOL;

/**
 * Render a simple ASCII table.
 *
 * @param list<string>        $headers
 * @param list<list<string>>  $rows
 */
function printTable(array $headers, array $rows): void
{
    // Calculate max width per column
    $widths = array_map('strlen', $headers);
    foreach ($rows as $row) {
        foreach ($row as $col => $cell) {
            $widths[$col] = max($widths[$col], strlen((string)$cell));
        }
    }

    $separator = '+' . implode('+', array_map(
        fn(int $w) => str_repeat('-', $w + 2),
        $widths,
    )) . '+';

    $renderRow = function (array $cols) use ($widths): string {
        $cells = array_map(
            fn($cell, $w) => ' ' . str_pad((string)$cell, $w) . ' ',
            $cols,
            $widths,
        );
        return '|' . implode('|', $cells) . '|';
    };

    echo $separator . PHP_EOL;
    echo $renderRow($headers) . PHP_EOL;
    echo $separator . PHP_EOL;
    foreach ($rows as $row) {
        echo $renderRow($row) . PHP_EOL;
    }
    echo $separator . PHP_EOL;
}

printTable(
    ['Package',   'Version', 'Status'],
    [
        ['php',      '8.4.0',  'active'],
        ['composer', '2.7.2',  'active'],
        ['phpunit',  '11.0.0', 'dev'],
        ['pest',     '2.35.0', 'dev'],
    ],
);

// ── TODO 5: Read from STDIN and exit cleanly ─────────────────────────────────
// Prompt the user with "Enter your name: ", read one line from STDIN using
// fgets(STDIN), trim the newline, echo the input back, then exit with code 0.
// Handle the case where fgets returns false (e.g. piped empty input).

echo PHP_EOL . "Enter your name: ";
$rawInput = fgets(STDIN);

if ($rawInput === false) {
    // Non-interactive context (e.g. piped empty input) — exit gracefully
    echo "(no input received)" . PHP_EOL;
    exit(0);
}

$name = trim($rawInput);
if ($name === '') {
    echo "No name entered." . PHP_EOL;
} else {
    echo "Hello, " . GREEN . BOLD . $name . RESET . "! Welcome to PHP CLI scripting." . PHP_EOL;
}

exit(0);
