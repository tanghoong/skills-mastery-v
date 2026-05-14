<?php
declare(strict_types=1);
/**
 * Chapter 35 — Automation & System Tasks
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_35.php
 *
 * Note: TODO 4 requires the pcntl extension (Linux/macOS).
 *       If pcntl is unavailable, that section is skipped automatically.
 */

// ── TODO 1: shell_exec — run `date` and `pwd` ────────────────────────────────
// Use shell_exec() to capture the output of the system `date` command and the
// `pwd` command. Print both results to STDOUT.

echo "=== TODO 1: shell_exec ===" . PHP_EOL;

$date = trim((string)shell_exec('date'));
$cwd  = trim((string)shell_exec('pwd'));

echo "System date : {$date}" . PHP_EOL;
echo "Working dir : {$cwd}"  . PHP_EOL;

// ── TODO 2: proc_open — capture stdout and stderr separately ─────────────────
// Use proc_open() to run a command (e.g. `ls /nonexistent` which produces
// stderr output). Read stdout and stderr into separate variables and print each.

echo PHP_EOL . "=== TODO 2: proc_open ===" . PHP_EOL;

$descriptors = [
    0 => ['pipe', 'r'],  // stdin
    1 => ['pipe', 'w'],  // stdout
    2 => ['pipe', 'w'],  // stderr
];

// Run a command that succeeds on stdout and also generates stderr output
$proc = proc_open('echo "stdout line"; ls /path/that/does/not/exist 2>&1; echo "done"', $descriptors, $pipes);

if (is_resource($proc)) {
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[0]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exitCode = proc_close($proc);

    echo "STDOUT:" . PHP_EOL;
    foreach (explode(PHP_EOL, trim((string)$stdout)) as $line) {
        echo "  {$line}" . PHP_EOL;
    }

    if (trim((string)$stderr) !== '') {
        echo "STDERR:" . PHP_EOL;
        foreach (explode(PHP_EOL, trim((string)$stderr)) as $line) {
            echo "  {$line}" . PHP_EOL;
        }
    }

    echo "Exit code: {$exitCode}" . PHP_EOL;
} else {
    echo "proc_open failed." . PHP_EOL;
}

// ── TODO 3: Lock file mechanism ───────────────────────────────────────────────
// Implement a ProcessLock class that:
//   1. Checks whether a lock file already exists for the given process name.
//   2. If it exists AND the PID inside is still running, returns false (already locked).
//   3. If the lock is stale (process gone), removes the old lock file.
//   4. Creates the lock file with the current PID.
//   5. Provides a release() method that deletes the lock file.
// Demonstrate: acquire a lock, print "Working...", release the lock.

echo PHP_EOL . "=== TODO 3: Lock file ===" . PHP_EOL;

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

            // posix_kill with signal 0 tests if the process exists
            if ($pid > 0 && function_exists('posix_kill') && posix_kill($pid, 0)) {
                echo "Lock held by PID {$pid} — cannot acquire." . PHP_EOL;
                return false;
            }

            // Stale lock
            echo "Removing stale lock (PID {$pid})." . PHP_EOL;
            unlink($this->path);
        }

        $myPid = getmypid();
        file_put_contents($this->path, (string)$myPid);
        echo "Lock acquired (PID {$myPid}): {$this->path}" . PHP_EOL;
        return true;
    }

    public function release(): void
    {
        if (file_exists($this->path)) {
            unlink($this->path);
            echo "Lock released: {$this->path}" . PHP_EOL;
        }
    }

    public function path(): string
    {
        return $this->path;
    }
}

$lock = new ProcessLock('chapter_35_exercise');

if ($lock->acquire()) {
    register_shutdown_function([$lock, 'release']);

    echo "Working..." . PHP_EOL;
    usleep(100_000); // simulate work

    $lock->release();
} else {
    echo "Skipping — another instance holds the lock." . PHP_EOL;
}

// ── TODO 4: Signal handler for SIGINT ────────────────────────────────────────
// Register a pcntl_signal handler for SIGINT that prints a clean shutdown
// message and exits. Use declare(ticks=1) or pcntl_signal_dispatch() to enable
// signal delivery. If pcntl is not available, print a skip message.

echo PHP_EOL . "=== TODO 4: Signal handler ===" . PHP_EOL;

if (!function_exists('pcntl_signal')) {
    echo "pcntl extension not available — skipping signal handler demo." . PHP_EOL;
} else {
    $signalCaught = false;

    pcntl_signal(SIGINT, function (int $signal) use (&$signalCaught): void {
        echo PHP_EOL . "Caught CTRL+C (SIGINT), cleaning up..." . PHP_EOL;
        $signalCaught = true;
    });

    echo "Signal handler registered for SIGINT." . PHP_EOL;
    echo "(Send SIGINT with Ctrl+C to test, or let the loop below finish.)" . PHP_EOL;

    // Dispatch any pending signals manually (avoids declare(ticks=1) overhead)
    for ($i = 0; $i < 3 && !$signalCaught; $i++) {
        pcntl_signal_dispatch();
        usleep(200_000);
    }

    if (!$signalCaught) {
        echo "Loop completed without interrupt." . PHP_EOL;
    }
}

// ── TODO 5: Background worker loop simulation ─────────────────────────────────
// Simulate a background worker: loop exactly 5 times, sleeping 1 second each
// iteration, and printing a timestamped progress message on each tick.
// Print "Worker complete." when the loop finishes.

echo PHP_EOL . "=== TODO 5: Worker loop ===" . PHP_EOL;

$iterations = 5;

for ($i = 1; $i <= $iterations; $i++) {
    $timestamp = date('H:i:s');
    $bar       = str_repeat('#', $i) . str_repeat('.', $iterations - $i);
    echo "[{$timestamp}] [{$bar}] Tick {$i}/{$iterations}" . PHP_EOL;
    sleep(1);
}

echo "Worker complete." . PHP_EOL;
