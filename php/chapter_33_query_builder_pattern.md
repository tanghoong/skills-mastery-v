# Chapter 33 — Query Builder Pattern

> **Goal:** Build a fluent PHP query builder from scratch that composes SQL safely through method chaining, preventing injection at the builder layer and supporting SELECT, INSERT, UPDATE, and DELETE.

## 33.1 The Problem with Raw SQL Strings

When you hand-write SQL across a codebase you accumulate scattered strings, inconsistent quoting, and error-prone concatenation. A query builder centralises SQL construction behind a typed API.

You have used Prisma's query builder in TypeScript — this chapter builds the same concept from PHP, which is instructive because you see exactly how the safety mechanisms work.

## 33.2 Fluent Interface and Method Chaining

Method chaining works by having every mutating method return `$this` (or `static` for subclassing):

```php
<?php
declare(strict_types=1);

$result = (new QueryBuilder())
    ->table('products')
    ->select('id', 'name', 'price')
    ->where('category', 'Electronics')
    ->limit(10)
    ->build();

// $result === [$sql, $bindings]
```

Returning `static` rather than `self` ensures that if a subclass calls a chained method, it gets back an instance of the subclass, not the parent.

## 33.3 Core QueryBuilder — SELECT

```php
<?php
declare(strict_types=1);

final class QueryBuilder
{
    private string        $table    = '';
    private array         $columns  = ['*'];
    private array         $wheres   = [];
    private array         $bindings = [];
    private ?int          $limit    = null;
    private ?int          $offset   = null;
    private ?string       $orderBy  = null;

    public function table(string $table): static
    {
        $clone        = clone $this;
        $clone->table = $table;
        return $clone;
    }

    public function select(string ...$columns): static
    {
        $clone          = clone $this;
        $clone->columns = $columns;
        return $clone;
    }

    public function where(string $column, mixed $value): static
    {
        $clone            = clone $this;
        $clone->wheres[]  = $column . ' = ?';
        $clone->bindings[] = $value;
        return $clone;
    }

    public function whereRaw(string $clause, array $bindings = []): static
    {
        $clone             = clone $this;
        $clone->wheres[]   = $clause;
        $clone->bindings   = array_merge($clone->bindings, $bindings);
        return $clone;
    }

    public function limit(int $n): static
    {
        $clone        = clone $this;
        $clone->limit = $n;
        return $clone;
    }

    public function offset(int $n): static
    {
        $clone         = clone $this;
        $clone->offset = $n;
        return $clone;
    }

    public function orderBy(string $column, string $direction = 'ASC'): static
    {
        $direction      = strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC';
        $clone          = clone $this;
        $clone->orderBy = $column . ' ' . $direction;
        return $clone;
    }

    /** @return array{0: string, 1: list<mixed>} */
    public function build(): array
    {
        $cols = implode(', ', $this->columns);
        $sql  = "SELECT {$cols} FROM {$this->table}";

        if ($this->wheres !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $this->wheres);
        }

        if ($this->orderBy !== null) {
            $sql .= ' ORDER BY ' . $this->orderBy;
        }

        if ($this->limit !== null) {
            $sql .= ' LIMIT ' . $this->limit;
        }

        if ($this->offset !== null) {
            $sql .= ' OFFSET ' . $this->offset;
        }

        return [$sql, $this->bindings];
    }
}
```

The clone-on-each-method pattern (immutable builder) prevents unexpected mutation when the same base builder is branched into two different queries.

## 33.4 INSERT Support

```php
<?php
declare(strict_types=1);

// Inside QueryBuilder:

/** @param array<string, mixed> $data
 *  @return array{0: string, 1: list<mixed>}
 */
public function insert(array $data): array
{
    $columns  = array_keys($data);
    $values   = array_values($data);
    $colList  = implode(', ', $columns);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));

    $sql = "INSERT INTO {$this->table} ({$colList}) VALUES ({$placeholders})";

    return [$sql, $values];
}
```

Usage:

```php
<?php
declare(strict_types=1);

[$sql, $bindings] = (new QueryBuilder())
    ->table('products')
    ->insert(['name' => 'Mechanical Keyboard', 'price' => 129.99, 'category' => 'Electronics']);

// INSERT INTO products (name, price, category) VALUES (?, ?, ?)
// bindings: ['Mechanical Keyboard', 129.99, 'Electronics']
```

## 33.5 UPDATE Support

```php
<?php
declare(strict_types=1);

// Inside QueryBuilder:

/** @param array<string, mixed> $data
 *  @return array{0: string, 1: list<mixed>}
 */
public function update(array $data): array
{
    $setClauses = [];
    $setBindings = [];

    foreach ($data as $column => $value) {
        $setClauses[]  = "{$column} = ?";
        $setBindings[] = $value;
    }

    $sql = "UPDATE {$this->table} SET " . implode(', ', $setClauses);

    if ($this->wheres !== []) {
        $sql .= ' WHERE ' . implode(' AND ', $this->wheres);
    }

    // SET bindings come first, then WHERE bindings
    return [$sql, array_merge($setBindings, $this->bindings)];
}
```

## 33.6 DELETE Support

```php
<?php
declare(strict_types=1);

// Inside QueryBuilder:

/** @return array{0: string, 1: list<mixed>} */
public function delete(): array
{
    $sql = "DELETE FROM {$this->table}";

    if ($this->wheres !== []) {
        $sql .= ' WHERE ' . implode(' AND ', $this->wheres);
    }

    return [$sql, $this->bindings];
}
```

Deleting without a WHERE clause deletes all rows. Some builders require an explicit `deleteAll()` or `force()` call to prevent accidents. That is a good safety feature to add.

## 33.7 Executing Built Queries

The builder only produces SQL and bindings. Execution is a separate concern — pass the result to PDO:

```php
<?php
declare(strict_types=1);

function execute(PDO $pdo, array $built): PDOStatement
{
    [$sql, $bindings] = $built;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($bindings);
    return $stmt;
}

$qb = new QueryBuilder();

// SELECT
$rows = execute($pdo, $qb->table('products')
    ->select('id', 'name', 'price')
    ->where('category', 'Electronics')
    ->orderBy('price', 'DESC')
    ->limit(5)
    ->build()
)->fetchAll(PDO::FETCH_ASSOC);

// INSERT
execute($pdo, $qb->table('products')
    ->insert(['name' => 'USB Hub', 'price' => 34.99, 'category' => 'Accessories'])
);

// UPDATE
execute($pdo, $qb->table('products')
    ->where('id', 7)
    ->update(['price' => 39.99])
);

// DELETE
execute($pdo, $qb->table('products')
    ->where('id', 7)
    ->delete()
);
```

## 33.8 SQL Injection at the Builder Layer

The builder never interpolates user values into the SQL string. Every value goes through the `$bindings` array and is passed to PDO's `execute()`, which sends it as a parameter separate from the SQL. The database driver handles quoting and escaping.

The column names in `select()` and `where()` do come from your code, not user input. If you ever need dynamic column names from untrusted sources, validate them against an allowlist:

```php
<?php
declare(strict_types=1);

function safeColumn(string $col, array $allowed): string
{
    if (!in_array($col, $allowed, strict: true)) {
        throw new \InvalidArgumentException("Column '{$col}' is not allowed.");
    }
    return $col;
}
```

## Key Takeaways

- Return `static` (not `self`) from chained methods to support subclassing.
- Clone `$this` on every method call to produce an immutable, branchable builder.
- Values always flow through `$bindings` to PDO's prepared statements — never interpolated.
- Column names from trusted code are safe; column names from user input need an allowlist.
- Separate the build step (produces `[$sql, $bindings]`) from the execute step (uses PDO).
- A minimal query builder is around 100 lines; extend with `JOIN`, `OR WHERE`, and `groupBy` as needed.

## What's Next

Phase 5 is complete. You now have a solid foundation in SQL schema design, querying, aggregation, indexing, transactions, and database access from PHP. Phase 6 will build on this to cover web fundamentals — HTTP, routing, and building your first PHP application that serves real HTTP responses.
