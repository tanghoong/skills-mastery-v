# Chapter 18: React + TypeScript (Hour 18)

React and TypeScript are the most common pairing in modern frontend development. This chapter covers every pattern you will encounter when building real React applications with full type safety.

## 1. Typing Component Props

Props are typed using an `interface` or `type`. By convention, name it `Props` or `ComponentNameProps`.

```typescript
interface ButtonProps {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger"; // optional with union
    disabled?: boolean;
}

function Button({ label, onClick, variant = "primary", disabled = false }: ButtonProps) {
    return (
        <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>
            {label}
        </button>
    );
}

// Usage — TypeScript checks every prop
<Button label="Submit" onClick={() => console.log("clicked")} />
<Button label="Delete" onClick={handleDelete} variant="danger" />
// <Button onClick={handleDelete} /> // Error: 'label' is required
```

## 2. Children Props

```typescript
import { ReactNode, PropsWithChildren } from "react";

// Option 1: explicit children
interface CardProps {
    title: string;
    children: ReactNode; // anything React can render
}

// Option 2: PropsWithChildren helper (shorter)
type CardProps = PropsWithChildren<{ title: string }>;

function Card({ title, children }: CardProps) {
    return (
        <div className="card">
            <h2>{title}</h2>
            <div>{children}</div>
        </div>
    );
}
```

## 3. Typing useState

TypeScript infers the type from the initial value. For complex or nullable state, provide the generic explicitly.

```typescript
import { useState } from "react";

interface User {
    id: number;
    name: string;
    email: string;
}

function UserProfile() {
    // Inferred as number
    const [count, setCount] = useState(0);

    // Inferred as string
    const [name, setName] = useState("");

    // Must provide generic — initial value is null but state will be User
    const [user, setUser] = useState<User | null>(null);

    // Array state
    const [items, setItems] = useState<string[]>([]);

    const loadUser = async () => {
        const data = await fetch("/api/user").then(r => r.json());
        setUser(data); // TypeScript ensures data matches User
    };

    return <div>{user?.name ?? "Loading..."}</div>;
}
```

## 4. Typing useRef

```typescript
import { useRef, useEffect } from "react";

function TextInput() {
    // Ref to a DOM element — initial value must be null
    const inputRef = useRef<HTMLInputElement>(null);

    // Ref as a mutable container (not a DOM element)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        inputRef.current?.focus(); // optional chaining because it starts null
    }, []);

    const startTimer = () => {
        timerRef.current = setTimeout(() => console.log("done"), 1000);
    };

    return <input ref={inputRef} type="text" />;
}
```

## 5. Typing Event Handlers

React provides specific event types for every DOM event.

```typescript
import { ChangeEvent, FormEvent, MouseEvent, KeyboardEvent } from "react";

function Form() {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value); // string
    };

    const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
        console.log(e.target.value);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // form submission logic
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") console.log("Enter pressed");
    };

    return (
        <form onSubmit={handleSubmit}>
            <input onChange={handleChange} onKeyDown={handleKeyDown} />
            <button type="submit">Submit</button>
        </form>
    );
}
```

## 6. Typing useContext

```typescript
import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextValue {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

// createContext requires a default value — use null + a guard hook
const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    const login = async (email: string, password: string) => {
        const data = await fetch("/api/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }).then(r => r.json());
        setUser(data);
    };

    const logout = () => setUser(null);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook that guarantees the context exists
function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

// Usage
function Header() {
    const { user, logout } = useAuth();
    return <div>{user ? <button onClick={logout}>Logout</button> : "Not logged in"}</div>;
}
```

## 7. Generic Components

Components can be generic too — useful for reusable lists, tables, and selects.

```typescript
interface SelectProps<T> {
    options: T[];
    value: T | null;
    onChange: (value: T) => void;
    getLabel: (option: T) => string;
}

function Select<T>({ options, value, onChange, getLabel }: SelectProps<T>) {
    return (
        <select
            value={options.indexOf(value as T)}
            onChange={e => onChange(options[Number(e.target.value)])}
        >
            {options.map((option, i) => (
                <option key={i} value={i}>{getLabel(option)}</option>
            ))}
        </select>
    );
}

// Usage — T is inferred as User
<Select
    options={users}
    value={selectedUser}
    onChange={setSelectedUser}
    getLabel={u => u.name}
/>
```

## 8. forwardRef

When a parent needs access to a child's DOM element, use `forwardRef` with explicit typing.

```typescript
import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, ...rest }, ref) => (
        <div>
            <label>{label}</label>
            <input ref={ref} {...rest} />
        </div>
    )
);

// Usage
const inputRef = useRef<HTMLInputElement>(null);
<Input ref={inputRef} label="Email" type="email" />
```

## Action Item for Hour 18:

- Build a typed `useLocalStorage<T>(key: string, initialValue: T)` custom hook that reads/writes to `localStorage` with full type safety.
- Create a generic `DataTable<T>` component that accepts `data: T[]` and `columns: { key: keyof T; header: string }[]` and renders a typed table.
