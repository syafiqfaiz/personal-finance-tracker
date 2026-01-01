# Architecture Decision Record (ADR) - Serverless Backend

**Date:** 2026-01-01
**Status:** Validated

## 1. Decision: Serverless Runtime on Cloudflare Pages Functions

### Context
We need a backend to hide API keys (Gemini, AWS) and manage user licenses. The application is currently a static PWA hosted on Cloudflare Pages.

### Options Considered
*   **Option A: AWS Lambda / API Gateway**: Industry standard but introduces high configuration overhead (Cold starts, IAM, VPC, separate deployment pipeline from frontend).
*   **Option B: VPS (DigitalOcean/EC2)**: Full control but requires OS maintenance, scaling configuration, and is overkill for a "zero backend" philosophy.
*   **Option C: Cloudflare Pages Functions**: Integrated directly into the existing deployment. Runs on the Edge (low latency). No cold starts (V8 isolates).

### Decision
**Option C: Cloudflare Pages Functions**.
*   **Reasoning**: Since we are already deploying to Cloudflare Pages, adding a `/functions` directory is zero-config. Logic scales automatically with the frontend.
*   **Consequence**: We are locked into the Cloudflare Worker runtime (non-Node.js environment). We must use libraries compatible with V8 Workers (e.g., `@aws-sdk/client-s3` works, but raw `fs` usage does not).

---

## 2. Decision: API Framework - Hono

### Context
Handling raw `Request`/`Response` objects in Workers is verbose, especially for routing, middleware (Auth, CORS), and error handling.

### Options Considered
*   **Option A: Raw Cloudflare API**: Minimal bundle size but requires boilerplate for routing and parsing.
*   **Option B: Express.js**: Too heavy, designed for Node.js, requires polyfills.
*   **Option C: Hono**: Designed specifically for Edge runtimes. Typescript-first, extremely small (<15kb), and has built-in middleware.

### Decision
**Option C: Hono**.
*   **Reasoning**: It provides a comfortable "Express-like" DX but runs natively on the Edge. It simplifies adding our planned `AuthenticationMiddleware` and `CorsMiddleware`.

---

## 3. Decision: Data Store - Cloudflare KV

### Context
We need a fast, low-latency way to check if a "License Key" is valid and track simple usage counters (AI requests per month).

### Options Considered
*   **Option A: PostgreSQL (Supabase/Neon)**: Good for complex relations, but adds latency (connection overhead) and overkill for simple key-value lookups.
*   **Option B: Cloudflare D1 (SQLite)**: Good middle ground, but currently (in our context) we only need keyed lookups.
*   **Option C: Cloudflare KV**: Extremely fast read-heavy store. Eventual consistency is acceptable for license checks.

### Decision
**Option C: Cloudflare KV**.
*   **Reasoning**: License validation is 99% read / 1% write. KV is optimized for this. We can switch to D1 later if we need complex billing queries.

---

## 4. Decision: Blob Storage - AWS S3 with Presigned URLs

### Context
We need to store receipt images. We want to avoid proxying image binary data through our serverless functions to save CPU time and bandwidth cost.

### Options Considered
*   **Option A: Store in Cloudflare KV/R2**: R2 is integrated but S3 is the industry standard for "Bring Your Own Key" architecture which allows users to easily migrate or own their data.
*   **Option B: Proxy Uploads**: Client -> Worker -> S3. Consumes Worker CPU time and limits upload size (Worker limit 100MB).
*   **Option C: Presigned URLs**: Client asks Worker for permission -> Worker gives signed URL -> Client uploads directly to S3.

### Decision
**Option C: Presigned URLs**.
*   **Reasoning**: Offloads the heavy lifting to S3. Backend acts only as a gatekeeper.
*   **Folder Structure**: `/user_storage/<INTERNAL_UUID>/...` ensures users cannot guess or traverse into others' directories.

---

## 5. Security Decision: Strict Origin & License Validation

### Context
We need to prevent others from using our API endpoints (stealing our Gemini quota) even if they find the endpoint URL.

### Decision
*   **Layer 1 (License)**: Every request requires a valid `X-License-Key` checked against KV.
*   **Layer 2 (Origin)**: The API will enforce strict `Origin` header validation against a whitelist (`localhost` + production domain).
*   **Layer 3 (CORS)**: Browser-enforced restrictions on who can read the response.

This "Defense in Depth" strategy ensures that even if a key is leaked, it's harder to abuse via automated scripts (without spoofing origins), and if an endpoint is leaked, it requires a key.
