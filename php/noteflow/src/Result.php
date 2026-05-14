<?php

declare(strict_types=1);

namespace NoteFlow;

// Result = Ok | Err
//
// Usage:
//   function divide(int $a, int $b): Ok|Err {
//       if ($b === 0) return Err::of('Division by zero');
//       return Ok::of($a / $b);
//   }
//
//   $result = divide(10, 2);
//   if ($result instanceof Ok) {
//       echo $result->value;   // 5
//   } else {
//       echo $result->error;   // error message string
//   }

readonly class Ok
{
    private function __construct(public mixed $value) {}

    /**
     * Wrap a successful value in an Ok result.
     */
    public static function of(mixed $value): self
    {
        return new self($value);
    }
}

readonly class Err
{
    private function __construct(public string $error) {}

    /**
     * Wrap an error message in an Err result.
     */
    public static function of(string $error): self
    {
        return new self($error);
    }
}
