## Relevant Files

- `package.json` - Root package.json for monorepo workspace configuration
- `backend/package.json` - Backend dependencies and scripts
- `backend/tsconfig.json` - Backend TypeScript configuration
- `backend/src/index.ts` - Express app entry point
- `backend/src/index.test.ts` - Tests for Express app startup and health endpoint
- `backend/src/config.ts` - Environment variable and configuration loading
- `backend/src/db.ts` - PostgreSQL connection pool setup (e.g., using `pg` or Knex)
- `backend/src/db.test.ts` - Tests for database connection and query helpers
- `backend/src/migrate.ts` - Database migration runner script
- `backend/src/seed.ts` - Recipe seed script that reads JSON files and upserts into DB
- `backend/src/seed.test.ts` - Tests for seed logic (parsing JSON, upserting)
- `backend/src/routes/auth.ts` - Battle.net OAuth login/logout/callback routes
- `backend/src/routes/auth.test.ts` - Tests for OAuth flow and session management
- `backend/src/routes/characters.ts` - Character CRUD and Blizzard API character fetch routes
- `backend/src/routes/characters.test.ts` - Tests for character routes
- `backend/src/routes/recipes.ts` - Recipe checklist toggle and public browse/search routes
- `backend/src/routes/recipes.test.ts` - Tests for recipe routes
- `backend/src/middleware/auth.ts` - Authentication middleware (session/JWT verification)
- `backend/src/middleware/auth.test.ts` - Tests for auth middleware
- `backend/src/services/blizzard.ts` - Blizzard API client (OAuth token exchange, character list fetch)
- `backend/src/services/blizzard.test.ts` - Tests for Blizzard API client
- `frontend/package.json` - Frontend dependencies and scripts
- `frontend/tsconfig.json` - Frontend TypeScript configuration
- `frontend/vite.config.ts` - Vite configuration (proxy, build settings)
- `frontend/index.html` - HTML entry point
- `frontend/src/main.tsx` - React app entry point
- `frontend/src/App.tsx` - Root component with routing
- `frontend/src/App.test.tsx` - Tests for root component and routing
- `frontend/src/pages/HomePage.tsx` - Profession picker landing page
- `frontend/src/pages/HomePage.test.tsx` - Tests for HomePage
- `frontend/src/pages/ProfessionPage.tsx` - Public recipe list with search for a profession
- `frontend/src/pages/ProfessionPage.test.tsx` - Tests for ProfessionPage
- `frontend/src/pages/MyRecipesPage.tsx` - Authenticated recipe checklist page
- `frontend/src/pages/MyRecipesPage.test.tsx` - Tests for MyRecipesPage
- `frontend/src/components/ProfessionPicker.tsx` - Profession icon grid component
- `frontend/src/components/RecipeList.tsx` - Recipe table/list with crafter names
- `frontend/src/components/RecipeSearch.tsx` - Search/filter input component
- `frontend/src/components/RecipeChecklist.tsx` - Checkbox list for toggling known recipes
- `frontend/src/components/CharacterSelector.tsx` - Character picker (API list + manual fallback)
- `frontend/src/components/LoginButton.tsx` - Battle.net login/logout button
- `frontend/src/hooks/useAuth.ts` - Auth context and hook for current user state
- `frontend/src/hooks/useRecipes.ts` - Hook for fetching and filtering recipes
- `frontend/src/hooks/useCharacters.ts` - Hook for fetching and managing characters
- `frontend/src/styles/global.css` - Global dark theme styles, gold accent variables
- `data/recipes/alchemy.json` - Curated rare Alchemy recipe seed data
- `data/recipes/blacksmithing.json` - Curated rare Blacksmithing recipe seed data
- `data/recipes/enchanting.json` - Curated rare Enchanting recipe seed data
- `data/recipes/engineering.json` - Curated rare Engineering recipe seed data
- `data/recipes/jewelcrafting.json` - Curated rare Jewelcrafting recipe seed data
- `data/recipes/leatherworking.json` - Curated rare Leatherworking recipe seed data
- `data/recipes/tailoring.json` - Curated rare Tailoring recipe seed data
- `data/recipes/cooking.json` - Curated rare Cooking recipe seed data
- `terraform/main.tf` - Root Terraform config (provider, modules)
- `terraform/variables.tf` - Input variables (project ID, region, Battle.net credentials)
- `terraform/outputs.tf` - Output values (Cloud Run URLs, Cloud SQL connection)
- `terraform/modules/cloud-run/main.tf` - Cloud Run service module
- `terraform/modules/cloud-sql/main.tf` - Cloud SQL PostgreSQL instance module
- `terraform/modules/secrets/main.tf` - Secret Manager module
- `terraform/modules/networking/main.tf` - VPC connector and networking module
- `addon/ProfessionExporter/ProfessionExporter.toc` - WoW addon table of contents file
- `addon/ProfessionExporter/ProfessionExporter.lua` - WoW addon Lua source (slash command, trade skill scan, JSON export frame)
- `addon/ProfessionExporter/README.md` - Addon installation and usage instructions
- `frontend/src/components/ImportRecipes.tsx` - Modal for pasting and importing addon JSON
- `frontend/src/components/ImportRecipes.test.tsx` - Tests for ImportRecipes component

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- No Docker is used. Cloud Run deployments use `gcloud run deploy --source .` with Google Cloud Buildpacks.
- The frontend dev server proxies API requests to the backend via Vite's proxy config for local development.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/wow-profession-recipes`)

- [x] 1.0 Project scaffolding and dev environment setup
  - [x] 1.1 Initialize the root `package.json` with npm workspaces configured for `backend` and `frontend`
  - [x] 1.2 Scaffold the backend: create `backend/package.json`, install Express, TypeScript, `ts-node`, `pg`, `cors`, `dotenv`, `express-session` and dev dependencies (`@types/*`, `jest`, `ts-jest`)
  - [x] 1.3 Create `backend/tsconfig.json` with strict TypeScript settings and ES module output
  - [x] 1.4 Create `backend/src/index.ts` with a minimal Express server that listens on `PORT` env var and has a `GET /health` endpoint returning `{ status: "ok" }`
  - [x] 1.5 Scaffold the frontend: create `frontend/package.json`, install React, React Router, TypeScript, Vite, and dev dependencies
  - [x] 1.6 Initialize the Vite project: `frontend/vite.config.ts`, `frontend/index.html`, `frontend/src/main.tsx` with a placeholder `<App />` component
  - [x] 1.7 Configure Vite to proxy `/api` requests to the backend (e.g., `http://localhost:3000`) for local development
  - [x] 1.8 Add root-level npm scripts: `dev:backend`, `dev:frontend`, `build:backend`, `build:frontend`
  - [x] 1.9 Create a `.env.example` file documenting all required environment variables (PORT, DATABASE_URL, BNET_CLIENT_ID, BNET_CLIENT_SECRET, SESSION_SECRET, FRONTEND_URL)
  - [x] 1.10 Verify local dev: run backend and frontend simultaneously, confirm the health endpoint responds and the React app loads

- [x] 2.0 Terraform infrastructure and GCP deployment pipeline
  - [x] 2.1 Create `terraform/variables.tf` with input variables: `gcp_project_id`, `gcp_region`, `bnet_client_id`, `bnet_client_secret`, `database_password`
  - [x] 2.2 Create `terraform/main.tf` with the Google provider configuration and references to child modules
  - [x] 2.3 Create `terraform/modules/networking/main.tf` — VPC, subnet, and Serverless VPC Access connector for Cloud Run to reach Cloud SQL via private IP
  - [x] 2.4 Create `terraform/modules/cloud-sql/main.tf` — Cloud SQL PostgreSQL instance (db-f1-micro), database, and user; output connection name and private IP
  - [x] 2.5 Create `terraform/modules/secrets/main.tf` — Secret Manager secrets for `BNET_CLIENT_ID`, `BNET_CLIENT_SECRET`, `SESSION_SECRET`, and `DATABASE_URL`; output secret resource IDs
  - [x] 2.6 Create `terraform/modules/cloud-run/main.tf` — parameterized Cloud Run service module (used for both backend and frontend); accept image/source, env vars, secret references, VPC connector, and Cloud SQL connection
  - [x] 2.7 Wire up the backend Cloud Run service in `terraform/main.tf` using the cloud-run module, passing Cloud SQL connection, secret references, and VPC connector
  - [x] 2.8 Wire up the frontend Cloud Run service in `terraform/main.tf` using the cloud-run module, passing the backend URL as an env var
  - [x] 2.9 Create `terraform/outputs.tf` — output the frontend URL, backend URL, and Cloud SQL connection name
  - [x] 2.10 Add IAM bindings: Cloud Run invoker (allUsers for public access), Cloud SQL client role for backend service account, Secret Manager accessor for backend service account
  - [x] 2.11 Run `terraform init` and `terraform plan` to validate the configuration
  - [x] 2.12 Run `terraform apply` to provision infrastructure, then deploy the skeleton backend and frontend using `gcloud run deploy --source .` and verify the health endpoint is reachable at the Cloud Run URL

- [ ] 3.0 Database schema, migrations, and recipe seed data
  - [x] 3.1 Create `backend/src/db.ts` — a connection pool using `pg.Pool` configured from `DATABASE_URL` env var
  - [x] 3.2 Create `backend/src/migrate.ts` — a migration script that creates the `users`, `characters`, `professions`, `recipes`, and `character_recipes` tables with the schema from the PRD data model; include `created_at`/`updated_at` timestamps
  - [x] 3.3 Include an `INSERT` in the migration for the 8 TBC professions (Alchemy, Blacksmithing, Enchanting, Engineering, Jewelcrafting, Leatherworking, Tailoring, Cooking) with placeholder icon URLs
  - [x] 3.4 Create the `data/recipes/` directory and add JSON seed files for each profession (at minimum, a few example recipes per profession with `name`, `source`, `zone`, `reputation_requirement`, and `dropped_by` fields)
  - [x] 3.5 Create `backend/src/seed.ts` — reads each JSON file from `data/recipes/`, upserts recipes into the `recipes` table, and soft-deletes recipes no longer in the JSON (set a `deleted_at` column rather than removing rows)
  - [x] 3.6 Add npm scripts: `migrate` and `seed` in `backend/package.json` that run the migration and seed scripts respectively
  - [x] 3.7 Run the migration and seed scripts against the live Cloud SQL instance and verify the tables and data exist
  - [x] 3.8 Write tests for `seed.ts` — verify JSON parsing, upsert logic, and soft-delete behavior using a test database or mocked pool

- [ ] 4.0 Backend API — Authentication and character management
  - [x] 4.1 Register a Battle.net OAuth application at the Blizzard developer portal; note the client ID, client secret, and configure the redirect URI to point at the backend's callback route
  - [x] 4.2 Create `backend/src/routes/auth.ts` — implement `GET /api/auth/login` (redirects to Battle.net OAuth authorize URL), `GET /api/auth/callback` (exchanges code for token, creates/updates user record, sets session), and `POST /api/auth/logout` (destroys session)
  - [x] 4.3 Create `backend/src/middleware/auth.ts` — middleware that checks for a valid session and attaches the user to `req.user`; returns 401 if not authenticated
  - [x] 4.4 Add a `GET /api/auth/me` route that returns the currently logged-in user's info (BattleTag, user ID) or 401 if not logged in
  - [x] 4.5 Create `backend/src/services/blizzard.ts` — functions to exchange an OAuth code for an access token, and to fetch the user's WoW Classic character list from the Blizzard API using the access token
  - [x] 4.6 Create `backend/src/routes/characters.ts` — implement `GET /api/characters` (returns the logged-in user's saved characters), `POST /api/characters` (creates a new character with name, realm, profession_id — used for manual entry or after selecting from Blizzard API list), and `DELETE /api/characters/:id` (removes a character belonging to the current user)
  - [x] 4.7 Add a `GET /api/characters/import` route that calls the Blizzard API to fetch the user's character list and returns it (not yet saved); if the API fails or returns empty, return an empty array so the frontend can show the manual entry fallback
  - [x] 4.8 Deploy the backend to Cloud Run and test the full OAuth login flow end-to-end in a browser (login → callback → session → /api/auth/me)
  - [x] 4.9 Write tests for auth routes (mock OAuth flow), auth middleware (valid/invalid sessions), and the Blizzard API service (mock HTTP responses)

- [ ] 5.0 Frontend — Minimal UI for testing auth and character endpoints (no styling)
  - [x] 5.1 Create `frontend/src/hooks/useAuth.ts` — a React context + hook that calls `GET /api/auth/me` on mount to determine if the user is logged in; exposes `user`, `isLoggedIn`, `login()` (redirects to `/api/auth/login`), and `logout()` (calls `POST /api/auth/logout`)
  - [x] 5.2 Create `frontend/src/components/LoginButton.tsx` — shows "Login with Battle.net" when logged out, and the user's BattleTag + "Logout" when logged in
  - [x] 5.3 Create `frontend/src/hooks/useCharacters.ts` — hook that fetches the user's saved characters (`GET /api/characters`), exposes import from Blizzard (`GET /api/characters/import`), and create (`POST /api/characters`) / delete (`DELETE /api/characters/:id`) functions
  - [x] 5.4 Create `frontend/src/components/CharacterManager.tsx` — list saved characters with a delete button each, an "Import from Battle.net" button that fetches and displays importable characters, and a manual add form (name, realm fields)
  - [x] 5.5 Wire up `frontend/src/App.tsx` with React Router and `AuthProvider` — `/` shows `LoginButton` and, when logged in, the `CharacterManager`; when logged out, prompt to log in
  - [x] 5.6 Deploy frontend to Cloud Run and test the full flow in a browser (login → view characters → import from Blizzard → add/delete character → logout)

- [x] 6.0 Backend API — Recipe endpoints (checklist and public browse)
  - [x] 6.1 Add to `backend/src/routes/recipes.ts` — `GET /api/recipes?profession_id=X` — returns all non-deleted recipes for a profession, each with an array of character names/realms who know it (public, no auth required)
  - [x] 6.2 Add `GET /api/recipes/checklist?character_id=X` — returns all recipes for the character's profession, each with a boolean `known` flag indicating if the character has it (auth required, character must belong to current user)
  - [x] 6.3 Add `POST /api/recipes/checklist` — accepts `{ character_id, recipe_id, known: boolean }` and inserts or deletes the `character_recipes` row accordingly (auth required)
  - [x] 6.4 Add `GET /api/professions` — returns the list of all professions with id, name, and icon_url (public, no auth)
  - [x] 6.5 Deploy and test: verify the public recipe list returns recipes with crafter names, and the checklist toggle persists correctly
  - [x] 6.6 Write tests for all recipe routes — mock the database layer and verify correct SQL queries, auth enforcement, and response shapes

- [ ] 7.0 Frontend — Styling, public recipe browse, and recipe checklist
  - [x] 7.1 Set up global styles in `frontend/src/styles/global.css` — dark background, light text, gold accent color, responsive typography, and CSS variables for the theme
  - [x] 7.2 Create `frontend/src/components/AppShell.tsx` — top-level layout with three zones: fixed top bar, left sidebar (240px, collapsible on mobile), and main content panel. Wire into `App.tsx`, replacing React Router routes with a single-shell view
  - [x] 7.3 Create `frontend/src/components/TopBar.tsx` — site name (Cormorant Garamond), global search input (prominent, debounced), login/logout button (Battle.net), user BattleTag when logged in. Nothing else
  - [x] 7.4 Create `frontend/src/components/Sidebar.tsx` and `frontend/src/hooks/useProfessions.ts` — fetch professions from `GET /api/professions`, render a vertical list of profession names/icons, selected profession highlighted with gold accent, collapsible into a drawer on mobile (hamburger toggle in TopBar)
  - [x] 7.5 Create `frontend/src/hooks/useRecipes.ts` — fetch recipes for the selected profession via `GET /api/recipes?profession_id=X`, expose data, loading state, and a client-side search/filter function (debounced, driven by the global search input in TopBar)
  - [x] 7.6 Create `frontend/src/components/RecipeTable.tsx` — the core UI. Columns: (1) Recipe Name tinted by rarity color, (2) Quality as a small rarity badge, (3) Crafters — names inline with "+N more" if >2 and expandable, (4) "You" column (checkbox/toggle, only rendered when logged in). Sticky header, 48px rows, subtle gold hover, alternating row shading. On mobile, converts to a stacked card list
  - [x] 7.7 Create `frontend/src/components/CrafterList.tsx` — renders the inline list of crafter names for a recipe row; shows first 2, then a "+N more" button that expands inline to reveal the rest
  - [x] 7.8 Create `frontend/src/components/CharacterSelector.tsx` — compact dropdown (in TopBar or above the recipe table) for logged-in users to pick which character they're toggling recipes for; fetches from existing `useCharacters` hook; if the selected character has no profession matching the sidebar selection, shows a prompt
  - [x] 7.9 Create `frontend/src/hooks/useChecklist.ts` — when a character is selected, fetches `GET /api/recipes/checklist?character_id=X` and merges `known` flags into the recipe list; exposes a `toggleRecipe(recipeId, known)` function with optimistic UI update, calls `POST /api/recipes/checklist`, and reverts on failure
  - [x] 7.10 Create `frontend/src/components/Toast.tsx` and `frontend/src/hooks/useToast.ts` — notification at bottom-right on recipe toggle ("Recipe added to your profile." / "Recipe removed from your profile."); uses `.toast` / `.toast.visible` CSS classes from `global.css`; fades in/out with 200ms transitions
  - [x] 7.11 Mobile responsive polish — sidebar collapses into a slide-out drawer with hamburger toggle, recipe table becomes a stacked card list, search stays sticky at top, verify touch targets >= 44px
  - [x] 7.12 Deploy and test the full flow end-to-end: public browse with search, login → select character → toggle recipes → verify changes appear on the public browse page
  - [x] 7.13 Write tests for `AppShell`, `TopBar`, `Sidebar`, `RecipeTable`, `CrafterList`, `CharacterSelector`, `Toast`, `useRecipes`, `useChecklist`, `useProfessions` — mock API responses and auth state, verify rendering, filter behavior, and optimistic toggle

- [ ] 8.0 In-game addon recipe export and app import
  - [ ] 8.1 Create `addon/ProfessionExporter/ProfessionExporter.toc` — addon metadata targeting the TBC Classic interface version, listing `ProfessionExporter.lua` as the sole file
  - [ ] 8.2 Create `addon/ProfessionExporter/ProfessionExporter.lua` — register a `/exportrecipes` slash command that: checks if a trade skill window is open, reads the profession name via `GetTradeSkillLine()`, iterates `GetNumTradeSkills()` entries skipping headers, collects recipe names, builds a JSON string with `character`, `realm`, `profession`, and `recipes` fields, and displays it in a copyable multiline EditBox frame
  - [ ] 8.3 Create `addon/ProfessionExporter/README.md` — installation instructions (copy folder to WoW `Interface/AddOns/`), usage guide (open profession window, type `/exportrecipes`, Ctrl+A → Ctrl+C), and a description of the JSON output format
  - [ ] 8.4 Add `POST /api/recipes/import` route in `backend/src/routes/recipes.ts` — auth required; accepts `{ character, realm, profession, recipes }` JSON body; validates the structure; looks up `profession_id` by name (case-insensitive); finds or creates a `characters` row for the `(user_id, name, realm, profession_id)` tuple; matches incoming recipe names against DB recipes using case-insensitive comparison with prefix stripping (`Recipe: `, `Plans: `, `Formula: `, `Schematic: `, `Design: `, `Pattern: `); bulk-inserts into `character_recipes` with `ON CONFLICT DO NOTHING`; returns `{ character_id, matched, skipped, unmatched }` where `unmatched` lists addon recipe names that didn't match any tracked recipe
  - [ ] 8.5 Write tests for the import endpoint in `backend/src/routes/recipes.test.ts` — cover successful import, prefix stripping, unmatched recipes in response, 401 without auth, and 400 for invalid JSON structure
  - [ ] 8.6 Create `frontend/src/components/ImportRecipes.tsx` — a modal with: brief instructions referencing the addon, a `<textarea>` for pasting JSON, client-side JSON validation with error message, an "Import" button that calls `POST /api/recipes/import`, and a results view showing matched/skipped/unmatched counts with the list of unmatched recipe names
  - [ ] 8.7 Add an "Import from Addon" button to the TopBar (visible only when logged in) that opens the `ImportRecipes` modal; after a successful import, refresh the checklist and recipe data so the UI reflects newly known recipes
  - [ ] 8.8 Write tests for `ImportRecipes` component in `frontend/src/components/ImportRecipes.test.tsx` — mock the fetch call, verify JSON validation feedback, successful import result display, and error handling
  - [ ] 8.9 Update `tasks/prd-wow-profession-recipes.md` and `README.md` to document the addon-based import flow — mention the addon in the project overview, add it to the tech stack, and include setup/usage instructions in the README

- [ ] 9.0 Wowhead recipe tooltips — hover over a recipe name to see what it does
  - [x] 9.1 ~Removed~ — `spell_url` column not needed; the existing `url` column is used for Wowhead links instead
  - [x] 9.2 Ensure recipe entries in `data/recipes/` have a `url` field pointing to the Wowhead TBC page; only add where there isn't a `url` already
  - [x] 9.3 Verified `backend/src/seed.ts` already includes `url` in the `RecipeEntry` interface and both UPDATE and INSERT queries — no `spell_url` needed
  - [x] 9.4 Verified `backend/src/routes/recipes.ts` already includes `r.url` in the SELECT columns and TypeScript result types for both `GET /api/recipes` and `GET /api/recipes/checklist` — no `spell_url` needed
  - [x] 9.5 Verified `frontend/src/hooks/useRecipes.ts` already has `url: string | null` in the `Recipe` interface — no `spell_url` needed
  - [x] 9.6 Add the Wowhead tooltip script to `frontend/index.html` — include `<script>const whTooltips = { colorLinks: false, iconizeLinks: false, renameLinks: false };</script>` and `<script src="https://wow.zamimg.com/js/tooltips.js"></script>` in `<head>`
  - [x] 9.7 Update `frontend/src/components/RecipeTable.tsx` — use `url` as the `<a>` href for recipe names so the Wowhead tooltip shows on hover; add a `useEffect` that calls `window.$WowheadPower.refreshLinks()` whenever the recipe list changes, so newly rendered links get tooltips
  - [ ] 9.8 Run the migration (`npm run migrate` in `backend/`) and seed (`npm run seed` in `backend/`) to add the column and populate `spell_url` values in the database
  - [ ] 9.9 Deploy and verify: hover over a recipe name and confirm the Wowhead tooltip appears showing the spell effect (e.g., an enchanting recipe shows what the enchant does)
