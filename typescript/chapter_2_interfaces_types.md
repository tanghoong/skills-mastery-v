# Chapter 2: Interfaces & Type Aliases (Hour 2)

In this hour, you will learn how to define custom structures for your data. This is where TypeScript really shines.

## 1. Type Aliases
You can create a custom name for any type using the `type` keyword.
```typescript
type ID = string | number; // Union type

let userId: ID = "user_123";
let orderId: ID = 456;

type User = {
  id: ID;
  name: string;
  isActive: boolean;
  age?: number; // Optional properties work in types too! (using ?: syntax)
};

const user1: User = { id: 1, name: "Alice", isActive: true };
```

## 2. Interfaces
Interfaces are another way to define object shapes. They are very similar to Type Aliases but have a few key differences (e.g., they can be merged).
```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  description?: string; // Optional property
}

const laptop: Product = {
  id: 1,
  name: "MacBook",
  price: 1500
};
```

## 3. Interfaces vs. Types (When to use which?)
- **Use Interfaces** when you are defining the shape of an object or a class, especially if you are building a public API or library where others might need to extend your definitions.
- **Use Types** when you need to define primitives, unions (`"UP" | "DOWN"`), intersections, or complex utility types.

### Best Practice for Nesting
While you can deeply nest objects within Types and Interfaces, it is wiser to break them apart for reusability.
```typescript
// Good (Separated for reuse)
interface Address { street: string; city: string; }
interface Customer { name: string; address: Address; }
```

### The `extends` Keyword
The `extends` keyword is used in three main places:
1. **Interfaces:** To inherit properties (`interface Dog extends Animal`).
2. **Classes (OOP):** For inheritance (`class Admin extends User`).
3. **Generics:** For constraints (`<T extends { length: number }>`).

*(Note: To achieve inheritance with `type`, use the intersection `&` operator).*

```typescript
// Extending Interfaces
interface Electronics extends Product {
  brand: string;
}

// Intersection with Types
type Employee = { id: number; name: string };
type Manager = Employee & { department: string };
```

## Action Item for Hour 2:
- Define an interface for a `Post` (id, title, body, author, tags).
- Create an array of `Post` objects and ensure TypeScript catches any missing properties.


interface Post {
  id: number;
  title: string;
  body: string;
  author: string;
  tags: string[];
}

const posts: Post[] = [
  {
    id: 1,
    title: "Post 1",
    body: "Body 1",
    author: "Author 1",
    tags: ["tag1", "tag2"]
  }
];
