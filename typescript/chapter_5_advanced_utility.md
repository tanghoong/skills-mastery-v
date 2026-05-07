# Chapter 5: Utility Types & Advanced Concepts (Hour 5)

In this final hour, we will look at built-in Utility Types that TypeScript provides to manipulate existing types, and touch on a few advanced concepts.

## 1. Partial & Required
`Partial<Type>` constructs a type with all properties of Type set to optional.
`Required<Type>` does the exact opposite.
```typescript
interface Todo {
  title: string;
  description: string;
}

// Partial makes all fields optional
function updateTodo(todo: Todo, fieldsToUpdate: Partial<Todo>) {
  return { ...todo, ...fieldsToUpdate };
}

const todo1 = { title: "organize desk", description: "clear clutter" };
const todo2 = updateTodo(todo1, { description: "throw out trash" }); // OK
```

## 2. Readonly
`Readonly<Type>` constructs a type with all properties set to readonly, meaning they cannot be reassigned.
```typescript
const myTodo: Readonly<Todo> = { title: "Delete", description: "forever" };
// myTodo.title = "Hello"; // Error: Cannot assign to 'title' because it is a read-only property.
```

## 3. Pick & Omit
These let you create new types by picking specific properties from an existing type, or omitting them.
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

// Only keep 'name' and 'email'
type UserPreview = Pick<User, "name" | "email">;

// Keep everything EXCEPT 'passwordHash'
type PublicUser = Omit<User, "passwordHash">;
```

## 4. Type Assertions ("Casting")
Sometimes you know more about a type than TypeScript does (e.g., when selecting a DOM element).
```typescript
// TypeScript only knows this is an HTMLElement or null
const myCanvas = document.getElementById("main_canvas") as HTMLCanvasElement;
```

## 5. Enums
Enums allow a developer to define a set of named constants. Use them sparingly, as Union Types (`"UP" | "DOWN"`) are often preferred.
```typescript
enum Direction {
  Up = 1,
  Down,
  Left,
  Right,
}
let dir: Direction = Direction.Up;
```

## Action Item for Hour 5:
- Take the `User` interface defined above. Create a function that accepts an `Omit<User, "passwordHash">` and returns a `Readonly<UserPreview>`.

## Congratulations!
You've completed the 5-hour TypeScript mastery overview. The best way to solidify this knowledge is to build a small project (like a Todo app or a simple API wrapper) using strict TypeScript settings.
