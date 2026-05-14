# Chapter 43 — Twig Template Engine

> **Goal:** Use Twig to separate presentation from logic — master template inheritance, filters, macros, and auto-escaping so your views are clean, safe, and DRY.

## 43.1 Setup via Composer

```bash
composer require twig/twig
```

Bootstrap the environment once at application startup:

```php
<?php
declare(strict_types=1);

use Twig\Environment;
use Twig\Loader\FilesystemLoader;

$loader = new FilesystemLoader(__DIR__ . '/templates');
$twig   = new Environment($loader, [
    'cache'       => __DIR__ . '/var/cache/twig',  // compiled template cache
    'auto_reload' => true,                          // recompile when source changes
    'autoescape'  => 'html',                        // XSS protection on by default
]);

echo $twig->render('home.html.twig', ['title' => 'PHP Mastery', 'year' => 2026]);
```

The `FilesystemLoader` resolves template paths relative to the templates directory. The compiled cache makes repeated renders near-zero overhead (similar to OPcache for PHP itself).

## 43.2 Syntax Basics

Twig has three delimiters:

| Delimiter | Purpose |
|---|---|
| `{{ expr }}` | Print / output an expression |
| `{% tag %}` | Control structures (for, if, block, extends…) |
| `{# comment #}` | Comments (not rendered to HTML) |

```twig
{# templates/user.html.twig #}
<h1>{{ user.name|title }}</h1>
<p>Member since {{ user.created_at|date('Y') }}</p>
<p>Score: {{ user.score|number_format(2) }}</p>
```

Twig's dot notation (`user.name`) checks for an array key, then a public property, then a getter method — in that order. This makes it easy to pass either plain arrays or objects.

## 43.3 Variables, Filters & Tests

Filters transform a value via the pipe operator `|`:

```twig
{{ "  hello world  "|trim|title }}    {# "Hello World" #}
{{ price|number_format(2, '.', ',') }} {# "1,234.56" #}
{{ description|truncate(100)|raw }}   {# raw disables auto-escape — use carefully #}
{{ items|length }}                     {# count of array or string #}
{{ items|join(', ') }}
{{ items|sort|reverse }}
```

Tests use `is`:

```twig
{% if user is defined and user is not null %}
    Hello, {{ user.name }}.
{% endif %}
```

## 43.4 Control Structures

```twig
{# for loop with loop variable #}
<ul>
{% for post in posts %}
    <li class="{{ loop.index is odd ? 'odd' : 'even' }}">
        {{ loop.index }}. {{ post.title }}
        {% if loop.last %} — end {% endif %}
    </li>
{% else %}
    <li>No posts yet.</li>
{% endfor %}
</ul>

{# if / elseif / else #}
{% if role == 'admin' %}
    <a href="/admin">Admin Panel</a>
{% elseif role == 'editor' %}
    <a href="/posts/new">New Post</a>
{% else %}
    <a href="/profile">Profile</a>
{% endif %}
```

## 43.5 Template Inheritance

Inheritance is Twig's most powerful feature. A base layout defines named `block` regions that child templates override.

```twig
{# templates/layout.html.twig #}
<!DOCTYPE html>
<html lang="en">
<head>
    <title>{% block title %}My App{% endblock %}</title>
    {% block stylesheets %}<link rel="stylesheet" href="/app.css">{% endblock %}
</head>
<body>
    <nav>{% block nav %}{% include 'partials/nav.html.twig' %}{% endblock %}</nav>
    <main>{% block content %}{% endblock %}</main>
    <footer>{% block footer %}&copy; {{ "now"|date("Y") }}{% endblock %}</footer>
</body>
</html>
```

```twig
{# templates/posts/show.html.twig #}
{% extends 'layout.html.twig' %}

{% block title %}{{ post.title }} — My App{% endblock %}

{% block content %}
    <article>
        <h1>{{ post.title }}</h1>
        <p class="meta">{{ post.created_at|date('d M Y') }}</p>
        {{ post.body|nl2br }}
    </article>
    {# Append to parent block content using parent() #}
    {{ parent() }}
{% endblock %}
```

Call `parent()` inside a block to render the parent block's content and then append or prepend around it.

## 43.6 `include` and `embed`

`include` renders a partial and passes the current context:

```twig
{% include 'partials/flash.html.twig' with { messages: flash } only %}
```

The `only` keyword prevents leaking the full context into the partial — a good default for encapsulation.

`embed` combines `include` with block overrides, letting you use a component with customised slots:

```twig
{% embed 'components/card.html.twig' %}
    {% block card_header %}Featured Post{% endblock %}
    {% block card_body %}{{ post.excerpt }}{% endblock %}
{% endembed %}
```

## 43.7 Macros

Macros are reusable template functions — think of them as template-level helpers:

```twig
{# templates/macros/forms.html.twig #}
{% macro input(name, value='', type='text', required=false) %}
    <input
        type="{{ type }}"
        name="{{ name }}"
        value="{{ value|e }}"
        {% if required %}required{% endif %}
    >
{% endmacro %}
```

```twig
{# Using the macro in another template #}
{% from 'macros/forms.html.twig' import input %}

<form method="post" action="/login">
    {{ input('email', '', 'email', true) }}
    {{ input('password', '', 'password', true) }}
    <button type="submit">Log in</button>
</form>
```

## 43.8 Custom Filters & Functions

Register custom behaviour on the `Environment` before first render:

```php
<?php
declare(strict_types=1);

use Twig\TwigFilter;
use Twig\TwigFunction;

// Custom filter: {{ text|excerpt(150) }}
$twig->addFilter(new TwigFilter('excerpt', function (string $text, int $length = 200): string {
    return mb_strlen($text) > $length
        ? mb_substr($text, 0, $length) . '…'
        : $text;
}));

// Custom function: {{ gravatar(user.email) }}
$twig->addFunction(new TwigFunction('gravatar', function (string $email): string {
    $hash = md5(strtolower(trim($email)));
    return "https://www.gravatar.com/avatar/{$hash}?s=80&d=mp";
}));
```

Mark a filter as `is_safe: ['html']` only if it returns pre-escaped HTML — otherwise Twig will double-escape it.

## 43.9 Auto-Escaping

With `autoescape => 'html'`, every `{{ }}` output is HTML-escaped by default. This prevents XSS without any manual effort. To output trusted HTML, use `|raw` explicitly:

```twig
{{ user_supplied_text }}      {# safe — escaped automatically #}
{{ trusted_html_content|raw }} {# opt-in — you assert this is safe #}
```

Never apply `|raw` to user-supplied data.

## Key Takeaways

- Twig separates presentation from logic — templates cannot execute arbitrary PHP, reducing attack surface.
- Template inheritance (`extends` + `block`) keeps layouts DRY and composable.
- Auto-escaping is on by default; use `|raw` only for trusted HTML content.
- Macros provide reusable template components without PHP code.
- Custom filters and functions bridge PHP logic and Twig templates cleanly.

## What's Next

Chapter 44 begins Phase 10 with a high-level tour of Laravel — routing, Eloquent, Blade, Artisan, and how its service providers wire everything together.
