#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * NoteFlow CLI Console
 *
 * Usage:
 *   php cli/console.php migrate
 *   php cli/console.php migrate:rollback
 *   php cli/console.php seed
 */

// Bootstrap autoloader and environment
require_once dirname(__DIR__) . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

$command = $argv[1] ?? null;

if ($command === null) {
    printUsage();
    exit(0);
}

match ($command) {
    'migrate'          => runMigrate(),
    'migrate:rollback' => runMigrateRollback(),
    'seed'             => runSeed(),
    default            => unknownCommand($command),
};

// -----------------------------------------------------------------------------
// Command implementations
// -----------------------------------------------------------------------------

function runMigrate(): void
{
    // TODO: implement
    //   Read all files from migrations/ ordered by filename.
    //   Execute each SQL file against the database connection.
    //   Track executed migrations in a `migrations` table to avoid re-runs.
    echo "[migrate] Running pending migrations..." . PHP_EOL;

    $migrationsDir = dirname(__DIR__) . '/migrations';
    $files = glob($migrationsDir . '/*.sql');

    if ($files === false || $files === []) {
        echo "[migrate] No migration files found." . PHP_EOL;
        return;
    }

    sort($files);
    $pdo = NoteFlow\Database\Connection::create();

    // Ensure the tracking table exists
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS migrations (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            filename   VARCHAR(255) NOT NULL UNIQUE,
            run_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );

    foreach ($files as $file) {
        $filename = basename($file);
        $exists   = $pdo->prepare('SELECT id FROM migrations WHERE filename = :f');
        $exists->execute([':f' => $filename]);

        if ($exists->fetch() !== false) {
            echo "[migrate] Skipping {$filename} (already applied)" . PHP_EOL;
            continue;
        }

        $sql = file_get_contents($file);
        if ($sql === false) {
            echo "[migrate] Could not read {$filename}, skipping." . PHP_EOL;
            continue;
        }

        $pdo->exec($sql);
        $track = $pdo->prepare('INSERT INTO migrations (filename) VALUES (:f)');
        $track->execute([':f' => $filename]);
        echo "[migrate] Applied {$filename}" . PHP_EOL;
    }

    echo "[migrate] Done." . PHP_EOL;
}

function runMigrateRollback(): void
{
    // TODO: implement
    //   Find the last applied migration from the tracking table.
    //   Execute the corresponding rollback SQL (e.g. migrations/001_...down.sql).
    //   Remove the entry from the tracking table.
    echo "[migrate:rollback] Rolling back last migration..." . PHP_EOL;
    echo "[migrate:rollback] TODO: implement" . PHP_EOL;
}

function runSeed(): void
{
    // TODO: implement
    //   Insert sample users and notes for local development.
    //   Use password_hash() for the seed user's password.
    echo "[seed] Seeding database with sample data..." . PHP_EOL;
    echo "[seed] TODO: implement" . PHP_EOL;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function printUsage(): void
{
    echo <<<'USAGE'
NoteFlow CLI

Usage:
  php cli/console.php <command>

Commands:
  migrate           Run all pending database migrations
  migrate:rollback  Roll back the last applied migration
  seed              Insert sample data for local development

USAGE;
}

function unknownCommand(string $command): void
{
    echo "[error] Unknown command: {$command}" . PHP_EOL;
    printUsage();
    exit(1);
}
