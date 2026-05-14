# Chapter 29 — SQL Queries

> **Goal:** Write fluent `SELECT` queries — filtering, joining multiple tables, paginating results, and using subqueries to answer layered business questions.

## 29.1 The SELECT Statement

Every read operation starts with `SELECT`. The minimal form:

```sql
SELECT id, name, email
FROM   users
WHERE  created_at >= '2024-01-01'
ORDER BY name ASC
LIMIT  10;
```

Execution order (logical, not syntactic):
1. `FROM` — identify the source table
2. `WHERE` — filter rows
3. `SELECT` — project columns
4. `ORDER BY` — sort
5. `LIMIT` / `OFFSET` — paginate

## 29.2 WHERE Clauses

```sql
-- Exact match
SELECT * FROM users WHERE email = 'alice@example.com';

-- Pattern match (LIKE)
SELECT * FROM users WHERE email LIKE '%@example.com';

-- Range
SELECT * FROM products WHERE price BETWEEN 10.00 AND 50.00;

-- Multiple conditions
SELECT * FROM products
WHERE  price > 20.00
  AND  stock > 0;

-- IN list
SELECT * FROM products WHERE id IN (1, 4, 7, 12);

-- NULL check — never use = NULL
SELECT * FROM orders WHERE shipped_at IS NULL;
```

## 29.3 ORDER BY and LIMIT / OFFSET

```sql
-- Most expensive products first
SELECT name, price
FROM   products
ORDER BY price DESC;

-- Pagination: page 3, 10 items per page
SELECT id, name, price
FROM   products
ORDER BY id ASC
LIMIT  10 OFFSET 20;   -- skip first 20 rows
```

`OFFSET` is straightforward but slow on large tables because the database still reads and discards the skipped rows. A cursor-based approach (`WHERE id > :last_seen_id LIMIT 10`) scales better.

## 29.4 JOINs

A `JOIN` combines rows from two tables based on a matching condition.

**INNER JOIN** — only rows that match on both sides:
```sql
SELECT o.id        AS order_id,
       u.name      AS customer,
       o.total
FROM   orders   o
JOIN   users    u ON u.id = o.user_id
ORDER BY o.created_at DESC;
```

**LEFT JOIN** — all rows from the left table; `NULL` columns for non-matching right rows:
```sql
-- Find users who have never placed an order
SELECT u.id, u.name
FROM   users  u
LEFT  JOIN orders o ON o.user_id = u.id
WHERE  o.id IS NULL;
```

**RIGHT JOIN** — mirror of LEFT JOIN; keep all rows from the right table. In practice, rewriting as a LEFT JOIN with tables swapped is clearer.

**FULL OUTER JOIN** — all rows from both tables; `NULL` where no match. MySQL does not natively support `FULL OUTER JOIN`; emulate it:
```sql
SELECT u.id AS user_id, o.id AS order_id
FROM   users  u
LEFT  JOIN orders o ON o.user_id = u.id

UNION

SELECT u.id AS user_id, o.id AS order_id
FROM   users  u
RIGHT JOIN orders o ON o.user_id = u.id
WHERE  u.id IS NULL;
```

**Multi-table join:**
```sql
SELECT u.name, p.name AS product, oi.quantity, oi.unit_price
FROM   order_items oi
JOIN   orders   o  ON o.id  = oi.order_id
JOIN   users    u  ON u.id  = o.user_id
JOIN   products p  ON p.id  = oi.product_id
WHERE  o.created_at >= '2024-06-01'
ORDER BY u.name, o.id;
```

## 29.5 UNION

`UNION` stacks result sets vertically. Both sides must have the same number of columns with compatible types.

```sql
-- All email addresses: customers + staff (from a separate table)
SELECT email, 'customer' AS source FROM users
UNION
SELECT email, 'staff'    AS source FROM staff_members
ORDER BY email;
```

`UNION` removes duplicates. `UNION ALL` keeps them and is faster because no deduplication pass is needed.

## 29.6 Subqueries

A subquery is a `SELECT` nested inside another SQL statement.

**In WHERE (scalar subquery):**
```sql
-- Orders placed by the most recently joined user
SELECT * FROM orders
WHERE  user_id = (
    SELECT id FROM users ORDER BY created_at DESC LIMIT 1
);
```

**IN subquery:**
```sql
-- Products that have been ordered at least once
SELECT id, name, price
FROM   products
WHERE  id IN (
    SELECT DISTINCT product_id FROM order_items
);
```

**EXISTS (preferred over IN for large datasets):**
```sql
-- Same result, but EXISTS stops scanning as soon as one match is found
SELECT id, name, price
FROM   products p
WHERE  EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.product_id = p.id
);
```

**Derived table (subquery in FROM):**
```sql
-- Average order total per user, then filter for high-value customers
SELECT customer, avg_total
FROM (
    SELECT u.name  AS customer,
           AVG(o.total) AS avg_total
    FROM   orders o
    JOIN   users  u ON u.id = o.user_id
    GROUP  BY u.id, u.name
) AS customer_stats
WHERE avg_total > 200;
```

## 29.7 Aliases

Column and table aliases make queries readable and are required for derived tables.

```sql
SELECT
    u.name            AS customer_name,
    COUNT(o.id)       AS total_orders,
    SUM(o.total)      AS lifetime_value
FROM users  AS u
JOIN orders AS o ON o.user_id = u.id
GROUP BY u.id, u.name;
```

## Key Takeaways

- SQL's logical execution order is FROM → WHERE → SELECT → ORDER BY → LIMIT.
- `INNER JOIN` returns only matched rows; `LEFT JOIN` preserves all left-table rows.
- Use `IS NULL` / `IS NOT NULL` — never `= NULL`.
- `EXISTS` is generally more efficient than `IN` when the subquery result set is large.
- `UNION ALL` is faster than `UNION` when you know there are no duplicates to remove.
- Cursor-based pagination (`WHERE id > :cursor`) outperforms large `OFFSET` values.

## What's Next

Chapter 30 introduces aggregation and window functions — tools for computing summaries (`SUM`, `AVG`) and per-row analytics (`ROW_NUMBER`, `RANK`) in a single pass over the data.
