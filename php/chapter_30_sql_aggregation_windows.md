# Chapter 30 — SQL Aggregation & Window Functions

> **Goal:** Summarise data with aggregate functions and `GROUP BY`, and perform per-row analytics without collapsing rows using window functions.

## 30.1 Aggregate Functions

Aggregate functions reduce many rows to a single value.

| Function | Returns |
|---|---|
| `COUNT(*)` | Number of rows in the group |
| `COUNT(col)` | Number of non-NULL values |
| `SUM(col)` | Total of numeric values |
| `AVG(col)` | Mean of numeric values |
| `MIN(col)` | Smallest value |
| `MAX(col)` | Largest value |

```sql
-- Overall store statistics
SELECT
    COUNT(*)         AS total_orders,
    SUM(total)       AS revenue,
    AVG(total)       AS avg_order_value,
    MIN(total)       AS smallest_order,
    MAX(total)       AS largest_order
FROM orders;
```

## 30.2 GROUP BY

`GROUP BY` splits rows into groups before the aggregate function runs. Every column in `SELECT` must either appear in `GROUP BY` or be wrapped in an aggregate function.

```sql
-- Revenue by product category
SELECT
    p.category,
    COUNT(oi.id)      AS items_sold,
    SUM(oi.quantity)  AS units_sold,
    AVG(p.price)      AS avg_price
FROM   order_items oi
JOIN   products    p  ON p.id = oi.product_id
GROUP  BY p.category
ORDER  BY units_sold DESC;
```

## 30.3 HAVING

`WHERE` filters rows before grouping. `HAVING` filters the groups themselves — after aggregation.

```sql
-- Only categories with an average price above 50
SELECT
    p.category,
    AVG(p.price) AS avg_price,
    COUNT(p.id)  AS product_count
FROM   products p
GROUP  BY p.category
HAVING AVG(p.price) > 50
ORDER  BY avg_price DESC;
```

A common mistake is putting an aggregate condition in `WHERE`. That produces an error because aggregates are not yet computed at the `WHERE` stage.

## 30.4 Window Functions — Concept

Aggregate functions collapse rows into one. Window functions compute a value for each row using a sliding frame of related rows — without collapsing the result set.

Syntax:
```sql
function_name() OVER (
    [PARTITION BY col, ...]
    [ORDER BY    col [ASC|DESC]]
    [ROWS/RANGE  frame_clause]
)
```

- `PARTITION BY` divides rows into independent windows (like `GROUP BY` but without collapsing).
- `ORDER BY` defines the row sequence within each partition.

## 30.5 ROW_NUMBER, RANK, DENSE_RANK

All three assign a sequential number to each row within a partition. They differ when values tie.

```sql
SELECT
    p.name,
    p.category,
    p.price,
    ROW_NUMBER()  OVER (PARTITION BY p.category ORDER BY p.price DESC) AS row_num,
    RANK()        OVER (PARTITION BY p.category ORDER BY p.price DESC) AS rnk,
    DENSE_RANK()  OVER (PARTITION BY p.category ORDER BY p.price DESC) AS dense_rnk
FROM products p;
```

Suppose two products in "Electronics" are both priced at 299.99:

| name | price | ROW_NUMBER | RANK | DENSE_RANK |
|---|---|---|---|---|
| Keyboard | 299.99 | 1 | 1 | 1 |
| Mouse | 299.99 | 2 | 1 | 1 |
| Cable | 9.99 | 3 | 3 | 2 |

- `ROW_NUMBER` always produces unique numbers — ties are broken arbitrarily.
- `RANK` skips a number after ties (1, 1, 3 — note the gap).
- `DENSE_RANK` never skips (1, 1, 2 — no gap).

Use `DENSE_RANK` when you need a "top N per category" without surprises from gaps.

## 30.6 Selecting the Top-N Per Group

A common pattern: get the single most expensive product per category.

```sql
SELECT category, name, price
FROM (
    SELECT
        p.name,
        p.category,
        p.price,
        ROW_NUMBER() OVER (PARTITION BY p.category ORDER BY p.price DESC) AS rn
    FROM products p
) ranked
WHERE rn = 1;
```

## 30.7 Running Totals with SUM() OVER

```sql
-- Cumulative revenue ordered by date
SELECT
    o.id,
    o.created_at,
    o.total,
    SUM(o.total) OVER (ORDER BY o.created_at ASC) AS running_total
FROM orders o
ORDER BY o.created_at ASC;
```

Add `PARTITION BY` to reset the running total per user:

```sql
SUM(o.total) OVER (PARTITION BY o.user_id ORDER BY o.created_at ASC) AS user_running_total
```

## 30.8 LAG and LEAD

`LAG` looks at the previous row; `LEAD` looks at the next row within the window.

```sql
-- Month-over-month revenue change
SELECT
    month,
    revenue,
    LAG(revenue)  OVER (ORDER BY month) AS prev_month_revenue,
    revenue - LAG(revenue) OVER (ORDER BY month) AS change
FROM monthly_revenue;
```

## 30.9 NTILE

`NTILE(n)` divides rows into `n` equally-sized buckets.

```sql
-- Assign products to price quartiles
SELECT
    name,
    price,
    NTILE(4) OVER (ORDER BY price ASC) AS quartile
FROM products;
```

## Key Takeaways

- `GROUP BY` collapses rows; window functions do not — the row count stays the same.
- Use `HAVING` (not `WHERE`) to filter on aggregate results.
- `RANK` leaves gaps after ties; `DENSE_RANK` does not; `ROW_NUMBER` always produces unique values.
- `SUM() OVER (ORDER BY ...)` builds a running total in a single query pass.
- `PARTITION BY` in a window function is analogous to `GROUP BY` but without collapsing.
- Derived-table + `WHERE rn = 1` is the canonical "top-N per group" pattern.

## What's Next

Chapter 31 covers indexes, the query execution plan, ACID transactions, and isolation levels — the performance and reliability layer that sits beneath every query you have written so far.
