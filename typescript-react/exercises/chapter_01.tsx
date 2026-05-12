/**
 * Chapter 1 — Setup & Tooling
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_01.tsx
 * Run:        tsx exercises/chapter_01.tsx
 *
 * These exercises model the DevLink configuration structure using TypeScript types.
 * No JSX or React imports needed — pure type and value exercises.
 */

// =============================================================================
// EXERCISE 1 — Type the Node environment
// =============================================================================
// TODO: Define a union type `NodeEnv` for: "development", "production", "test"

type NodeEnv = never; // replace with the union

// =============================================================================
// EXERCISE 2 — Vite environment interface
// =============================================================================
// TODO: Define an interface `ViteEnv` with:
//   - VITE_API_URL:        string  (required)
//   - VITE_APP_NAME:       string  (required)
//   - VITE_ENABLE_AI_BIO:  string  (required, "true" | "false")
//   - VITE_ANTHROPIC_KEY:  string  (optional)
//   - MODE:                NodeEnv (built-in Vite variable)
//   - DEV:                 boolean
//   - PROD:                boolean

interface ViteEnv {
  // TODO
}

// =============================================================================
// EXERCISE 3 — Build the tsconfig compiler options shape
// =============================================================================
// TODO: Define an interface `TsCompilerOptions` with (all optional):
//   - target:           string
//   - lib:              string[]
//   - module:           string
//   - moduleResolution: string
//   - jsx:              "react-jsx" | "react" | "preserve"
//   - strict:           boolean
//   - noEmit:           boolean
//   - baseUrl:          string
//   - paths:            Record<string, string[]>

interface TsCompilerOptions {
  // TODO
}

// =============================================================================
// EXERCISE 4 — Model a tsconfig.json structure
// =============================================================================
// TODO: Define interface `TsConfig` with:
//   - compilerOptions: TsCompilerOptions
//   - include:         string[]  (optional)
//   - exclude:         string[]  (optional)

interface TsConfig {
  // TODO
}

// =============================================================================
// EXERCISE 5 — Build a valid DevLink tsconfig
// =============================================================================
// TODO: Create a const `devlinkTsConfig` of type `TsConfig` matching:
//   target: "ES2022", lib: ["ES2022", "DOM", "DOM.Iterable"]
//   module: "ESNext", moduleResolution: "Bundler"
//   jsx: "react-jsx", strict: true, noEmit: true
//   baseUrl: ".", paths: { "@/*": ["./src/*"] }
//   include: ["src"], exclude: ["node_modules", "dist"]

const devlinkTsConfig: TsConfig = {} as TsConfig; // replace with real value

// =============================================================================
// EXERCISE 6 — Model a Vite script entry
// =============================================================================
// TODO: Define a union type `ViteCommand` for: "dev", "build", "preview"
// TODO: Define interface `ViteScript` with:
//   - command:  ViteCommand
//   - outDir?:  string
//   - port?:    number

type ViteCommand = never; // replace

interface ViteScript {
  // TODO
}

// =============================================================================
// EXERCISE 7 — Project structure paths
// =============================================================================
// TODO: Define a union type `DevLinkDir` for the core source directories:
//   "components", "features", "hooks", "lib", "stores", "types"
// TODO: Write a function `toSrcPath` that takes a `DevLinkDir` and
//       returns a string in the format "src/<dir>" (e.g. "src/components")

type DevLinkDir = never; // replace

function toSrcPath(dir: DevLinkDir): string {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 8 — Environment variable parsing
// =============================================================================
// TODO: Write a function `parseEnableBio` that takes a string and returns
//       a boolean: true only when the string is exactly "true"

function parseEnableBio(raw: string): boolean {
  // TODO
  return false;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 5 — tsconfig shape
  console.assert(devlinkTsConfig.compilerOptions.strict === true,  "Ex5: strict should be true");
  console.assert(devlinkTsConfig.compilerOptions.noEmit === true,  "Ex5: noEmit should be true");
  console.assert(devlinkTsConfig.compilerOptions.jsx === "react-jsx", "Ex5: jsx should be react-jsx");
  console.assert(devlinkTsConfig.include?.includes("src") === true, "Ex5: include should contain 'src'");

  // Exercise 7 — path helper
  console.assert(toSrcPath("components") === "src/components", "Ex7: should return 'src/components'");
  console.assert(toSrcPath("hooks")      === "src/hooks",      "Ex7: should return 'src/hooks'");
  console.assert(toSrcPath("stores")     === "src/stores",     "Ex7: should return 'src/stores'");

  // Exercise 8 — bool parsing
  console.assert(parseEnableBio("true")  === true,  "Ex8: 'true' should parse to true");
  console.assert(parseEnableBio("false") === false, "Ex8: 'false' should parse to false");
  console.assert(parseEnableBio("1")     === false, "Ex8: '1' should parse to false (not 'true')");
  console.assert(parseEnableBio("")      === false, "Ex8: '' should parse to false");

  console.log("Chapter 1 verification complete ✓");
}

verify();
