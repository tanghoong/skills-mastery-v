<?php

declare(strict_types=1);

/**
 * Chapter 31 — Indexes, Transactions & Locking
 *
 * Uses SQLite in-memory. SQLite's locking model differs from MySQL's
 * row-level locking, but transactions and SAVEPOINTs behave identically
 * at the SQL level — making it a perfect sandbox.
 * Run with: php chapter_31.php
 *
 * Tasks:
 *   TODO 1 — Create indexes on orders.user_id and products.category
 *   TODO 2 — EXPLAIN QUERY PLAN before and after adding an index
 *   TODO 3 — Successful transaction: insert order + order_items atomically
 *   TODO 4 — Rolled-back transaction: verify data is NOT persisted on failure
 *   TODO 5 — SAVEPOINT: partial rollback inside a transaction
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

// Seed
$pdo->exec("INSERT INTO users (email, name) VALUES
    ('alice@example.com', 'Alice'),
    ('bob@example.com',   'Bob'),
    ('carol@shop.com',    'Carol')
");

$pdo->exec("INSERT INTO products (name, price, stock, category) VALUES
    ('Keyboard',    129.99, 30, 'Electronics'),
    ('USB Hub',      39.99, 80, 'Electronics'),
    ('Monitor',     349.99, 15, 'Electronics'),
    ('Desk Lamp',    24.99, 60, 'Home Office'),
    ('Ergo Chair',  399.99,  8, 'Furniture')
");

$pdo->exec("INSERT INTO orders (user_id, total) VALUES (1, 169.98), (2, 349.99)");
$pdo->exec("INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 129.99),
    (1, 2, 1, 39.99),
    (2, 3, 1, 349.99)
");

echo "=== Chapter 31 — Indexes, Transactions & Locking ===" . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 1 — Create indexes
//
// Create two indexes:
//   1a. idx_orders_user_id  on orders(user_id)
//   1b. idx_products_category on products(category)
//
// In SQLite: CREATE INDEX idx_name ON table_name (column_name);
// ---------------------------------------------------------------------------

echo "--- TODO 1: Create indexes ---" . PHP_EOL;

// TODO 1a — index on orders.user_id
// $pdo->exec('CREATE INDEX idx_orders_user_id ON orders (user_id)');

// TODO 1b — index on products.category
// $pdo->exec('CREATE INDEX idx_products_category ON products (category)');

echo "[TODO 1] Indexes not yet created." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 2 — EXPLAIN QUERY PLAN
//
// In SQLite the equivalent of MySQL's EXPLAIN is: EXPLAIN QUERY PLAN <query>
// It returns rows describing how SQLite plans to execute the query.
//
// 2a. Run EXPLAIN QUERY PLAN on:
//       SELECT * FROM orders WHERE user_id = 1
//     BEFORE creating the index, and print the plan.
//
// 2b. Create the index (CREATE INDEX idx_orders_user_id ON orders (user_id))
//     then run EXPLAIN QUERY PLAN on the same query again.
//     Print the plan and observe the difference.
//
// The plan output will contain a 'detail' column. Look for "USING INDEX" in
// the second plan versus "SCAN" in the first.
// ---------------------------------------------------------------------------

echo "--- TODO 2: EXPLAIN QUERY PLAN (before and after index) ---" . PHP_EOL;

// 2a. Plan before index
// $plan = $pdo->query('EXPLAIN QUERY PLAN SELECT * FROM orders WHERE user_id = 1')->fetchAll();
// echo "Before index:" . PHP_EOL;
// foreach ($plan as $row) { print_r($row); }

// 2b. Create index then re-explain
// $pdo->exec('CREATE INDEX idx_orders_user_id ON orders (user_id)');
// $plan = $pdo->query('EXPLAIN QUERY PLAN SELECT * FROM orders WHERE user_id = 1')->fetchAll();
// echo "After index:" . PHP_EOL;
// foreach ($plan as $row) { print_r($row); }

echo "[TODO 2] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 3 — Successful transaction
//
// Place a new order for user_id = 3 (Carol) atomically:
//   - Insert a row into orders (user_id = 3, total = 424.98)
//   - Insert two rows into order_items (products 1 and 3, qty 1 each)
//
// Steps:
//   $pdo->beginTransaction();
//   ... inserts ...
//   $pdo->commit();
//
// After the commit, verify by querying COUNT(*) from both tables
// and printing the result.
// ---------------------------------------------------------------------------

echo "--- TODO 3: Successful transaction ---" . PHP_EOL;

// TODO 3 — wrap the inserts in a transaction
// $pdo->beginTransaction();
// try {
//     $stmt = $pdo->prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)');
//     $stmt->execute([3, 424.98]);
//     $orderId = (int) $pdo->lastInsertId();
//
//     $itemStmt = $pdo->prepare(
//         'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
//     );
//     $itemStmt->execute([$orderId, 1, 1, 129.99]);
//     $itemStmt->execute([$orderId, 3, 1, 349.99]);
//
//     $pdo->commit();
//     echo "Transaction committed. Order #{$orderId} created." . PHP_EOL;
// } catch (\PDOException $e) {
//     $pdo->rollBack();
//     echo "Transaction failed: " . $e->getMessage() . PHP_EOL;
// }

echo "[TODO 3] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 4 — Rolled-back transaction
//
// Simulate a failure mid-transaction:
//   - Begin a transaction
//   - Insert a valid order row for user_id = 2
//   - Attempt to insert an order_item with an invalid product_id (e.g., 9999)
//     to trigger a foreign key violation
//   - Catch the exception and call rollBack()
//
// After the rollback, verify the order count is unchanged (still 2 from
// the bootstrap, or 3 if you completed TODO 3).
// Print "Orders in DB: N" to confirm the rolled-back insert is gone.
// ---------------------------------------------------------------------------

echo "--- TODO 4: Rolled-back transaction ---" . PHP_EOL;

// TODO 4 — transaction that rolls back
// $pdo->beginTransaction();
// try {
//     $stmt = $pdo->prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)');
//     $stmt->execute([2, 99.99]);
//     $orderId = (int) $pdo->lastInsertId();
//
//     // This will fail — product_id 9999 does not exist
//     $itemStmt = $pdo->prepare(
//         'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
//     );
//     $itemStmt->execute([$orderId, 9999, 1, 99.99]);
//
//     $pdo->commit();
// } catch (\PDOException $e) {
//     $pdo->rollBack();
//     echo "Rolled back due to: " . $e->getMessage() . PHP_EOL;
// }
//
// $count = (int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn();
// echo "Orders in DB: {$count}" . PHP_EOL;

echo "[TODO 4] Not yet implemented." . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 5 — SAVEPOINT: partial rollback
//
// SAVEPOINTs let you roll back to a named checkpoint without aborting
// the entire transaction.
//
// Demonstrate with these steps inside a single transaction:
//   5a. INSERT a new order for user_id = 1 (valid)
//   5b. SAVEPOINT sp_after_order  (in SQL: SAVEPOINT sp_after_order)
//   5c. INSERT an order_item with an invalid product_id = 9999
//   5d. ROLLBACK TO SAVEPOINT sp_after_order  (undo only step 5c)
//   5e. INSERT a VALID order_item for the same order
//   5f. RELEASE SAVEPOINT sp_after_order (optional cleanup)
//   5g. COMMIT
//
// After commit: verify the order exists and has exactly one item.
//
// Note: In PDO there is no dedicated savepoint method — use exec() to send
// the raw SQL:  $pdo->exec('SAVEPOINT sp_after_order');
// ---------------------------------------------------------------------------

echo "--- TODO 5: SAVEPOINT / partial rollback ---" . PHP_EOL;

// TODO 5 — savepoint demo
// $pdo->beginTransaction();
// try {
//     // 5a
//     $stmt = $pdo->prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)');
//     $stmt->execute([1, 129.99]);
//     $orderId = (int) $pdo->lastInsertId();
//
//     // 5b
//     $pdo->exec('SAVEPOINT sp_after_order');
//
//     // 5c — invalid insert
//     try {
//         $pdo->prepare(
//             'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
//         )->execute([$orderId, 9999, 1, 999.99]);
//     } catch (\PDOException $inner) {
//         // 5d — rollback only to the savepoint
//         $pdo->exec('ROLLBACK TO SAVEPOINT sp_after_order');
//         echo "Partial rollback: bad item undone." . PHP_EOL;
//     }
//
//     // 5e — valid insert
//     $pdo->prepare(
//         'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
//     )->execute([$orderId, 1, 1, 129.99]);
//
//     // 5f
//     $pdo->exec('RELEASE SAVEPOINT sp_after_order');
//
//     // 5g
//     $pdo->commit();
//     echo "Committed. Order #{$orderId} with 1 valid item." . PHP_EOL;
//
//     $itemCount = (int) $pdo->query(
//         "SELECT COUNT(*) FROM order_items WHERE order_id = {$orderId}"
//     )->fetchColumn();
//     echo "Item count for order #{$orderId}: {$itemCount}" . PHP_EOL;
// } catch (\PDOException $e) {
//     $pdo->rollBack();
//     echo "Transaction failed: " . $e->getMessage() . PHP_EOL;
// }

echo "[TODO 5] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "Done." . PHP_EOL;
