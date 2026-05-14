# Chapter 34 — CLI Scripting

> **Goal:** Build well-structured, user-friendly command-line PHP scripts that handle arguments, interact with the terminal, and exit cleanly.

## 34.1 Reading Arguments: `$argv` and `$argc`

When PHP runs from the command line, the runtime populates `$argv` (an array of arguments) and `$argc` (the count). This is directly analogous to `process.argv` in Node.js, with the same zero-index-is-script-name convention.

```php
<?php
declare(strict_types=1);

// Run: php script.php hello world
// $argv = ['script.php', 'hello', 'world']
// $argc = 3

$scriptName = $argv[0];
$args       = array_slice($argv, 1);

echo "Script: {$scriptName}" . PHP_EOL;
echo "Args: " . implode(', ', $args) . PHP_EOL;

if ($argc < 2) {
    fwrite(STDERR, "Usage: php {$scriptName} <name>" . PHP_EOL);
    exit(1);
}
```

Always write usage errors to `STDERR` (not `STDOUT`) so callers can redirect them independently — the same discipline you would apply in a Node CLI tool.

## 34.2 Parsing Options with `getopt`

`getopt` parses Unix-style short and long options. Short options are single characters; a trailing `:` means the option requires a value. Long options work the same way in the second array parameter.

```php
<?php
declare(strict_types=1);

// Run: php script.php -v --output=report.txt
$short = 'v';            // -v  (flag, no value)
$long  = ['output:'];    // --output=<file>  (required value)

$opts = getopt($short, $long);

$verbose    = isset($opts['v']);
$outputFile = $opts['output'] ?? 'stdout';

if ($verbose) {
    echo "[verbose] Output target: {$outputFile}" . PHP_EOL;
}
```

This is the PHP equivalent of a library like `yargs` or `commander` in Node — though more primitive. For complex CLIs you would wrap `getopt` in a class (see 34.6).

## 34.3 Reading from STDIN

Interactive prompts use `fgets(STDIN)`, which blocks until the user presses Enter.

```php
<?php
declare(strict_types=1);

echo "Enter your name: ";
$input = fgets(STDIN);

if ($input === false) {
    fwrite(STDERR, "Failed to read input." . PHP_EOL);
    exit(1);
}

$name = trim($input);
echo "Hello, {$name}!" . PHP_EOL;
```

`trim` is essential — `fgets` includes the trailing newline character.

## 34.4 ANSI Escape Codes

ANSI escape sequences let you add colour and formatting to terminal output. Each sequence begins with `\033[` (ESC + `[`).

```php
<?php
declare(strict_types=1);

const RESET  = "\033[0m";
const BOLD   = "\033[1m";
const GREEN  = "\033[32m";
const RED    = "\033[31m";
const YELLOW = "\033[33m";

function printSuccess(string $msg): void
{
    echo GREEN . BOLD . "✔ " . RESET . GREEN . $msg . RESET . PHP_EOL;
}

function printError(string $msg): void
{
    echo RED . BOLD . "✘ " . RESET . RED . $msg . RESET . PHP_EOL;
}

printSuccess("Build completed in 1.23s");
printError("File not found: config.php");
```

Always emit the reset sequence `\033[0m` after styled output so that the next line is not accidentally coloured.

## 34.5 Progress Bars and Table Output

A simple progress bar overwrites the current line using carriage return `\r` rather than a newline `\n`.

```php
<?php
declare(strict_types=1);

function renderProgress(int $current, int $total, int $width = 40): void
{
    $pct   = (int)(($current / $total) * $width);
    $bar   = str_repeat('=', $pct) . str_repeat('-', $width - $pct);
    $label = sprintf('%3d%%', (int)(($current / $total) * 100));
    echo "\r[{$bar}] {$label}";
}

$total = 20;
for ($i = 1; $i <= $total; $i++) {
    renderProgress($i, $total);
    usleep(50_000); // 50 ms
}
echo PHP_EOL;
```

For tabular data, calculate column widths and use `str_pad`:

```php
<?php
declare(strict_types=1);

function printTable(array $headers, array $rows): void
{
    $widths = array_map('strlen', $headers);
    foreach ($rows as $row) {
        foreach ($row as $i => $cell) {
            $widths[$i] = max($widths[$i], strlen((string)$cell));
        }
    }

    $line = function (array $cols) use ($widths): string {
        $cells = array_map(
            fn($col, $w) => str_pad((string)$col, $w),
            $cols,
            $widths,
        );
        return '| ' . implode(' | ', $cells) . ' |';
    };

    $separator = '+' . implode('+', array_map(fn($w) => str_repeat('-', $w + 2), $widths)) . '+';
    echo $separator . PHP_EOL;
    echo $line($headers) . PHP_EOL;
    echo $separator . PHP_EOL;
    foreach ($rows as $row) {
        echo $line($row) . PHP_EOL;
    }
    echo $separator . PHP_EOL;
}

printTable(
    ['Name', 'Version', 'Status'],
    [['php',     '8.4',   'active'], ['composer', '2.7',   'active']],
);
```

## 34.6 Structuring a CLI Application Class

For anything beyond a short script, encapsulate the CLI logic in a class. This mirrors the pattern you would use with a `Command` class in Node's `commander` library.

```php
<?php
declare(strict_types=1);

final class CliApp
{
    private bool $verbose = false;
    private string $outputFile = 'stdout';

    public function __construct(private readonly array $argv) {}

    public function run(): int
    {
        $opts = getopt('v', ['output:'], $restIndex);
        $this->verbose    = isset($opts['v']);
        $this->outputFile = (string)($opts['output'] ?? 'stdout');

        $positional = array_slice($this->argv, $restIndex);

        if (count($positional) === 0) {
            fwrite(STDERR, "Error: no input files specified." . PHP_EOL);
            return 1;
        }

        foreach ($positional as $file) {
            $this->process($file);
        }

        return 0;
    }

    private function process(string $file): void
    {
        if ($this->verbose) {
            echo "Processing: {$file}" . PHP_EOL;
        }
        // ... real work here
    }
}

exit((new CliApp($argv))->run());
```

The `run()` method returns an integer exit code, which is passed to `exit()` at the outermost level — keeping side effects at the boundary and the class itself testable.

## 34.7 Exit Codes

Unix convention: `0` means success, any non-zero value means failure. Use named constants or an enum to avoid magic numbers.

```php
<?php
declare(strict_types=1);

enum ExitCode: int
{
    case Success        = 0;
    case GeneralError   = 1;
    case MisuseOfShell  = 2;
    case CannotExecute  = 126;
    case CommandNotFound = 127;
}

exit(ExitCode::Success->value);
```

## Key Takeaways

- `$argv[0]` is always the script name; real arguments start at index 1, just like `process.argv[2]` in Node.
- `getopt` handles short (`-v`) and long (`--output=file`) options; use a class to wrap the parsing logic for complex CLIs.
- Write usage/error messages to `STDERR`, normal output to `STDOUT` — this keeps pipelines composable.
- ANSI escape codes provide terminal colour; always emit the reset sequence after styled output.
- Overwrite the current line with `\r` (carriage return without newline) to create in-place progress bars.
- Return a meaningful integer exit code from `run()` and pass it to `exit()` at the script boundary.

## What's Next

Chapter 35 explores how to schedule PHP scripts with cron, interact with the OS via `proc_open`, handle Unix signals, and write long-running daemon processes.
