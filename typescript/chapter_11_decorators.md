# Chapter 11: Decorators (Hour 11)

Decorators are a special syntax for annotating and modifying classes, methods, and properties. They are heavily used in frameworks like **NestJS**, **Angular**, and **TypeORM**.

> **Setup:** Decorators require `"experimentalDecorators": true` in your `tsconfig.json`. TypeScript 5.0+ also supports the new TC39 standard decorators — the examples below use the stage-3 standard (TS 5.0+).

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

## 1. What Is a Decorator?

A decorator is a function that is applied to a class, method, property, or parameter using the `@` syntax. It runs at class definition time, not at instantiation time.

```typescript
// A simple class decorator
function Logger(target: Function) {
    console.log(`Class created: ${target.name}`);
}

@Logger
class UserService {
    getUser() { return "Alice"; }
}
// Logs: "Class created: UserService" — at the moment the class is defined
```

## 2. Class Decorators

A class decorator receives the constructor of the class. You can use it to wrap, replace, or observe the class.

```typescript
function Singleton<T extends { new (...args: any[]): {} }>(constructor: T) {
    let instance: T;
    return class extends constructor {
        constructor(...args: any[]) {
            if (instance) return instance;
            super(...args);
            instance = this as unknown as T;
        }
    };
}

@Singleton
class DatabaseConnection {
    id = Math.random();
}

const db1 = new DatabaseConnection();
const db2 = new DatabaseConnection();
console.log(db1.id === db2.id); // true — same instance
```

## 3. Method Decorators

Method decorators receive the class prototype, the method name, and the property descriptor. Great for logging, timing, or access control.

```typescript
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = function (...args: any[]) {
        console.log(`Calling ${propertyKey} with`, args);
        const result = original.apply(this, args);
        console.log(`${propertyKey} returned`, result);
        return result;
    };

    return descriptor;
}

class Calculator {
    @Log
    add(a: number, b: number): number {
        return a + b;
    }
}

const calc = new Calculator();
calc.add(2, 3);
// Logs: "Calling add with [2, 3]"
// Logs: "add returned 5"
```

## 4. Property Decorators

Property decorators receive the class prototype and the property name. They cannot directly modify the value but are useful for metadata (e.g., validation libraries use these).

```typescript
function Required(target: any, propertyKey: string) {
    console.log(`${propertyKey} is marked as required on ${target.constructor.name}`);
}

class UserDto {
    @Required
    name: string = "";

    @Required
    email: string = "";
}
// Logs at class definition:
// "name is marked as required on UserDto"
// "email is marked as required on UserDto"
```

## 5. Decorator Factories

A decorator factory is a function that returns a decorator. This lets you pass arguments to your decorator.

```typescript
function MinLength(min: number) {
    return function (target: any, propertyKey: string) {
        let value: string;

        Object.defineProperty(target, propertyKey, {
            get: () => value,
            set: (newVal: string) => {
                if (newVal.length < min) {
                    throw new Error(`${propertyKey} must be at least ${min} characters`);
                }
                value = newVal;
            }
        });
    };
}

class Product {
    @MinLength(3)
    name: string = "";
}

const p = new Product();
p.name = "TV"; // Error: "name must be at least 3 characters"
p.name = "Television"; // OK
```

## 6. Decorator Stacking & Execution Order

Multiple decorators on the same target are evaluated bottom-to-top (innermost first).

```typescript
function First() {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        console.log("First: evaluated");
        return desc;
    };
}

function Second() {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        console.log("Second: evaluated");
        return desc;
    };
}

class Example {
    @First()
    @Second()
    method() {}
}
// Logs: "Second: evaluated" then "First: evaluated"
```

## 7. Real-World Pattern: NestJS-Style Controller

This is the pattern NestJS uses to build REST API controllers.

```typescript
const routes: { method: string; path: string; handler: string }[] = [];

function Controller(basePath: string) {
    return function (target: Function) {
        target.prototype.basePath = basePath;
    };
}

function Get(path: string) {
    return function (target: any, propertyKey: string) {
        routes.push({ method: "GET", path, handler: propertyKey });
    };
}

@Controller("/users")
class UserController {
    @Get("/")
    findAll() { return []; }

    @Get("/:id")
    findOne() { return {}; }
}

console.log(routes);
// [ { method: "GET", path: "/",    handler: "findAll" },
//   { method: "GET", path: "/:id", handler: "findOne" } ]
```

## Action Item for Hour 11:

- Create a `@Memoize` method decorator that caches the return value of a method based on its arguments. On subsequent calls with the same arguments, it should return the cached result without re-executing the function body.
