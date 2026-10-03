# Ingredient-Based Recipe Generator

This project takes a list of ingredients from a logged-in user, asks a large language model for a recipe, **validates** the result on the server, saves it to PostgreSQL under that user's account, and shows it in the app. The backend uses the Hugging Face Inference API with a configurable model (`HF_MODEL`, default `Qwen/Qwen2.5-7B-Instruct`).

## What the Project Does

1. A logged-in user enters ingredients (and optionally servings, difficulty, max cooking time).
2. `POST /api/recipes/generate` validates the request.
3. The AI service asks the model for **one JSON object** (no Markdown).
4. The reply is parsed and checked with Zod. If it is invalid, the model is asked once more, told what was wrong. If it is still invalid, the user gets a controlled error and **nothing is saved**.
5. A valid recipe is stored as structured rows (`Recipe`, `RecipeIngredient`, `RecipeInstruction`) owned by the authenticated user, and returned to the frontend.

## Recipe Engine

Flow: `route → requireAuth → validate → controller → recipe-ai.service (HF) → parse → Zod → recipe.service (Prisma)`.

- Prompt and retry logic: `backend/services/recipe-ai.service.js`. Output schema: `backend/schemas/ai-recipe.schema.js`. JSON extraction (tolerates ```json fences and surrounding prose): `backend/utils/parse-model-json.js`. Database access: `backend/services/recipe.service.js`.
- The model's answer is untrusted. It must have `title`, `description`, `prepTime`/`cookTime` (whole minutes), `servings`, `difficulty` (`easy|medium|hard`), `ingredients` (`name`, `quantity`, `unit`) and `instructions` (strings). Numbers given as quantities are turned into text; `Step 1:` style prefixes are stripped.
- Truncated replies (`finish_reason: length`) are rejected. Up to 2 attempts are made. A Hugging Face outage is **not** retried and returns a 502.
- Optional preferences the server can actually check: `servings` (exactly), `difficulty` (exactly) and `maxCookingTime` (the recipe's `cookTime` must be at most this many minutes). If the model ignores one, that counts as invalid output. `diet` and `cuisine` are intentionally **not** offered, because the server cannot verify them (a wrong "vegan" or "gluten-free" claim would be a real risk).
- The model call is prompt-based JSON, not provider-enforced JSON mode, because support differs between Hugging Face providers. Validation is what protects the database.

## API (all recipe endpoints require login)

| Endpoint | Description |
| --- | --- |
| `POST /api/recipes/generate` | Body: `{ ingredients: string[1-20], servings?: 1-20, difficulty?: "easy"\|"medium"\|"hard", maxCookingTime?: 1-600 }`. Returns `201 { recipe }` (saved). `400` invalid request, `401` not logged in, `502` AI unavailable or invalid output. |
| `GET /api/recipes?limit=20&cursor=<id>` | Your recipes, newest first (summaries). Returns `{ recipes, nextCursor }`; `limit` is 1-50. |
| `GET /api/recipes/:id` | One full recipe. |
| `DELETE /api/recipes/:id` | Deletes your recipe (ingredients and steps cascade). |

Ownership comes only from the login cookie; any `userId` in a request body is ignored. A recipe that belongs to someone else returns **404**, the same as a missing one, so ids cannot be probed.

Recipe shape: `{ id, title, description, prepTime, cookTime, servings, difficulty, ingredients: [{ name, quantity, unit }], instructions: [string], createdAt }`.

The old unauthenticated Markdown endpoint `POST /api/recipe` has been removed.

### Requirements
- Node.js environment
- Hugging Face access token, set only in the backend environment (`HF_ACCESS_TOKEN`)
- A Hugging Face model available to your token, set with `HF_MODEL` (default `Qwen/Qwen2.5-7B-Instruct`)
- PostgreSQL 14+ (see Database below)

### Setup
1. Install dependencies.
2. Copy `backend/.env.example` to `backend/.env` and set `HF_ACCESS_TOKEN`, `HF_MODEL`, `DATABASE_URL` and `JWT_SECRET` (never use a `VITE_` prefix for secrets).
3. Copy `.env.example` to `.env.local` (frontend, public values only).
4. Set up the database (see Database below), then start the backend: `cd backend && npm run dev`.
5. Start the frontend: `npm run dev`.
6. Log in, add at least 4 ingredients and press "Get a recipe". Check the backend with `GET /api/health` and `GET /api/health/db`.

### Database

The backend uses PostgreSQL through Prisma (schema: `backend/prisma/schema.prisma`). Tables so far: `User`, `Recipe`, `RecipeIngredient`, `RecipeInstruction`. No application code reads or writes them yet.

1. Install PostgreSQL 14+ and create a database and user, for example:
   ```sql
   CREATE USER chef WITH PASSWORD 'choose-a-password';
   CREATE DATABASE chef_claude OWNER chef;
   ```
2. In `backend/.env`, set the connection string (never commit it):
   ```ini
   DATABASE_URL="postgresql://chef:choose-a-password@localhost:5432/chef_claude?schema=public"
   ```
3. From `backend/`, generate the Prisma Client: `npm run db:generate` (`npx prisma generate`).
4. Apply migrations:
   - Development: `npm run db:migrate` (`npx prisma migrate dev`). After you change `schema.prisma` this also creates a new migration.
   - Production/CI: `npm run db:deploy` (`npx prisma migrate deploy`).
5. Start the backend and check the connection: `curl localhost:3001/api/health/db`. It returns 200 when the database answers and a generic 503 otherwise; credentials are never included in responses.

Local development order: install PostgreSQL → set `DATABASE_URL` → `npm install` → `npm run db:generate` → `npm run db:migrate` → `npm run dev` (backend) → `npm run dev` (frontend). The API still starts without `DATABASE_URL`; only `/api/health/db` reports it as not configured.

### Authentication

Users can register, log in, log out and load their profile. Passwords are hashed with bcrypt (cost 12) and never stored or returned in plaintext. Login issues a JWT (HS256, 7 days) in an **HTTP-only cookie** named `chef_token`; the browser never exposes it to JavaScript and the frontend never stores tokens or passwords in `localStorage`/`sessionStorage`.

| Endpoint | Description |
| --- | --- |
| `POST /api/auth/register` | `{ name, email, password }` → creates the user, signs them in, returns `201 { user }`. Email is trimmed and lowercased; password is 8–72 bytes. Duplicate email → `409`. |
| `POST /api/auth/login` | `{ email, password }` → `200 { user }` and sets the cookie. Wrong email or password → `401` with the same message for both. |
| `POST /api/auth/logout` | Clears the cookie. Always `200`. |
| `GET /api/auth/me` | Returns the current user, or `401` if the cookie is missing, invalid, expired or the user no longer exists. |

Setup:
1. Generate a secret and put it in `backend/.env` as `JWT_SECRET` (at least 32 characters; the server refuses to start in production without it):
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
2. Open the frontend at the **same hostname** as `VITE_API_BASE_URL` (e.g. both `localhost`). Mixing `localhost` and `127.0.0.1` makes the cookie cross-site and it will not be sent.
3. Cookie settings: `httpOnly` always; `secure` in production; `sameSite=lax` by default. If your frontend and API are deployed on **different sites**, set `AUTH_COOKIE_SAMESITE=none` (this forces `secure`, so HTTPS is required) and list the frontend in `CLIENT_ORIGIN`.

To protect a backend route, add the `requireAuth` middleware (`backend/middleware/auth.middleware.js`); it sets `req.user`, and routes must use `req.user.id` rather than any id sent by the client. On the frontend, wrap private routes in the `ProtectedRoute` layout route (`components/ProtectedRoute.jsx`). The recipe generator and recipe pages are all behind login.

Frontend routes: `/` (generator), `/recipes` (saved recipes), `/recipes/:id` (one recipe, with delete), `/login`, `/register`. The first three are wrapped in `ProtectedRoute`. Auth state lives in `src/auth/AuthProvider.jsx` (`useAuth()`), which asks `GET /api/auth/me` on load and tracks `loading`, `authenticated`, `unauthenticated` and `error`.

### NOTES
- The model may introduce extra pantry ingredients; this is intentional.
- Model quality varies. Check your chosen `HF_MODEL` with a real token; if it often fails validation, the server logs `[recipe-ai] attempt ... rejected: <reason>` to help tune the prompt.
- Recipe text from the model is stored and displayed as plain text only.

### Future Improvements
- Rate limiting on login and recipe generation.
- Token revocation (server-side sessions or a token version).
