# Chapter 9 — Forms: React Hook Form + Zod

## Learning Objectives

By the end of this chapter you will be able to:
- Derive form types directly from Zod schemas with `z.infer<>`
- Wire `zodResolver` to `useForm` for automatic validation
- Type `useForm<T>`, `register`, `handleSubmit`, and `formState`
- Build reusable typed form field components
- Handle server-side validation errors in the form

---

## 9.1 Why React Hook Form + Zod

React Hook Form avoids the re-render-on-every-keystroke problem of controlled forms. Zod provides runtime validation with TypeScript types derived from the same schema. Together they give end-to-end form type safety with minimal boilerplate.

```bash
npm install react-hook-form zod @hookform/resolvers
```

---

## 9.2 Define the Schema First

The schema is the source of truth — types flow from it:

```typescript
// src/features/projects/projectSchema.ts
import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(80, "Max 80 characters"),
  description: z.string().min(1, "Description is required").max(500),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  repoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.array(z.string()).max(10, "Max 10 tags"),
  featured: z.boolean(),
});

// Derive the TypeScript type — no duplicate interface needed
export type ProjectFormData = z.infer<typeof projectSchema>;
// Equivalent to:
// interface ProjectFormData {
//   title: string;
//   description: string;
//   url?: string | undefined;
//   ...
// }
```

---

## 9.3 `useForm<T>` with `zodResolver`

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, type ProjectFormData } from "./projectSchema";

function ProjectForm({ onSubmit }: { onSubmit: (data: ProjectFormData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      repoUrl: "",
      tags: [],
      featured: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register("title")} placeholder="Project title" />
        {errors.title && <p role="alert">{errors.title.message}</p>}
      </div>

      <div>
        <textarea {...register("description")} placeholder="Description" />
        {errors.description && <p role="alert">{errors.description.message}</p>}
      </div>

      <div>
        <input {...register("url")} type="url" placeholder="https://..." />
        {errors.url && <p role="alert">{errors.url.message}</p>}
      </div>

      <label>
        <input {...register("featured")} type="checkbox" />
        Featured project
      </label>

      <button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving…" : "Save"}
      </button>

      <button type="button" onClick={() => reset()}>
        Reset
      </button>
    </form>
  );
}
```

`handleSubmit(onSubmit)` only calls `onSubmit` if all Zod validations pass. `data` is typed as `ProjectFormData` — zero `any`.

---

## 9.4 `Controller` for Custom Inputs

When a form field isn't a native input (date pickers, multi-select, rich text), use `Controller`:

```tsx
import { Controller } from "react-hook-form";

function TagsField({ control }: { control: Control<ProjectFormData> }) {
  return (
    <Controller
      name="tags"       // keyof ProjectFormData — TypeScript checks this
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <TagsInput
            value={field.value}        // string[] — correctly typed
            onChange={field.onChange}  // (v: string[]) => void
            onBlur={field.onBlur}
          />
          {fieldState.error && <p role="alert">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}
```

---

## 9.5 Reusable Typed Field Component

```tsx
import type { UseFormRegister, FieldError, Path, FieldValues } from "react-hook-form";

interface TextFieldProps<T extends FieldValues> {
  name: Path<T>;                  // keyof T — but safe for nested paths
  register: UseFormRegister<T>;
  label: string;
  error?: FieldError;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
}

function TextField<T extends FieldValues>({
  name,
  register,
  label,
  error,
  type = "text",
  placeholder,
}: TextFieldProps<T>) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
```

Usage:
```tsx
<TextField<ProjectFormData>
  name="title"
  label="Project Title"
  register={register}
  error={errors.title}
/>
```

---

## 9.6 Server Validation Errors with `setError`

When the server rejects a submission, map server errors back into the form:

```tsx
const { setError } = useForm<ProjectFormData>({ ... });

const handleSubmit = async (data: ProjectFormData) => {
  try {
    await api.createProject(data);
  } catch (e) {
    if (e instanceof ApiValidationError) {
      // Map field errors from server response
      e.fields.forEach(({ field, message }) => {
        setError(field as Path<ProjectFormData>, { message });
      });
    } else {
      // Non-field error — set on a root key
      setError("root.serverError", { message: "Server error. Try again." });
    }
  }
};
```

---

## 9.7 `FormProvider` for Deep Component Trees

When the form has many levels of nesting, pass `methods` via context instead of prop-drilling:

```tsx
import { FormProvider, useFormContext } from "react-hook-form";

function ProjectFormPage() {
  const methods = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <BasicInfoSection />
        <LinksSection />
        <TagsSection />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}

// Deep child — no prop drilling needed
function BasicInfoSection() {
  const { register, formState: { errors } } = useFormContext<ProjectFormData>();
  return <TextField name="title" register={register} error={errors.title} label="Title" />;
}
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| Schema first | Define Zod schema → derive `ProjectFormData` with `z.infer<>` |
| `useForm<T>` | Generic is `z.infer<typeof schema>` — matches `zodResolver` automatically |
| `register` | Typed by `T` — TypeScript errors if field name doesn't exist |
| `Controller` | For non-native inputs (date pickers, custom selects) |
| Server errors | `setError(fieldName, { message })` maps API errors back to fields |
| `FormProvider` | Use when form fields are in deeply nested components |
