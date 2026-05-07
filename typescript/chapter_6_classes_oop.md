# Chapter 6: Classes & Object-Oriented Programming (Hour 6)

You have already used interfaces to describe object shapes. Now we go deeper into classes — the backbone of object-oriented TypeScript.

## 1. Class Basics

A class is a blueprint for creating objects. TypeScript adds full type support on top of JavaScript classes.

```typescript
class Animal {
    name: string;
    age: number;

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }

    speak(): string {
        return `${this.name} makes a sound.`;
    }
}

const cat = new Animal("Whiskers", 3);
console.log(cat.speak()); // "Whiskers makes a sound."
```

## 2. Access Modifiers

TypeScript gives you three access modifiers to control visibility.

| Modifier    | Accessible from            |
|-------------|----------------------------|
| `public`    | Anywhere (default)         |
| `private`   | Inside the class only      |
| `protected` | Inside the class + subclasses |

```typescript
class BankAccount {
    public owner: string;
    private balance: number;

    constructor(owner: string, initialBalance: number) {
        this.owner = owner;
        this.balance = initialBalance;
    }

    deposit(amount: number): void {
        this.balance += amount;
    }

    getBalance(): number {
        return this.balance;
    }
}

const account = new BankAccount("John", 1000);
account.deposit(500);
console.log(account.getBalance()); // 1500
// console.log(account.balance); // Error: 'balance' is private
```

## 3. Constructor Parameter Shorthand

TypeScript has a shortcut: declare and assign properties directly in the constructor signature using access modifiers.

```typescript
// Long form (what you've seen above)
class Person {
    public name: string;
    private age: number;

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }
}

// Shorthand — identical result, much less code
class Person {
    constructor(
        public name: string,
        private age: number
    ) {}
}
```

## 4. Inheritance with `extends`

Subclasses inherit properties and methods from a parent class. Use `super()` to call the parent constructor.

```typescript
class Animal {
    constructor(public name: string) {}

    speak(): string {
        return `${this.name} makes a sound.`;
    }
}

class Dog extends Animal {
    constructor(name: string, public breed: string) {
        super(name); // Must call parent constructor first
    }

    // Override the parent method
    speak(): string {
        return `${this.name} barks.`;
    }
}

const dog = new Dog("Rex", "Labrador");
console.log(dog.speak()); // "Rex barks."
console.log(dog.breed);   // "Labrador"
```

## 5. Implementing Interfaces

A class can implement one or more interfaces. This is a contract — the class must fulfill all properties and methods defined by the interface.

```typescript
interface Printable {
    print(): void;
}

interface Serializable {
    serialize(): string;
}

class Report implements Printable, Serializable {
    constructor(public title: string, public content: string) {}

    print(): void {
        console.log(`--- ${this.title} ---\n${this.content}`);
    }

    serialize(): string {
        return JSON.stringify({ title: this.title, content: this.content });
    }
}

const report = new Report("Sales Q1", "Revenue: $50,000");
report.print();
console.log(report.serialize());
```

## 6. Abstract Classes

An abstract class is a base class that cannot be instantiated directly. It defines a structure that subclasses must follow.

```typescript
abstract class Shape {
    abstract area(): number; // Subclasses must implement this

    describe(): string {
        return `This shape has an area of ${this.area()}`;
    }
}

class Circle extends Shape {
    constructor(private radius: number) {
        super();
    }

    area(): number {
        return Math.PI * this.radius ** 2;
    }
}

class Rectangle extends Shape {
    constructor(private width: number, private height: number) {
        super();
    }

    area(): number {
        return this.width * this.height;
    }
}

// const s = new Shape(); // Error: Cannot create an instance of an abstract class
const circle = new Circle(5);
console.log(circle.describe()); // "This shape has an area of 78.53..."
```

## 7. Static Members

`static` properties and methods belong to the class itself, not to any instance.

```typescript
class Counter {
    private static count: number = 0;

    static increment(): void {
        Counter.count++;
    }

    static getCount(): number {
        return Counter.count;
    }
}

Counter.increment();
Counter.increment();
console.log(Counter.getCount()); // 2
```

## Action Item for Hour 6:

- Create an abstract class `Vehicle` with an abstract method `fuelType(): string` and a shared method `describe(): string`.
- Create two subclasses: `ElectricCar` and `PetrolCar`, each implementing `fuelType()`.
- Add a `static` property to track how many `Vehicle` instances have been created.
