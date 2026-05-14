# Chapter 31 — Indexes, Transactions & Locking

> **Goal:** Understand how indexes speed up queries, how to read a query execution plan, and how transactions with the right isolation level protect your data under concurrency.

## 31.1 Why Indexes Exist

Without an index, the database performs a **full table scan** — reading every row to find matches. On a table with millions of rows this is unacceptably slow. An index is a separate data structure (typically a B-tree) that maps column values to row locations, allowing the engine to jump directly to matching rows.

The trade-off: indexes speed up reads but slow down writes because every `INSERT`, `UPDATE`, and `DELETE` must also update the index.

## 31.2 CREATE INDEX

```sql
-- Single-column index on orders.user_id
CREATE INDEX idx_orders_user_id ON orders (user_id);

-- Composite index — column order matters
-- Useful for queries that filter by user_id AND created_at together,
-- or by user_id alone. NOT useful for created_at alone.
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at);

-- Unique index (also enforces uniqueness as a constraint)
CREATE UNIQUE INDEX idx_users_email ON users (email);

-- Drop an index
DROP INDEX idx_orders_user_id ON orders;
```

**Composite index column order rule:** put the highest-selectivity column first (the column that narrows results the most). For range filters, the range column must come last.

## 31.3 EXPLAIN — Reading the Query Plan

`EXPLAIN` shows the database's plan for executing a query without running it. In MySQL:

```sql
EXPLAIN SELECT o.id, o.total
FROM orders o
WHERE o.user_id = 42;
```

Key columns in the output:

| Column | What to look for |
|---|---|
| `type` | `ALL` = full scan (bad); `ref`/`eq_ref`/`const` = index used (good) |
| `key` | Which index was chosen (`NULL` means none) |
| `rows` | Estimated rows examined — lower is better |
| `Extra` | `Using filesort` or `Using temporary` signal expensive operations |

```sql
-- After adding the index, re-run EXPLAIN and compare
CREATE INDEX idx_orders_user_id ON orders (user_id);

EXPLAIN SELECT o.id, o.total
FROM orders o
WHERE o.user_id = 42;
-- key should now show idx_orders_user_id
-- type should be ref instead of ALL
```

In SQLite the equivalent is `EXPLAIN QUERY PLAN`:
```sql
EXPLAIN QUERY PLAN
SELECT * FROM orders WHERE user_id = 42;
```

## 31.4 ACID Properties

Every database transaction must satisfy four guarantees:

**Atomicity** — all operations in the transaction succeed together, or none of them do. There is no half-committed state.

**Consistency** — a transaction moves the database from one valid state to another. Constraints (foreign keys, NOT NULL) are enforced after the commit.

**Isolation** — concurrent transactions do not see each other's intermediate, uncommitted state (to varying degrees depending on the isolation level).

**Durability** — once a transaction commits, the changes survive crashes. The database writes to a durable log before acknowledging success.

## 31.5 Isolation Levels

Isolation is a spectrum. Higher isolation is safer but slower due to increased locking.

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | possible | possible | possible |
| READ COMMITTED | prevented | possible | possible |
| REPEATABLE READ (MySQL default) | prevented | prevented | possible* |
| SERIALIZABLE | prevented | prevented | prevented |

- **Dirty read**: reading uncommitted data from another transaction.
- **Non-repeatable read**: re-reading the same row within a transaction yields different values.
- **Phantom read**: re-running a range query yields different rows (inserts by another transaction).

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

## 31.6 START TRANSACTION, COMMIT, ROLLBACK

```sql
START TRANSACTION;

UPDATE products SET stock = stock - 1 WHERE id = 7;

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (101, 7, 1, 29.99);

-- If everything succeeded:
COMMIT;

-- If an error occurred before COMMIT:
ROLLBACK;
```

Between `START TRANSACTION` and `COMMIT`, other connections (depending on isolation level) cannot see the intermediate state.

## 31.7 SAVEPOINT — Partial Rollback

A savepoint marks a point inside a transaction you can roll back to without aborting the entire transaction.

```sql
START TRANSACTION;

INSERT INTO orders (user_id, total) VALUES (3, 150.00);
-- auto-generated id = 201

SAVEPOINT after_order;

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (201, 9, 2, 75.00);

-- Suppose validation fails for this item only
ROLLBACK TO SAVEPOINT after_order;

-- The order row still exists; only the item insert was rolled back
-- Insert a corrected item instead:
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (201, 9, 1, 75.00);

COMMIT;
```

## 31.8 Deadlocks

A deadlock occurs when two transactions each hold a lock the other needs. MySQL detects this automatically and rolls back the transaction with less work done (the "victim"). Your application must catch the deadlock error and retry.

```sql
-- Transaction A                   -- Transaction B
START TRANSACTION;                 START TRANSACTION;
UPDATE products SET ...            UPDATE orders SET ...
WHERE id = 1;  -- locks row 1      WHERE id = 5; -- locks row 5

UPDATE orders SET ...              UPDATE products SET ...
WHERE id = 5; -- waits for B       WHERE id = 1; -- waits for A
-- DEADLOCK DETECTED — one TX is rolled back
```

Mitigation strategies:
- Always access tables/rows in the same order across all transactions.
- Keep transactions as short as possible.
- Retry on deadlock (`ER_LOCK_DEADLOCK` error code 1213 in MySQL).

## Key Takeaways

- A full table scan (`type: ALL` in `EXPLAIN`) on a large table is the most common avoidable performance problem.
- Composite index column order follows the query filter pattern; the leftmost prefix must be used.
- ACID guarantees atomicity and durability at the transaction level.
- MySQL's default isolation level is `REPEATABLE READ` — generally the right choice.
- `SAVEPOINT` allows partial rollback without aborting the entire transaction.
- Deadlocks are inevitable in concurrent systems; design for retry, and keep transactions short.

## What's Next

Chapter 32 puts these SQL concepts into PHP code via PDO — the standard low-level database interface that gives you full control over queries, prepared statements, and transactions from PHP.
