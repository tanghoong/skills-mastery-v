// ============================================================
// Chapter 18 — React + TypeScript
// NOTE: These exercises require a React project.
// Create one with: npx create-react-app ch18 --template typescript
// Or with Vite:    npm create vite@latest ch18 -- --template react-ts
//
// Create each component in src/ and import it into App.tsx to test.
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Typed props — ProfileCard component
// Build a `ProfileCard` component that accepts:
//   name: string
//   role: string
//   avatarUrl?: string        (optional, show a placeholder if missing)
//   onFollow: () => void
//   isFollowing: boolean
//
// Render the name, role, a Follow/Unfollow button, and the avatar.
// ----------------------------------------------------------------

// TODO: create src/components/ProfileCard.tsx


// ----------------------------------------------------------------
// Exercise 2: useState with complex types
// Build a `ShoppingCart` component that:
//   - has local state: items: CartItem[] where CartItem = { id: number; name: string; qty: number; price: number }
//   - renders the list of items with quantity controls (+ / -)
//   - shows total price
//   - has an "Add item" button that adds a hardcoded test item
//   - has a "Remove" button per item
// Type every useState, event handler, and derived value.
// ----------------------------------------------------------------

// TODO: create src/components/ShoppingCart.tsx


// ----------------------------------------------------------------
// Exercise 3: useContext — ThemeContext
// Create a ThemeContext that provides:
//   theme: "light" | "dark"
//   toggleTheme: () => void
//
// Build:
//   a) ThemeProvider component that wraps children
//   b) useTheme() custom hook that throws if used outside provider
//   c) ThemeToggleButton component that uses the hook
//   d) ThemedBox component that changes its background based on theme
// ----------------------------------------------------------------

// TODO: create src/context/ThemeContext.tsx


// ----------------------------------------------------------------
// Exercise 4: Generic component — TypedSelect<T>
// Build a generic Select component:
//   interface SelectProps<T> {
//     options: T[]
//     value: T | null
//     onChange: (value: T) => void
//     getLabel: (option: T) => string
//     placeholder?: string
//   }
//
// Use it with both a string array and an array of objects.
// ----------------------------------------------------------------

// TODO: create src/components/TypedSelect.tsx


// ----------------------------------------------------------------
// Exercise 5: Custom hook — useLocalStorage<T>
// Build `useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]`
// that:
//   - reads from localStorage on mount (parse JSON, fallback to initialValue)
//   - writes to localStorage on every update
//   - returns [value, setValue] like useState
// Demonstrate it by persisting the shopping cart from Exercise 2.
// ----------------------------------------------------------------

// TODO: create src/hooks/useLocalStorage.ts
