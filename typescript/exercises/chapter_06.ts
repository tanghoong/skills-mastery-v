// ============================================================
// Chapter 6 — Classes & OOP
// Run: tsx exercises/chapter_06.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Basic class with access modifiers
// Build a `BankAccount` class with:
//   - owner: string (public, readonly)
//   - private balance: number
//   - constructor(owner, initialBalance)
//   - deposit(amount): void  — throws if amount <= 0
//   - withdraw(amount): void — throws if amount > balance or amount <= 0
//   - getBalance(): number
//   - toString(): string — e.g. "Alice's account: $1500.00"
// ----------------------------------------------------------------

// TODO: implement BankAccount

// const acc = new BankAccount("Alice", 1000);
// acc.deposit(500);
// acc.withdraw(200);
// console.log(acc.toString()); // "Alice's account: $1300.00"
// console.log(acc.getBalance()); // 1300


// ----------------------------------------------------------------
// Exercise 2: Inheritance
// Create an abstract class `Shape` with:
//   - abstract area(): number
//   - abstract perimeter(): number
//   - describe(): string  — "Shape with area X and perimeter Y"
//
// Create subclasses: Circle(radius), Rectangle(width, height), Triangle(a, b, c)
// All extend Shape and implement area() and perimeter().
// ----------------------------------------------------------------

// TODO: implement Shape, Circle, Rectangle, Triangle

// const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6), new Triangle(3, 4, 5)];
// shapes.forEach(s => console.log(s.describe()));


// ----------------------------------------------------------------
// Exercise 3: Implementing interfaces
// Define an interface `Serializable` with: serialize(): string
// Define an interface `Cloneable<T>` with: clone(): T
//
// Make your `BankAccount` class implement both interfaces.
// serialize() → JSON string of { owner, balance }
// clone()     → new BankAccount with same owner and balance
// ----------------------------------------------------------------

// TODO: add Serializable and Cloneable<BankAccount> to BankAccount


// ----------------------------------------------------------------
// Exercise 4: Static members
// Add a static property to `BankAccount`:
//   - private static totalAccounts: number = 0
//   - Increment it in the constructor
//   - static getTotalAccounts(): number
// ----------------------------------------------------------------

// TODO: add static tracking to BankAccount

// new BankAccount("Alice", 500);
// new BankAccount("Bob", 300);
// console.log(BankAccount.getTotalAccounts()); // 2 (or more if you ran exercise 1)


// ----------------------------------------------------------------
// Exercise 5: Constructor shorthand
// Rewrite this verbose class using TypeScript's constructor shorthand:
// ----------------------------------------------------------------

class Verbose {
    public name: string;
    private age: number;
    protected score: number;

    constructor(name: string, age: number, score: number) {
        this.name = name;
        this.age = age;
        this.score = score;
    }
}

// TODO: rewrite as `class Concise` using parameter shorthand
