# Chapter 4 — Events & Forms

## Learning Objectives

By the end of this chapter you will be able to:
- Type every common React event handler without using `any`
- Build fully typed controlled form components
- Handle form submission with typed `FormEvent`
- Extract reusable typed event handler types

---

## 4.1 The React Event Type System

React wraps native DOM events in synthetic event objects. Each has a typed generic: `React.SyntheticEvent<Element>`. More specific subtypes exist for each event category.

| Event Type | Generic | Common Use |
|-----------|---------|-----------|
| `React.ChangeEvent<T>` | HTML element | `<input>`, `<select>`, `<textarea>` |
| `React.FormEvent<T>` | HTML element | `<form>` submit |
| `React.MouseEvent<T>` | HTML element | `onClick`, `onMouseEnter` |
| `React.KeyboardEvent<T>` | HTML element | `onKeyDown`, `onKeyUp` |
| `React.FocusEvent<T>` | HTML element | `onFocus`, `onBlur` |
| `React.DragEvent<T>` | HTML element | Drag-and-drop |
| `React.ClipboardEvent<T>` | HTML element | Copy, paste |

---

## 4.2 `ChangeEvent` — Inputs, Selects, Textareas

```tsx
// Input
const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value: string = e.target.value;
  setName(value);
};

// Checkbox
const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
  const checked: boolean = e.target.checked;
  setIsPublic(checked);
};

// Select
const handlePlatform = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const value = e.target.value as SocialPlatform; // narrow to known union
  setPlatform(value);
};

// Textarea
const handleBio = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setBio(e.target.value);
};
```

The element type in the generic (`HTMLInputElement`, `HTMLSelectElement`, etc.) determines what properties are available on `e.target`.

---

## 4.3 `FormEvent` — Typed Form Submission

```tsx
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault(); // typed — HTMLFormElement has this method
  // process form data from state
};

return <form onSubmit={handleSubmit}>...</form>;
```

---

## 4.4 `MouseEvent` — Click Handlers

```tsx
// Button click
const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation(); // prevent event bubbling
  onDelete(id);
};

// Div click with dataset
const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const id = e.currentTarget.dataset.id; // string | undefined
  if (id) navigate(`/project/${id}`);
};
```

---

## 4.5 `KeyboardEvent` — Keyboard Handlers

```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    onSubmit();
  }
  if (e.key === "Escape") {
    onCancel();
  }
  // e.ctrlKey, e.shiftKey, e.altKey are all booleans
};
```

---

## 4.6 Extracting Reusable Handler Types

React exports handler types you can use in props interfaces:

```tsx
import type { ChangeEventHandler, MouseEventHandler, KeyboardEventHandler } from "react";

interface SearchInputProps {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onClear: MouseEventHandler<HTMLButtonElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}

function SearchInput({ value, onChange, onClear, onKeyDown }: SearchInputProps) {
  return (
    <div>
      <input value={value} onChange={onChange} onKeyDown={onKeyDown} />
      <button onClick={onClear}>✕</button>
    </div>
  );
}
```

`ChangeEventHandler<HTMLInputElement>` is equivalent to `(e: React.ChangeEvent<HTMLInputElement>) => void` but is cleaner in prop type definitions.

---

## 4.7 Fully Typed Controlled Form

```tsx
import { useState } from "react";

interface LinkFormData {
  platform: "github" | "twitter" | "linkedin" | "website";
  url: string;
  label: string;
}

interface LinkFormProps {
  onSubmit: (data: LinkFormData) => void;
}

function LinkForm({ onSubmit }: LinkFormProps) {
  const [form, setForm] = useState<LinkFormData>({
    platform: "github",
    url: "",
    label: "",
  });

  const handleField =
    (field: keyof LinkFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={form.platform}
        onChange={handleField("platform") as React.ChangeEventHandler<HTMLSelectElement>}
      >
        <option value="github">GitHub</option>
        <option value="twitter">Twitter</option>
        <option value="linkedin">LinkedIn</option>
        <option value="website">Website</option>
      </select>

      <input
        type="url"
        value={form.url}
        onChange={handleField("url") as React.ChangeEventHandler<HTMLInputElement>}
        placeholder="https://..."
      />

      <input
        type="text"
        value={form.label}
        onChange={handleField("label") as React.ChangeEventHandler<HTMLInputElement>}
        placeholder="Display label"
      />

      <button type="submit">Add Link</button>
    </form>
  );
}
```

---

## 4.8 Uncontrolled Forms with `useRef`

For simple read-once cases, `useRef` avoids re-renders on every keystroke:

```tsx
function SimpleLoginForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";
    login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={emailRef} type="email" />
      <input ref={passwordRef} type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

Use controlled forms (state) when you need real-time validation or the field values affect rendering. Use uncontrolled (refs) for read-once-on-submit forms.

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| Input change | `React.ChangeEvent<HTMLInputElement>` |
| Form submit | `React.FormEvent<HTMLFormElement>` + `e.preventDefault()` |
| Button click | `React.MouseEvent<HTMLButtonElement>` |
| Keyboard | `React.KeyboardEvent<HTMLInputElement>` — use `e.key` not `e.keyCode` |
| Prop types | Use `ChangeEventHandler<T>` shorthand in props interfaces |
| Controlled vs uncontrolled | State for real-time validation, refs for read-once submit |
