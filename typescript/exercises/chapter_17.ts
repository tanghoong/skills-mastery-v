// ============================================================
// Chapter 17 — Structural Typing & Type Compatibility
// Run: tsx exercises/chapter_17.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Structural compatibility
// Given the three interfaces below, answer (in comments) which
// assignments TypeScript allows and why.
// Then actually write the assignments to confirm.
// ----------------------------------------------------------------

interface Point2D { x: number; y: number; }
interface Point3D { x: number; y: number; z: number; }
interface NamedPoint { x: number; y: number; label: string; }

const p2: Point2D = { x: 1, y: 2 };
const p3: Point3D = { x: 1, y: 2, z: 3 };
const pn: NamedPoint = { x: 1, y: 2, label: "A" };

// TODO: Try each assignment below and add a comment: "OK" or "ERROR: reason"
// let a: Point2D = p3;    // ?
// let b: Point3D = p2;    // ?
// let c: Point2D = pn;    // ?
// let d: NamedPoint = p2; // ?


// ----------------------------------------------------------------
// Exercise 2: Excess property checking
// Explain the difference between these two assignments (in a comment)
// and demonstrate it with actual code.
// ----------------------------------------------------------------

interface Options { timeout: number; retries: number; }

// TODO: show one case where excess property checking fires (direct literal)
// and one where it does NOT fire (via variable). Add explanatory comments.


// ----------------------------------------------------------------
// Exercise 3: Function compatibility — covariance & contravariance
// a) Show that a function returning a "wider" type is NOT assignable
//    to one that returns a "narrower" type.
// b) Show that a function accepting a "broader" parameter type IS
//    assignable to one that accepts a narrower type.
// Write each case with a comment explaining why it is or isn't allowed.
// ----------------------------------------------------------------

type ReturnsAnimal  = () => { name: string };
type ReturnsDog     = () => { name: string; breed: string };

type TakesAnimal    = (a: { name: string }) => void;
type TakesDog       = (d: { name: string; breed: string }) => void;

// TODO: write and comment the assignments:
// let ra: ReturnsAnimal = ((): ReturnsDog => ({ name: "Rex", breed: "Lab" })); // ?
// let rb: ReturnsDog    = ((): ReturnsAnimal => ({ name: "Rex" }));            // ?
// let ta: TakesAnimal   = (d: TakesDog) => {};   // ?
// let tb: TakesDog      = (a: TakesAnimal) => {}; // ?


// ----------------------------------------------------------------
// Exercise 4: `as const` to derive union types
// a) Define a PAYMENT_METHODS array using `as const`
// b) Derive a PaymentMethod union type from it
// c) Write a function processPayment(method: PaymentMethod): string
//    that handles every method in a switch
// d) Show that passing an unlisted string causes a TypeScript error
// ----------------------------------------------------------------

// TODO: implement PAYMENT_METHODS, PaymentMethod, processPayment

// console.log(processPayment("credit_card")); // "Processing credit card payment"
// processPayment("bitcoin");                  // TypeScript ERROR


// ----------------------------------------------------------------
// Exercise 5: unknown vs any vs never
// Fill in the blanks with the correct type (unknown, any, or never)
// and explain your choice in a comment.
// ----------------------------------------------------------------

// a) A function that is guaranteed to throw and never returns:
function alwaysThrows(msg: string): /* ??? */ {
    throw new Error(msg);
}

// b) A variable that could be any type from an external API, but you
//    want to force type-checking before using it:
let apiResponse: /* ??? */ = fetch("/api/data");

// c) The catch clause error variable type in strict TypeScript:
try {
    JSON.parse("bad");
} catch (err /* : ??? */) {
    // what type is err?
}

// TODO: replace each /* ??? */ with the correct type and add a comment explaining why
