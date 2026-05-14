<?php

declare(strict_types=1);

namespace NoteFlow\Database;

use PDO;
use PDOException;

class Connection
{
    /**
     * Create and return a configured PDO instance.
     *
     * Reads connection parameters from $_ENV (populated by vlucas/phpdotenv):
     *   DB_DSN  — e.g. "mysql:host=127.0.0.1;dbname=noteflow;charset=utf8mb4"
     *   DB_USER — database username
     *   DB_PASS — database password
     *
     * @throws \RuntimeException if the connection cannot be established.
     */
    public static function create(): PDO
    {
        $dsn  = $_ENV['DB_DSN']  ?? throw new \RuntimeException('DB_DSN is not set');
        $user = $_ENV['DB_USER'] ?? throw new \RuntimeException('DB_USER is not set');
        $pass = $_ENV['DB_PASS'] ?? '';

        try {
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            throw new \RuntimeException(
                'Database connection failed: ' . $e->getMessage(),
                (int) $e->getCode(),
                $e
            );
        }

        return $pdo;
    }
}
