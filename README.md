# Ingredient-Based Recipe Generator

This project takes a list of ingredients from a logged-in user, asks a large language model for a recipe, **validates** the result on the server, saves it to PostgreSQL under that user's account, and shows it in the app. The backend uses the Hugging Face Inference API with a configurable model (`HF_MODEL`, default `Qwen/Qwen2.5-7B-Instruct`).

## What the Project Does

1. A logged-in user picks a tab on the home page and asks for a recipe either **from ingredients** they have ("Ingredients recipe" tab) or **from a dish name** such as "Paneer Butter Masala" ("Dish recipe" tab), optionally with servings, difficulty and max cooking time.
2. `POST /api/recipes/generate` validates the request.
3. The AI service asks the model for **one JSON object** (no Markdown).
4. The reply is parsed and checked with Zod. If it is invalid, the model is asked once more, told what was wrong. If it is still invalid, the user gets a controlled error and **nothing is saved**.
5. A valid recipe is stored as structured rows (`Recipe`, `RecipeIngredient`, `RecipeInstruction`) owned by the authenticated user, and returned to the frontend.

## Recipe Engine

Flow: `route → requireAuth → validate → controller → recipe-ai.service (HF) → parse → Zod → recipe.service (Prisma)`.

- Prompt and retry logic: `backend/services/recipe-ai.service.js`. Output schema: `backend/schemas/ai-recipe.schema.js`. JSON extraction (tolerates ```json fences and surrounding prose): `backend/utils/parse-model-json.js`. Database access: `backend/services/recipe.service.js`.
- The model's answer is untrusted. It must have `title`, `description`, `prepTime`/`cookTime` (whole minutes), `servings`, `difficulty` (`easy|medium|hard`), `ingredients` (`name`, `quantity`, `unit`) and `instructions` (strings). Numbers given as quantities are turned into text; `Step 1:` style prefixes are stripped.
- Truncated replies (`finish_reason: length`) are rejected. Up to 2 attempts are made. A Hugging Face outage is **not** retried and returns a 502.
- Two generation modes share all of the above (validation, retry, claims filter, saving). They differ only in the prompt: `mode: "ingredients"` builds a recipe from the user's ingredients, `mode: "dish"` writes the standard recipe for the named dish. In dish mode the model may answer that the text is not a dish; that ends the request at once with a friendly `422` (no retry, nothing saved). Nothing checks that the returned title matches the requested dish; that relies on the prompt.
- Optional preferences the server can actually check: `servings` (exactly), `difficulty` (exactly) and `maxCookingTime` (the recipe's `cookTime` must be at most this many minutes). If the model ignores one, that counts as invalid output. `diet` and `cuisine` are intentionally **not** offered, because the server cannot verify them (a wrong "vegan" or "gluten-free" claim would be a real risk).
- The model call is prompt-based JSON, not provider-enforced JSON mode, because support differs between Hugging Face providers. Validation is what protects the database.

## API (all recipe endpoints require login)

| Endpoint | Description |
| --- | --- |
| `POST /api/recipes/generate` | Body: `{ mode: "ingredients", ingredients: string[1-20] }` **or** `{ mode: "dish", dishName: string[2-80] }`, plus optional `servings` (1-20), `difficulty` (`easy`\|`medium`\|`hard`) and `maxCookingTime` (1-600). A body without `mode` that has `ingredients` is the original format and still works. Dish names are trimmed, must contain a letter or number, and may not contain nutrition or health claims such as "detox" or "low calorie" (`400`). Returns `201 { recipe }` (saved). `400` invalid request, `401` not logged in, `422` the text is not a dish, `429` too many requests, `502` AI unavailable or invalid output. |
| `GET /api/recipes?limit=20&cursor=<id>&q=<text>&difficulty=<d>` | Your recipes, newest first (summaries). Returns `{ recipes, nextCursor }`; `limit` is 1-50. Optional filters: `q` matches the title or an ingredient name (case-insensitive, literal text), `difficulty` is `easy`, `medium` or `hard`. |
| `GET /api/recipes/favorites` | Your favorite recipes, most recently favorited first. Same `limit`, `cursor`, `q` and `difficulty` options. |
| `POST /api/recipes/:id/favorite` | Marks your recipe as a favorite. `201` when added, `200` if it already was (no duplicates, safe to repeat). |
| `DELETE /api/recipes/:id/favorite` | Removes the favorite. `200` even if it was not a favorite. |
| `POST /api/recipes/:id/transform` | Body: `{ instruction: string(3-300) }`. Asks the AI to change one of your recipes (e.g. "Make this recipe vegetarian"). Returns `200 { recipe, changed }` - a **preview only**, nothing is saved. `changed` is `false` if the AI returned the recipe unchanged. |
| `POST /api/recipes/:id/transform/save` | Body: `{ mode: "new"\|"replace", recipe }` where `recipe` is the previewed recipe. `new` creates a new recipe (`201`); `replace` overwrites recipe `:id` (`200`, keeps its id, creation date and favorite mark). |
| `GET /api/recipes/:id` | One full recipe. |
| `DELETE /api/recipes/:id` | Deletes your recipe (ingredients and steps cascade). |

Ownership comes only from the login cookie; any `userId` in a request body is ignored. A recipe that belongs to someone else returns **404**, the same as a missing one, so ids cannot be probed.

Recipe shape: `{ id, title, description, prepTime, cookTime, servings, difficulty, isFavorite, ingredients: [{ name, quantity, unit }], instructions: [string], createdAt }`. List endpoints return the same fields without `ingredients` and `instructions`.

### Favorites

Favorites live in their own `Favorite` table (`userId`, `recipeId`, `createdAt`). The primary key is `(userId, recipeId)`, so the database itself rejects duplicates, and both foreign keys cascade (deleting a recipe or a user removes their favorites). Recipes are private, so a user can only favorite recipes they own; favoriting or un-favoriting someone else's recipe returns `404` and changes nothing. The check is in `backend/services/favorite.service.js`, not in the table, so a future sharing feature will not need a schema change.

The old unauthenticated Markdown endpoint `POST /api/recipe` has been removed.

### Customizing a recipe with AI

Open a saved recipe and use "Customize with AI": pick a suggestion (vegetarian, vegan, more protein, shorter cooking time, double servings, fewer ingredients, change cuisine) or type your own request, then press "Transform recipe". The AI's version is shown as a **preview**; the saved recipe is never changed automatically. You then choose **Save as new recipe**, **Replace this recipe** (asks for confirmation) or **Discard**.

- Flow: `route → requireAuth → validate → load the recipe (must be yours) → transform service → parse → Zod → preview`. It uses the same "ask, validate, retry once with feedback" loop as generation (`requestValidRecipe` in `backend/services/recipe-ai.service.js`). The transform prompt is in `backend/services/recipe-transform.service.js`. If the output is invalid, nothing is returned or saved.
- The instruction is trimmed, 3-300 characters, and is sent to the model as quoted data, not as part of the system prompt. The recipe owner always comes from the login session; the body can't set it.
- Saving re-validates the recipe with the same schema as AI output. The server does not remember previews, so a client could submit its own recipe text to the save endpoint; that only affects that user's own private recipes. Replace runs in one database transaction.
- Request bodies may be up to 64 KB (a full recipe can exceed the old 10 KB limit).

**AI safety.** The app does not present AI recipes as medical or nutritional advice. Prompts forbid calorie counts, nutrition facts, health or medical claims and allergy guarantees, and `backend/utils/health-claims.js` rejects (and retries) outputs containing clear examples of them, for both generation and transformation. This is a best-effort word filter, not a guarantee: results are **not** verified to be vegan, allergen-free, lower in calories, etc., and the UI says so. Claims already present in a saved recipe do not block transforming it. Anyone with allergies or dietary needs must check the ingredients themselves.

### Meal planner and shopping lists

**Meal plans.** A meal plan is a named run of 1-31 days. You assign saved recipes to its days, move or remove them, rename the plan, or delete it. In the app: "Meal planner" in the main navigation.

| Endpoint | Description |
| --- | --- |
| `GET /api/meal-plans?limit=20` | Your plans, newest start date first, with `entryCount`. |
| `POST /api/meal-plans` | `{ name, startDate: "YYYY-MM-DD", endDate? }`. `endDate` defaults to start + 6 days. Max 31 days. `201`. |
| `GET /api/meal-plans/:id` | The plan with its `entries` (`{ id, date, recipe }`) ordered by date. |
| `PATCH /api/meal-plans/:id` | Change `name`, `startDate` and/or `endDate`. `409` if planned recipes would fall outside the new dates (nothing is dropped silently). |
| `DELETE /api/meal-plans/:id` | Deletes the plan and its entries. Shopping lists made from it are kept. |
| `POST /api/meal-plans/:id/entries` | `{ recipeId, date }`: plan one of **your** recipes on a day inside the plan. `409` if that recipe is already planned that day, or the plan already has 100 recipes. |
| `PATCH /api/meal-plans/:id/entries/:entryId` | Move to another `date` and/or swap the `recipeId`. |
| `DELETE /api/meal-plans/:id/entries/:entryId` | Remove one planned recipe. |

Dates are calendar dates (no time of day, no time zones). Deleting a recipe also removes it from any plan.

**Shopping lists.** From a meal plan you can create a shopping list for all planned recipes, or only the ones you tick. The list is saved as a snapshot: it does not change if recipes or plans change later, and it survives deleting the plan.

| Endpoint | Description |
| --- | --- |
| `POST /api/shopping-lists` | `{ mealPlanId, entryIds?, name? }`. Builds the list from the plan's recipes (all, or just `entryIds`), merges ingredients and saves it. `201`. `400` if there is nothing to shop for. |
| `GET /api/shopping-lists?limit=20` | Your lists, newest first, with `itemCount` and `checkedCount`. |
| `GET /api/shopping-lists/:id` | One list with its items (`{ id, name, quantity, checked }`). |
| `PATCH /api/shopping-lists/:id/items/:itemId` | `{ checked: true\|false }`: tick items off while shopping. |
| `DELETE /api/shopping-lists/:id` | Deletes the list. |

How ingredients are merged (`backend/utils/ingredient-aggregation.js`):
- Same ingredient = same name ignoring case, singular/plural, and words like "chopped" or "large" ("Tomatoes" + "tomato" = one line). A recipe planned on two days is counted twice.
- Counts and counted units are added ("2 + 3 = 5", "2 + 3 cloves = 5 cloves").
- Weights and volumes are added, converting if units differ ("500 ml + 500 ml = 1 L", "200 g + 0.5 kg = 700 g"). If only one unit is used it is kept as written ("3 cups").
- Amounts that cannot safely be added are shown side by side, never guessed: "2 + 100 g", "1 tsp + to taste". Ranges ("2-3") use the larger number.
- The displayed name is a spelling that appears in the recipes. Quantities in recipes are free text, so unusual wording ends up listed as written.

Everything is scoped to the logged-in user; another user's plans, entries and lists return `404`, the same as missing ones. Run `npm run db:migrate` to create the new tables (`MealPlan`, `MealPlanEntry`, `ShoppingList`, `ShoppingListItem`).

### Rate limiting

Limits are counted in the server's memory and use `express-rate-limit`. Blocked requests get `429` with the usual JSON error plus `Retry-After`.

| What | Default | Counted per |
| --- | --- | --- |
| Recipe generation and transformation (both call the AI; one shared budget; invalid requests count too) | 20 per 15 minutes | logged-in user |
| Failed logins (successful logins never count; a locked-out IP is refused even with the right password) | 10 per 15 minutes | IP address |
| Sign-ups | 10 per 15 minutes | IP address |

Change them with `AI_RATE_LIMIT_MAX`, `AI_RATE_LIMIT_WINDOW_MINUTES`, `AUTH_RATE_LIMIT_MAX` and `AUTH_RATE_LIMIT_WINDOW_MINUTES` in `backend/.env`. Invalid values stop the server at startup. **Behind a reverse proxy or hosting platform, set `TRUST_PROXY` to the number of proxies in front of the API** (usually `1`); otherwise every visitor looks like the same IP and shares one login limit. Do not set it when the API is reached directly, because then clients could fake their IP. Counters reset when the server restarts and are not shared between several server instances (that would need a shared store such as Redis).

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

The backend uses PostgreSQL through Prisma (schema: `backend/prisma/schema.prisma`). Tables: `User`, `Recipe`, `RecipeIngredient`, `RecipeInstruction`, `Favorite`, `MealPlan`, `MealPlanEntry`, `ShoppingList` and `ShoppingListItem`. Run `npm run db:migrate` after pulling changes to apply new migrations (the latest adds the meal planner and shopping list tables).

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

Frontend routes: `/` (generator), `/recipes` (library with search and difficulty filter), `/favorites` (the same dashboard limited to favorites), `/recipes/:id` (details, favorite and delete), `/meal-plans`, `/meal-plans/:id` (week view), `/shopping-lists`, `/shopping-lists/:id`, `/login`, `/register`. All except the last two are wrapped in `ProtectedRoute`. Auth state lives in `src/auth/AuthProvider.jsx` (`useAuth()`), which asks `GET /api/auth/me` on load and tracks `loading`, `authenticated`, `unauthenticated` and `error`.

### NOTES
- The model may introduce extra pantry ingredients; this is intentional.
- Model quality varies. Check your chosen `HF_MODEL` with a real token; if it often fails validation, the server logs `[recipe-ai] attempt ... rejected: <reason>` to help tune the prompt.
- Recipe text from the model is stored and displayed as plain text only.

### Future Improvements
- Token revocation (server-side sessions or a token version).
