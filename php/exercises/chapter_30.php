<?php

declare(strict_types=1);

/**
 * Chapter 30 — SQL Aggregation & Window Functions
 *
 * Uses the same SQLite in-memory schema + seed data as Chapter 28/29.
 * SQLite supports window functions from version 3.25.0 (2018-09-15).
 * Run with: php chapter_30.php
 *
 * Tasks:
 *   TODO 1 — GROUP BY: count and average price per category
 *   TODO 2 — HAVING: only categories with avg price > 50
 *   TODO 3 — ROW_NUMBER() OVER PARTITION BY: rank products within category by price
 *   TODO 4 — RANK() vs DENSE_RANK(): show the difference with tied prices
 *   TODO 5 — Running total: SUM() OVER (ORDER BY created_at)
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
foreach ([
    ['alice@example.com', 'Alice Smith'],
    ['bob@example.com',   'Bob Jones'],
    ['carol@shop.com',    'Carol White'],
    ['dave@shop.com',     'Dave Brown'],
    ['eve@mail.org',      'Eve Green'],
] as $u) {
    $insertUser->execute($u);
}

// Seed: products — deliberately include tied prices for RANK vs DENSE_RANK demo
$insertProduct = $pdo->prepare('INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)');
foreach ([
    ['Mechanical Keyboard', 129.99, 30, 'Electronics'],
    ['USB-C Hub',            39.99, 80, 'Electronics'],
    ['Monitor 27"',         349.99, 15, 'Electronics'],
    ['Webcam HD',            79.99, 40, 'Electronics'],
    ['Headset Pro',          79.99, 25, 'Electronics'],   // same price as Webcam — tied
    ['Desk Lamp',            24.99, 60, 'Home Office'],
    ['Desk Fan',             24.99, 45, 'Home Office'],   // same price as Lamp — tied
    ['Ergonomic Chair',     399.99,  8, 'Furniture'],
    ['Standing Desk',       599.99,  5, 'Furniture'],
    ['Notebook A5',           4.99, 200, 'Stationery'],
    ['Ballpoint Pens x10',    3.49, 300, 'Stationery'],
    ['Sticky Notes',          2.99, 150, 'Stationery'],
] as $p) {
    $insertProduct->execute($p);
}

// Seed: orders (spread across different timestamps via direct SQL)
$pdo->exec("
    INSERT INTO users (email, name) VALUES ('system@internal', 'System'); -- id 6 (ignored)
");
$insertOrder = $pdo->prepare("INSERT INTO orders (user_id, total, created_at) VALUES (?, ?, ?)");
$insertItem  = $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');

$ordersData = [
    [1, 169.98, '2024-01-15 10:00:00', [[1, 1, 129.99], [2, 1, 39.99]]],
    [2, 429.98, '2024-02-20 14:30:00', [[3, 1, 349.99], [4, 1, 79.99]]],
    [1, 399.99, '2024-03-05 09:15:00', [[8, 1, 399.99]]],
    [3,  89.99, '2024-03-18 16:00:00', [[5, 1, 89.99]]],
    [4,   9.97, '2024-04-01 11:45:00', [[10, 1, 4.99], [11, 1, 3.49], [12, 1, 2.99]]],
];

foreach ($ordersData as [$userId, $total, $createdAt, $items]) {
    $insertOrder->execute([$userId, $total, $createdAt]);
    $orderId = (int) $pdo->lastInsertId();
    foreach ($items as [$productId, $qty, $unitPrice]) {
        $insertItem->execute([$orderId, $productId, $qty, $unitPrice]);
    }
}

echo "=== Chapter 30 — Aggregation & Window Functions ===" . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 1 — GROUP BY: product count and average price per category
//
// Query the products table.
// Group by category.
// For each category, show:
//   - category name
//   - number of products (COUNT)
//   - average price (AVG, rounded to 2 decimal places)
// Sort by average price descending.
// ---------------------------------------------------------------------------

echo "--- TODO 1: Products per category (GROUP BY) ---" . PHP_EOL;

// TODO 1 — write and execute the GROUP BY query
// SELECT category,
//        COUNT(*) AS product_count,
//        ROUND(AVG(price), 2) AS avg_price
// FROM products
// GROUP BY category
// ORDER BY avg_price DESC

echo "[TODO 1] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 2 — HAVING: only categories with avg price > 50
//
// Same as TODO 1 but add a HAVING clause to exclude categories
// whose average price is 50 or below.
// ---------------------------------------------------------------------------

echo "--- TODO 2: Categories with avg price > 50 (HAVING) ---" . PHP_EOL;

// TODO 2 — add HAVING AVG(price) > 50 to the previous query

echo "[TODO 2] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 3 — ROW_NUMBER() OVER PARTITION BY
//
// Rank products within their category by price (highest first).
// Use ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC).
// Print: category, product name, price, and row_num.
// Order the final result by category ASC, row_num ASC.
// ---------------------------------------------------------------------------

echo "--- TODO 3: ROW_NUMBER per category ---" . PHP_EOL;

// TODO 3 — window function query
// SELECT
//     category,
//     name,
//     price,
//     ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS row_num
// FROM products
// ORDER BY category ASC, row_num ASC

echo "[TODO 3] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 4 — RANK() vs DENSE_RANK()
//
// Show the difference when tied prices exist.
// Query the products table and compute three window-function columns:
//   - ROW_NUMBER() OVER (ORDER BY price DESC)
//   - RANK()       OVER (ORDER BY price DESC)
//   - DENSE_RANK() OVER (ORDER BY price DESC)
// (No PARTITION BY — rank across all products.)
// Print all columns so the gaps in RANK vs DENSE_RANK are visible.
// ---------------------------------------------------------------------------

echo "--- TODO 4: RANK vs DENSE_RANK ---" . PHP_EOL;

// TODO 4 — write the three-window-function query
// SELECT
//     name,
//     price,
//     ROW_NUMBER() OVER (ORDER BY price DESC) AS row_num,
//     RANK()       OVER (ORDER BY price DESC) AS rnk,
//     DENSE_RANK() OVER (ORDER BY price DESC) AS dense_rnk
// FROM products
// ORDER BY price DESC

echo "[TODO 4] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 5 — Running total with SUM() OVER (ORDER BY created_at)
//
// Query the orders table.
// Use SUM(total) OVER (ORDER BY created_at ASC) to build a cumulative
// revenue figure that grows with each successive order.
// Print: order id, created_at, total, and running_total.
// ---------------------------------------------------------------------------

echo "--- TODO 5: Running total of order revenue ---" . PHP_EOL;

// TODO 5 — running total query
// SELECT
//     id,
//     created_at,
//     total,
//     SUM(total) OVER (ORDER BY created_at ASC) AS running_total
// FROM orders
// ORDER BY created_at ASC

echo "[TODO 5] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "Done." . PHP_EOL;
