# WoW Guild Profession Recipe Tracker

A lightweight web app for a World of Warcraft: Burning Crusade Anniversary guild to track which members have rare profession recipes. Guild members log in with Battle.net, select a character, and check off recipes they know. Anyone can browse and search for recipes and see who can craft what — no login required.

Designed for easy self-hosting: fork this repo, fill in your credentials, and deploy to Google Cloud with Terraform.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + TypeScript + Express
- **Database:** PostgreSQL (Cloud SQL)
- **Auth:** Battle.net OAuth 2.0
- **Addon:** ProfessionExporter — WoW TBC Anniversary addon for exporting recipes to JSON
- **Infrastructure:** Terraform on Google Cloud (Cloud Run, Cloud SQL, Secret Manager)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Terraform](https://developer.hashicorp.com/terraform/install) (v1.5+)
- [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install)
- A [Google Cloud project](https://console.cloud.google.com/) with billing enabled
- A [Battle.net Developer](https://develop.battle.net/) account

## Local Development Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone <your-fork-url>
   cd wow-professions
   npm install
   ```

2. Copy the environment file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Set `GUILD=Red Sun` (or your guild name). The character selector only shows Blizzard account characters that are also present in that guild's roster.

3. Start the Cloud SQL proxy in a terminal running outside sandbox mode:

   ```bash
   cloud-sql-proxy YOUR_PROJECT_ID:us-central1:wow-professions-db --port 5432
   ```

   > If you use Cursor/Codex terminals, run the proxy in a terminal with full permissions (not sandboxed), or Battle.net OAuth/DNS calls may fail during local auth.

4. Start both servers (also outside sandbox mode):

   ```bash
   npm run dev:backend   # starts Express on port 3000
   npm run dev:frontend  # starts Vite on port 5173, proxies /api to backend
   ```

   The Vite dev server proxies `/api` and `/health` requests to the backend automatically.

## Deploying to Google Cloud

### Step 1: Install tools

On macOS with Homebrew:

```bash
brew install terraform
brew install --cask google-cloud-sdk
```

### Step 2: Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Enable required GCP APIs

```bash
gcloud services enable \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  servicenetworking.googleapis.com \
  cloudresourcemanager.googleapis.com \
  cloudbuild.googleapis.com
```

Wait a minute or two after this completes for the APIs to propagate.

### Step 4: Register a Battle.net OAuth application

1. Go to [https://develop.battle.net/](https://develop.battle.net/) and create a new client.
2. Set the redirect URL to `http://localhost:3000/api/auth/callback` for now. You will add the production redirect URL after the first deploy.
3. Note your **Client ID** and **Client Secret**.

### Step 5: Configure Terraform variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
gcp_project_id     = "your-gcp-project-id"
gcp_region         = "us-central1"
bnet_client_id     = "your-battle-net-client-id"
bnet_client_secret = "your-battle-net-client-secret"
database_password  = "a-strong-random-password"
session_secret     = "a-different-random-string"
frontend_url       = ""
# Optional: set a globally unique name for the public addon downloads bucket.
# addon_artifacts_bucket_name = "my-wow-professions-addon-artifacts"
```

Generate random values for `database_password` and `session_secret`:

```bash
openssl rand -base64 24
```

> **Note:** The `github_repo` variable in `terraform.tfvars.example` is commented out. Leave it that way for manual deploys. Only set it if you plan to use CI/CD (see [CI/CD section](#cicd-with-github-actions-optional) below).

### Step 6: Deploy infrastructure

```bash
terraform init
terraform apply
```

This provisions: a VPC with private networking, a Cloud SQL PostgreSQL instance (takes ~10-15 minutes), Secret Manager secrets, two Cloud Run services (backend + frontend), and all necessary IAM bindings.

When complete, Terraform will output:

```
backend_url  = "https://wow-professions-api-XXXXXXXXXX-uc.a.run.app"
frontend_url = "https://wow-professions-web-XXXXXXXXXX-uc.a.run.app"
cloud_sql_connection_name = "your-project:us-central1:wow-professions-db"
addon_artifacts_bucket_name = "your-project-wow-professions-addon-artifacts"
addon_artifacts_base_url = "https://storage.googleapis.com/your-project-wow-professions-addon-artifacts"
```

### Step 7: Update Battle.net redirect URL

Go back to your Battle.net developer application and add a second redirect URL:

```
https://wow-professions-api-XXXXXXXXXX-uc.a.run.app/api/auth/callback
```

(Replace with your actual backend URL from the Terraform output.)

### Step 8: Set the frontend URL

Update `terraform.tfvars` with your frontend URL:

```hcl
frontend_url = "https://wow-professions-web-XXXXXXXXXX-uc.a.run.app"
```

Then re-apply:

```bash
terraform apply
```

### Step 9: Deploy your application code

Deploy the backend and frontend using source-based deploys (no Docker required):

```bash
# From the repo root
cd backend
gcloud run deploy wow-professions-api --source . --region us-central1

cd ../frontend
gcloud run deploy wow-professions-web --source . --region us-central1
```

### Viewing logs in Google Cloud

The backend emits structured JSON logs to stdout/stderr, which Cloud Run automatically forwards to **Cloud Logging**.

- Open Logs Explorer in your GCP project.
- Filter by service name `wow-professions-api`.
- Each backend response includes an `X-Request-Id` header. Capture that value when reporting issues so you can quickly find all related logs.
- Useful messages include:
  - `http.request.start` / `http.request.finish`
  - `http.request.error`
  - `recipes.import.start` / `recipes.import.finish`
  - `recipes.import.invalid_body`, `recipes.import.guild_restriction`, `recipes.import.unknown_profession`

This makes it easier to troubleshoot unexpected behavior during guild testing, especially addon imports.

## CI/CD with GitHub Actions (Optional)

If you just want to deploy once and manage updates manually with `terraform apply` and `gcloud run deploy`, you can skip this section entirely. Everything above is sufficient for a working deployment.

If you want automated deploys on every merge to `main`, read on.

### What the Workflow Does

Every push to `main` (including merged pull requests) triggers `.github/workflows/deploy.yml`, which:

1. Authenticates to Google Cloud via **Workload Identity Federation** (no service account keys)
2. Runs `terraform apply` to sync infrastructure
3. Packages the `addon/ProfessionExporter` folder and uploads:
   - versioned zip: `releases/<addon-version>/ProfessionExporter-<addon-version>.zip`
   - latest zip: `latest/ProfessionExporter.zip`
4. Deploys the backend and frontend to Cloud Run via `gcloud run deploy --source`

### Setup Steps

#### 1. Enable Workload Identity Federation

Add `github_repo` to your `terraform.tfvars`:

```hcl
github_repo = "your-github-username/your-repo-name"
```

Then apply to provision the WIF pool, provider, and a dedicated service account:

```bash
terraform apply
```

#### 2. Set up remote Terraform state

CI runners don't have local state, so state must live in a GCS bucket. Copy the example and run the bootstrap script:

```bash
cd terraform
cp backend.tf.example backend.tf
# Edit backend.tf to set your bucket name
bash bootstrap.sh
```

This creates the GCS bucket and migrates your existing local state.

#### 3. Add GitHub repository secrets

Go to your repo's Settings > Secrets and variables > Actions, or use the CLI:

| Secret                           | Value                                                        |
| -------------------------------- | ------------------------------------------------------------ |
| `GCP_PROJECT_ID`                 | Your GCP project ID                                          |
| `GCP_REGION`                     | e.g. `us-central1`                                           |
| `TF_STATE_BUCKET`                | Name of your GCS state bucket (e.g. `my-project-tf-state`)   |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | From `terraform output workload_identity_provider`           |
| `GCP_SERVICE_ACCOUNT`            | From `terraform output github_actions_service_account`       |
| `BNET_CLIENT_ID`                 | Your Battle.net OAuth client ID                              |
| `BNET_CLIENT_SECRET`             | Your Battle.net OAuth client secret                          |
| `DATABASE_PASSWORD`              | The Cloud SQL password from your `terraform.tfvars`          |
| `SESSION_SECRET`                 | The session signing secret from your `terraform.tfvars`      |
| `FRONTEND_URL`                   | The frontend Cloud Run URL (from `terraform output frontend_url`) |

You can also set secrets via the CLI: `gh secret set SECRET_NAME --body "value"`

## Importing Recipes from the Addon

Guild members can import their known recipes from the in-game ProfessionExporter addon instead of toggling each recipe manually:

1. **Install the addon:** Download the latest zip from:
   - `https://storage.googleapis.com/<your-addon-bucket>/latest/ProfessionExporter.zip`
   - You can get `<your-addon-bucket>` with: `cd terraform && terraform output -raw addon_artifacts_bucket_name`
   Then copy the `ProfessionExporter` folder into your WoW addons directory:
   - **Windows:** `World of Warcraft\_classic_\Interface\AddOns\ProfessionExporter\`
   - **Mac:** `World of Warcraft/_classic_/Interface/AddOns/ProfessionExporter/`
2. **Export in-game:** Open your profession window (press P, click a profession), type `/exportrecipes`, then copy the JSON (Ctrl+A, Ctrl+C).
3. **Import in the app:** Log in, go to the main page (click "Guild Recipes" if you have a profession selected), and click "Import from Addon". Paste the JSON and click Import.

The addon exports JSON with `character`, `realm`, `profession`, and `recipes` fields. The app matches recipe names (with prefix stripping for "Recipe:", "Plans:", etc.), inserts newly matched recipes, and removes previously known recipes for that character/profession if they are no longer present in the latest import. Recipe import is restricted to characters that are in the configured `GUILD`.

## Project Structure

```
wow-professions/
├── addon/
│   └── ProfessionExporter/     # WoW addon for exporting recipes
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD: Terraform apply + Cloud Run deploy (optional)
├── backend/                  # Express + TypeScript API
│   └── src/
├── frontend/                 # React + TypeScript + Vite
│   └── src/
├── data/
│   └── recipes/              # Curated recipe JSON files (per profession)
├── terraform/                # Infrastructure as code
│   ├── modules/
│   │   ├── cloud-run/
│   │   ├── cloud-sql/
│   │   ├── github-oidc/      # WIF for GitHub Actions (created when github_repo is set)
│   │   ├── networking/
│   │   └── secrets/
│   ├── backend.tf.example    # GCS remote state template (optional, for CI/CD)
│   ├── bootstrap.sh          # One-time GCS state bucket + migration (optional)
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── tasks/                    # PRD and task tracking
├── .env.example              # Local dev environment variables
└── package.json              # npm workspaces root
```

## Managing Recipes

Tracked recipes are maintained as JSON files in `data/recipes/`, one per profession (e.g., `alchemy.json`, `tailoring.json`). Each entry includes:

```json
{
  "name": "Flask of Pure Death",
  "source": "drop",
  "zone": "Serpentshrine Cavern",
  "reputation_requirement": null,
  "dropped_by": ["Hydross the Unstable", "The Lurker Below", "Coilfang Trash"],
  "url": "https://www.wowhead.com/tbc/item=22866/flask-of-pure-death",
  "rarity": "rare"
}
```

| Field                    | Type             | Description                                                    |
| ------------------------ | ---------------- | -------------------------------------------------------------- |
| `name`                   | string           | Recipe name without profession prefix (e.g. "Flask of Pure Death", not "Recipe: Flask of Pure Death") |
| `source`                 | string           | How to obtain: `drop`, `vendor`, `quest`, or `reputation`      |
| `zone`                   | string           | Zone or instance where the recipe is found                     |
| `reputation_requirement` | string \| null   | Faction and standing required, if any                          |
| `dropped_by`             | string[] \| null | Enemies that drop the recipe, if source is `drop`              |
| `url`                    | string \| null   | Wowhead TBC item link                                         |
| `rarity`                 | string \| null   | Item rarity (e.g. `common`, `uncommon`, `rare`, `epic`)        |

To add or remove recipes, edit the JSON files and redeploy. A database seed script reads these files and upserts them into the database. Recipes removed from the JSON are soft-deleted so historical character-recipe links are preserved.
