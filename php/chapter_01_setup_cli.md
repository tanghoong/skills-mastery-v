# Chapter 1 — Setup and the PHP CLI

> **Goal:** Get PHP 8.4+ installed and running, understand the built-in dev server and REPL, and know why `declare(strict_types=1)` belongs at the top of every file you write.

## 1.1 Installing PHP 8.4+

On macOS the fastest path is Homebrew:

```bash
brew install php
php --version
# PHP 8.4.x (cli) ...
```

On Ubuntu/Debian:

```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php
sudo apt update && sudo apt install -y php8.4 php8.4-cli php8.4-mbstring php8.4-xml
php --version
```

On Windows, grab the thread-safe ZIP from https://windows.php.net and add the extracted folder to your PATH.

Verify the installation by asking PHP to run a one-liner directly from your shell:

```bash
php -r "echo PHP_VERSION . PHP_EOL;"
```

## 1.2 Running Code — Four Ways

**One-liner (`php -r`)**

```bash
php -r "echo strtoupper('hello world') . PHP_EOL;"
```

Good for quick experiments without creating a file.

**Script file**

```bash
php my_script.php
```

The most common workflow. Every file should start with `<?php`.

**Interactive REPL (`php -a`)**

```bash
php -a
Interactive shell

php > $x = 42;
php > echo $x * 2;
84
```

PHP's REPL is more limited than a Node.js or Python shell — it does not retain full state across errors — but it is useful for testing expressions and functions quickly.

**Built-in dev server (`php -S`)**

```bash
php -S localhost:8080 -t public/
```

This spins up a single-threaded HTTP server pointing at the `public/` directory. It is strictly for development; never use it in production. The TypeScript equivalent would be running `tsx` or `ts-node` in watch mode — fast to start, no build step.

## 1.3 php.ini — The Runtime Configuration File

`php.ini` controls memory limits, error reporting, file upload sizes, and much more. Find where yours lives:

```bash
php --ini
# Loaded Configuration File: /usr/local/etc/php/8.4/php.ini
```

A few settings worth knowing immediately:

| Setting | Recommended (dev) | What it does |
|---|---|---|
| `display_errors` | `On` | Print errors to the browser/stdout |
| `error_reporting` | `E_ALL` | Report every level of error |
| `memory_limit` | `256M` | Max RAM per script |
| `max_execution_time` | `30` | Seconds before a script is killed |

After editing `php.ini`, restart any running web server or simply re-run your CLI script.

## 1.4 phpinfo()

```php
<?php
declare(strict_types=1);

phpinfo();
```

Run this as a web script (via `php -S`) and open it in a browser. It dumps the complete runtime configuration: loaded extensions, ini values, environment variables, and build options. It is the first place to look when a feature (e.g., `mbstring`, `pdo_pgsql`) seems missing. Never leave a `phpinfo()` page accessible in production.

## 1.5 declare(strict_types=1)

This directive changes how PHP handles type coercion at function call boundaries.

```php
<?php
declare(strict_types=1);

function add(int $a, int $b): int {
    return $a + $b;
}

echo add(2, 3);       // 5 — fine
echo add(2.9, 3.1);   // Fatal error: Argument 1 must be of type int, float given
```

Without `strict_types=1`, PHP would silently truncate `2.9` to `2` and `3.1` to `3`, giving you `5` with no warning — a classic source of subtle bugs.

**TypeScript analogy:** `strict_types=1` is roughly equivalent to enabling `"strict": true` in `tsconfig.json`. Both move the language from "try to make it work" mode into "tell me when types do not match" mode. The key difference is that `strict_types` is a per-file opt-in in PHP, while TypeScript's strict mode is project-wide.

The directive must appear as the very first statement in the file — before any code, after the opening `<?php` tag. Make it a habit.

## Key Takeaways

- PHP 8.4 is installed via a package manager or Homebrew and confirmed with `php --version`.
- `php -r` runs one-liners, `php -a` opens an interactive shell, and `php -S` starts a dev web server.
- `php.ini` controls runtime behavior; `php --ini` tells you which file is loaded.
- `phpinfo()` shows the full runtime configuration and loaded extensions.
- `declare(strict_types=1)` must be the first statement in every file and prevents silent type coercion at function boundaries.

## What's Next

Chapter 2 digs into PHP's scalar types — `int`, `float`, `string`, and `bool` — and shows exactly how PHP juggles types when you do not declare strict mode, so you understand what you are opting out of.
