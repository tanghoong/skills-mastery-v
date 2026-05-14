<?php
declare(strict_types=1);
/**
 * Chapter 25 — Behavioral Patterns Part 2
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_25.php
 */

// ── TODO 1: State ─────────────────────────────────────────────────────────────
// Implement an Order state machine with four states:
//   PendingState -> PaidState -> ShippedState -> DeliveredState
//
// OrderState interface declares: pay(Order), ship(Order), deliver(Order), label(): string
//
// Each state class:
//   - Implements only its legal transitions (call $order->setState(new NextState()))
//   - Throws \LogicException for illegal transitions with a descriptive message
//
// Order class:
//   - Starts in PendingState
//   - Delegates pay/ship/deliver to current state
//   - status(): string returns state label
//
// Verify: full happy path works; illegal transition (ship before pay) throws.

// YOUR CODE HERE
// interface OrderState { ... }
// class PendingState implements OrderState { ... }
// class PaidState implements OrderState { ... }
// class ShippedState implements OrderState { ... }
// class DeliveredState implements OrderState { ... }
// class Order { ... }

// Demonstration:
// $order = new Order();
// echo $order->status() . PHP_EOL; // pending
// $order->pay();
// echo $order->status() . PHP_EOL; // paid
// $order->ship();
// $order->deliver();
// echo $order->status() . PHP_EOL; // delivered
//
// try {
//     $bad = new Order();
//     $bad->ship(); // should throw
// } catch (\LogicException $e) {
//     echo "Caught: {$e->getMessage()}" . PHP_EOL;
// }


// ── TODO 2: Template Method ───────────────────────────────────────────────────
// Implement a report generation framework using Template Method.
//
// Abstract ReportGenerator:
//   - final generate(): string — template method
//     1. $rows = $this->fetchData()
//     2. map each row through $this->formatRow($row)
//     3. join with $this->separator()
//     4. wrap with $this->wrapOutput($joined)
//   - abstract fetchData(): array
//   - abstract formatRow(array $row): string
//   - protected separator(): string — default PHP_EOL
//   - protected wrapOutput(string $content): string — default identity
//
// CsvReport:
//   - fetchData() returns [['id'=>1,'name'=>'Alice'],['id'=>2,'name'=>'Bob']]
//   - formatRow() returns "id,name" CSV format
//
// HtmlReport:
//   - Same data; formatRow() returns "<tr><td>id</td><td>name</td></tr>"
//   - wrapOutput() wraps in <table>...</table>

// YOUR CODE HERE
// abstract class ReportGenerator { ... }
// class CsvReport extends ReportGenerator { ... }
// class HtmlReport extends ReportGenerator { ... }

// Demonstration:
// echo (new CsvReport())->generate() . PHP_EOL;
// echo (new HtmlReport())->generate() . PHP_EOL;


// ── TODO 3: Null Object ───────────────────────────────────────────────────────
// Define UserInterface:
//   id(): int
//   name(): string
//   isGuest(): bool
//   hasPermission(string $permission): bool
//
// AuthenticatedUser: real user, stores id, name, and permissions array.
//
// GuestUser (Null Object):
//   - id() returns 0
//   - name() returns 'Guest'
//   - isGuest() returns true
//   - hasPermission() always returns false
//
// greet(UserInterface $user): string — returns personalised or guest greeting.
// No null checks anywhere in greet().

// YOUR CODE HERE
// interface UserInterface { ... }
// class AuthenticatedUser implements UserInterface { ... }
// class GuestUser implements UserInterface { ... }
// function greet(UserInterface $user): string { ... }

// Demonstration:
// echo greet(new AuthenticatedUser(1, 'Alice', ['read', 'write'])) . PHP_EOL;
// echo greet(new GuestUser()) . PHP_EOL;
// $alice = new AuthenticatedUser(1, 'Alice', ['read']);
// var_dump($alice->hasPermission('write')); // false
// var_dump($alice->hasPermission('read'));  // true


// ── TODO 4: Memento ───────────────────────────────────────────────────────────
// Implement an undo-able TextEditor.
//
// EditorMemento: readonly class holding a string $content snapshot.
//
// TextEditor:
//   - type(string $text): void — appends text to internal content
//   - save(): EditorMemento    — captures current state
//   - restore(EditorMemento): void — reverts to snapshot
//   - content(): string
//
// Demonstrate:
//   type "Hello" -> save -> type ", World" -> save -> type "!!!"
//   undoLast -> content is "Hello, World"
//   undoLast -> content is "Hello"

// YOUR CODE HERE
// readonly class EditorMemento { ... }
// class TextEditor { ... }

// Demonstration:
// $editor  = new TextEditor();
// $history = [];
// $editor->type('Hello');
// $history[] = $editor->save();
// $editor->type(', World');
// $history[] = $editor->save();
// $editor->type('!!!');
// echo $editor->content() . PHP_EOL;              // Hello, World!!!
// $editor->restore(array_pop($history));
// echo $editor->content() . PHP_EOL;              // Hello, World
// $editor->restore(array_pop($history));
// echo $editor->content() . PHP_EOL;              // Hello


// ── TODO 5: Visitor ───────────────────────────────────────────────────────────
// Implement the Visitor pattern over a product catalogue.
//
// Two product types:
//   PhysicalProduct (has name and base price)
//   DigitalProduct  (has name and base price)
// Both implement Product interface with:
//   accept(ProductVisitor $visitor): void
//   basePrice(): float
//
// ProductVisitor interface:
//   visitPhysical(PhysicalProduct): void
//   visitDigital(DigitalProduct): void
//
// TaxVisitor accumulates tax:
//   - Physical: 10% of base price
//   - Digital:  20% of base price
//   - total(): float
//
// PriceVisitor accumulates gross totals:
//   - Both: basePrice() + applicable tax (same rates as TaxVisitor)
//   - total(): float
//
// Catalogue: Book (physical, 20.00), eBook (digital, 10.00), Mug (physical, 15.00)
// Expected tax: 2.00 + 2.00 + 1.50 = 5.50

// YOUR CODE HERE
// interface ProductVisitor { ... }
// interface Product { ... }
// class PhysicalProduct implements Product { ... }
// class DigitalProduct implements Product { ... }
// class TaxVisitor implements ProductVisitor { ... }
// class PriceVisitor implements ProductVisitor { ... }

// Demonstration:
// $catalogue = [
//     new PhysicalProduct('Book', 20.00),
//     new DigitalProduct('eBook', 10.00),
//     new PhysicalProduct('Mug', 15.00),
// ];
// $tax = new TaxVisitor();
// foreach ($catalogue as $p) { $p->accept($tax); }
// echo 'Total tax: ' . number_format($tax->total(), 2) . PHP_EOL; // 5.50

echo PHP_EOL . "All TODOs complete!" . PHP_EOL;
