/**
 * Chapter 2 — Component Typing
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_02.tsx
 *
 * These exercises define the typed prop interfaces and component signatures
 * for DevLink's core UI components. Components don't render — focus is on
 * getting types right.
 */

import type { ReactNode, ComponentPropsWithoutRef } from "react";

// =============================================================================
// EXERCISE 1 — Avatar props
// =============================================================================
// TODO: Define interface `AvatarProps` with:
//   - src:   string (optional)
//   - alt:   string
//   - size:  "sm" | "md" | "lg" (optional, default "md")
//   - No children — Avatars don't accept child content

interface AvatarProps {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Badge props
// =============================================================================
// TODO: Define interface `BadgeProps` with:
//   - variant: "default" | "success" | "warning" | "destructive" (optional)
//   - children: ReactNode

interface BadgeProps {
  // TODO
}

// =============================================================================
// EXERCISE 3 — Card props
// =============================================================================
// TODO: Define interface `CardProps` with:
//   - title:     string (optional — card may not have a title)
//   - children:  ReactNode
//   - className: string (optional — caller can add extra classes)
//   - featured:  boolean (optional)

interface CardProps {
  // TODO
}

// =============================================================================
// EXERCISE 4 — Button props extending HTML button
// =============================================================================
// TODO: Define interface `ButtonProps` that:
//   - Extends ComponentPropsWithoutRef<"button">
//   - Adds: variant?: "primary" | "secondary" | "ghost" | "danger"
//   - Adds: size?: "sm" | "md" | "lg"
//   - Adds: isLoading?: boolean

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  // TODO
}

// =============================================================================
// EXERCISE 5 — ProfileCard props
// =============================================================================
// TODO: Define interface `ProfileCardProps` with:
//   - name:        string  (required)
//   - username:    string  (required)
//   - bio?:        string
//   - avatarUrl?:  string
//   - location?:   string
//   - onFollow?:   () => void   (optional callback)

interface ProfileCardProps {
  // TODO
}

// =============================================================================
// EXERCISE 6 — SocialLink props
// =============================================================================
// TODO: Define type `SocialPlatform` as a union of:
//   "github" | "twitter" | "linkedin" | "youtube" | "website" | "other"
// TODO: Define interface `SocialLinkProps` with:
//   - platform: SocialPlatform
//   - url:      string
//   - label:    string
//   - icon?:    ReactNode

type SocialPlatform = never; // replace

interface SocialLinkProps {
  // TODO
}

// =============================================================================
// EXERCISE 7 — Component function signatures
// =============================================================================
// TODO: Write the function signatures (NOT the bodies — just the signature with
//       correct param destructuring and inferred return type) for:
//   - Avatar
//   - Badge
//   - Button (must accept and spread ...rest onto a <button>)

// TODO: function Avatar(props: AvatarProps): JSX.Element
// TODO: function Badge(props: BadgeProps): JSX.Element
// TODO: function Button({ variant, size, isLoading, children, ...rest }: ButtonProps): JSX.Element

// =============================================================================
// EXERCISE 8 — PropsWithChildren vs explicit children
// =============================================================================
// TODO: Using `PropsWithChildren` from react, define `PanelProps` that:
//   - has a required `title: string`
//   - has an optional `collapsible: boolean`
//   - includes `children` via `PropsWithChildren`
//   Compare this to explicitly writing `children: ReactNode` in the interface.

import type { PropsWithChildren } from "react";

type PanelProps = PropsWithChildren<{
  // TODO: add title and collapsible
}>;

// =============================================================================
// VERIFICATION — type-level checks (no runtime needed)
// =============================================================================

// These assignments should compile without errors when your types are correct

// Exercise 1
const avatarProps: AvatarProps = { alt: "Charlie" };
const avatarPropsWithSrc: AvatarProps = { src: "/photo.jpg", alt: "Charlie", size: "lg" };

// Exercise 2
const badgeProps: BadgeProps = { children: "Published" };
const badgeSuccess: BadgeProps = { variant: "success", children: "Live" };

// Exercise 3
const cardProps: CardProps = { children: "Content" };
const cardFeatured: CardProps = { title: "DevLink", featured: true, children: "Content" };

// Exercise 4 — ButtonProps should accept HTML button props via ComponentPropsWithoutRef
const buttonProps: ButtonProps = { children: "Save", type: "submit", onClick: () => {} };
const buttonVariant: ButtonProps = { children: "Delete", variant: "danger", size: "sm" };

// Exercise 5
const profileProps: ProfileCardProps = { name: "Charlie", username: "charlie" };
const profileFull: ProfileCardProps = {
  name: "Charlie Tang",
  username: "charlie",
  bio: "TypeScript enthusiast",
  avatarUrl: "/avatar.jpg",
  location: "Singapore",
  onFollow: () => console.log("followed"),
};

// Exercise 6
const linkProps: SocialLinkProps = {
  platform: "github",
  url: "https://github.com/charlie",
  label: "GitHub",
};

console.log("Chapter 2 type checks passed ✓", {
  avatarProps,
  avatarPropsWithSrc,
  badgeProps,
  badgeSuccess,
  cardProps,
  cardFeatured,
  buttonProps,
  buttonVariant,
  profileProps,
  profileFull,
  linkProps,
});
