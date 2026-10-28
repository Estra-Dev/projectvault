import "dotenv/config";
import express from "express";
import cors from "cors";
import { createDigitAuth, requireAuth, getAuth, DigitAuthError } from "@digit-auth/node";
import { connectToDatabase } from "./db/connect.js";
import { createProjectsRouter } from "./routes/projects.js";
import { createNotesRouter } from "./routes/notes.js";
import { createLinksRouter } from "./routes/links.js";
import digitAuthWebhookRouter from "./routes/digit-auth-webhook.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

// Webhooks must receive the original request body for signature verification.
app.use("/webhooks/digit-auth", digitAuthWebhookRouter);

app.use(
  express.json({
    verify: (_req, _res, buf) => {
      // Store raw body if needed in future, but just ensure we can detect parse errors
    },
  }),
);

// Handle malformed JSON from express.json()
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError) {
    const error = err as SyntaxError & { body?: unknown; type?: string };
    if (error.type === "entity.parse.failed" || error.message?.includes("JSON")) {
      return res.status(400).json({ error: "Malformed JSON" });
    }
  }
  next(err);
});

const apiUrl = process.env.DIGIT_AUTH_API_URL;
const clientId = process.env.DIGIT_AUTH_CLIENT_ID;
const clientSecret = process.env.DIGIT_AUTH_CLIENT_SECRET;

if (!apiUrl || !clientId || !clientSecret) {
  throw new Error("Missing DigitAuth backend environment variables.");
}

const digitAuth = createDigitAuth({
  apiUrl,
  clientId,
  clientSecret,
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "projectvault-api",
  });
});

// Temporary integration test endpoint.
app.get("/auth-test", requireAuth(digitAuth), (req, res) => {
  const auth = getAuth(req);

  res.status(200).json({
    status: "authenticated",
    user: {
      id: auth?.user.id,
      email: auth?.user.email,
    },
  });
});

app.use("/projects", createProjectsRouter(digitAuth));
app.use("/notes", createNotesRouter(digitAuth));
app.use("/links", createLinksRouter(digitAuth));

// 404 handler for unknown API routes
app.use((req, res, _next) => {
  res.status(404).json({ error: "Not Found" });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof DigitAuthError) {
      const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 401;
      return res.status(status).json({ error: err.message || "Authentication failed" });
    }

    if (typeof err === "object" && err !== null) {
      const maybeError = err as { status?: number; statusCode?: number; name?: string };
      if (typeof maybeError.status === "number" && maybeError.status >= 400 && maybeError.status < 600) {
        return res.status(maybeError.status).json({ error: "Request failed" });
      }
      if (typeof maybeError.statusCode === "number" && maybeError.statusCode >= 400 && maybeError.statusCode < 600) {
        return res.status(maybeError.statusCode).json({ error: "Request failed" });
      }
    }

    console.error("Unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  },
);

async function start() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`ProjectVault API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exit(1);
  }
}

start();
