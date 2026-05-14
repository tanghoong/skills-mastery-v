<?php

declare(strict_types=1);

/**
 * Chapter 32 — PDO Deep Dive
 *
 * All tasks use an SQLite in-memory database.
 * Run with: php chapter_32.php
 *
 * Tasks:
 *   TODO 1 — Connect with DSN, set ERRMODE_EXCEPTION and FETCH_ASSOC as defaults
 *   TODO 2 — Named placeholders (:id) in a prepared statement
 *   TODO 3 — Positional placeholders (?) in a prepared statement
 *   TODO 4 — FETCH_CLASS: map results directly to a Product class
 *   TODO 5 — PDO transaction with try/catch/rollback
 */

echo "=== Chapter 32 — PDO Deep Dive ===" . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 1 — Connect with DSN and set default attributes
//
// Create a new PDO connection to SQLite in-memory.
// Set these attributes either via the $options array in the constructor
// or with setAttribute() after construction:
//   - PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION
//   - PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
//   - PDO::ATTR_EMULATE_PREPARES   => false
//
// After connecting, create the schema and seed data below.
// ---------------------------------------------------------------------------

// TODO 1 — create the $pdo connection
// $pdo = new PDO('sqlite::memory:', options: [
//     PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
//     PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
//     PDO::ATTR_EMULATE_PREPARES   => false,
// ]);
// echo "[TODO 1] Connected to SQLite in-memory." . PHP_EOL;

// --- Placeholder so the rest of the file can reference $pdo ---
// Remove these two lines once you complete TODO 1.
$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
echo "[TODO 1] Replace this placeholder with the full PDO constructor call above." . PHP_EOL;
// ---

// Bootstrap schema (runs regardless — do not modify)
$pdo->exec('
    CREATE TABLE products (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        name     TEXT NOT NULL,
        price    REAL NOT NULL,
        stock    INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL DEFAULT \'uncategorised\'
    );

    CREATE TABLE orders (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity   INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
');

// Seed products
$seed = $pdo->prepare('INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)');
foreach ([
    ['Mechanical Keyboard', 129.99, 30, 'Electronics'],
    ['USB-C Hub',            39.99, 80, 'Electronics'],
    ['Monitor 27"',         349.99, 15, 'Electronics'],
    ['Desk Lamp',            24.99, 60, 'Home Office'],
    ['Ergonomic Chair',     399.99,  8, 'Furniture'],
] as $p) {
    $seed->execute($p);
}

echo PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 2 — Named placeholders
//
// Write a prepared statement that selects a single product by id using a
// named placeholder (:id).
// Fetch the result with fetch() and print the product's name and price.
//
// Then use bindValue() with an explicit PDO::PARAM_INT type hint to bind
// the value instead of passing it in execute([...]).
// ---------------------------------------------------------------------------

echo "--- TODO 2: Named placeholder ---" . PHP_EOL;

// TODO 2a — execute with named placeholder in the array
// $stmt = $pdo->prepare('SELECT id, name, price, category FROM products WHERE id = :id');
// $stmt->execute([':id' => 3]);
// $product = $stmt->fetch(PDO::FETCH_ASSOC);
// echo "Product #{$product['id']}: {$product['name']} @ £{$product['price']}" . PHP_EOL;

// TODO 2b — same query but use bindValue() with PARAM_INT
// $stmt = $pdo->prepare('SELECT id, name, price FROM products WHERE id = :id');
// $stmt->bindValue(':id', 1, PDO::PARAM_INT);
// $stmt->execute();
// $product = $stmt->fetch(PDO::FETCH_ASSOC);
// echo "bindValue result: {$product['name']}" . PHP_EOL;

echo "[TODO 2] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 3 — Positional placeholders
//
// Write a prepared statement that:
//   3a. Inserts a new product using positional ? placeholders
//   3b. Immediately selects it back by the lastInsertId()
//
// Then demonstrate re-using the same prepared statement in a loop to insert
// 3 more products at once (each with different values).
// ---------------------------------------------------------------------------

echo "--- TODO 3: Positional placeholders ---" . PHP_EOL;

// TODO 3a — single insert
// $stmt = $pdo->prepare('INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)');
// $stmt->execute(['Webcam HD', 79.99, 40, 'Electronics']);
// $newId = (int) $pdo->lastInsertId();
// echo "Inserted product id: {$newId}" . PHP_EOL;

// TODO 3b — loop re-use
// $stmt = $pdo->prepare('INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)');
// $batch = [
//     ['Headset Pro',   89.99, 25, 'Electronics'],
//     ['Notebook A5',    4.99, 200, 'Stationery'],
//     ['Sticky Notes',   2.99, 150, 'Stationery'],
// ];
// foreach ($batch as $item) {
//     $stmt->execute($item);
//     echo "Inserted: {$item[0]}" . PHP_EOL;
// }

echo "[TODO 3] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 4 — FETCH_CLASS
//
// Define a Product class below (it is started for you).
// Complete it so that PDO can map the four columns (id, name, price, category)
// onto public readonly properties.
//
// Then write a query that selects all products and fetches them as Product
// objects using setFetchMode(PDO::FETCH_CLASS, Product::class).
//
// Print each product using the object's properties (not array access).
// ---------------------------------------------------------------------------

echo "--- TODO 4: FETCH_CLASS ---" . PHP_EOL;

// TODO 4 — complete this class so PDO can hydrate it
final class Product
{
    // PDO sets properties before the constructor runs.
    // Declare matching public properties for each column name.

    // TODO: add public readonly int $id;
    // TODO: add public readonly string $name;
    // TODO: add public readonly float $price;
    // TODO: add public readonly string $category;
}

// TODO 4 — fetch all products as Product objects
// $stmt = $pdo->query('SELECT id, name, price, category FROM products ORDER BY id ASC');
// $stmt->setFetchMode(PDO::FETCH_CLASS, Product::class);
// /** @var Product[] $products */
// $products = $stmt->fetchAll();
// foreach ($products as $p) {
//     echo "  [{$p->id}] {$p->name} — £{$p->price} ({$p->category})" . PHP_EOL;
// }

echo "[TODO 4] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 5 — PDO transaction with try/catch/rollback
//
// Wrap an order insert inside a transaction:
//   5a. Begin transaction
//   5b. Insert a row into orders (product_id = 1, quantity = 2)
//   5c. Simulate a second operation that FAILS (insert with invalid product_id = 9999)
//   5d. In the catch block, roll back and print the error message
//   5e. Verify by querying COUNT(*) from orders — it should be 0
//       (or unchanged if you added rows in TODO 3 that are outside a transaction)
//
// Then run a SECOND transaction that succeeds:
//   5f. Begin transaction
//   5g. Insert a valid order (product_id = 2, quantity = 1)
//   5h. Commit
//   5i. Print the new order id using lastInsertId()
// ---------------------------------------------------------------------------

echo "--- TODO 5: PDO transaction ---" . PHP_EOL;

// TODO 5 — failing transaction
// $pdo->beginTransaction();
// try {
//     $pdo->prepare('INSERT INTO orders (product_id, quantity) VALUES (?, ?)')->execute([1, 2]);
//     // Force failure: product_id 9999 violates FK (if PRAGMA foreign_keys = ON)
//     // SQLite may not enforce this without the PRAGMA — use an explicit check if needed
//     $pdo->prepare('INSERT INTO orders (product_id, quantity) VALUES (?, ?)')->execute([9999, 1]);
//     $pdo->commit();
// } catch (\PDOException $e) {
//     $pdo->rollBack();
//     echo "Rolled back: " . $e->getMessage() . PHP_EOL;
// }
//
// $orderCount = (int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn();
// echo "Orders after rollback: {$orderCount}" . PHP_EOL;

// TODO 5 — successful transaction
// $pdo->beginTransaction();
// try {
//     $pdo->prepare('INSERT INTO orders (product_id, quantity) VALUES (?, ?)')->execute([2, 1]);
//     $pdo->commit();
//     $newOrderId = (int) $pdo->lastInsertId();
//     echo "Order committed. New order id: {$newOrderId}" . PHP_EOL;
// } catch (\PDOException $e) {
//     $pdo->rollBack();
//     echo "Transaction failed: " . $e->getMessage() . PHP_EOL;
// }

echo "[TODO 5] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "Done." . PHP_EOL;
