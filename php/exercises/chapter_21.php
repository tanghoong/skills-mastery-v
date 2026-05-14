<?php
declare(strict_types=1);
/**
 * Chapter 21 — Design Principles
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_21.php
 */

// ── TODO 1: SRP ───────────────────────────────────────────────────────────────
// The class below violates Single Responsibility Principle.
// Split it into three focused classes:
//   - UserRepository  (handles DB persistence)
//   - Mailer          (sends welcome emails)
//   - AppLogger       (writes log entries)
// Each class should have a single public method that does its one job.

class UserManager {
    public function save(array $data): void {
        // pretend: PDO insert
        echo "DB: saving user {$data['email']}" . PHP_EOL;
    }
    public function sendWelcomeEmail(string $email): void {
        // pretend: SMTP
        echo "Email: welcome sent to {$email}" . PHP_EOL;
    }
    public function log(string $message): void {
        // pretend: file write
        echo "Log: {$message}" . PHP_EOL;
    }
}

// YOUR CODE HERE — define UserRepository, Mailer, AppLogger
// Then demonstrate their use:
// $repo   = new UserRepository();
// $mailer = new Mailer();
// $log    = new AppLogger();
// $repo->save(['email' => 'alice@example.com']);
// $mailer->sendWelcome('alice@example.com');
// $log->info('User created.');


// ── TODO 2: OCP ───────────────────────────────────────────────────────────────
// The existing PercentageDiscount class is closed for modification.
// Add a new BuyOneGetOneDiscount that implements DiscountStrategy
// so that a second item costs 0.
// You must not change any existing class.

interface DiscountStrategy {
    public function apply(float $price): float;
}

class PercentageDiscount implements DiscountStrategy {
    public function __construct(private readonly float $percent) {}
    public function apply(float $price): float {
        return $price * (1 - $this->percent / 100);
    }
}

class FlatDiscount implements DiscountStrategy {
    public function __construct(private readonly float $amount) {}
    public function apply(float $price): float {
        return max(0.0, $price - $this->amount);
    }
}

// YOUR CODE HERE — add BuyOneGetOneDiscount
// Then:
// $bogo = new BuyOneGetOneDiscount(quantity: 2);
// echo $bogo->apply(50.00) . PHP_EOL; // 25.00 (two items, second free)


// ── TODO 3: LSP ───────────────────────────────────────────────────────────────
// Below is the classic Liskov violation: Square extends Rectangle and overrides
// setWidth/setHeight so they always set both dimensions equally.
// This breaks any caller that expects to set width and height independently.
//
// Step A: Show the violation (run the broken test below).
// Step B: Fix it — implement a Shape interface instead of using inheritance.
//         Both Rectangle and Square implement Shape with just area(): float.

class Rectangle {
    protected float $width;
    protected float $height;

    public function setWidth(float $w): void  { $this->width  = $w; }
    public function setHeight(float $h): void { $this->height = $h; }
    public function area(): float { return $this->width * $this->height; }
}

class BrokenSquare extends Rectangle {
    public function setWidth(float $w): void  { $this->width = $this->height = $w; }
    public function setHeight(float $h): void { $this->width = $this->height = $h; }
}

// Step A — uncomment to see violation:
// $shape = new BrokenSquare();
// $shape->setWidth(4);
// $shape->setHeight(5);
// echo $shape->area() . PHP_EOL; // Expected 20, got 25 — LSP broken

// YOUR CODE HERE — Step B: define Shape interface, FixedRectangle, FixedSquare
// function assertArea(Shape $s, float $expected): void { ... }


// ── TODO 4: ISP ───────────────────────────────────────────────────────────────
// The fat Worker interface forces all implementors to provide every method,
// even ones that make no sense for them (e.g. a Robot cannot eat).
// Split it into three focused interfaces: Workable, Eatable, Sleepable.
// Then create HumanWorker (implements all three) and RobotWorker (implements only Workable).

interface Worker {
    public function work(): void;
    public function eat(): void;
    public function sleep(): void;
}

// YOUR CODE HERE — define Workable, Eatable, Sleepable
// Then: class HumanWorker implements Workable, Eatable, Sleepable { ... }
//       class RobotWorker implements Workable { ... }
// Demonstrate instantiation and calling each method.


// ── TODO 5: DIP ───────────────────────────────────────────────────────────────
// NotificationService below creates its own SmtpMailer internally.
// Refactor it so the mailer is injected via the constructor.
// Define a MailerInterface with send(string $to, string $subject): void.
// Create SmtpMailer and LogMailer (which just echo-logs instead of sending).
// Show that swapping mailers requires no change to NotificationService.

class NotificationService {
    public function notify(string $email, string $message): void {
        // Violation: tight coupling — cannot swap without modifying this class
        $mailer = new SmtpMailer2(); // intentionally named SmtpMailer2 to avoid conflict above
        $mailer->send($email, $message);
    }
}

class SmtpMailer2 {
    public function send(string $to, string $subject): void {
        echo "SMTP: sending '{$subject}' to {$to}" . PHP_EOL;
    }
}

// YOUR CODE HERE — define MailerInterface, refactor NotificationService
// $smtpService = new NotificationService(new SmtpMailer());
// $logService  = new NotificationService(new LogMailer());
// Both work without any change to NotificationService.


echo PHP_EOL . "All TODOs complete!" . PHP_EOL;
