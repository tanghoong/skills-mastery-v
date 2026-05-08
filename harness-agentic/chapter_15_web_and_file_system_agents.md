# Chapter 15 — Web & File System Agents

## Learning Objectives

By the end of this chapter you will be able to:
- Build tools that make HTTP requests to external APIs
- Scrape and parse structured data from web pages
- Read and write files safely with path validation
- Apply rate limiting and caching to web-scraping tools
- Implement delivery carrier tracking as a real-world web agent use case

---

## 15.1 Web Tools — HTTP Requests

The simplest web tool makes an HTTP fetch call:

```typescript
import { tool } from "ai";
import { z } from "zod";

const fetchUrlTool = tool({
  description: "Fetch the content of a URL and return the response text. Use for APIs that return JSON or plain text.",
  parameters: z.object({
    url: z.string().url().describe("The full URL to fetch, e.g. 'https://api.example.com/orders/A8812'"),
    method: z.enum(["GET", "POST"]).default("GET"),
    headers: z.record(z.string()).optional().describe("Optional HTTP headers"),
    body: z.string().optional().describe("Request body for POST requests (JSON string)"),
  }),
  execute: async ({ url, method, headers, body }) => {
    // Security: only allow approved domains
    const allowedDomains = ["api.acme.com", "tracking.ups.com", "api.fedex.com"];
    const hostname = new URL(url).hostname;
    if (!allowedDomains.some(d => hostname.endsWith(d))) {
      return JSON.stringify({ error: "URL_NOT_ALLOWED", hostname });
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body ?? undefined,
        signal: AbortSignal.timeout(5000),  // 5 second timeout
      });

      if (!res.ok) {
        return JSON.stringify({ error: `HTTP_${res.status}`, statusText: res.statusText });
      }

      const text = await res.text();
      return text.length > 5000 ? text.slice(0, 5000) + "\n[truncated]" : text;
    } catch (err) {
      return JSON.stringify({ error: "FETCH_FAILED", message: (err as Error).message });
    }
  },
});
```

**Key security rule:** Never allow the agent to fetch arbitrary URLs — it could be used to exfiltrate data or SSRF internal services. Always validate against an allowlist.

---

## 15.2 Delivery Carrier Tracking Tool

The course's delivery tracking use case — a real-world web tool:

```typescript
const CARRIER_TRACKING_URLS: Record<string, string> = {
  ups:    "https://www.ups.com/track?tracknum=",
  fedex:  "https://www.fedex.com/fedextrack/?trknbr=",
  dhl:    "https://www.dhl.com/en/express/tracking.html?AWB=",
  auspost: "https://auspost.com.au/mypost/track/#/search?trackId=",
};

const trackDeliveryTool = tool({
  description: "Track a shipment using a tracking number and carrier name. Returns current location and ETA.",
  parameters: z.object({
    trackingNumber: z.string().describe("The shipping tracking number"),
    carrier: z.enum(["ups", "fedex", "dhl", "auspost"]).describe("The shipping carrier"),
  }),
  execute: async ({ trackingNumber, carrier }) => {
    // In production: call the carrier's actual tracking API
    // For the course: use a mock API or the carrier's tracking API if available

    try {
      const apiUrl = `https://api.carrier-mock.example.com/track/${carrier}/${trackingNumber}`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });

      if (!res.ok) return JSON.stringify({ found: false, carrier, trackingNumber });

      const data = await res.json() as {
        status: string; location: string; eta: string; events: unknown[];
      };
      return JSON.stringify({
        found: true, carrier, trackingNumber,
        status: data.status, location: data.location, eta: data.eta,
        latestEvent: data.events[0],
      });
    } catch {
      return JSON.stringify({ found: false, error: "CARRIER_API_UNAVAILABLE", carrier });
    }
  },
});
```

---

## 15.3 HTML Scraping and Parsing

When an API is not available, scraping is the fallback:

```typescript
import * as cheerio from "cheerio";   // npm install cheerio

async function scrapeTrackingPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AcmeBot/1.0)",
      "Accept": "text/html",
    },
    signal: AbortSignal.timeout(8000),
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, footer, header, ads").remove();

  // Extract tracking status — selector depends on the carrier's HTML
  const status   = $("[data-testid='tracking-status']").text().trim();
  const location = $("[data-testid='current-location']").text().trim();
  const eta      = $("[data-testid='delivery-eta']").text().trim();

  return JSON.stringify({ status, location, eta });
}
```

**Scraping gotchas:**
- Carrier pages often require JavaScript rendering — use Playwright for JS-heavy pages
- Selectors break when sites update their HTML — monitor and update regularly
- Respect robots.txt and rate limits — don't hammer carrier sites

---

## 15.4 File System Tools

File system tools let agents read reports, logs, and data files:

```typescript
import * as path from "path";
import * as fs   from "fs/promises";

const ALLOWED_BASE_DIR = "/app/data";   // Agents can only access this directory

function safePath(relativePath: string): string {
  const absolute = path.resolve(ALLOWED_BASE_DIR, relativePath);
  if (!absolute.startsWith(ALLOWED_BASE_DIR)) {
    throw new Error(`PATH_TRAVERSAL: ${relativePath}`);
  }
  return absolute;
}

const readFileTool = tool({
  description: "Read a file from the data directory. Returns the file contents as text.",
  parameters: z.object({
    filePath: z.string().describe("Relative path within the data directory, e.g. 'reports/march-2026.csv'"),
  }),
  execute: async ({ filePath }) => {
    try {
      const safe = safePath(filePath);
      const stat = await fs.stat(safe);
      if (stat.size > 1_000_000) return JSON.stringify({ error: "FILE_TOO_LARGE", sizeMB: stat.size / 1e6 });
      const content = await fs.readFile(safe, "utf-8");
      return content.length > 10_000 ? content.slice(0, 10_000) + "\n[truncated]" : content;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return JSON.stringify({ error: "FILE_NOT_FOUND" });
      return JSON.stringify({ error: "READ_FAILED", message: (err as Error).message });
    }
  },
});

const writeFileTool = tool({
  description: "Write content to a file in the data directory.",
  parameters: z.object({
    filePath: z.string().describe("Relative path for the output file, e.g. 'reports/analysis.txt'"),
    content:  z.string().describe("The content to write"),
    append:   z.boolean().default(false).describe("If true, append to existing file"),
  }),
  execute: async ({ filePath, content, append }) => {
    try {
      const safe = safePath(filePath);
      await fs.mkdir(path.dirname(safe), { recursive: true });
      if (append) {
        await fs.appendFile(safe, content, "utf-8");
      } else {
        await fs.writeFile(safe, content, "utf-8");
      }
      return JSON.stringify({ success: true, path: filePath, bytes: Buffer.byteLength(content) });
    } catch (err) {
      return JSON.stringify({ error: "WRITE_FAILED", message: (err as Error).message });
    }
  },
});
```

---

## 15.5 Rate Limiting Web Tools

Avoid hammering external APIs with a simple in-memory rate limiter:

```typescript
class RateLimiter {
  private calls: number[] = [];

  constructor(
    private readonly maxCalls: number,
    private readonly windowMs: number
  ) {}

  async throttle(): Promise<void> {
    const now = Date.now();
    this.calls = this.calls.filter(t => now - t < this.windowMs);

    if (this.calls.length >= this.maxCalls) {
      const waitMs = this.windowMs - (now - this.calls[0]);
      await new Promise(r => setTimeout(r, waitMs));
    }

    this.calls.push(Date.now());
  }
}

const carrierRateLimiter = new RateLimiter(10, 60_000);  // 10 calls per minute

// Use in tool execute:
await carrierRateLimiter.throttle();
const result = await fetchCarrierAPI(trackingNumber);
```

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| HTTP tool | Fetch external APIs; always validate URL against allowlist |
| Scraping | Use Cheerio for static HTML; Playwright for JS-heavy pages |
| File system | Always resolve to absolute path; validate against base dir |
| Path traversal | `path.resolve` + `startsWith(baseDir)` check is mandatory |
| Rate limiting | Protect external APIs from hammering; use in-memory limiter |
| Timeout | Always set `AbortSignal.timeout()` on web requests |

---

*Next: Chapter 16 — Model Context Protocol (MCP)*
