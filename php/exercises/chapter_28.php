<?php

declare(strict_types=1);

/**
 * Chapter 28 — SQL Fundamentals
 *
 * This exercise uses an SQLite in-memory database so no MySQL install is needed.
 * Run with: php chapter_28.php
 *
 * Tasks:
 *   TODO 1 — Write CREATE TABLE statements for users, products, orders, order_items
 *   TODO 2 — Add a `category` column to products via ALTER TABLE
 *   TODO 3 — Insert seed data (5 users, 10 products, 5 orders)
 *   TODO 4 — Demonstrate NOT NULL and UNIQUE constraint violations
 *   TODO 5 — Print all tables and their row counts
 */

// ---------------------------------------------------------------------------
// Bootstrap — SQLite in-memory connection
// ---------------------------------------------------------------------------

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// SQLite does not enforce foreign keys by default; enable them explicitly.
$pdo->exec('PRAGMA foreign_keys = ON;');

echo "=== Chapter 28 — SQL Fundamentals ===" . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 1 — CREATE TABLE statements
//
// Create all four tables with appropriate column types, PRIMARY KEYs, and
// FOREIGN KEY constraints.  In SQLite:
//   - Use INTEGER PRIMARY KEY AUTOINCREMENT for auto-increment PKs
//   - Use REAL for decimals (SQLite has no DECIMAL type)
//   - Use TEXT for strings
//   - Use INTEGER (0/1) for booleans
//
// Table specifications:
//   users       : id, email (UNIQUE NOT NULL), name (NOT NULL), created_at (default CURRENT_TIMESTAMP)
//   products    : id, name (NOT NULL), price (NOT NULL), stock (default 0)
//   orders      : id, user_id (FK → users.id), total (NOT NULL), created_at
//   order_items : id, order_id (FK → orders.id CASCADE), product_id (FK → products.id RESTRICT),
//                 quantity (NOT NULL), unit_price (NOT NULL)
// ---------------------------------------------------------------------------

// TODO 1 — replace the `null;` lines with the four CREATE TABLE statements
// using $pdo->exec('CREATE TABLE ...');

$createUsers = null;         // replace with: $pdo->exec('CREATE TABLE users ...');
$createProducts = null;      // replace with: $pdo->exec('CREATE TABLE products ...');
$createOrders = null;        // replace with: $pdo->exec('CREATE TABLE orders ...');
$createOrderItems = null;    // replace with: $pdo->exec('CREATE TABLE order_items ...');

if ($createUsers === null) {
    echo "[TODO 1] Create table statements not yet implemented." . PHP_EOL;
} else {
    echo "[TODO 1] Tables created." . PHP_EOL;
}

echo PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 2 — ALTER TABLE: add a `category` column to products
//
// In SQLite ALTER TABLE only supports ADD COLUMN (no DROP/RENAME in older versions).
// Add: category TEXT NOT NULL DEFAULT 'uncategorised'
// ---------------------------------------------------------------------------

// TODO 2 — uncomment and complete:
// $pdo->exec('ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT \'uncategorised\'');
// echo "[TODO 2] Added 'category' column to products." . PHP_EOL;

echo "[TODO 2] Alter table not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 3 — Seed data
//
// Insert:
//   - 5 users  (vary the email domains: @example.com, @shop.com, @mail.org)
//   - 10 products spread across at least 3 categories
//   - 5 orders (each linked to an existing user_id)
//   - At least 8 order_items linking orders to products
//
// Use prepared statements with named or positional placeholders.
// ---------------------------------------------------------------------------

// TODO 3 — insert seed data here
// Example structure:
// $stmt = $pdo->prepare('INSERT INTO users (email, name) VALUES (?, ?)');
// $stmt->execute(['alice@example.com', 'Alice']);
// ... repeat for other rows ...

echo "[TODO 3] Seed data not yet inserted." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 4 — Demonstrate constraint violations
//
// Attempt TWO operations that should fail, and catch the PDOException for each:
//   4a. Insert a user with a duplicate email (UNIQUE violation)
//   4b. Insert a user without a name (NOT NULL violation)
//
// Show the exception message so you can read what SQLite reports.
// ---------------------------------------------------------------------------

echo "--- TODO 4: Constraint violations ---" . PHP_EOL;

// 4a. UNIQUE violation
try {
    // TODO 4a — attempt to insert a user with an email that already exists
    // $pdo->exec("INSERT INTO users (email, name) VALUES ('alice@example.com', 'Duplicate Alice')");
    echo "[TODO 4a] UNIQUE violation not demonstrated yet." . PHP_EOL;
} catch (\PDOException $e) {
    echo "[TODO 4a] UNIQUE violation caught: " . $e->getMessage() . PHP_EOL;
}

// 4b. NOT NULL violation
try {
    // TODO 4b — attempt to insert a user without a name
    // $pdo->exec("INSERT INTO users (email) VALUES ('noname@example.com')");
    echo "[TODO 4b] NOT NULL violation not demonstrated yet." . PHP_EOL;
} catch (\PDOException $e) {
    echo "[TODO 4b] NOT NULL violation caught: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 5 — Print table row counts
//
// Query the row count from each of the four tables and print a summary like:
//   users:       5 rows
//   products:   10 rows
//   orders:      5 rows
//   order_items: 8 rows
// ---------------------------------------------------------------------------

echo "--- TODO 5: Row counts ---" . PHP_EOL;

$tables = ['users', 'products', 'orders', 'order_items'];

foreach ($tables as $table) {
    // TODO 5 — replace 0 with a real COUNT(*) query against $table
    $count = 0;
    // Example:
    // $count = (int) $pdo->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();

    printf("  %-15s %d rows\n", $table . ':', $count);
}

echo PHP_EOL . "Done." . PHP_EOL;
