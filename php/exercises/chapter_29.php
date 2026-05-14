<?php

declare(strict_types=1);

/**
 * Chapter 29 — SQL Queries
 *
 * Builds on the same SQLite in-memory schema from Chapter 28.
 * The bootstrap section below creates and seeds the tables for you.
 * Run with: php chapter_29.php
 *
 * Tasks:
 *   TODO 1 — SELECT with WHERE: filter users by email domain
 *   TODO 2 — INNER JOIN: orders with users, show order total per order
 *   TODO 3 — LEFT JOIN: users with no orders
 *   TODO 4 — Subquery: products that appear in at least one order
 *   TODO 5 — UNION + LIMIT/OFFSET pagination
 */

// ---------------------------------------------------------------------------
// Bootstrap — schema + seed data (do not modify)
// ---------------------------------------------------------------------------

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->exec('PRAGMA foreign_keys = ON;');

$pdo->exec('
    CREATE TABLE users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        email      TEXT NOT NULL UNIQUE,
        name       TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE products (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        name     TEXT NOT NULL,
        price    REAL NOT NULL,
        stock    INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL DEFAULT \'uncategorised\'
    );

    CREATE TABLE orders (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        total      REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE order_items (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id   INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity   INTEGER NOT NULL,
        unit_price REAL NOT NULL
    );
');

// Seed: users
$insertUser = $pdo->prepare('INSERT INTO users (email, name) VALUES (?, ?)');
$users = [
    ['alice@example.com',  'Alice Smith'],
    ['bob@example.com',    'Bob Jones'],
    ['carol@shop.com',     'Carol White'],
    ['dave@shop.com',      'Dave Brown'],
    ['eve@mail.org',       'Eve Green'],
];
foreach ($users as $u) {
    $insertUser->execute($u);
}

// Seed: products
$insertProduct = $pdo->prepare('INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)');
$products = [
    ['Mechanical Keyboard', 129.99, 30, 'Electronics'],
    ['USB-C Hub',            39.99, 80, 'Electronics'],
    ['Monitor 27"',         349.99, 15, 'Electronics'],
    ['Desk Lamp',            24.99, 60, 'Home Office'],
    ['Ergonomic Chair',     399.99,  8, 'Furniture'],
    ['Standing Desk',       599.99,  5, 'Furniture'],
    ['Notebook A5',           4.99, 200, 'Stationery'],
    ['Ballpoint Pens x10',    3.49, 300, 'Stationery'],
    ['Webcam HD',            79.99, 40, 'Electronics'],
    ['Headset Pro',          89.99, 25, 'Electronics'],
];
foreach ($products as $p) {
    $insertProduct->execute($p);
}

// Seed: orders + order_items
$insertOrder = $pdo->prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)');
$insertItem  = $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');

$orders = [
    [1, 169.98, [[1, 1, 129.99], [2, 1, 39.99]]],   // Alice: keyboard + hub
    [2, 429.98, [[3, 1, 349.99], [9, 1, 79.99]]],   // Bob: monitor + webcam
    [1, 399.99, [[5, 1, 399.99]]],                   // Alice: chair
    [3, 89.99,  [[10, 1, 89.99]]],                   // Carol: headset
    [4,   9.97, [[7, 1, 4.99], [8, 1, 3.49], [7, 1, 4.99]]], // Dave: notebooks+pens
];

foreach ($orders as [$userId, $total, $items]) {
    $insertOrder->execute([$userId, $total]);
    $orderId = (int) $pdo->lastInsertId();
    foreach ($items as [$productId, $qty, $unitPrice]) {
        $insertItem->execute([$orderId, $productId, $qty, $unitPrice]);
    }
}

echo "=== Chapter 29 — SQL Queries ===" . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 1 — SELECT with WHERE: filter users by email domain
//
// Find all users whose email address ends in '@example.com'.
// Use a LIKE pattern in the WHERE clause.
// Print each user's name and email.
// ---------------------------------------------------------------------------

echo "--- TODO 1: Users from @example.com ---" . PHP_EOL;

// TODO 1 — write and execute the query, then print results
// $stmt = $pdo->prepare('SELECT name, email FROM users WHERE email LIKE ?');
// $stmt->execute(['%@example.com']);
// foreach ($stmt->fetchAll() as $row) { ... }

echo "[TODO 1] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 2 — INNER JOIN: orders with users, show order total per order
//
// Join the orders table with the users table.
// Print: order id, customer name, and order total.
// Sort by order id ascending.
// ---------------------------------------------------------------------------

echo "--- TODO 2: Orders with customer names (INNER JOIN) ---" . PHP_EOL;

// TODO 2 — write the INNER JOIN query
// SELECT o.id, u.name AS customer, o.total
// FROM   orders o
// JOIN   users  u ON u.id = o.user_id
// ORDER BY o.id ASC

echo "[TODO 2] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 3 — LEFT JOIN: find users with no orders
//
// Use a LEFT JOIN between users and orders.
// Filter to rows where orders.id IS NULL (meaning the user has no orders).
// Print the name and email of each such user.
// ---------------------------------------------------------------------------

echo "--- TODO 3: Users with no orders (LEFT JOIN) ---" . PHP_EOL;

// TODO 3 — write the LEFT JOIN query with IS NULL filter

echo "[TODO 3] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 4 — Subquery: products that appear in at least one order
//
// Write TWO versions of this query and compare results:
//   4a. Using IN with a subquery on order_items.product_id
//   4b. Using EXISTS
//
// Print product id, name, and price for each result.
// ---------------------------------------------------------------------------

echo "--- TODO 4a: Products ordered (IN subquery) ---" . PHP_EOL;

// TODO 4a — IN subquery
// SELECT id, name, price FROM products
// WHERE id IN (SELECT DISTINCT product_id FROM order_items)

echo "[TODO 4a] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "--- TODO 4b: Products ordered (EXISTS) ---" . PHP_EOL;

// TODO 4b — EXISTS
// SELECT id, name, price FROM products p
// WHERE EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id)

echo "[TODO 4b] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 5 — UNION + LIMIT/OFFSET
//
// 5a. Use UNION to combine two result sets:
//     - All users from the '@example.com' domain
//     - All users from the '@shop.com' domain
//     Include a literal column 'domain' in each SELECT so you can tell them apart.
//
// 5b. Demonstrate pagination:
//     Select products ordered by price DESC with LIMIT 3 OFFSET 0 (page 1),
//     then again with LIMIT 3 OFFSET 3 (page 2).
//     Print both pages.
// ---------------------------------------------------------------------------

echo "--- TODO 5a: UNION of two user groups ---" . PHP_EOL;

// TODO 5a — UNION query

echo "[TODO 5a] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "--- TODO 5b: Pagination with LIMIT/OFFSET ---" . PHP_EOL;

// TODO 5b — two paginated queries
// Page 1: SELECT id, name, price FROM products ORDER BY price DESC LIMIT 3 OFFSET 0
// Page 2: SELECT id, name, price FROM products ORDER BY price DESC LIMIT 3 OFFSET 3

echo "[TODO 5b] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "Done." . PHP_EOL;
