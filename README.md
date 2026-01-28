# AI-First Personal Finance Tracker (PWA & Serverless)

A private, offline-first personal finance tracker built as a React PWA, backed by a secure Serverless Backend for AI and Cloud Storage orchestration.

## 🚀 Key Features
- **Offline-First**: Track expenses anywhere, even without internet.
- **AI-Powered**: Natural language expense entry using Google Gemini (via secure backend).
- **Secure Cloud Storage**: Direct uploads to Cloudflare R2 using presigned URLs.
- **Privacy-Centric**: "Bring Your Own Key" architecture for local data, with backend acting as a secure proxy.
- **Admin License Management**: Dedicated API for creating, updating, and managing user licenses.
- **Observability**: Integrated Sentry error tracking.

## 🛠 Tech Stack
- **Frontend**: React (TypeScript), Vite, Tailwind-like CSS, Lucide Icons.
- **Backend**: Cloudflare Pages Functions (Hono Framework).
- **Data**: IndexedDB (Local), Cloudflare KV (Licenses), Cloudflare R2 (Receipts).
- **Storage Interface**: AWS SDK v3 (configured for Cloudflare R2 compatibility using S3 API).
- **AI**: Google Gemini 2.0 Flash.

## ⚙️ Setup & Configuration

### 1. Environment Variables
Copy the template files to create your local configuration:
```bash
cp .env.copy .env
cp .dev.vars.copy .dev.vars
```

To run the full stack (Frontend + Backend), configure these variables in your deployment platform (Cloudflare Pages) or `.dev.vars` for local development:

| Variable | Description | Required |
| :--- | :--- | :--- |
| `VITE_GA_ID` | Google Analytics Measurement ID (e.g., `G-XXXXX`). | No |
| `VITE_SENTRY_DSN` | Sentry DSN URL for error tracking. | No |
| `VITE_GEMINI_API_KEY` | Google Gemini API Key. | **Yes** (Backend) |
| `LICENSE_STORE` | Cloudflare KV Namespace ID. | **Yes** (Backend) |
| `R2_ACCESS_KEY_ID` | R2 Access Key ID (for AWS SDK authentication). | **Yes** (Backend) |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Access Key. | **Yes** (Backend) |
| `R2_BUCKET_NAME` | R2 Bucket Name (e.g., `belanja-storage`). | **Yes** (Backend) |
| `R2_ENDPOINT_URL` | R2 S3 API Endpoint (e.g., `https://<account_id>.r2.cloudflarestorage.com`). | **Yes** (Backend) |
| `ADMIN_SECRET` | Secret key for Admin API access. | **Yes** (Backend) |

### 2. Installation
```bash
npm install
```

### 3. Development
Run the frontend and backend locally:
```bash
npm run dev
```
*   Frontend: `http://localhost:5173`
*   Backend: `http://localhost:8788` (if using `wrangler pages dev`)

## 🧪 Testing

### Automated Tests
Run the full test suite (covering both Frontend components and Backend functions):
```bash
npm test
```
*Powered by Vitest*

### Manual Testing
- **API Docs (Swagger UI)**: Access `http://localhost:8788/api/docs` (or your production URL) to interactively test backend endpoints.

## 🌍 Deployment & Environments

### 1. Environments Overview
We use a three-tier environment strategy to ensure stability.

| Environment | Purpose | URL | Deploy Command | Config Source |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | Development & Testing | `localhost:8788` | `npm run dev` | `.dev.vars` / `.env` |
| **Staging** | Pre-production testing | `staging.personal-finance-tracker.pages.dev` | `npm run deploy:staging` | Dashboard / `.env.staging` |
| **Production** | Live User App | `personal-finance-tracker.pages.dev` | `npm run deploy` | Dashboard / `.env.production` |

### 2. Setting Up Staging
To create a safe testing ground:
1.  **Create Project**: Go to Cloudflare Dashboard > Workers & Pages > Create Application > Pages > Create Connect to Git (or CLI). Name it `personal-finance-tracker-staging`.
2.  **Configure Vars**: Copy your secrets (Section 1) into this new project's **Settings > Environment variables**.
3.  **Bind KV**: Create a separate KV Namespace (e.g., `LICENSE_STORE_STAGING`) and bind it to `LICENSE_STORE` in the staging project settings.
4.  **Local Build Config**:
    -   Create `.env.staging` with `VITE_API_URL=https://staging.personal-finance-tracker.pages.dev`
    -   Create `.env.production` with `VITE_API_URL=https://personal-finance-tracker.pages.dev`
    -   *Note*: `npm run deploy:staging` uses `vite build --mode staging` which loads `.env.staging`.

### 3. Deployment Methods

#### Method 1: CLI Deployment (Updates & Staging)
To deploy to **Staging**:
```bash
npm run deploy:staging
```

To deploy to **Production**:
```bash
npm run deploy
```

#### Method 1.5: CLI Deployment & Secret Management (Advanced)
If you prefer to manage everything via terminal instead of the Dashboard:

**1. Configure Secrets (First Time Only)**
Upload your secrets to Cloudflare directly via CLI. You must do this for each environment (Staging/Production).

```bash
# For Staging
npx wrangler pages secret put VITE_GEMINI_API_KEY --project-name personal-finance-tracker-staging
npx wrangler pages secret put R2_ACCESS_KEY_ID --project-name personal-finance-tracker-staging
npx wrangler pages secret put R2_SECRET_ACCESS_KEY --project-name personal-finance-tracker-staging
npx wrangler pages secret put R2_BUCKET_NAME --project-name personal-finance-tracker-staging
npx wrangler pages secret put R2_ENDPOINT_URL --project-name personal-finance-tracker-staging
npx wrangler pages secret put ADMIN_SECRET --project-name personal-finance-tracker-staging

# For Production (remove --project-name to use default from wrangler.toml or specify it)
npx wrangler pages secret put VITE_GEMINI_API_KEY --project-name personal-finance-tracker
# ... repeat for all secrets
```

**2. Configure KV Binding**
Since Pages `wrangler.toml` doesn't support custom environments like `staging`:
- Go to **Cloudflare Dashboard > Pages > personal-finance-tracker-staging**.
- Settings > Functions > KV Namespace Bindings.
- Add `LICENSE_STORE` bound to your Staging KV.

**3. Deploy**
```bash
npm run deploy:staging
```

#### Method 2: Git Integration (Production)
1.  **Connect Repository**: Link your GitHub/GitLab repo to Cloudflare Pages (Production Project).
2.  **Build Settings**:
    -   **Framework Preset**: `Vite`
    -   **Build Command**: `npm run build`
    -   **Output Directory**: `dist`
3.  **Environment Variables**:
    -   Go to **Settings > Environment variables**.
    -   Add **Production** variables.
4.  **KV Namespace Binding**:
    -   Go to **Settings > Functions > KV Namespace Bindings**.
    -   **Variable Name**: `LICENSE_STORE`
    -   **KV Namespace**: Select you Production KV.
5.  **Deploy**: Push to `main`.

## 🔒 Security & Privacy
- **Local Secret Management**: Personal secrets are stored in IndexedDB.
- **Serverless Proxy**: Sensitive API keys (Gemini, AWS) are stored securely in Cloudflare environment variables, never exposed to the client.
- **Strict CORS**: Backend enforces strict origin checks (Localhost + Production Domain).
