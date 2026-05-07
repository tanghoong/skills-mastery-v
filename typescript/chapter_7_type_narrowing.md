# Chapter 7: Type Narrowing & Type Guards (Hour 7)

TypeScript often needs to handle values that could be more than one type (e.g., `string | number`). Type narrowing is how you tell TypeScript which specific type you are working with at a given point in the code.

## 1. The Problem

When you have a union type, you cannot use type-specific methods until you narrow it down.

```typescript
function printId(id: string | number) {
    // console.log(id.toUpperCase()); // Error: 'toUpperCase' doesn't exist on type 'number'
}
```

## 2. `typeof` Guard

The `typeof` operator is the most basic way to narrow primitive types.

```typescript
function printId(id: string | number): void {
    if (typeof id === "string") {
        console.log(id.toUpperCase()); // TypeScript knows id is string here
    } else {
        console.log(id.toFixed(2));    // TypeScript knows id is number here
    }
}

printId("abc123"); // "ABC123"
printId(99.9);     // "99.90"
```

## 3. `instanceof` Guard

Use `instanceof` to narrow class instances.

```typescript
class Dog {
    bark() { return "Woof!"; }
}

class Cat {
    meow() { return "Meow!"; }
}

function makeSound(animal: Dog | Cat): string {
    if (animal instanceof Dog) {
        return animal.bark(); // TypeScript knows it's a Dog
    }
    return animal.meow();    // TypeScript knows it must be a Cat
}
```

## 4. Discriminated Unions

This is the most powerful and recommended pattern for narrowing complex types. Add a shared literal property (a "discriminant") to each type in the union.

```typescript
interface Circle {
    kind: "circle"; // discriminant
    radius: number;
}

interface Square {
    kind: "square"; // discriminant
    side: number;
}

interface Triangle {
    kind: "triangle"; // discriminant
    base: number;
    height: number;
}

type Shape = Circle | Square | Triangle;

function getArea(shape: Shape): number {
    switch (shape.kind) {
        case "circle":
            return Math.PI * shape.radius ** 2;
        case "square":
            return shape.side ** 2;
        case "triangle":
            return 0.5 * shape.base * shape.height;
    }
}

console.log(getArea({ kind: "circle", radius: 5 }));     // 78.53...
console.log(getArea({ kind: "square", side: 4 }));       // 16
console.log(getArea({ kind: "triangle", base: 6, height: 3 })); // 9
```

## 5. User-Defined Type Guards (`is`)

Sometimes `typeof` and `instanceof` are not enough — for example, when narrowing plain objects. You can write your own type guard function using the `is` keyword.

```typescript
interface Fish {
    swim(): void;
}

interface Bird {
    fly(): void;
}

// The return type `pet is Fish` is the type predicate
function isFish(pet: Fish | Bird): pet is Fish {
    return (pet as Fish).swim !== undefined;
}

function move(pet: Fish | Bird): void {
    if (isFish(pet)) {
        pet.swim(); // TypeScript knows it's a Fish
    } else {
        pet.fly();  // TypeScript knows it's a Bird
    }
}
```

## 6. Exhaustiveness Checking with `never`

When using discriminated unions in a `switch`, you can use `never` to make TypeScript warn you if a case is missing. This is a compile-time safety net.

```typescript
type Shape = Circle | Square | Triangle; // from above

function getArea(shape: Shape): number {
    switch (shape.kind) {
        case "circle":   return Math.PI * shape.radius ** 2;
        case "square":   return shape.side ** 2;
        case "triangle": return 0.5 * shape.base * shape.height;
        default:
            // If you ever add a new Shape type and forget to handle it,
            // this line will cause a compile error.
            const _exhaustiveCheck: never = shape;
            return _exhaustiveCheck;
    }
}
```

If you later add `type Rectangle = { kind: "rectangle"; width: number; height: number }` to `Shape` but forget to add the `case "rectangle"` branch, TypeScript will throw an error at the `never` line.

## 7. Nullish Narrowing

The optional chaining (`?.`) and nullish coalescing (`??`) operators pair naturally with narrowing.

```typescript
interface User {
    name: string;
    address?: {
        city: string;
    };
}

function getCity(user: User): string {
    // Optional chaining: safely access nested optional values
    // Nullish coalescing: fallback if the value is null or undefined
    return user.address?.city ?? "Unknown city";
}

const user1: User = { name: "Alice", address: { city: "Bangkok" } };
const user2: User = { name: "Bob" };

console.log(getCity(user1)); // "Bangkok"
console.log(getCity(user2)); // "Unknown city"
```

## Action Item for Hour 7:

- Create a union type `PaymentMethod` that can be `CreditCard`, `BankTransfer`, or `Crypto`, each with a `kind` discriminant and relevant fields.
- Write a function `processPayment(payment: PaymentMethod): string` using a `switch` statement with exhaustiveness checking via `never`.
