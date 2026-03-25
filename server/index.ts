import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

// Preserve original process.exit before it is overridden below — used by fatal handlers
const origExit = process.exit.bind(process);

process.on("SIGHUP", () => {});

process.on("SIGTERM", () => {
  console.log("[server] SIGTERM received, shutting down gracefully");
  const getActiveAnalyses = (globalThis as any).__getActiveAnalyses;
  if (typeof getActiveAnalyses === "function") {
    const active = getActiveAnalyses();
    if (active.length > 0) {
      console.log(`[server] WARNING: ${active.length} active analysis job(s) will be terminated:`);
      active.forEach((a: any) => console.log(`[server]   - ${a.key}: ${a.step} (${a.pct}%) started ${Math.round((Date.now() - a.startedAt) / 1000)}s ago`));
    }
  }
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[server] SIGINT received, shutting down gracefully");
  process.exit(0);
});

process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
  console.error("[server] UNCAUGHT EXCEPTION:", err);
  // Fatal network errors must exit — otherwise the process stays alive as a zombie
  // with no bound port, making every subsequent restart fail with EADDRINUSE.
  if (err.code === "EADDRINUSE" || err.code === "EACCES") {
    console.error("[server] Fatal port error — exiting so the process can be restarted cleanly");
    origExit(1);
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("[server] UNHANDLED REJECTION:", reason);
});

process.exit = ((code?: number) => {
  if (code !== 0 && code !== undefined) {
    console.error(`[server] process.exit(${code}) intercepted — keeping server alive`);
    console.trace();
    return undefined as never;
  }
  return origExit(code);
}) as typeof process.exit;

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const AUTH_COOKIE = "geo_admin_token";

function generateAuthToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const validTokens = new Set<string>();

function isPublicPath(path: string): boolean {
  if (path === "/api/auth/login") return true;
  if (path === "/api/auth/check") return true;
  if (process.env.NODE_ENV !== "production") return true;
  if (path.match(/^\/api\/multi-segment-sessions\/\d+\/report$/)) return true;
  if (path.match(/^\/api\/share\/teaser\/\d+$/)) return true;
  if (path.match(/^\/api\/share\/teaser\/\d+\/lead$/)) return true;
  if (path.match(/^\/api\/share\/teaser\/by-slug\//)) return true;
  if (path.match(/^\/api\/share\/summary\/by-slug\//)) return true;
  if (path === "/api/share/summary-lead") return true;
  if (path === "/api/webhooks/incoming") return true;
  if (path === "/api/internal/migrate-session") return true;
  if (path.startsWith("/api/citation-urls/")) return true;
  if (path.match(/^\/api\/analytics\/session\/\d+/)) return true;
  if (path === "/api/landing/submit") return true;
  if (path.match(/^\/api\/landing\/submission\/\d+$/)) return true;
  if (path === "/api/landing/run-analysis") return true;
  if (path === "/api/waitlist") return true;
  if (path.match(/^\/api\/multisegment\/sessions\/\d+$/)) return true;
  if (path.match(/^\/api\/multisegment\/by-slug\//)) return true;
  if (path === "/api/directory/recent") return true;
  if (path === "/api/directory/search-index") return true;
  if (path.match(/^\/api\/multi-segment-sessions\/\d+\/citation-sources$/)) return true;
  if (path.match(/^\/api\/multi-segment-sessions\/\d+\/citation-domains\//)) return true;
  if (path.match(/^\/api\/multi-segment-sessions\/\d+\/citation-insights$/)) return true;
  if (path.match(/^\/api\/segment-analysis\/progress\//)) return true;
  if (path === "/api/segment-analysis/analyze") return true;
  if (path === "/api/agents/interest") return true;
  if (path.match(/^\/api\/crawl\/status\/\d+$/)) return true;
  if (path.match(/^\/api\/crawl\/run\/\d+$/)) return true;
  if (path.match(/^\/api\/crawl\/analyze\/\d+$/)) return true;
  if (path.match(/^\/api\/citations\/session\/\d+\/rows$/)) return true;
  if (!path.startsWith("/api/")) return true;
  return false;
}

app.post("/api/auth/login", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ message: "Admin password not configured" });
  }
  if (password !== adminPassword) {
    return res.status(401).json({ message: "Invalid password" });
  }
  const token = generateAuthToken();
  validTokens.add(token);
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  return res.json({ success: true });
});

app.get("/api/auth/check", (req, res) => {
  if (process.env.NODE_ENV !== "production") {
    return res.json({ authenticated: true });
  }
  const token = req.cookies?.[AUTH_COOKIE];
  if (token && validTokens.has(token)) {
    return res.json({ authenticated: true });
  }
  return res.json({ authenticated: false });
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (token) validTokens.delete(token);
  res.clearCookie(AUTH_COOKIE);
  return res.json({ success: true });
});

app.use((req, res, next) => {
  if (isPublicPath(req.path)) return next();
  const token = req.cookies?.[AUTH_COOKIE];
  if (token && validTokens.has(token)) return next();
  return res.status(401).json({ message: "Authentication required" });
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedBodySnippet: string | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    try {
      if (Array.isArray(bodyJson)) {
        capturedBodySnippet = `[Array(${bodyJson.length})]`;
      } else if (typeof bodyJson === "object" && bodyJson !== null) {
        const keys = Object.keys(bodyJson);
        if (keys.length > 10) {
          capturedBodySnippet = `{Object(${keys.length} keys)}`;
        } else {
          const full = JSON.stringify(bodyJson);
          capturedBodySnippet = full.length > 300 ? full.slice(0, 300) + `...` : full;
        }
      } else {
        capturedBodySnippet = String(bodyJson).slice(0, 300);
      }
    } catch {
      capturedBodySnippet = "[unserializable]";
    }
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedBodySnippet) {
        logLine += ` :: ${capturedBodySnippet}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // On startup, reset any brand-intelligence jobs that were left in "running" state
  // (they died mid-run when the server restarted). Mark them failed so the UI shows
  // a clear error instead of hanging forever at a partial progress count.
  try {
    const { db: startupDb } = await import("./db");
    const { brandIntelligenceJobs: bijTable } = await import("@shared/schema");
    const { eq: eqDrizzle } = await import("drizzle-orm");
    const stuck = await startupDb
      .update(bijTable)
      .set({ status: "failed", error: "Server restarted mid-run — please re-run this analysis." })
      .where(eqDrizzle(bijTable.status, "running"))
      .returning({ id: bijTable.id });
    if (stuck.length > 0) {
      console.log(`[startup] Reset ${stuck.length} orphaned running job(s) to failed: ${stuck.map(j => j.id).join(", ")}`);
    }
  } catch (err) {
    console.error("[startup] Failed to reset orphaned jobs:", err);
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);

  // Pre-emptively free the port — prevents EADDRINUSE on rapid restarts
  try {
    const { execSync } = await import("child_process");
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: "ignore" });
    await new Promise(r => setTimeout(r, 300));
  } catch {}

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
