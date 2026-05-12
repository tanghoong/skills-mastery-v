/**
 * Chapter 20 — Dependency Injection
 *
 * Run: tsx exercises/chapter_20.ts
 */

// =============================================================================
// EXERCISE 1 — Injection token
// =============================================================================
// TODO: Implement `InjectionToken<T>` class:
//       - Constructor: (description: string)
//       - Property: description (string)
//       - toString(): string → "InjectionToken(description)"

export class InjectionToken<T> {
  constructor(public readonly description: string) {}

  toString(): string {
    // TODO
    return "";
  }
}

// =============================================================================
// EXERCISE 2 — Simple DI container
// =============================================================================
// TODO: Implement `Container` class:
//       - registerValue<T>(token: InjectionToken<T>, value: T): void
//       - registerFactory<T>(token: InjectionToken<T>, factory: () => T): void
//       - registerSingleton<T>(token: InjectionToken<T>, factory: () => T): void
//         (creates instance once on first resolve, caches it)
//       - resolve<T>(token: InjectionToken<T>): T
//         (throws Error if not registered)
//       - has(token: InjectionToken<unknown>): boolean
//       - clear(): void

export class Container {
  private values    = new Map<string, unknown>();
  private factories = new Map<string, () => unknown>();
  private singletons = new Map<string, unknown>();
  private singletonFactories = new Map<string, () => unknown>();

  registerValue<T>(token: InjectionToken<T>, value: T): void {
    // TODO
  }

  registerFactory<T>(token: InjectionToken<T>, factory: () => T): void {
    // TODO
  }

  registerSingleton<T>(token: InjectionToken<T>, factory: () => T): void {
    // TODO
  }

  resolve<T>(token: InjectionToken<T>): T {
    // TODO: check singletons first, then values, then factories
    // If singleton factory: create once and cache
    throw new Error(`No provider for: ${token.description}`);
  }

  has(token: InjectionToken<unknown>): boolean {
    // TODO
    return false;
  }

  clear(): void {
    // TODO
  }
}

// =============================================================================
// EXERCISE 3 — Service with dependencies
// =============================================================================
// TODO: Define `Logger` interface: { info(msg: string): void; error(msg: string): void }
// TODO: Define `Cache` interface: { get(key: string): string | null; set(key: string, value: string): void }
//
// TODO: Implement `UserService` class:
//       - Constructor: (private logger: Logger, private cache: Cache)
//       - getUser(id: number): { id: number; name: string } | null
//         1. Check cache for key "user:{id}" (parse JSON if found)
//         2. If miss: log "Cache miss for user {id}", return a mock user { id, name: "User ${id}" }
//            and store in cache
//         3. Log "Cache hit for user {id}" on hit

export interface Logger {
  // TODO
}

export interface Cache {
  // TODO
}

export class UserService {
  constructor(private logger: Logger, private cache: Cache) {}

  getUser(id: number): { id: number; name: string } | null {
    // TODO
    return null;
  }
}

// =============================================================================
// EXERCISE 4 — Token-based container usage
// =============================================================================
// TODO: Define tokens for Logger and Cache
// TODO: Implement `buildContainer(): Container`
//       Registers a mock logger (logs to an array) and an in-memory cache (Map-based)
//       Registers UserService as a singleton (constructed using Logger + Cache from container)
//       Returns the container

export const LOGGER_TOKEN = new InjectionToken<Logger>("Logger");
export const CACHE_TOKEN  = new InjectionToken<Cache>("Cache");
export const USER_SERVICE_TOKEN = new InjectionToken<UserService>("UserService");

export function buildContainer(): Container {
  const container = new Container();

  // TODO: register mock logger, mock cache, and UserService singleton
  // Mock logger: implements Logger interface, stores messages in an array
  // Mock cache: implements Cache interface, uses a Map internally

  return container;
}

// =============================================================================
// EXERCISE 5 — Override in tests
// =============================================================================
// TODO: Implement `buildTestContainer(overrides?: { logger?: Logger; cache?: Cache }): Container`
//       Same as buildContainer but accepts overrides for testing

export function buildTestContainer(overrides: { logger?: Logger; cache?: Cache } = {}): Container {
  const container = buildContainer();

  // TODO: if overrides.logger, re-register with the provided logger
  // TODO: if overrides.cache, re-register with the provided cache

  return container;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — InjectionToken
  const token = new InjectionToken<string>("MyService");
  console.assert(token.description === "MyService",              "Ex1: description");
  console.assert(token.toString() === "InjectionToken(MyService)", "Ex1: toString");

  // Exercise 2 — Container
  const container = new Container();
  const strToken  = new InjectionToken<string>("Greeting");
  const numToken  = new InjectionToken<number>("Counter");
  const objToken  = new InjectionToken<{ count: number }>("State");

  container.registerValue(strToken, "Hello");
  console.assert(container.resolve(strToken) === "Hello", "Ex2: resolve value");
  console.assert(container.has(strToken) === true,        "Ex2: has registered token");

  container.registerFactory(numToken, () => Math.random());
  const n1 = container.resolve(numToken);
  const n2 = container.resolve(numToken);
  console.assert(n1 !== n2, "Ex2: factory creates new instance each time");

  let singletonCount = 0;
  container.registerSingleton(objToken, () => { singletonCount++; return { count: singletonCount }; });
  const s1 = container.resolve(objToken);
  const s2 = container.resolve(objToken);
  console.assert(s1 === s2,           "Ex2: singleton returns same instance");
  console.assert(singletonCount === 1, "Ex2: factory called only once");

  let threw = false;
  try { container.resolve(new InjectionToken("Unregistered")); } catch { threw = true; }
  console.assert(threw, "Ex2: resolving unregistered token should throw");

  container.clear();
  console.assert(!container.has(strToken), "Ex2: clear removes all registrations");

  // Exercise 3 — UserService
  const logs: string[] = [];
  const cacheStore = new Map<string, string>();

  const mockLogger: Logger = {
    info:  (msg) => logs.push(`INFO: ${msg}`),
    error: (msg) => logs.push(`ERROR: ${msg}`),
  };
  const mockCache: Cache = {
    get:   (key) => cacheStore.get(key) ?? null,
    set:   (key, val) => { cacheStore.set(key, val); },
  };

  const svc = new UserService(mockLogger, mockCache);

  const user1 = svc.getUser(1);
  console.assert(user1?.id === 1,               "Ex3: user id should be 1");
  console.assert(logs.some((l) => l.includes("miss") || l.includes("Miss")), "Ex3: cache miss logged");

  const user1Cached = svc.getUser(1);
  console.assert(user1Cached?.id === 1,          "Ex3: cached user returned");
  console.assert(logs.some((l) => l.includes("hit") || l.includes("Hit")), "Ex3: cache hit logged");

  // Exercise 4 — buildContainer
  const c = buildContainer();
  console.assert(c.has(USER_SERVICE_TOKEN),      "Ex4: UserService registered");
  const us = c.resolve(USER_SERVICE_TOKEN);
  console.assert(us instanceof UserService,      "Ex4: resolves to UserService instance");

  const us2 = c.resolve(USER_SERVICE_TOKEN);
  console.assert(us === us2,                     "Ex4: UserService is singleton");

  console.log("Chapter 20 verification complete ✓");
}

verify();
