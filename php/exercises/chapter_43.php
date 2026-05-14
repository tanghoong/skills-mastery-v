<?php
declare(strict_types=1);
/**
 * Chapter 43 — Twig Template Engine
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_43.php
 *
 * Note: This file simulates Twig rendering in pure PHP without Composer.
 * In a real project: composer require twig/twig
 */

// ── TODO 1: Mini template renderer — variable interpolation ─────────────────
// Write render(string $template, array<string, mixed> $vars): string that:
//   - Replaces {{ varName }} and {{ var.key }} with values from $vars
//   - {{ var.key }} should look up $vars['var']['key']
//   - Trims whitespace inside the braces
//   - Leaves unknown variables as empty string

echo "── TODO 1: Variable interpolation renderer ─────────────────────────────\n";

/**
 * @param array<string, mixed> $vars
 */
function render(string $template, array $vars): string
{
    return preg_replace_callback(
        '/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/',
        function (array $matches) use ($vars): string {
            $path  = explode('.', $matches[1]);
            $value = $vars;

            foreach ($path as $segment) {
                if (is_array($value) && array_key_exists($segment, $value)) {
                    $value = $value[$segment];
                } else {
                    return '';
                }
            }

            return is_scalar($value) ? (string) $value : '';
        },
        $template,
    ) ?? $template;
}

$tpl1 = 'Hello, {{ name }}! You have {{ count }} messages. App: {{ app.name }}';
$out1 = render($tpl1, [
    'name'  => 'Alice',
    'count' => 5,
    'app'   => ['name' => 'NoteFlow'],
]);
echo $out1 . "\n";
// Expected: Hello, Alice! You have 5 messages. App: NoteFlow

// ── TODO 2: Add {% for item in items %}...{% endfor %} loop support ──────────
// Extend the renderer to handle for loops.
// The block between {% for item in items %} and {% endfor %} repeats once
// per element of $vars['items'], with 'item' bound to each element.
// Support {{ item }} and {{ item.property }} inside the loop body.

echo "\n── TODO 2: For-loop support ─────────────────────────────────────────────\n";

/**
 * @param array<string, mixed> $vars
 */
function renderWithLoops(string $template, array $vars): string
{
    // Process {% for item in collection %}...{% endfor %}
    $template = preg_replace_callback(
        '/\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}(.*?)\{%\s*endfor\s*%\}/s',
        function (array $matches) use ($vars): string {
            [, $itemName, $collectionName, $body] = $matches;
            $collection = $vars[$collectionName] ?? [];
            if (!is_array($collection)) {
                return '';
            }

            $output = '';
            foreach ($collection as $item) {
                $loopVars           = $vars;
                $loopVars[$itemName] = $item;
                $output .= render($body, $loopVars);
            }
            return $output;
        },
        $template,
    ) ?? $template;

    // Resolve remaining variables
    return render($template, $vars);
}

$tpl2 = <<<'TPL'
<ul>
{% for post in posts %}  <li>{{ post.title }} ({{ post.author }})</li>
{% endfor %}</ul>
TPL;

$out2 = renderWithLoops($tpl2, [
    'posts' => [
        ['title' => 'PHP 8.4 Features',  'author' => 'Alice'],
        ['title' => 'Caching Strategies', 'author' => 'Bob'],
        ['title' => 'Twig Deep Dive',     'author' => 'Carol'],
    ],
]);
echo $out2;

// ── TODO 3: Add {% if condition %}...{% endif %} support ─────────────────────
// Extend the renderer to handle if blocks.
// Condition is a variable name — truthy/falsy PHP evaluation.
// Support: {% if varName %}...{% endif %}
// For a stretch goal, support {% if !varName %} (negation).

echo "\n── TODO 3: If-block support ─────────────────────────────────────────────\n";

/**
 * @param array<string, mixed> $vars
 */
function renderFull(string $template, array $vars): string
{
    // Process {% if condition %}...{% endif %} (with optional negation)
    $template = preg_replace_callback(
        '/\{%\s*if\s+(!?)(\w+)\s*%\}(.*?)\{%\s*endif\s*%\}/s',
        function (array $matches) use ($vars): string {
            [, $negate, $varName, $body] = $matches;
            $condition = (bool) ($vars[$varName] ?? false);
            if ($negate === '!') {
                $condition = !$condition;
            }
            return $condition ? renderFull($body, $vars) : '';
        },
        $template,
    ) ?? $template;

    // Process for loops
    $template = preg_replace_callback(
        '/\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}(.*?)\{%\s*endfor\s*%\}/s',
        function (array $matches) use ($vars): string {
            [, $itemName, $collectionName, $body] = $matches;
            $collection = $vars[$collectionName] ?? [];
            if (!is_array($collection)) {
                return '';
            }
            $output = '';
            foreach ($collection as $item) {
                $loopVars            = $vars;
                $loopVars[$itemName] = $item;
                $output .= renderFull($body, $loopVars);
            }
            return $output;
        },
        $template,
    ) ?? $template;

    return render($template, $vars);
}

$tpl3 = <<<'TPL'
{% if isAdmin %}<a href="/admin">Admin Panel</a>
{% endif %}{% if !isAdmin %}<a href="/profile">Profile</a>
{% endif %}Welcome, {{ name }}!
TPL;

echo renderFull($tpl3, ['name' => 'Alice', 'isAdmin' => true]);
echo renderFull($tpl3, ['name' => 'Bob', 'isAdmin' => false]);

// ── TODO 4: Filter pipeline — {{ var|upper }}, {{ var|lower }}, {{ var|trim }}
// Add filter support to the renderer.
// Filters are applied left-to-right via pipe: {{ value|filter1|filter2 }}
// Implement: upper, lower, trim, length (returns count for arrays, strlen for strings)

echo "\n── TODO 4: Filter pipeline ──────────────────────────────────────────────\n";

function applyFilter(mixed $value, string $filter): mixed
{
    return match ($filter) {
        'upper'  => is_string($value) ? strtoupper($value) : $value,
        'lower'  => is_string($value) ? strtolower($value) : $value,
        'trim'   => is_string($value) ? trim($value) : $value,
        'length' => is_array($value) ? count($value) : (is_string($value) ? strlen($value) : 0),
        default  => $value,
    };
}

/**
 * @param array<string, mixed> $vars
 */
function renderWithFilters(string $template, array $vars): string
{
    return preg_replace_callback(
        '/\{\{\s*([a-zA-Z0-9_.]+(?:\|[a-zA-Z0-9_]+)*)\s*\}\}/',
        function (array $matches) use ($vars): string {
            $parts   = explode('|', $matches[1]);
            $varPath = array_shift($parts);
            $filters = $parts;

            // Resolve variable (supporting dot notation)
            $segments = explode('.', $varPath);
            $value    = $vars;
            foreach ($segments as $seg) {
                if (is_array($value) && array_key_exists($seg, $value)) {
                    $value = $value[$seg];
                } else {
                    $value = '';
                    break;
                }
            }

            // Apply filters in sequence
            foreach ($filters as $filter) {
                $value = applyFilter($value, $filter);
            }

            return is_scalar($value) ? (string) $value : '';
        },
        $template,
    ) ?? $template;
}

$tpl4    = '{{ title|upper }}  |  {{ greeting|lower|trim }}  |  {{ items|length }} items';
$result4 = renderWithFilters($tpl4, [
    'title'    => 'php mastery',
    'greeting' => '  Hello World  ',
    'items'    => ['a', 'b', 'c', 'd'],
]);
echo $result4 . "\n";
// Expected: PHP MASTERY  |  hello world  |  4 items

// ── TODO 5: Equivalent real Twig code ────────────────────────────────────────
// Show the real Twig syntax that corresponds to what our renderer handles.
// Write this as a comment block — do NOT require twig/twig.

echo "\n── TODO 5: Real Twig equivalents (see comment block below) ─────────────\n";

/*
 * ─── Real Twig Code Equivalents ───────────────────────────────────────────────
 *
 * TODO 1 — Variable interpolation:
 *   {{ name }}           — print the 'name' variable (auto-escaped)
 *   {{ app.name }}       — access a nested key or property
 *   {{ count }}          — works for integers, strings, etc.
 *
 * TODO 2 — For loop:
 *   <ul>
 *   {% for post in posts %}
 *       <li>{{ post.title }} ({{ post.author }})</li>
 *   {% else %}
 *       <li>No posts yet.</li>
 *   {% endfor %}
 *   </ul>
 *
 *   Twig adds an {% else %} clause for empty collections — our renderer does not.
 *   Twig also provides a `loop` variable: loop.index, loop.first, loop.last.
 *
 * TODO 3 — If block:
 *   {% if isAdmin %}
 *       <a href="/admin">Admin Panel</a>
 *   {% elseif isModerator %}
 *       <a href="/mod">Mod Tools</a>
 *   {% else %}
 *       <a href="/profile">Profile</a>
 *   {% endif %}
 *
 *   Twig supports `{% elseif %}` and full boolean expressions, not just variable names.
 *
 * TODO 4 — Filters:
 *   {{ title|upper }}
 *   {{ greeting|lower|trim }}
 *   {{ items|length }}
 *   {{ text|truncate(100) }}   — custom filter (see Ch. 43 custom filters)
 *   {{ html|raw }}             — disable auto-escaping for trusted HTML
 *
 * Key differences from our mini-renderer:
 *   1. Twig auto-escapes ALL output by default — our renderer does not.
 *   2. Twig supports full expressions: {{ user.score + bonus }}, {{ items|sort }}
 *   3. Twig's dot notation also calls methods: {{ user.getName() }}
 *   4. Twig has built-in filters: date, number_format, json_encode, nl2br, etc.
 *   5. Template inheritance (extends/block/parent()) has no equivalent in our renderer.
 * ──────────────────────────────────────────────────────────────────────────────
 */

echo "Twig equivalents documented in the comment block above TODO 5.\n";
