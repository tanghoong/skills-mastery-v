# Chapter 28 — SQL Fundamentals

> **Goal:** Understand how relational databases are structured, how to define schemas with DDL, and how to apply normalisation principles to design clean, maintainable tables.

## 28.1 What Is DDL?

SQL is split into sub-languages. **DDL (Data Definition Language)** covers the statements that create and modify the structure of a database — tables, columns, constraints, and indexes. The three core DDL statements are `CREATE`, `ALTER`, and `DROP`.

If you have used Prisma, you have been writing schema definitions in a different syntax and letting the ORM generate the SQL. Here you write that SQL directly, which gives you a precise understanding of what the database is actually storing and enforcing.

## 28.2 MySQL Data Types

Choosing the right data type keeps storage efficient and prevents invalid data from entering the system.

| Category | Types | When to use |
|---|---|---|
| Integer | `INT`, `BIGINT`, `TINYINT` | Whole numbers; use `BIGINT` for IDs that may exceed 2 billion |
| Decimal | `DECIMAL(p,s)`, `FLOAT` | Money should always be `DECIMAL`; never `FLOAT` |
| String | `VARCHAR(n)`, `TEXT`, `CHAR(n)` | `VARCHAR` for bounded strings; `TEXT` for long content |
| Date/Time | `DATE`, `DATETIME`, `TIMESTAMP` | `TIMESTAMP` auto-adjusts to UTC; `DATETIME` stores as-is |
| Boolean | `TINYINT(1)` or `BOOLEAN` | MySQL has no native bool; maps to 0/1 |
| JSON | `JSON` | Structured but schema-less sub-documents |

## 28.3 CREATE TABLE — E-Commerce Schema

```sql
CREATE TABLE users (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(255)    NOT NULL UNIQUE,
    name       VARCHAR(100)    NOT NULL,
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    price       DECIMAL(10, 2)  NOT NULL,
    stock       INT             NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    total       DECIMAL(10, 2)  NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE order_items (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT UNSIGNED NOT NULL,
    product_id  BIGINT UNSIGNED NOT NULL,
    quantity    INT             NOT NULL,
    unit_price  DECIMAL(10, 2)  NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
```

Notice the constraint choices:
- `ON DELETE CASCADE` on `order_items` means deleting an order removes its line items automatically.
- `ON DELETE RESTRICT` on `orders.user_id` prevents deleting a user who has orders.

## 28.4 Constraints

Constraints are rules the database enforces at write time, before any application code can react.

**NOT NULL** — the column must always have a value:
```sql
email VARCHAR(255) NOT NULL
```

**UNIQUE** — no two rows may share the same value in this column:
```sql
email VARCHAR(255) NOT NULL UNIQUE
```

**DEFAULT** — value applied when the column is omitted on insert:
```sql
stock INT NOT NULL DEFAULT 0
```

**PRIMARY KEY** — shorthand for `NOT NULL + UNIQUE + clustered index`. Every table should have one.

**FOREIGN KEY** — referential integrity: the value must exist in the referenced table. The database rejects inserts that would create orphan rows.

## 28.5 ALTER TABLE

After a table exists in production you cannot drop and recreate it. `ALTER TABLE` modifies the structure without losing data.

```sql
-- Add a new column
ALTER TABLE products
    ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'uncategorised';

-- Rename a column (MySQL 8+)
ALTER TABLE products
    RENAME COLUMN category TO product_category;

-- Change a column's type
ALTER TABLE products
    MODIFY COLUMN stock BIGINT NOT NULL DEFAULT 0;

-- Drop a column
ALTER TABLE products
    DROP COLUMN product_category;
```

## 28.6 DROP TABLE

```sql
-- Remove a table entirely (irreversible — data gone)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
```

Drop order matters: child tables (those with foreign keys pointing to others) must be dropped before the parent tables they reference, or you will hit a constraint error.

## 28.7 Normalisation: 1NF, 2NF, 3NF

Normalisation is a set of rules for organising data to minimise redundancy and prevent update anomalies.

**First Normal Form (1NF):** Every column holds atomic (indivisible) values. No repeating groups or arrays inside a column.

Bad — CSV in a column:
```sql
-- violates 1NF
CREATE TABLE orders_bad (
    id       INT PRIMARY KEY,
    products TEXT  -- "1,2,3" stored as a comma-separated string
);
```

Fixed: each product becomes a row in `order_items`.

**Second Normal Form (2NF):** Must be in 1NF, and every non-key column must depend on the entire primary key (matters when the PK is composite).

Bad — `product_name` depends only on `product_id`, not the full composite key:
```sql
CREATE TABLE order_items_bad (
    order_id     INT,
    product_id   INT,
    product_name VARCHAR(200), -- partial dependency
    quantity     INT,
    PRIMARY KEY (order_id, product_id)
);
```

Fixed: `product_name` lives in the `products` table.

**Third Normal Form (3NF):** Must be in 2NF, and no non-key column may depend on another non-key column (no transitive dependencies).

Bad — `city` depends on `zip_code`, not on `user_id`:
```sql
CREATE TABLE users_bad (
    id       INT PRIMARY KEY,
    zip_code VARCHAR(10),
    city     VARCHAR(100) -- transitive: zip_code → city
);
```

Fixed: extract a `zip_codes(zip_code, city)` table.

## Key Takeaways

- Use `DECIMAL(p,s)` for money, never `FLOAT`.
- Foreign keys enforce referential integrity at the database level — not just in application code.
- `NOT NULL`, `UNIQUE`, and `DEFAULT` are your first line of defence against bad data.
- `ALTER TABLE` lets you evolve a schema without losing data.
- Normalisation (1NF → 3NF) eliminates redundancy and prevents update anomalies.
- Drop child tables before parents when tearing down a schema.

## What's Next

Chapter 29 moves from defining structure to querying it — you will write `SELECT` statements, `JOIN` multiple tables, and use subqueries to answer real business questions.
