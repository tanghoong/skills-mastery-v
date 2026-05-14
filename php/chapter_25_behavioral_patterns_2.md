# Chapter 25 — Behavioral Patterns Part 2

> **Goal:** Model complex object lifecycles and eliminate scattered conditionals with State, Template Method, Mediator, Memento, Visitor, and Null Object.

## 25.1 State

State allows an object to alter its behaviour when its internal state changes. Instead of large `switch` or `if/elseif` blocks keyed on a status field, each state is its own class that knows which transitions are legal.

```php
<?php
declare(strict_types=1);

interface OrderState {
    public function pay(Order $order): void;
    public function ship(Order $order): void;
    public function deliver(Order $order): void;
    public function label(): string;
}

class Order {
    private OrderState $state;

    public function __construct() {
        $this->state = new PendingState();
    }

    public function setState(OrderState $state): void { $this->state = $state; }
    public function pay(): void     { $this->state->pay($this); }
    public function ship(): void    { $this->state->ship($this); }
    public function deliver(): void { $this->state->deliver($this); }
    public function status(): string { return $this->state->label(); }
}

class PendingState implements OrderState {
    public function pay(Order $order): void    { $order->setState(new PaidState()); }
    public function ship(Order $order): void   { throw new \LogicException('Pay first.'); }
    public function deliver(Order $order): void { throw new \LogicException('Pay first.'); }
    public function label(): string { return 'pending'; }
}

class PaidState implements OrderState {
    public function pay(Order $order): void    { throw new \LogicException('Already paid.'); }
    public function ship(Order $order): void   { $order->setState(new ShippedState()); }
    public function deliver(Order $order): void { throw new \LogicException('Ship first.'); }
    public function label(): string { return 'paid'; }
}

class ShippedState implements OrderState {
    public function pay(Order $order): void    { throw new \LogicException('Already paid.'); }
    public function ship(Order $order): void   { throw new \LogicException('Already shipped.'); }
    public function deliver(Order $order): void { $order->setState(new DeliveredState()); }
    public function label(): string { return 'shipped'; }
}

class DeliveredState implements OrderState {
    public function pay(Order $o): void    { throw new \LogicException('Order complete.'); }
    public function ship(Order $o): void   { throw new \LogicException('Order complete.'); }
    public function deliver(Order $o): void { throw new \LogicException('Order complete.'); }
    public function label(): string { return 'delivered'; }
}

$order = new Order();
$order->pay();
$order->ship();
$order->deliver();
echo $order->status() . PHP_EOL; // delivered
```

## 25.2 Template Method

Template Method defines the skeleton of an algorithm in a base class and lets subclasses fill in specific steps without changing the overall structure.

```php
<?php
declare(strict_types=1);

abstract class ReportGenerator {
    // Template method — defines the algorithm
    final public function generate(): string {
        $rows = $this->fetchData();
        $lines = array_map([$this, 'formatRow'], $rows);
        return $this->wrapOutput(implode($this->separator(), $lines));
    }

    abstract protected function fetchData(): array;
    abstract protected function formatRow(array $row): string;

    protected function separator(): string { return PHP_EOL; }
    protected function wrapOutput(string $content): string { return $content; }
}

class CsvReport extends ReportGenerator {
    protected function fetchData(): array {
        return [['id' => 1, 'name' => 'Alice'], ['id' => 2, 'name' => 'Bob']];
    }
    protected function formatRow(array $row): string {
        return "{$row['id']},{$row['name']}";
    }
}

class HtmlReport extends ReportGenerator {
    protected function fetchData(): array {
        return [['id' => 1, 'name' => 'Alice'], ['id' => 2, 'name' => 'Bob']];
    }
    protected function formatRow(array $row): string {
        return "<tr><td>{$row['id']}</td><td>{$row['name']}</td></tr>";
    }
    protected function separator(): string { return "\n"; }
    protected function wrapOutput(string $content): string {
        return "<table>\n{$content}\n</table>";
    }
}

echo (new CsvReport())->generate() . PHP_EOL;
echo (new HtmlReport())->generate() . PHP_EOL;
```

## 25.3 Null Object

Null Object replaces `null` with an object that implements the same interface but performs safe no-ops. It eliminates defensive `null` checks scattered throughout callers.

```php
<?php
declare(strict_types=1);

interface UserInterface {
    public function id(): int;
    public function name(): string;
    public function isGuest(): bool;
    public function hasPermission(string $permission): bool;
}

class AuthenticatedUser implements UserInterface {
    public function __construct(
        private readonly int    $userId,
        private readonly string $username,
        private readonly array  $permissions
    ) {}

    public function id(): int    { return $this->userId; }
    public function name(): string { return $this->username; }
    public function isGuest(): bool { return false; }
    public function hasPermission(string $permission): bool {
        return in_array($permission, $this->permissions, true);
    }
}

class GuestUser implements UserInterface {
    public function id(): int    { return 0; }
    public function name(): string { return 'Guest'; }
    public function isGuest(): bool { return true; }
    public function hasPermission(string $permission): bool { return false; }
}

function greet(UserInterface $user): string {
    // No null check needed anywhere
    return $user->isGuest() ? 'Hello, Guest!' : "Hello, {$user->name()}!";
}

echo greet(new AuthenticatedUser(1, 'Alice', ['read'])) . PHP_EOL;
echo greet(new GuestUser()) . PHP_EOL;
```

## 25.4 Memento (Undo Snapshot)

Memento captures and externalises an object's internal state so it can be restored later, without violating encapsulation.

```php
<?php
declare(strict_types=1);

class EditorMemento {
    public function __construct(public readonly string $content) {}
}

class TextEditor {
    private string $content = '';

    public function type(string $text): void {
        $this->content .= $text;
    }

    public function save(): EditorMemento {
        return new EditorMemento($this->content);
    }

    public function restore(EditorMemento $memento): void {
        $this->content = $memento->content;
    }

    public function content(): string { return $this->content; }
}

$editor  = new TextEditor();
$history = [];

$editor->type('Hello');
$history[] = $editor->save();
$editor->type(', World');
$history[] = $editor->save();
$editor->type('!!!');

echo $editor->content() . PHP_EOL; // Hello, World!!!
$editor->restore(array_pop($history));
echo $editor->content() . PHP_EOL; // Hello, World
$editor->restore(array_pop($history));
echo $editor->content() . PHP_EOL; // Hello
```

## 25.5 Visitor (Report Generator)

Visitor lets you add operations to object structures without modifying the classes of the elements. Each element accepts a visitor; the visitor dispatches on the concrete type via overloaded `visit*` methods.

```php
<?php
declare(strict_types=1);

interface ProductVisitor {
    public function visitPhysical(PhysicalProduct $product): void;
    public function visitDigital(DigitalProduct $product): void;
}

interface Product {
    public function accept(ProductVisitor $visitor): void;
    public function basePrice(): float;
}

class PhysicalProduct implements Product {
    public function __construct(
        public readonly string $name,
        private readonly float $price
    ) {}
    public function basePrice(): float { return $this->price; }
    public function accept(ProductVisitor $visitor): void { $visitor->visitPhysical($this); }
}

class DigitalProduct implements Product {
    public function __construct(
        public readonly string $name,
        private readonly float $price
    ) {}
    public function basePrice(): float { return $this->price; }
    public function accept(ProductVisitor $visitor): void { $visitor->visitDigital($this); }
}

class TaxVisitor implements ProductVisitor {
    private float $totalTax = 0;

    public function visitPhysical(PhysicalProduct $p): void {
        $this->totalTax += $p->basePrice() * 0.10; // 10% VAT on physical goods
    }
    public function visitDigital(DigitalProduct $p): void {
        $this->totalTax += $p->basePrice() * 0.20; // 20% digital services tax
    }
    public function total(): float { return $this->totalTax; }
}

$catalogue = [
    new PhysicalProduct('Book', 20.00),
    new DigitalProduct('eBook', 10.00),
    new PhysicalProduct('Mug', 15.00),
];

$tax = new TaxVisitor();
foreach ($catalogue as $product) {
    $product->accept($tax);
}

echo 'Total tax: ' . number_format($tax->total(), 2) . PHP_EOL; // 6.50
```

## Key Takeaways

- State turns complex status-driven conditionals into a family of small, focused state classes with enforced transition rules.
- Template Method locks the algorithm skeleton in a base class while leaving extension points open — `final` prevents accidental override of the template.
- Null Object eliminates defensive null checks by providing a safe do-nothing implementation of an interface.
- Memento provides a clean snapshot/restore mechanism without exposing an object's internals.
- Visitor adds new operations to an object hierarchy without modifying the hierarchy — ideal when the hierarchy is stable but operations frequently change.

## What's Next

Chapter 26 examines Dependency Injection in depth — from constructor injection through building a PSR-11 container — showing how DI eliminates Singleton abuse and makes all patterns here trivially testable.
