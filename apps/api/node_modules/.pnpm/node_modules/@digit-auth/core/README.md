# @digit-auth/core

Shared authentication and authorization contracts for the DigitAuth platform.

`@digit-auth/core` contains the reusable authorization definitions shared across DigitAuth packages and applications.

## Installation

```bash
pnpm add @digit-auth/core
```

Or:

```bash
npm install @digit-auth/core
```

## What's Included

### User Roles

The package provides the shared `UserRole` enum:

- `USER`
- `MODERATOR`
- `ADMIN`
- `SUPER_ADMIN`

### Permissions

The shared `Permission` enum contains the permissions used by DigitAuth authorization.

These include permissions for:

- Users
- Profiles
- Sessions
- Security events
- Audit logs
- Courses

### Role Permissions

`RolePermissions` provides the central mapping between roles and their available permissions.

This allows the API and SDK packages to use the same authorization contracts.

## Usage

```ts
import { Permission, RolePermissions, UserRole } from "@digit-auth/core";

const role = UserRole.ADMIN;

const canReadProfile = RolePermissions[role].includes(Permission.PROFILE_READ);

console.log(canReadProfile);
```

## Package Purpose

This package intentionally contains shared contracts rather than application-specific authentication logic.

Token verification, user lookup, sessions, password management, and other authentication operations remain inside the DigitAuth API.

The Node.js SDK uses these shared contracts to provide authorization middleware for external applications.

## Requirements

- Node.js 20+
- TypeScript 6+

## License

MIT
