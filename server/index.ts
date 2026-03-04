import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

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

process.on("uncaughtException", (err) => {
  console.error("[server] UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[server] UNHANDLED REJECTION:", reason);
});

const origExit = process.exit.bind(process);
process.exit = ((code?: number) => {
  if (code !== 0 && code !== undefined) {
    console.error(`[server] process.exit(${code}) intercepted — keeping server alive`);
    console.trace();
    return undefined as never;
  }
  return origExit(code);
}) as typeof process.exit;

const app = express();
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
  if (path.match(/^\/api\/multi-segment-sessions\/\d+\/report$/)) return true;
  if (path.match(/^\/api\/share\/teaser\/\d+$/)) return true;
  if (path.match(/^\/api\/share\/teaser\/\d+\/lead$/)) return true;
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
