# Chapter 25 — Animations with Framer Motion

## Learning Objectives

By the end of this chapter you will be able to:
- Use `motion` components with typed `animate`, `initial`, and `exit` props
- Define typed `Variants` objects for reusable animations
- Use `AnimatePresence` to animate components as they unmount
- Use `MotionValue<T>` with `useMotionValue` and `useTransform`

---

## 25.1 Setup

```bash
npm install framer-motion
```

---

## 25.2 `motion` Components — Basic Typing

Every HTML element has a `motion` counterpart. Props like `animate`, `initial`, `exit`, and `transition` are typed:

```tsx
import { motion } from "framer-motion";

// animate accepts TargetAndTransition — CSS properties with number or string values
function FadeInCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

TypeScript errors on invalid CSS property names or bad value types:
```tsx
<motion.div
  animate={{ opcity: 1 }}   // Error: 'opcity' is not a valid CSS property
  animate={{ opacity: "1" }} // Works — framer accepts string numbers
  animate={{ opacity: 1 }}   // Works — preferred
/>
```

---

## 25.3 `Variants` — Typed Reusable Animations

```typescript
import type { Variants } from "framer-motion";

// Typed variant map — keys are arbitrary names
export const fadeIn: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export const slideIn: Variants = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export const staggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,  // each child animates 100ms after the previous
      delayChildren: 0.2,
    },
  },
};
```

Usage:
```tsx
function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {projects.map((p) => (
        <motion.li key={p.id} variants={fadeIn}>
          <ProjectCard project={p} />
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

When a parent has `variants`, children that reference the same variant keys automatically inherit the `initial` and `animate` propagation.

---

## 25.4 `AnimatePresence` — Exit Animations

`AnimatePresence` tracks when children mount and unmount, enabling `exit` animations:

```tsx
import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
  message: string;
  id: string;
  onClose: (id: string) => void;
}

function Toast({ message, id, onClose }: ToastProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <p>{message}</p>
      <button onClick={() => onClose(id)}>✕</button>
    </motion.div>
  );
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const { removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
```

`AnimatePresence` requires each child to have a unique `key` — this is how it tracks which component unmounted.

---

## 25.5 Page Transitions

```tsx
// src/components/PageTransition.tsx
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

interface PageTransitionProps {
  children: React.ReactNode;
  key: string; // passed by parent for AnimatePresence tracking
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

// App.tsx — wrap each route's content
<AnimatePresence mode="wait">
  <Routes location={location} key={location.pathname}>
    <Route path="/:username" element={
      <PageTransition key="profile">
        <PublicProfile />
      </PageTransition>
    } />
  </Routes>
</AnimatePresence>
```

---

## 25.6 `MotionValue<T>` — Scroll-Linked Animations

```tsx
import { motion, useMotionValue, useTransform, useScroll } from "framer-motion";

function ParallaxHero() {
  const { scrollY } = useScroll();
  // MotionValue<number> — tracks scroll position

  // Transform scroll range [0, 300] to opacity range [1, 0]
  const opacity  = useTransform<number, number>(scrollY, [0, 300], [1, 0]);
  const yOffset  = useTransform<number, number>(scrollY, [0, 300], [0, 100]);

  return (
    <motion.section style={{ opacity, y: yOffset }}>
      <h1>DevLink</h1>
      <p>Your developer portfolio, typed.</p>
    </motion.section>
  );
}
```

`useTransform<Input, Output>` is generic. TypeScript infers the types from the input and output arrays.

---

## 25.7 `useAnimation` — Programmatic Control

```tsx
import { motion, useAnimation } from "framer-motion";

function ShakeOnError({ hasError, children }: { hasError: boolean; children: React.ReactNode }) {
  const controls = useAnimation();

  useEffect(() => {
    if (hasError) {
      controls.start({
        x: [0, -8, 8, -8, 8, 0],
        transition: { duration: 0.4 },
      });
    }
  }, [hasError, controls]);

  return <motion.div animate={controls}>{children}</motion.div>;
}
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| `Variants` type | Always type variant objects — prevents typos in variant names |
| `AnimatePresence` | Requires unique `key` on children — tracks mounts/unmounts |
| `mode="wait"` | Waits for exit animation before entering next — for page transitions |
| `mode="popLayout"` | Smooth reflow when list items are removed — for toasts, lists |
| `MotionValue<T>` | Type the input and output of `useTransform` explicitly |
| `layout` prop | Smooth positional transitions when element moves — add to list items |
