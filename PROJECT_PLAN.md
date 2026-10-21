# ProjectVault - Implementation Plan

> **Status:** Planning Only (No implementation yet)  
> **Waiting for:** Review before scaffolding/applying changes  
> **Repo root:** `C:\Users\HP\Desktop\projectvault`  
> **Git:** Initialized, no commits yet (as inspected)

## 1) Architecture

ProjectVault will be a split application with clear separation between frontend and backend. Both will live under this repo root (separate directories) but remain logically independent.

### High-level structure (proposed)
```
projectvault/
├── AGENTS.md
├── PROJECT_PLAN.md
├── apps/
│   ├── web/        # Next.js frontend (React + TS + Tailwind)
│   └── api/        # Express 5 backend (TS)
├── packages/       # (optional) shared types/utils if needed later
└── pnpm-workspace.yaml  # (to be created only if monorepo structure confirmed)
```

**Notes:**
- Frontend and backend are logically separated. No code shared by copying from DigitAuth.
- ProjectVault must remain outside the DigitAuth repository.
- Monorepo vs two separate repos is a design choice to verify - see section 2.

### Frontend (Next.js)
- **Framework:** Next.js (App Router preferred; to be confirmed during scaffolding based on conventions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth UI/Client:** `@digit-auth/react` (published)
- **Responsibilities:**
  - Auth flows via DigitAuth React components/hooks (registration, sign-in, sign-out, email verification, password reset) as supported by the SDK
  - Protected routes/pages for Projects/Notes/Links
  - API calls to backend with authenticated requests as per SDK/client usage
  - No secrets in client bundle

### Backend (Express 5)
- **Framework:** Express 5
- **Language:** TypeScript
- **Auth:** `@digit-auth/node` middleware (published)
- **DB:** MongoDB with Mongoose
- **Responsibilities:**
  - REST API for Projects, Notes, Links (CRUD)
  - Protect routes using DigitAuth Node middleware
  - Derive authenticated user identity from verified auth context (never trust client-supplied userId)
  - Enforce ownership on all queries/operations
  - Input validation, proper HTTP errors
  - No secrets/PII leaked in responses/logs

### Data model (proposed)
Core entities (minimal for planning):
- **User** (identity comes from DigitAuth; we do not duplicate auth credentials. We may store a minimal mapping like `digitAuthId`/externalId if needed for ownership - to be verified against SDK behavior)
- **Project** - belongs to user, has title/description/metadata, timestamps
- **Note** - belongs to user, linked to project or standalone? (to be refined) - private to owner
- **Link** - belongs to user, title/url/description/tags - private to owner

**Critical:** Ownership must be enforced via authenticated user identity from DigitAuth context. Never rely on resource ID alone or on client-provided user identifiers.

## 2) Dependencies to Verify

Before installing, verify the following against published packages and npm.

### DigitAuth SDKs (critical)
| Package | Known version | Action |
|---------|---------------|--------|
| `@digit-auth/react` | `0.1.4` | Verify on npm registry is still available, fetch package.json, README, exports, types (`.d.ts`), and examples. Confirm exact component/hook names, props, configuration, how auth state is exposed, and how to attach auth to requests. |
| `@digit-auth/node` | `0.1.0` | Verify on npm registry, fetch README, exports, types, middleware API (function/class/options), how to extract verified user identity, how to protect routes, error handling, and any required env vars. |

### Frontend dependencies (to verify)
- `next`, `react`, `react-dom` - versions compatible with chosen Next version
- `typescript`, `@types/react`, `@types/node`
- `tailwindcss`, `postcss`, `autoprefixer` (or current Tailwind setup)
- Any peer deps required by `@digit-auth/react`

### Backend dependencies (to verify)
- `express@5` (Express 5 - confirm stability/compat)
- `typescript`, `@types/express`, `@types/node`
- `mongoose` - compatible with Node/TS
- `dotenv` - for env loading (server only)
- `cors` - if cross-origin between apps (to be decided by structure)
- Any peer deps required by `@digit-auth/node`

### Tooling
- `pnpm` - confirm installed/version
- `git` - available (confirmed)
- Type checking: `tsc --noEmit`
- Linting: to be determined (eslint) - verify config approach
- Build tools as per Next/Express

**Verification method (planned):**
1. `npm view @digit-auth/react@0.1.4 version` and `npm view @digit-auth/node@0.1.0 version`
2. Inspect package contents/README via registry or temp install to read files
3. Review TypeScript declarations and exports
4. Document exact APIs before coding

## 3) Environment Variables (names only, no secrets)

**Rule:** Do not create `.env` files with credentials. Only list names. Secrets must come from secure env management.

### Frontend (`apps/web`)
| Variable | Purpose | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_*` (TBD) | DigitAuth public config if required by `@digit-auth/react` | Only if SDK requires public values. **Never** expose client secret. Must confirm from SDK docs/types. |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | Non-secret if just origin/path. |

### Backend (`apps/api`)
| Variable | Purpose | Notes |
|----------|---------|-------|
| `PORT` | Server port | Optional |
| `NODE_ENV` | Environment | development/production |
| `MONGODB_URI` | MongoDB connection string | **Secret** - server only |
| `DIGIT_AUTH_*` (TBD) | DigitAuth server configuration required by `@digit-auth/node` | Must inspect SDK. Could include issuer, audience, secret/key, JWKS URL, etc. **Client secret must never reach browser.** |
| `CORS_ORIGIN` | Allowed origin(s) | If frontend/backend on different origins |

**Action:** After inspecting both SDKs' READMEs/types, replace (TBD) with exact required variable names and document whether each is public/server-only.

## 4) Security Strategy

### Authentication
- Use DigitAuth for all auth flows (register, sign-in, sign-out, email verification, password reset) where supported.
- Frontend uses `@digit-auth/react` as documented.
- Backend protects routes with `@digit-auth/node` middleware.
- Identity derived only from verified auth context from DigitAuth.

### Authorization & Data Isolation
- **Ownership model:** Every Project/Note/Link document must have an owner identifier tied to the authenticated DigitAuth user (exact field name to be determined after inspecting how user identity is represented).
- **Query scoping:** All find/findOne/update/delete operations must include owner filter from verified identity.
- **No ID trust:** Never accept ownerId/userId from request body/query/params as authoritative.
- **Resource access:** Fetch resource by id+owner; return 404 (or appropriate) to avoid leaking existence across users.
- **Multi-user isolation:** Enforced at query level, tested with 2+ users.

### Input & API Security
- Validate request bodies/params (to be added - strategy defined now)
- Return proper HTTP status codes (401/403/404/400)
- No sensitive data in responses (tokens, secrets, passwords)
- No sensitive data in logs

### Secrets & Config
- All secrets in env vars only
- Client secret never sent to browser
- `.env*` files containing secrets must not be committed
- DB credentials server-side only

### Additional Safeguards
- CORS configured appropriately if cross-origin
- Error messages should not leak implementation details unnecessarily
- Plan for token/session handling as per SDK (follow SDK behavior exactly)

## 5) Test Strategy

### Principles
- Test data isolation between users (critical)
- Test auth flows via SDK
- Test ownership enforcement on every protected operation

### Planned tests (manual + automated where feasible)
| Area | Test | Expected |
|------|------|----------|
| Auth | Register/sign-in/sign-out via DigitAuth UI/hooks | Works as per SDK |
| Auth | Email verification & password reset flows (if supported) | Work as per SDK |
| AuthZ | Unauthenticated request to protected endpoint | 401/appropriate error |
| Ownership - Projects | User A creates project P1; User B cannot GET/PUT/DELETE P1 by ID | Blocked, no data leak |
| Ownership - Notes | Same isolation test | Blocked |
| Ownership - Links | Same isolation test | Blocked |
| Ownership - create | Cannot create resource for another user (ignore client userId) | Owner set from verified identity only |
| Ownership - list | List returns only resources owned by authenticated user | Correct filtering |
| Input validation | Invalid/missing data | Proper 400 errors |
| Secrets | Check responses/logs for tokens/secrets | None present |

**Multi-user requirement:** At least two separate user accounts must be used to verify isolation.

## 6) Phased Implementation Roadmap

> **Current phase:** Phase 0 - Planning (complete). **Do not proceed past Phase 0 without review.**

### Phase 0: Planning (DONE - this plan)
- [x] Inspect environment and git state
- [x] Create `AGENTS.md`
- [x] Create `PROJECT_PLAN.md`
- [ ] Review and approval

### Phase 1: Inspect DigitAuth SDKs (verification)
**Goal:** Know exact APIs before scaffolding
- [ ] Fetch/package-inspect `@digit-auth/react@0.1.4` (README, package.json exports, types, examples)
- [ ] Fetch/package-inspect `@digit-auth/node@0.1.0` (README, package.json exports, types, middleware API)
- [ ] Document exact component/hook/middleware names, options, and required env vars
- [ ] Verify versions still available on npm
- [ ] Record findings in plan/update notes (no code changes yet except docs if needed)

### Phase 2: Scaffolding (after approval)
**Goal:** Create project structure
- [ ] Decide structure (monorepo with apps/web, apps/api or separate). Create accordingly
- [ ] Initialize frontend (Next.js + TS + Tailwind) in `apps/web`
- [ ] Initialize backend (Express 5 + TS) in `apps/api`
- [ ] Add base configs (tsconfig, package.json scripts)
- [ ] Git checkpoint

### Phase 3: Install & wire DigitAuth (after SDK inspection)
**Goal:** Integrate published SDKs correctly
- [ ] Pin verified versions of `@digit-auth/react` and `@digit-auth/node`
- [ ] Configure frontend with `@digit-auth/react` per exact API
- [ ] Configure backend with `@digit-auth/node` middleware per exact API
- [ ] Set up env var structure (names only in docs) - no secrets committed
- [ ] Verify auth flows work
- [ ] Git checkpoint

### Phase 4: Database & Models
**Goal:** Data layer with ownership
- [ ] Connect to MongoDB via Mongoose (server-side)
- [ ] Create models: Project, Note, Link with owner reference
- [ ] Add indexes as needed
- [ ] Git checkpoint

### Phase 5: API Routes (CRUD) with ownership enforcement
**Goal:** Protected CRUD for all three resources
- [ ] Auth-protect all routes with DigitAuth Node middleware
- [ ] Implement Projects CRUD (scoped to owner)
- [ ] Implement Notes CRUD (scoped to owner)
- [ ] Implement Links CRUD (scoped to owner)
- [ ] Enforce ownership in all queries/updates/deletes
- [ ] Input validation and proper errors
- [ ] Git checkpoint

### Phase 6: Frontend UI
**Goal:** Private workspace UI
- [ ] Auth pages/components using `@digit-auth/react`
- [ ] Protected routes
- [ ] Projects/Notes/Links management UI
- [ ] API integration with auth
- [tagless, no secrets in client]
- [ ] Git checkpoint

### Phase 7: Security verification & testing
**Goal:** Validate isolation and security
- [ ] Multi-user isolation tests (2+ users) - User A cannot access User B's data
- [ ] Auth flow tests
- [ ] Check for secret leakage in responses/logs
- [ ] Type checks, lint, build
- [ ] Fix issues (no security weakening)
- [ ] Git checkpoint

### Phase 8: Final review & documentation
**Goal:** Clean state
- [ ] Update docs if needed
- [ ] Ensure no secrets committed
- [ ] Final checks
- [ ] Summary report

## 7) Risks & Unknowns (to verify)

| Risk | Status | Mitigation |
|------|--------|------------|
| Exact API of `@digit-auth/react` unknown | **To verify** | Inspect package before scaffolding; follow types/README exactly |
| Exact API/middleware of `@digit-auth/node` unknown | **To verify** | Inspect package before scaffolding; identify how user identity is extracted |
| Required env vars for DigitAuth unknown | **To verify** | Extract from SDK README/types |
| Express 5 compatibility details | **To verify** | Check current Express 5 docs/patterns |
| Monorepo structure vs separate apps | **To verify** | Decide based on simplicity and compatibility; can start with `apps/` structure |
| How ownership is tied to DigitAuth user identity | **To verify** | Determine from SDK (user id/email/sub/claims) - must use verified context |

## 8) Immediate Next Steps (after approval)

1. **SDK inspection** - Read `@digit-auth/react@0.1.4` and `@digit-auth/node@0.1.0` from npm (package.json, README, exports, types)
2. **Document exact APIs** - Update plan with concrete findings
3. **Scaffold structure** - Create frontend/backend directories with configs
4. **Wire auth** - Integrate as per exact SDK APIs
5. **Continue incrementally** with milestones and checkpoints

---

**Reminder:** Planning only. No packages installed, no features implemented. Files created: `AGENTS.md`, `PROJECT_PLAN.md`. Waiting for review before proceeding.
