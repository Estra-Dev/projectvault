# ProjectVault - Agent Instructions

## Overview

ProjectVault is a private workspace application for managing Projects, Notes, and Links. It serves as a real-world integration test for DigitAuth and must consume DigitAuth as an independent external developer would, using its published SDK packages.

This file contains essential instructions for AI agents working on ProjectVault. Read this before making any changes.

## Core Principles

- **Do not build yet** - This is for planning only. Wait for review before scaffolding or implementing features.
- **Work incrementally** - Make small, verifiable changes. Run checks at each milestone.
- **Inspect before assuming** - Always inspect the environment, existing files, and package metadata before implementing.
- **Separate concerns** - Keep frontend and backend logically separated. Do not place ProjectVault inside the DigitAuth repository.

## Technology Stack (Required)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Authentication UI/Client | Published `@digit-auth/react` |
| Backend | Express 5, TypeScript |
| Authentication Middleware | Published `@digit-auth/node` |
| Database | MongoDB with Mongoose |
| Package Management | pnpm (where appropriate) |
| Version Control | Git |

## Non-Negotiable DigitAuth Rules

1. **Use published packages only** - Use `@digit-auth/react` and `@digit-auth/node` from npm. No source imports, copied files, local workspace links, or private imports from the DigitAuth repository.
2. **Inspect before implementing** - Check current published package versions, README files, package exports, TypeScript declarations, and examples before implementing authentication.
3. **Verify API signatures** - Confirm real API signatures of both SDKs. Never invent component names, methods, properties, middleware options, or configuration fields.
4. **Pin verified versions** - Currently known: `@digit-auth/react@0.1.4`, `@digit-auth/node@0.1.0`. Verify availability before installing. Pin verified versions (not `latest` or unbounded ranges).
5. **Use full auth flow** - Use DigitAuth for registration, sign-in, sign-out, email verification, password reset, and authenticated backend requests wherever the published SDK supports them.
6. **No auth substitutions** - Do not substitute Clerk, Auth.js, NextAuth, Firebase Authentication, custom JWT authentication, or another auth provider.
7. **Stop on blockers** - If a required feature is missing or SDK doesn't work as documented, stop and report the exact blocker. Do not silently bypass DigitAuth.
8. **Secrets in env vars** - Keep credentials in environment variables. Never commit secrets or print them in logs.
9. **Client secret safety** - Browser must never receive DigitAuth client secret. Server-side secrets only for trusted backend code.
10. **Follow official docs** - Follow current official DigitAuth SDK documentation and actual package behavior, not assumptions from other libraries.

## Security & Data Isolation

- **Private by default** - Every user's projects, notes, and links must be private to that user.
- **Authenticate all protected requests** - Use DigitAuth Node SDK to authenticate protected backend requests.
- **Derive identity from verified context** - Derive authenticated user identity from verified auth context, not from arbitrary user IDs in request body/query.
- **Enforce ownership** - Enforce ownership in DB queries and every read, update, delete operation.
- **No ID-as-proof** - Never trust a resource ID as proof of ownership.
- **Validate inputs** - Validate all inputs and return appropriate HTTP errors.
- **No sensitive data leakage** - Do not expose passwords, access tokens, refresh tokens, or internal secrets in responses or logs.
- **Multi-user testing** - Plan tests with at least two separate users. User A must not access User B's data by guessing/changing resource IDs.
- **Server-side secrets** - Keep DB config and sensitive credentials server-side.

## Working Method

- **Inspect first** - Inspect current directory and environment before creating files.
- **No blind overwrites** - Do not overwrite existing files without inspecting them first.
- **Scope limited** - Changes limited to ProjectVault only.
- **Small milestones** - Work in small, verifiable milestones.
- **Verify at each step** - Run relevant type checks, linting, builds, tests at each milestone.
- **Diagnose, don't hide** - Diagnose failures instead of suppressing errors or weakening security.
- **Git checkpoints** - Use Git checkpoints after meaningful, verified milestones. Never commit secrets, broken work, or unrelated changes.
- **Ask before destructive actions** - Ask before destructive operations, paid service activation, or actions that could expose credentials.
- **Explain blockers** - When blocked by missing credentials/external config, explain precisely what is needed.
- **Report at milestone end** - Report what changed, tested, results, blockers, next milestone.

## Current Task Rules

1. **Planning only** - Do not install packages or implement application features yet.
2. **Inspect environment** - Inspect current ProjectVault directory and existing Git state.
3. **Create AGENTS.md** - This file (already created).
4. **Create PROJECT_PLAN.md** - Detailed plan with architecture, deps to verify, env vars (names only), security strategy, test strategy, phased roadmap.
5. **No .env with credentials** - Do not create .env files containing credentials.
6. **No files outside ProjectVault** - Do not modify files outside ProjectVault.
7. **Show and summarize** - Show created files and summarize plan.
8. **Stop and wait** - Stop and wait for review before proceeding to application scaffolding.
9. **Uncertain = verify** - If detail uncertain, record as something to verify rather than inventing.
