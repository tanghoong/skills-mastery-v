# Chapter 35 — Automation & System Tasks

> **Goal:** Schedule PHP scripts with cron, shell out to OS commands safely, handle Unix signals, and write stable long-running worker processes.

## 35.1 Cron Job Scheduling

Cron is the Unix task scheduler. A crontab entry has five time fields followed by the command. You edit the current user's crontab with `crontab -e`.

```
# ┌─ minute (0–59)
# │  ┌─ hour (0–23)
# │  │  ┌─ day of month (1–31)
# │  │  │  ┌─ month (1–12)
# │  │  │  │  ┌─ day of week (0–7, Sunday=0 or 7)
# │  │  │  │  │
# *  *  *  *  *  command
  0  2  *  *  *  /usr/bin/php /var/www/scripts/cleanup.php >> /var/log/cleanup.log 2>&1
```

Key points:
- Always use absolute paths for both `php` and the script — cron runs with a minimal `$PATH`.
- Redirect `stdout` and `stderr` to a log file (`>> file 2>&1`) so failures are visible.
- A PHP script called by cron should exit with a non-zero code on failure; cron can be configured to email on non-zero exits.

From within PHP you can generate or inspect crontab entries programmatically:

```php
<?php
declare(strict_types=1);

function addCronJob(string $schedule, string $command): void
{
    $existing = shell_exec('crontab -l 2>/dev/null') ?? '';
    $newLine  = "{$schedule} {$command}" . PHP_EOL;

    if (str_contains($existing, $command)) {
        echo "Cron job already registered." . PHP_EOL;
        return;
    }

    $updated = $existing . $newLine;
    file_put_contents('/tmp/crontab_tmp', $updated);
    shell_exec('crontab /tmp/crontab_tmp');
    unlink('/tmp/crontab_tmp');
    echo "Cron job added." . PHP_EOL;
}

addCronJob('0 3 * * *', '/usr/bin/php /var/www/scripts/report.php');
```

## 35.2 `exec`, `shell_exec`, and `proc_open`

PHP provides three levels of shell integration, each with different trade-offs.

`shell_exec` (and its alias, the backtick operator) runs a command and returns all output as a string. Use it for simple, fire-and-forget commands where you only need stdout.

```php
<?php
declare(strict_types=1);

$date = trim((string)shell_exec('date'));
$cwd  = trim((string)shell_exec('pwd'));
echo "Date: {$date}" . PHP_EOL;
echo "CWD:  {$cwd}"  . PHP_EOL;
```

`exec` runs a command, fills an output array line by line, and returns the last line. Use it when you want structured output and the exit code.

```php
<?php
declare(strict_types=1);

exec('ls -1 /tmp', $output, $exitCode);
echo "Exit: {$exitCode}" . PHP_EOL;
foreach ($output as $line) {
    echo "  {$line}" . PHP_EOL;
}
```

`proc_open` gives you full bidirectional I/O — separate pipes for stdin, stdout, and stderr. This is the equivalent of Node's `child_process.spawn`.

```php
<?php
declare(strict_types=1);

$descriptors = [
    0 => ['pipe', 'r'],  // stdin  — write to process
    1 => ['pipe', 'w'],  // stdout — read from process
    2 => ['pipe', 'w'],  // stderr — read from process
];

$proc = proc_open('git log --oneline -5', $descriptors, $pipes);

if (!is_resource($proc)) {
    fwrite(STDERR, "Failed to start process." . PHP_EOL);
    exit(1);
}

$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);

$exitCode = proc_close($proc);

echo "STDOUT:" . PHP_EOL . $stdout;
if ($stderr !== '') {
    fwrite(STDERR, "STDERR: {$stderr}");
}
echo "Exit: {$exitCode}" . PHP_EOL;
```

Security rule: never interpolate unvalidated user input into a shell command. Use `escapeshellarg()` on any externally-supplied value.

## 35.3 Signal Handling with `pcntl_signal`

The `pcntl` extension lets PHP processes react to Unix signals — `SIGTERM` (graceful shutdown), `SIGINT` (Ctrl+C), `SIGHUP` (reload config), etc. Without a handler, `SIGTERM` simply kills the process immediately.

```php
<?php
declare(strict_types=1);

declare(ticks=1); // required for signal delivery between statements

$running = true;

pcntl_signal(SIGTERM, function (int $signal) use (&$running): void {
    echo PHP_EOL . "SIGTERM received — shutting down gracefully." . PHP_EOL;
    $running = false;
});

pcntl_signal(SIGINT, function (int $signal) use (&$running): void {
    echo PHP_EOL . "SIGINT (Ctrl+C) received — cleaning up." . PHP_EOL;
    $running = false;
});

echo "Worker started. PID: " . getmypid() . PHP_EOL;

while ($running) {
    echo "Working..." . PHP_EOL;
    sleep(2);
}

echo "Worker stopped." . PHP_EOL;
exit(0);
```

`declare(ticks=1)` instructs the Zend engine to check for pending signals after every statement. An alternative is to call `pcntl_signal_dispatch()` explicitly in your loop, which avoids the ticks overhead.

## 35.4 Lock Files

A lock file prevents multiple instances of a script from running simultaneously — important for cron jobs that might overlap if a previous run is still going.

```php
<?php
declare(strict_types=1);

final class ProcessLock
{
    private readonly string $path;

    public function __construct(string $name)
    {
        $this->path = sys_get_temp_dir() . "/{$name}.lock";
    }

    public function acquire(): bool
    {
        if (file_exists($this->path)) {
            $pid = (int)file_get_contents($this->path);
            // Check if the PID is still alive
            if ($pid > 0 && posix_kill($pid, 0)) {
                return false; // another instance is running
            }
            // Stale lock — remove it
            unlink($this->path);
        }

        file_put_contents($this->path, (string)getmypid());
        return true;
    }

    public function release(): void
    {
        if (file_exists($this->path)) {
            unlink($this->path);
        }
    }
}

$lock = new ProcessLock('my_worker');

if (!$lock->acquire()) {
    fwrite(STDERR, "Another instance is already running." . PHP_EOL);
    exit(1);
}

// Register cleanup on normal exit
register_shutdown_function([$lock, 'release']);

echo "Lock acquired. Running..." . PHP_EOL;
sleep(5);
echo "Done." . PHP_EOL;
```

## 35.5 Background Workers and the Daemon Pattern

A daemon is a long-running process that runs in the background. A minimal PHP daemon:

1. Acquires a lock file.
2. Registers signal handlers for graceful shutdown.
3. Enters a loop that processes work and sleeps between iterations.
4. Releases the lock on exit.

```php
<?php
declare(strict_types=1);

declare(ticks=1);

final class Daemon
{
    private bool $running = true;

    public function __construct(private readonly ProcessLock $lock) {}

    public function start(): void
    {
        if (!$this->lock->acquire()) {
            fwrite(STDERR, "Daemon already running." . PHP_EOL);
            exit(1);
        }

        register_shutdown_function([$this->lock, 'release']);
        pcntl_signal(SIGTERM, [$this, 'stop']);
        pcntl_signal(SIGINT,  [$this, 'stop']);

        echo "Daemon started. PID: " . getmypid() . PHP_EOL;

        while ($this->running) {
            $this->tick();
            sleep(1);
        }

        echo "Daemon stopped cleanly." . PHP_EOL;
    }

    public function stop(): void
    {
        echo PHP_EOL . "Shutdown signal received." . PHP_EOL;
        $this->running = false;
    }

    private function tick(): void
    {
        // Poll a queue, process messages, etc.
        echo date('H:i:s') . " — tick" . PHP_EOL;
    }
}
```

## Key Takeaways

- Use absolute paths in crontab entries; redirect both stdout and stderr to a log file.
- Use `shell_exec` for simple one-liners, `exec` when you need line-by-line output and exit codes, and `proc_open` when you need separate stdin/stdout/stderr streams.
- Always `escapeshellarg()` any user-supplied value before interpolating it into a shell command.
- `pcntl_signal` with `declare(ticks=1)` enables graceful shutdown on `SIGTERM`/`SIGINT`.
- Lock files using the process PID prevent cron job overlap; always release the lock via `register_shutdown_function`.
- The daemon pattern combines a lock file, signal handlers, and a sleep loop — keep `tick()` fast and non-blocking.

## What's Next

Chapter 36 covers PHP namespaces and Composer, the package manager that makes large codebases and third-party libraries manageable.
