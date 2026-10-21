# @digit-auth/node

Node.js and Express SDK for DigitAuth authentication and authorization.

## Features

- Authenticate Express requests with DigitAuth
- Access the authenticated user
- Role-based authorization
- Permission-based authorization
- Resource ownership authorization
- Automatic communication with the DigitAuth API
- TypeScript support
- Express 5 support

## Requirements

- Node.js 20+
- Express 5+
- A running DigitAuth API

## Installation

```bash
pnpm add @digit-auth/node
```

Or:

```bash
npm install @digit-auth/node
```

## Create the DigitAuth client

```ts
import { createDigitAuth } from "@digit-auth/node";

const auth = createDigitAuth({
  apiUrl: "https://your-digit-auth-api.example.com/api/v1",
});
```

The SDK communicates with the DigitAuth API for authentication and authorization.

The SDK does not require your JWT signing secrets.

## Authentication

Use `requireAuth()` to protect an Express route.

```ts
import express from "express";
import { createDigitAuth, requireAuth } from "@digit-auth/node";

const app = express();

const auth = createDigitAuth({
  apiUrl: "https://your-digit-auth-api.example.com/api/v1",
});

app.get("/protected", requireAuth(auth), (req, res) => {
  res.json({
    user: req.auth?.user,
  });
});
```

When authentication succeeds, the SDK attaches the authentication context to `req.auth`.

The context contains:

- `user`
- `accessToken`

## Get the authenticated user

You can also use `getAuth()` after authentication middleware has populated the request.

```ts
import { getAuth, requireAuth } from "@digit-auth/node";

app.get("/profile", requireAuth(auth), (req, res) => {
  const authContext = getAuth(req);

  res.json({
    user: authContext.user,
  });
});
```

## Role authorization

Use `requireRole()` when access should be restricted to a specific role.

```ts
import { requireAuth, requireRole } from "@digit-auth/node";

import { UserRole } from "@digit-auth/core";

app.get(
  "/admin",
  requireAuth(auth),
  requireRole(UserRole.ADMIN),
  (_req, res) => {
    res.json({
      message: "Admin access granted.",
    });
  },
);
```

## Permission authorization

Use `requirePermission()` when access should depend on a specific permission.

```ts
import { requireAuth, requirePermission } from "@digit-auth/node";

import { Permission } from "@digit-auth/core";

app.get(
  "/users",
  requireAuth(auth),
  requirePermission(Permission.USER_READ),
  (_req, res) => {
    res.json({
      message: "User read access granted.",
    });
  },
);
```

If the authenticated user does not have the required permission, the SDK rejects the request.

## Ownership authorization

Use `requireOwnership()` when a resource should only be accessible by its owner.

For resources where the owner ID is contained in a route parameter:

```ts
import { requireAuth, requireOwnership } from "@digit-auth/node";

app.get(
  "/users/:userId/profile",
  requireAuth(auth),
  requireOwnership({
    param: "userId",
  }),
  (req, res) => {
    res.json({
      message: "You own this resource.",
    });
  },
);
```

The middleware compares the requested resource owner ID with the authenticated user's ID.

### Custom ownership

For resources where the owner ID must be obtained from application data, use `requireOwner()`.

```ts
import { requireAuth, requireOwner } from "@digit-auth/node";

app.get(
  "/projects/:projectId",
  requireAuth(auth),
  requireOwner(async (req) => {
    const project = await findProject(req.params.projectId);

    return project.ownerId;
  }),
  async (req, res) => {
    const project = await findProject(req.params.projectId);

    res.json({
      project,
    });
  },
);
```

## Authorization model

DigitAuth keeps authentication and authorization decisions centralized in the DigitAuth API.

The Node SDK does not require access to the API's JWT signing secrets.

The general flow is:

```text
Express application
        |
        | Bearer access token
        v
@digit-auth/node
        |
        | /auth/me
        v
DigitAuth API
        |
        +-- Verify access token
        +-- Load user
        +-- Check account status
        +-- Determine authorization
        |
        v
Authenticated request
```

This allows applications using the SDK to avoid duplicating JWT verification logic and authentication secrets.

## Error handling

The SDK exposes `DigitAuthError` for SDK/API errors.

```ts
import { DigitAuthError } from "@digit-auth/node";

try {
  // SDK operation
} catch (error) {
  if (error instanceof DigitAuthError) {
    console.error(error.status);
    console.error(error.code);
    console.error(error.message);
  }
}
```

Authentication and authorization middleware errors can be handled using normal Express error-handling middleware.

## API URL

The SDK expects the base URL of the DigitAuth API.

For example:

```ts
const auth = createDigitAuth({
  apiUrl: "http://localhost:5000/api/v1",
});
```

For production:

```ts
const auth = createDigitAuth({
  apiUrl: "https://api.example.com/api/v1",
});
```

## Security

Do not expose DigitAuth JWT signing secrets to applications consuming this SDK.

The SDK sends the user's access token to the DigitAuth API, where the API remains responsible for token verification and user authentication.

Use HTTPS in production.

Access tokens should be handled as sensitive credentials and should never be logged or committed to source control.

## License

MIT
