<?php
declare(strict_types=1);
/**
 * Chapter 19 — PHP 8.4 Features
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_19.php
 * Note: Requires PHP >= 8.4
 */

echo "=== Chapter 19: PHP 8.4 Features ===\n\n";

// ── TODO 1: Property hooks ────────────────────────────────────────────────────
// Define a class Temperature with:
//   - A `celsius` property with a set hook that rejects values below -273.15
//     and a get hook that returns the stored value.
//   - A virtual `fahrenheit` property (get only) computed as celsius * 9/5 + 32.
//   - A constructor that accepts float $celsius and assigns it (triggers the hook).
//
// Test with: 100.0°C → 212°F, 0.0°C → 32°F, and an invalid -300 that throws.

// class Temperature
// {
//     public float $celsius {
//         get => $this->celsius;
//         set(float $value) {
//             if ($value < -273.15) {
//                 throw new \ValueError("Temperature below absolute zero: {$value}");
//             }
//             $this->celsius = $value;
//         }
//     }
//
//     public float $fahrenheit {
//         get => $this->celsius * 9 / 5 + 32;
//     }
//
//     public function __construct(float $celsius)
//     {
//         $this->celsius = $celsius;
//     }
// }

// Uncomment to test:
// $t = new Temperature(100.0);
// echo "TODO 1 — 100°C = " . $t->fahrenheit . "°F\n"; // 212
// $t->celsius = 0.0;
// echo "TODO 1 — 0°C = " . $t->fahrenheit . "°F\n";   // 32
// try {
//     $t->celsius = -300.0;
// } catch (\ValueError $e) {
//     echo "TODO 1 — caught: " . $e->getMessage() . "\n";
// }


// ── TODO 2: Asymmetric visibility ─────────────────────────────────────────────
// Define an Order class with:
//   - public private(set) string $status = 'pending'
//   - public private(set) int $itemCount = 0
//   - addItem(): void — increments $itemCount
//   - ship(): void   — sets $status to 'shipped'
//
// Verify that external code can READ both properties but cannot WRITE them.

// class Order
// {
//     public private(set) string $status    = 'pending';
//     public private(set) int    $itemCount = 0;
//
//     public function addItem(): void { $this->itemCount++; }
//     public function ship(): void    { $this->status = 'shipped'; }
// }

// Uncomment to test:
// $order = new Order();
// echo "TODO 2 — initial status: " . $order->status . "\n";    // pending
// echo "TODO 2 — initial items:  " . $order->itemCount . "\n"; // 0
// $order->addItem();
// $order->addItem();
// $order->ship();
// echo "TODO 2 — after ship, status: " . $order->status . "\n";    // shipped
// echo "TODO 2 — item count:         " . $order->itemCount . "\n"; // 2
//
// // This should throw an Error — uncomment to verify:
// // $order->status = 'cancelled'; // Fatal error: cannot modify private(set) property


// ── TODO 3: array_find, array_any, array_all ─────────────────────────────────
// Use the following product list to demonstrate all three new PHP 8.4 functions.
// a) array_find  — find the first product priced under $10
// b) array_any   — check if any product is out of stock
// c) array_all   — check if all products have a name longer than 3 chars
// d) array_find_key — find the array key of the product named 'Gadget'

$products = [
    ['name' => 'Widget',    'price' => 9.99,  'inStock' => true],
    ['name' => 'Gadget',    'price' => 49.99, 'inStock' => false],
    ['name' => 'Doohickey', 'price' => 4.99,  'inStock' => true],
    ['name' => 'Thingamajig', 'price' => 19.99, 'inStock' => true],
];

// Uncomment to test (requires PHP 8.4):
// $cheap = array_find($products, fn(array $p): bool => $p['price'] < 10.0);
// echo "TODO 3a — first cheap product: " . ($cheap['name'] ?? 'none') . "\n"; // Widget

// $hasOutOfStock = array_any($products, fn(array $p): bool => !$p['inStock']);
// echo "TODO 3b — any out of stock: " . ($hasOutOfStock ? 'yes' : 'no') . "\n"; // yes

// $allLongNames = array_all($products, fn(array $p): bool => strlen($p['name']) > 3);
// echo "TODO 3c — all long names: " . ($allLongNames ? 'yes' : 'no') . "\n"; // yes

// $gadgetKey = array_find_key($products, fn(array $p): bool => $p['name'] === 'Gadget');
// echo "TODO 3d — Gadget key: " . $gadgetKey . "\n"; // 1


// ── TODO 4: new in property initializers ──────────────────────────────────────
// Define a NullLogger class with a log(string $message): void no-op method.
// Define a UserService class whose constructor has a promoted property:
//   private readonly NullLogger $logger = new NullLogger()
// Add a createUser(string $name): string method that calls $this->logger->log()
// and returns "User {$name} created".
//
// Verify: (a) works with no argument, (b) accepts an injected logger.

// class NullLogger
// {
//     public function log(string $message): void {}
// }
//
// class UserService
// {
//     public function __construct(
//         private readonly NullLogger $logger = new NullLogger(),
//     ) {}
//
//     public function createUser(string $name): string
//     {
//         $this->logger->log("Creating user: {$name}");
//         return "User {$name} created";
//     }
// }

// Uncomment to test:
// $service = new UserService();
// echo "TODO 4 — " . $service->createUser('Charlie') . "\n"; // User Charlie created


// ── TODO 5: Lazy objects via ReflectionClass::newLazyGhost() ─────────────────
// Define an ExpensiveService class whose constructor prints "Initializing..."
// and stores a value. Create a lazy ghost of it using ReflectionClass.
// Verify that "Initializing..." is NOT printed at creation time — only on
// first property/method access.

// class ExpensiveService
// {
//     public string $data;
//
//     public function __construct()
//     {
//         echo "Initializing ExpensiveService...\n";
//         $this->data = 'computed data';
//     }
//
//     public function getData(): string { return $this->data; }
// }

// Uncomment to test:
// $reflector = new ReflectionClass(ExpensiveService::class);
// $lazy = $reflector->newLazyGhost(function (ExpensiveService $instance): void {
//     $instance->__construct();
// });
//
// echo "TODO 5 — lazy object created (no init yet)\n";
// // "Initializing..." should NOT appear above this line
// echo "TODO 5 — accessing data: " . $lazy->getData() . "\n";
// // "Initializing..." appears HERE, then: computed data

echo "\nAll TODOs complete!\n";
