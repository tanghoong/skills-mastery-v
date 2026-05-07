# Chapter 4: Generics (Hour 4)

Generics are arguably the most powerful and complex feature in TypeScript. They allow you to create reusable components that can work over a variety of types rather than a single one.

## 1. The Problem Generics Solve
Imagine a function that returns whatever is passed into it.
```typescript
function identity(arg: any): any {
  return arg; // We lose the specific type information
}
```

## 2. Using Generics
We use a "type variable" (commonly `T`) to capture the type.
```typescript
function identity<T>(arg: T): T {
  return arg;
}

// Usage
let output1 = identity<string>("myString"); // output1 is strictly string
let output2 = identity<number>(100);        // output2 is strictly number
// Type inference also works
let output3 = identity(true);               // inferred as boolean
```

## 3. Generics in Interfaces and Classes
```typescript
interface KeyValuePair<K, V> {
  key: K;
  value: V;
}

let item: KeyValuePair<string, number> = { key: "age", value: 30 };

class DataStorage<T> {
  private data: T[] = [];
  
  addItem(item: T) {
    this.data.push(item);
  }
  
  getItems(): T[] {
    return [...this.data];
  }
}

const textStorage = new DataStorage<string>();
textStorage.addItem("Hello");
```

## 4. Generic Constraints
Sometimes you want a generic type to have certain properties. You can constrain it using `extends`.
```typescript
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length);
  return arg;
}

logLength("string"); // OK, string has length
logLength([1, 2, 3]); // OK, array has length
// logLength(10); // Error: number doesn't have length
```

## Action Item for Hour 4:
- Create a generic `fetchData<T>(url: string)` function wrapper that simulates returning a Promise of type `T`.
