# Chapter 3: Functions, Arrays & Tuples (Hour 3)

Now we will look at how to type functions, collections of data, and structured arrays.

## 1. Typing Functions
You can type the parameters and the return value of a function.
```typescript
// Function declaration
function add(x: number, y: number): number {
  return x + y;
}

// Arrow function
const multiply = (x: number, y: number): number => {
  return x * y;
};

// Void return type (returns nothing)
function logMessage(msg: string): void {
  console.log(msg);
}
```

## 2. Optional and Default Parameters
```typescript
function greet(name: string, greeting: string = "Hello", title?: string): string {
  if (title) {
    return `${greeting}, ${title} ${name}`;
  }
  return `${greeting}, ${name}`;
}
```

## 3. Arrays
Arrays can be typed in two ways:
```typescript
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ["apple", "banana"];

// Array of custom objects
interface Task { title: string; completed: boolean }
let tasks: Task[] = [{ title: "Learn TS", completed: false }];
```

## 4. Tuples
Tuples are arrays with a fixed number of elements whose types are known.
```typescript
// A tuple representing an [x, y] coordinate
let coordinate: [number, number] = [10, 20];

// A tuple representing a status code and message
let response: [number, string] = [200, "OK"];
// response[0] is number, response[1] is string
```

## Action Item for Hour 3:
- Write a function that takes an array of numbers and returns a tuple containing the `[min, max]` values. Strongly type all inputs and outputs.


function minmax(numbers: number[]): [number, number] {
  let min = numbers[0];
  let max = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] < min) {
      min = numbers[i];
    }
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }
  return [min, max];
}

let [min, max] = minmax([1, 2, 3, 4, 5]);
console.log(min, max);