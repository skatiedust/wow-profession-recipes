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
  - [ ] 3.5 Create `backend/src/seed.ts` — reads each JSON file from `data/recipes/`, upserts recipes into the `recipes` table, and soft-deletes recipes no longer in the JSON (set a `deleted_at` column rather than removing rows)
  - [ ] 3.6 Add npm scripts: `migrate` and `seed` in `backend/package.json` that run the migration and seed scripts respectively
  - [ ] 3.7 Run the migration and seed scripts against the live Cloud SQL instance and verify the tables and data exist
  - [ ] 3.8 Write tests for `seed.ts` — verify JSON parsing, upsert logic, and soft-delete behavior using a test database or mocked pool

- [ ] 4.0 Backend API — Authentication and character management
  - [ ] 4.1 Register a Battle.net OAuth application at the Blizzard developer portal; note the client ID, client secret, and configure the redirect URI to point at the backend's callback route
  - [ ] 4.2 Create `backend/src/routes/auth.ts` — implement `GET /api/auth/login` (redirects to Battle.net OAuth authorize URL), `GET /api/auth/callback` (exchanges code for token, creates/updates user record, sets session), and `POST /api/auth/logout` (destroys session)
  - [ ] 4.3 Create `backend/src/middleware/auth.ts` — middleware that checks for a valid session and attaches the user to `req.user`; returns 401 if not authenticated
  - [ ] 4.4 Add a `GET /api/auth/me` route that returns the currently logged-in user's info (BattleTag, user ID) or 401 if not logged in
  - [ ] 4.5 Create `backend/src/services/blizzard.ts` — functions to exchange an OAuth code for an access token, and to fetch the user's WoW Classic character list from the Blizzard API using the access token
  - [ ] 4.6 Create `backend/src/routes/characters.ts` — implement `GET /api/characters` (returns the logged-in user's saved characters), `POST /api/characters` (creates a new character with name, realm, profession_id — used for manual entry or after selecting from Blizzard API list), and `DELETE /api/characters/:id` (removes a character belonging to the current user)
  - [ ] 4.7 Add a `GET /api/characters/import` route that calls the Blizzard API to fetch the user's character list and returns it (not yet saved); if the API fails or returns empty, return an empty array so the frontend can show the manual entry fallback
  - [ ] 4.8 Deploy the backend to Cloud Run and test the full OAuth login flow end-to-end in a browser (login → callback → session → /api/auth/me)
  - [ ] 4.9 Write tests for auth routes (mock OAuth flow), auth middleware (valid/invalid sessions), and the Blizzard API service (mock HTTP responses)

- [ ] 5.0 Backend API — Recipe endpoints (checklist and public browse)
  - [ ] 5.1 Add to `backend/src/routes/recipes.ts` — `GET /api/recipes?profession_id=X` — returns all non-deleted recipes for a profession, each with an array of character names/realms who know it (public, no auth required)
  - [ ] 5.2 Add `GET /api/recipes/checklist?character_id=X` — returns all recipes for the character's profession, each with a boolean `known` flag indicating if the character has it (auth required, character must belong to current user)
  - [ ] 5.3 Add `POST /api/recipes/checklist` — accepts `{ character_id, recipe_id, known: boolean }` and inserts or deletes the `character_recipes` row accordingly (auth required)
  - [ ] 5.4 Add `GET /api/professions` — returns the list of all professions with id, name, and icon_url (public, no auth)
  - [ ] 5.5 Deploy and test: verify the public recipe list returns recipes with crafter names, and the checklist toggle persists correctly
  - [ ] 5.6 Write tests for all recipe routes — mock the database layer and verify correct SQL queries, auth enforcement, and response shapes

- [ ] 6.0 Frontend — Public recipe browse and search
  - [ ] 6.1 Set up global styles in `frontend/src/styles/global.css` — dark background, light text, gold accent color (`#FFD100` or similar), responsive typography, and CSS variables for the theme
  - [ ] 6.2 Create `frontend/src/App.tsx` with React Router — routes for `/` (home), `/profession/:id` (recipe list), and `/my-recipes` (authenticated checklist)
  - [ ] 6.3 Create `frontend/src/pages/HomePage.tsx` — displays a grid of profession icons/names using the `ProfessionPicker` component; fetches from `GET /api/professions`
  - [ ] 6.4 Create `frontend/src/components/ProfessionPicker.tsx` — renders profession cards/buttons with icons and names; clicking navigates to `/profession/:id`
  - [ ] 6.5 Create `frontend/src/pages/ProfessionPage.tsx` — fetches recipes from `GET /api/recipes?profession_id=X`, displays them using `RecipeList`, and includes `RecipeSearch` at the top
  - [ ] 6.6 Create `frontend/src/components/RecipeList.tsx` — renders a table or card list of recipes showing name, source, zone, reputation requirement, and a list of character names who know it; shows "No crafters yet" if the crafter list is empty
  - [ ] 6.7 Create `frontend/src/components/RecipeSearch.tsx` — a search input that filters the recipe list by name in real time (client-side); passes the filter string up to the parent via a callback
  - [ ] 6.8 Create `frontend/src/hooks/useRecipes.ts` — hook that fetches recipes for a profession and exposes the data, loading state, and a filter function
  - [ ] 6.9 Add a navigation header with the app name, a link back to home, and the login button (placeholder for now)
  - [ ] 6.10 Deploy the frontend to Cloud Run and verify the public browse flow works end-to-end with live data
  - [ ] 6.11 Write tests for `HomePage`, `ProfessionPage`, `RecipeList`, and `RecipeSearch` — mock API responses and verify rendering and filter behavior

- [ ] 7.0 Frontend — Authentication, character management, and recipe checklist
  - [ ] 7.1 Create `frontend/src/hooks/useAuth.ts` — a React context + hook that calls `GET /api/auth/me` on mount to determine if the user is logged in; exposes `user`, `isLoggedIn`, `login()` (redirects to `/api/auth/login`), and `logout()` (calls `/api/auth/logout`)
  - [ ] 7.2 Create `frontend/src/components/LoginButton.tsx` — shows "Login with Battle.net" when logged out, and the user's BattleTag + "Logout" when logged in
  - [ ] 7.3 Create `frontend/src/hooks/useCharacters.ts` — hook that fetches the user's saved characters (`GET /api/characters`), exposes import from Blizzard (`GET /api/characters/import`), and save/delete functions
  - [ ] 7.4 Create `frontend/src/components/CharacterSelector.tsx` — displays the user's saved characters as a list; includes an "Import from Battle.net" button that fetches and displays importable characters; includes a manual entry form (name, realm, profession dropdown) as a fallback or alternative
  - [ ] 7.5 Create `frontend/src/pages/MyRecipesPage.tsx` — authenticated page: if not logged in, prompt to log in; if logged in, show `CharacterSelector`; once a character is selected, show `RecipeChecklist` for that character's profession
  - [ ] 7.6 Create `frontend/src/components/RecipeChecklist.tsx` — fetches the checklist from `GET /api/recipes/checklist?character_id=X`, renders checkboxes for each recipe with name and metadata; toggling a checkbox calls `POST /api/recipes/checklist` with optimistic UI update
  - [ ] 7.7 Add route protection: the `/my-recipes` route should redirect to login if the user is not authenticated
  - [ ] 7.8 Deploy and test the full authenticated flow end-to-end: login → import characters → select character → toggle recipes → verify changes appear on the public browse page
  - [ ] 7.9 Write tests for `LoginButton`, `CharacterSelector`, `MyRecipesPage`, and `RecipeChecklist` — mock auth state and API calls, verify UI states for logged-in/logged-out, optimistic toggle behavior
