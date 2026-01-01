# AI-First Personal Finance Tracker (PWA & Serverless)

A private, offline-first personal finance tracker built as a React PWA, backed by a secure Serverless Backend for AI and Cloud Storage orchestration.

## 🚀 Key Features
- **Offline-First**: Track expenses anywhere, even without internet.
- **AI-Powered**: Natural language expense entry using Google Gemini (via secure backend).
- **Secure Cloud Storage**: Direct uploads to AWS S3 using presigned URLs.
- **Privacy-Centric**: "Bring Your Own Key" architecture for local data, with backend acting as a secure proxy.
- **Observability**: Integrated Sentry error tracking and Admin API.

## 🛠 Tech Stack
- **Frontend**: React (TypeScript), Vite, Tailwind-like CSS, Lucide Icons.
- **Backend**: Cloudflare Pages Functions (Hono Framework).
- **Data**: IndexedDB (Local), Cloudflare KV (Licenses), AWS S3 (Receipts).
- **AI**: Google Gemini 2.0 Flash.

## ⚙️ Setup & Configuration

### 1. Environment Variables
To run the full stack (Frontend + Backend), configure these variables in your deployment platform (Cloudflare Pages) or `.dev.vars` for local development:

| Variable | Description | Required |
| :--- | :--- | :--- |
| `VITE_GA_ID` | Google Analytics Measurement ID (e.g., `G-XXXXX`). | No |
| `VITE_SENTRY_DSN` | Sentry DSN URL for error tracking. | No |
| `VITE_GEMINI_API_KEY` | Google Gemini API Key. | **Yes** (Backend) |
| `LICENSE_STORE` | Cloudflare KV Namespace ID. | **Yes** (Backend) |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key for S3. | **Yes** (Backend) |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key. | **Yes** (Backend) |
| `AWS_BUCKET_NAME` | S3 Bucket Name. | **Yes** (Backend) |
| `AWS_REGION` | AWS Region (e.g., `us-east-1`). | **Yes** (Backend) |
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
Run the full test suite (Unit & Integration):
```bash
# Frontend Tests
npm test

# Backend Functions Tests
npx vitest run functions
```

### Manual Testing
- **API Docs (Swagger UI)**: Access `http://localhost:8788/api/docs` (or your production URL) to interactively test backend endpoints.

## 🌍 Deployment (Cloudflare Pages)

### Method 1: CLI Deployment (Recommended)
1.  **Login**: `npx wrangler login`
2.  **Deploy**:
    ```bash
    npm run deploy
    ```

### Method 2: Git Integration
Connect your repository to Cloudflare Pages.
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`
*   **Functions**: Automatically detected in `/functions`.

## 🔒 Security & Privacy
- **Local Secret Management**: Personal secrets are stored in IndexedDB.
- **Serverless Proxy**: Sensitive API keys (Gemini, AWS) are stored securely in Cloudflare environment variables, never exposed to the client.
- **Strict CORS**: Backend enforces strict origin checks (Localhost + Production Domain).
