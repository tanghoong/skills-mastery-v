<?php

declare(strict_types=1);

/**
 * Chapter 33 — Query Builder Pattern
 *
 * Build a fluent QueryBuilder class from scratch, then execute the built
 * queries against an SQLite in-memory database to verify correctness.
 * Run with: php chapter_33.php
 *
 * Tasks:
 *   TODO 1 — Implement QueryBuilder with table(), select(), where(), limit(), build()
 *   TODO 2 — Add insert(array $data): array method
 *   TODO 3 — Add update(array $data): array method
 *   TODO 4 — Add delete(): array method
 *   TODO 5 — Execute all built queries against SQLite and verify results
 */

echo "=== Chapter 33 — Query Builder Pattern ===" . PHP_EOL . PHP_EOL;

// ---------------------------------------------------------------------------
// TODO 1 — Implement the core QueryBuilder class
//
// The class must:
//   - Store internal state: table, columns, wheres, bindings, limit, offset, orderBy
//   - Return `static` (cloned) from every chained method so the builder is immutable
//   - Implement these public methods:
//       table(string $table): static
//       select(string ...$cols): static
//       where(string $col, mixed $val): static  — appends "col = ?" and stores the binding
//       limit(int $n): static
//       offset(int $n): static
//       orderBy(string $col, string $direction = 'ASC'): static
//       build(): array  — returns [$sql, $bindings]
//
// build() must assemble: SELECT <cols> FROM <table> [WHERE ...] [ORDER BY ...] [LIMIT n] [OFFSET n]
//
// Values MUST go into $bindings — never interpolated into the SQL string.
// ---------------------------------------------------------------------------

// TODO 1 — implement the class
class QueryBuilder
{
    private string  $table    = '';
    private array   $columns  = ['*'];
    private array   $wheres   = [];
    private array   $bindings = [];
    private ?int    $limitVal  = null;
    private ?int    $offsetVal = null;
    private ?string $orderByClause = null;

    public function table(string $table): static
    {
        // TODO 1: clone $this, set table, return clone
        throw new \RuntimeException('TODO 1: implement table()');
    }

    public function select(string ...$cols): static
    {
        // TODO 1: clone $this, set columns, return clone
        throw new \RuntimeException('TODO 1: implement select()');
    }

    public function where(string $col, mixed $val): static
    {
        // TODO 1: clone $this, append "$col = ?" to wheres, append $val to bindings, return clone
        throw new \RuntimeException('TODO 1: implement where()');
    }

    public function limit(int $n): static
    {
        // TODO 1: clone $this, set limitVal, return clone
        throw new \RuntimeException('TODO 1: implement limit()');
    }

    public function offset(int $n): static
    {
        // TODO 1: clone $this, set offsetVal, return clone
        throw new \RuntimeException('TODO 1: implement offset()');
    }

    public function orderBy(string $col, string $direction = 'ASC'): static
    {
        // TODO 1: sanitise direction to ASC or DESC, clone $this, set orderByClause, return clone
        throw new \RuntimeException('TODO 1: implement orderBy()');
    }

    /**
     * @return array{0: string, 1: list<mixed>}
     */
    public function build(): array
    {
        // TODO 1: assemble the SELECT SQL string from internal state
        // Return [$sql, $this->bindings]
        throw new \RuntimeException('TODO 1: implement build()');
    }

    // -----------------------------------------------------------------------
    // TODO 2 — insert(array $data): array
    //
    // Build an INSERT statement from an associative array of column => value.
    // Return [$sql, $values] where $values are the column values in order.
    //
    // Result SQL form:
    //   INSERT INTO <table> (col1, col2, ...) VALUES (?, ?, ...)
    // -----------------------------------------------------------------------

    /**
     * @param array<string, mixed> $data
     * @return array{0: string, 1: list<mixed>}
     */
    public function insert(array $data): array
    {
        // TODO 2: implement insert
        throw new \RuntimeException('TODO 2: implement insert()');
    }

    // -----------------------------------------------------------------------
    // TODO 3 — update(array $data): array
    //
    // Build an UPDATE statement.
    // The WHERE conditions already stored in $this->wheres are appended.
    // SET bindings come FIRST, then WHERE bindings in the returned array.
    //
    // Result SQL form:
    //   UPDATE <table> SET col1 = ?, col2 = ? [WHERE ...]
    // -----------------------------------------------------------------------

    /**
     * @param array<string, mixed> $data
     * @return array{0: string, 1: list<mixed>}
     */
    public function update(array $data): array
    {
        // TODO 3: implement update
        throw new \RuntimeException('TODO 3: implement update()');
    }

    // -----------------------------------------------------------------------
    // TODO 4 — delete(): array
    //
    // Build a DELETE statement using the WHERE conditions already stored.
    //
    // Result SQL form:
    //   DELETE FROM <table> [WHERE ...]
    // -----------------------------------------------------------------------

    /**
     * @return array{0: string, 1: list<mixed>}
     */
    public function delete(): array
    {
        // TODO 4: implement delete
        throw new \RuntimeException('TODO 4: implement delete()');
    }
}

// ---------------------------------------------------------------------------
// Helper — executes a built query against PDO and returns the PDOStatement
// ---------------------------------------------------------------------------

function qbExecute(PDO $pdo, array $built): \PDOStatement
{
    [$sql, $bindings] = $built;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($bindings);
    return $stmt;
}

// ---------------------------------------------------------------------------
// TODO 5 — Execute all built queries against SQLite and verify results
//
// The bootstrap below creates the schema. Your job is to:
//
// 5a. Use QueryBuilder::insert() to insert 5 products.
//     Verify with a SELECT COUNT(*) = 5.
//
// 5b. Use QueryBuilder::build() (SELECT) to fetch only 'Electronics' products.
//     Assert the result contains only Electronics rows.
//
// 5c. Use QueryBuilder::update() to change the price of product id = 1 to 99.99.
//     Verify by fetching product 1 and printing the new price.
//
// 5d. Use QueryBuilder::delete() to delete product id = 5.
//     Verify with a SELECT COUNT(*) = 4.
//
// 5e. Build a query with .limit(2).offset(2).orderBy('price', 'DESC') and
//     print the result — this should be the 3rd and 4th most expensive products.
// ---------------------------------------------------------------------------

// Bootstrap — do not modify
$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->exec('
    CREATE TABLE products (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        name     TEXT NOT NULL,
        price    REAL NOT NULL,
        category TEXT NOT NULL DEFAULT \'uncategorised\'
    );
');

$qb = new QueryBuilder();

echo "--- TODO 5a: INSERT 5 products ---" . PHP_EOL;

// TODO 5a — use $qb->table('products')->insert([...]) for each product
// Example:
// qbExecute($pdo, $qb->table('products')->insert([
//     'name'     => 'Mechanical Keyboard',
//     'price'    => 129.99,
//     'category' => 'Electronics',
// ]));
// ... (insert 4 more) ...
//
// $count = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
// echo "Products inserted: {$count} (expected 5)" . PHP_EOL;

echo "[TODO 5a] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "--- TODO 5b: SELECT Electronics only ---" . PHP_EOL;

// TODO 5b — use $qb->table('products')->select(...)->where('category', 'Electronics')->build()
// $rows = qbExecute($pdo, ...)->fetchAll();
// foreach ($rows as $row) { ... }

echo "[TODO 5b] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "--- TODO 5c: UPDATE price for product id = 1 ---" . PHP_EOL;

// TODO 5c — use $qb->table('products')->where('id', 1)->update(['price' => 99.99])
// qbExecute($pdo, ...);
// $updated = $pdo->query('SELECT name, price FROM products WHERE id = 1')->fetch();
// echo "Updated: {$updated['name']} @ £{$updated['price']}" . PHP_EOL;

echo "[TODO 5c] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "--- TODO 5d: DELETE product id = 5 ---" . PHP_EOL;

// TODO 5d — use $qb->table('products')->where('id', 5)->delete()
// qbExecute($pdo, ...);
// $count = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
// echo "Products remaining: {$count} (expected 4)" . PHP_EOL;

echo "[TODO 5d] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "--- TODO 5e: Paginated SELECT (limit 2, offset 2, order by price DESC) ---" . PHP_EOL;

// TODO 5e — chain table(), select(), orderBy(), limit(), offset(), build()
// $rows = qbExecute($pdo,
//     $qb->table('products')
//         ->select('id', 'name', 'price')
//         ->orderBy('price', 'DESC')
//         ->limit(2)
//         ->offset(2)
//         ->build()
// )->fetchAll();
// foreach ($rows as $row) {
//     echo "  [{$row['id']}] {$row['name']} £{$row['price']}" . PHP_EOL;
// }

echo "[TODO 5e] Not yet implemented." . PHP_EOL . PHP_EOL;

echo "Done." . PHP_EOL;
