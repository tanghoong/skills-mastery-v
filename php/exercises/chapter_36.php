<?php
declare(strict_types=1);
/**
 * Chapter 36 — Namespaces & Composer
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_36.php
 *
 * Note: This file is intentionally self-contained (no Composer autoloader)
 * so it can be run standalone. TODOs 3 and 5 are demonstrated as code
 * comments and printed explanations, as they describe project configuration
 * rather than runtime behaviour.
 */

// ── TODO 1: Declare a namespace and define a class ────────────────────────────
// Normally each class lives in its own file matching its namespace path.
// Here we demonstrate the concept inline. Declare namespace App\Services,
// define a Greeter class with a greet(string $name): string method.

namespace App\Services {
    final class Greeter
    {
        public function greet(string $name): string
        {
            return "Hello, {$name}! Welcome to PHP namespace mastery.";
        }

        public function greetFormal(string $title, string $name): string
        {
            return "Good day, {$title} {$name}.";
        }
    }
}

namespace App\Helpers {
    function slugify(string $title): string
    {
        $slug = mb_strtolower(trim($title), 'UTF-8');
        $slug = (string)preg_replace('/[^\pL\pN\s-]/u', '', $slug);
        $slug = (string)preg_replace('/[\s-]+/', '-', $slug);
        return trim($slug, '-');
    }

    const VERSION = '1.0.0';
}

// All remaining code runs in the global namespace
namespace {
    // ── TODO 2: Use `use` to import and alias namespaced classes ──────────────
    // Import App\Services\Greeter with its real name, and also alias it
    // as GreeterService. Use both to demonstrate they refer to the same class.

    use App\Services\Greeter;
    use App\Services\Greeter as GreeterService;
    use function App\Helpers\slugify;
    use const App\Helpers\VERSION;

    echo "=== TODO 1 & 2: Namespaces and use ===" . PHP_EOL;

    $g1 = new Greeter();
    echo $g1->greet('Charlie') . PHP_EOL;

    $g2 = new GreeterService();
    echo $g2->greetFormal('Dr.', 'Strange') . PHP_EOL;

    echo "Same class? " . ($g1::class === $g2::class ? 'yes' : 'no') . PHP_EOL;

    // ── TODO 4: use function and use const ────────────────────────────────────
    // Demonstrate using an imported function and an imported constant.

    echo PHP_EOL . "=== TODO 4: use function and use const ===" . PHP_EOL;

    $slug = slugify('Hello World — PHP 8.4!');
    echo "Slug    : {$slug}"   . PHP_EOL;   // hello-world-php-84
    echo "Version : " . VERSION . PHP_EOL;

    // ── TODO 3: composer.json PSR-4 snippet (as a comment) ───────────────────
    // The snippet below shows how to configure PSR-4 autoloading in composer.json
    // so that the App\ namespace maps to the src/ directory.

    echo PHP_EOL . "=== TODO 3: composer.json PSR-4 snippet ===" . PHP_EOL;

    $composerSnippet = <<<'JSON'
    {
        "name": "charlie/php-mastery",
        "require": {
            "php": "^8.4"
        },
        "autoload": {
            "psr-4": {
                "App\\": "src/"
            }
        },
        "autoload-dev": {
            "psr-4": {
                "App\\Tests\\": "tests/"
            }
        }
    }
    JSON;

    echo $composerSnippet . PHP_EOL;

    echo PHP_EOL . "PSR-4 mapping: App\\ => src/" . PHP_EOL;
    echo "File App\\Services\\Greeter -> src/Services/Greeter.php" . PHP_EOL;
    echo "File App\\Tests\\Unit\\GreeterTest -> tests/Unit/GreeterTest.php" . PHP_EOL;

    // ── TODO 5: PSR standards summary ────────────────────────────────────────
    // List PSR-1, PSR-4, PSR-7, PSR-11, PSR-12, and PSR-15 with a one-line
    // description of each.

    echo PHP_EOL . "=== TODO 5: PSR Standards Summary ===" . PHP_EOL;

    $psrStandards = [
        'PSR-1'  => 'Basic Coding Standard: <?php, StudlyCaps classes, camelCase methods, UPPER_CASE constants.',
        'PSR-4'  => 'Autoloading Standard: namespace maps to directory; one class per file; filename = class name.',
        'PSR-7'  => 'HTTP Message Interfaces: RequestInterface / ResponseInterface used by Slim, Guzzle, Laminas.',
        'PSR-11' => 'Container Interface: ContainerInterface with get(string $id) and has(string $id) for DI containers.',
        'PSR-12' => 'Extended Coding Style: brace placement, indentation (4 spaces), blank lines — superset of PSR-2.',
        'PSR-15' => 'HTTP Server Handlers: MiddlewareInterface and RequestHandlerInterface for middleware pipelines.',
    ];

    foreach ($psrStandards as $psr => $description) {
        echo sprintf("  %-7s %s", $psr, $description) . PHP_EOL;
    }
}
