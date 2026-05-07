// ============================================================
// Chapter 2 — Interfaces & Type Aliases
// Run: tsx exercises/chapter_02.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Define an interface
// Create an interface `Book` with:
//   - id: number
//   - title: string
//   - author: string
//   - year: number
//   - genre?: string  (optional)
// Then create two Book objects and store them in an array.
// ----------------------------------------------------------------

// TODO: define Book interface and create the array


// ----------------------------------------------------------------
// Exercise 2: Extend an interface
// Create an interface `EBook` that extends `Book` and adds:
//   - fileSize: number  (in MB)
//   - format: "pdf" | "epub" | "mobi"
// Create one EBook object.
// ----------------------------------------------------------------

// TODO: define EBook and create an object


// ----------------------------------------------------------------
// Exercise 3: Type alias with union
// Create a type `BookId` that can be either string or number.
// Create a function `findBook(id: BookId, books: Book[]): Book | undefined`
// that finds a book by id. (Hint: use == not === for loose comparison)
// ----------------------------------------------------------------

// TODO: define BookId type and findBook function


// ----------------------------------------------------------------
// Exercise 4: Intersection type
// Create a type alias `Author` with { name: string; country: string }
// Create a type alias `Publisher` with { company: string; founded: number }
// Create an intersection type `PublishedAuthor = Author & Publisher`
// Create one PublishedAuthor object.
// ----------------------------------------------------------------

// TODO: define the types and object


// ----------------------------------------------------------------
// Exercise 5: Interface vs Type — nested structure
// Model a library system with separated, reusable interfaces:
//   Address: { street, city, country }
//   Library:  { name, address: Address, books: Book[], memberCount: number }
// Create one Library object.
// ----------------------------------------------------------------

// TODO: define Address, Library, and create the object

// Expected — print the library name and city:
// console.log(`${library.name} is in ${library.address.city}`);
