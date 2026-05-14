# Chapter 32 — PDO Deep Dive

> **Goal:** Use PHP's PDO extension correctly — safe prepared statements, the right fetch mode for each situation, and transaction control from PHP code.

## 32.1 What Is PDO?

PDO (PHP Data Objects) is PHP's database abstraction layer. It provides a consistent API regardless of which database driver you use underneath (MySQL, PostgreSQL, SQLite). Critically, it supports prepared statements, which are the primary defence against SQL injection.

Coming from Prisma, PDO sits at a much lower level — you write SQL by hand and PDO handles binding, execution, and result fetching.

## 32.2 Connecting — The DSN

A DSN (Data Source Name) is a connection string that identifies the driver, host, database name, and character set.

```php
<?php
declare(strict_types=1);

// MySQL DSN
$dsn = 'mysql:host=127.0.0.1;port=3306;dbname=devlog;charset=utf8mb4';

// SQLite DSN (file-based)
$dsn = 'sqlite:/path/to/database.sqlite';

// SQLite in-memory (great for tests)
$dsn = 'sqlite::memory:';

$pdo = new PDO(
    $dsn,
    username: 'devlog_user',   // null for SQLite
    password: 'localpassword', // null for SQLite
    options: [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,  // use native prepared statements
    ]
);
```

`PDO::ERRMODE_EXCEPTION` is non-negotiable in modern PHP. It throws a `PDOException` on any error, which means failures surface immediately rather than silently returning `false`.

## 32.3 Prepared Statements — Named Placeholders

Named placeholders (`:name`) are clearer than positional ones and let you bind in any order.

```php
<?php
declare(strict_types=1);

$stmt = $pdo->prepare(
    'SELECT id, name, price FROM products WHERE category = :category AND price < :max_price'
);

$stmt->execute([
    ':category'  => 'Electronics',
    ':max_price' => 100.00,
]);

$products = $stmt->fetchAll();
```

You can also bind individually, which lets you specify the type:

```php
<?php
declare(strict_types=1);

$stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
$stmt->bindValue(':id', 42, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch();
```

## 32.4 Prepared Statements — Positional Placeholders

Positional placeholders use `?` and are bound in order. Useful for short, simple queries.

```php
<?php
declare(strict_types=1);

$stmt = $pdo->prepare(
    'INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)'
);

$stmt->execute(['Mechanical Keyboard', 129.99, 50, 'Electronics']);
$newId = (int) $pdo->lastInsertId();
```

Re-using a prepared statement inside a loop is efficient — the query is parsed once, then executed many times with different bindings:

```php
<?php
declare(strict_types=1);

$stmt = $pdo->prepare('INSERT INTO products (name, price, category) VALUES (?, ?, ?)');

foreach ($products as $p) {
    $stmt->execute([$p['name'], $p['price'], $p['category']]);
}
```

## 32.5 Fetch Modes

PDO offers several fetch modes that control how result rows are returned.

**FETCH_ASSOC** — associative array, keys are column names (the most common choice):

```php
<?php
declare(strict_types=1);

$stmt = $pdo->query('SELECT id, name, price FROM products LIMIT 5');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['name'] . ': £' . $row['price'] . PHP_EOL;
}
```

**FETCH_OBJ** — anonymous `stdClass` object, columns become properties:

```php
<?php
declare(strict_types=1);

$stmt = $pdo->query('SELECT id, name, price FROM products LIMIT 1');
$product = $stmt->fetch(PDO::FETCH_OBJ);
echo $product->name; // stdClass property access
```

**FETCH_CLASS** — maps directly into a named class. PDO sets properties before the constructor runs (unless you pass `PDO::FETCH_CLASS | PDO::FETCH_PROPS_LATE`).

```php
<?php
declare(strict_types=1);

final class Product
{
    public readonly int    $id;
    public readonly string $name;
    public readonly float  $price;
    public readonly string $category;
}

$stmt = $pdo->prepare('SELECT id, name, price, category FROM products WHERE id = :id');
$stmt->execute([':id' => 7]);
$stmt->setFetchMode(PDO::FETCH_CLASS, Product::class);

/** @var Product|false $product */
$product = $stmt->fetch();

if ($product !== false) {
    echo $product->name . ' costs £' . $product->price;
}
```

**FETCH_KEY_PAIR** — produces an associative array keyed by the first column, valued by the second. Perfect for lookup maps:

```php
<?php
declare(strict_types=1);

// ['Electronics' => 12, 'Books' => 34, ...]
$categoryCounts = $pdo
    ->query('SELECT category, COUNT(*) FROM products GROUP BY category')
    ->fetchAll(PDO::FETCH_KEY_PAIR);
```

## 32.6 Transactions in PDO

PDO wraps the SQL transaction commands in PHP methods:

```php
<?php
declare(strict_types=1);

$pdo->beginTransaction();

try {
    $orderStmt = $pdo->prepare(
        'INSERT INTO orders (user_id, total) VALUES (:user_id, :total)'
    );
    $orderStmt->execute([':user_id' => 3, ':total' => 199.98]);
    $orderId = (int) $pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES (:order_id, :product_id, :quantity, :unit_price)'
    );
    $itemStmt->execute([
        ':order_id'   => $orderId,
        ':product_id' => 7,
        ':quantity'   => 2,
        ':unit_price' => 99.99,
    ]);

    $pdo->commit();
    echo "Order #{$orderId} placed successfully." . PHP_EOL;
} catch (\PDOException $e) {
    $pdo->rollBack();
    echo "Transaction failed: " . $e->getMessage() . PHP_EOL;
}
```

## 32.7 Persistent Connections

Persistent connections reuse an existing connection instead of opening a new one on every request. This can reduce latency in scripts that make many short-lived connections, but it is generally safer to leave connection pooling to a proper tool (ProxySQL, PgBouncer) rather than relying on PHP's persistent connections.

```php
<?php
declare(strict_types=1);

$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_PERSISTENT => true,
]);
```

Caveat: persistent connections carry state (uncommitted transactions, session variables) from a previous request. Always explicitly `ROLLBACK` or `COMMIT` before a script ends if using persistent connections.

## Key Takeaways

- Always set `PDO::ERRMODE_EXCEPTION` — never let errors fail silently.
- Prepared statements with placeholders are the only safe way to include user-supplied values in SQL.
- Re-use a prepared statement inside a loop; PDO sends the parse step only once.
- `FETCH_CLASS` maps SQL rows directly to typed PHP objects with no manual hydration.
- Wrap multi-step writes in `beginTransaction()` / `commit()` / `rollBack()`.
- Prefer a dedicated connection pool over `PDO::ATTR_PERSISTENT` in production.

## What's Next

Chapter 33 builds on raw PDO to construct a fluent **Query Builder** — a PHP class that composes SQL programmatically, prevents injection at the builder layer, and provides a cleaner API than hand-writing SQL strings everywhere.
