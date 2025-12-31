# PRD: Serverless Backend for AI & Cloud Storage

**Date:** 2025-12-31
**Status:** Proposed
**Author:** Gemini Agent

## 1. Executive Summary
This document outlines the requirements for moving the AI processing and receipt storage logic from the client-side to a serverless backend. This transition allows for **monetization** (via license keys), **security** (hiding API keys), and **resource management** (rate limiting & offloading heavy assets).

**Target Platform:** Cloudflare Pages Functions (integrates with current `wrangler` setup).
**Data Store:** Cloudflare KV (Key-Value) for license management.
**Blob Storage:** AWS S3 (or Cloudflare R2) for receipt images.

---

## 2. Authentication & Authorization

### 2.1 User Authentication (License Keys)
*   **Strategy:** Bearer-token style API keys.
*   **Mechanism:** Every request from the client must include the header:
    `X-License-Key: <USER_LICENSE_KEY>`
*   **Validation:**
    1.  Serverless function checks if key exists in KV Store.
    2.  Checks if `status` is "active".
    3.  Checks if `expiration` (if applicable) is in the future.

### 2.2 Admin Authentication
*   **Strategy:** Shared Secret (Environment Variable).
*   **Mechanism:** Admin endpoints (key generation) require the header:
    `X-Admin-Secret: <SERVER_ADMIN_SECRET>`
*   **Security:** This secret is stored in Cloudflare Dashboard variables, never in code.

---

## 3. Data Model (KV Store)

The License Key acts as the primary key in the KV store.

**Key Format:** `license:<uuid>`

**Value Schema (JSON):**
```json
{
  "id": "uuid-v4-string",
  "created_at": "ISO-8601-timestamp",
  "status": "active", // "active", "revoked", "expired"
  "tier": "pro", // "basic", "pro", "enterprise"
  "features": {
    "ai_enabled": true,
    "cloud_backup_enabled": true
  },
  "limits": {
    "ai_requests_per_month": 100,
    "storage_limit_mb": 1024
  },
  "usage": {
    "billing_cycle": "2025-12", // Year-Month
    "ai_requests_used": 14,
    "storage_used_mb": 12.5
  }
}
```

---

## 4. API Endpoints

### 4.1 Feature: AI Expense Extraction
**Endpoint:** `POST /api/ai/extract`

*   **Description:** Proxies requests to Google Gemini 1.5 Flash to extract expense details from text.
*   **Request Body:**
    ```json
    {
      "text": "Lunch at Nandos 25.50",
      "categories": ["Food", "Transport"],
      "currency": "MYR"
    }
    ```
*   **Logic:**
    1.  Validate `X-License-Key`.
    2.  Check if `usage.ai_requests_used < limits.ai_requests_per_month`.
    3.  If cycle changed (new month), reset `usage.ai_requests_used`.
    4.  Call Google Gemini API (using server-side secret).
    5.  Increment `usage.ai_requests_used` in KV.
    6.  Return extracted JSON.
*   **Response:**
    *   `200 OK`: `{ "data": <ExtractedExpense>, "remaining_quota": 85 }`
    *   `403 Forbidden`: Invalid Key.
    *   `429 Too Many Requests`: Monthly quota exceeded.

### 4.2 Feature: Receipt Upload (Presigned URL)
**Endpoint:** `POST /api/storage/upload-url`

*   **Description:** Generates a secure, temporary URL for the client to upload an image directly to S3/R2.
*   **Request Body:**
    ```json
    {
      "filename": "receipt_123.jpg",
      "contentType": "image/jpeg",
      "sizeBytes": 500000
    }
    ```
*   **Logic:**
    1.  Validate `X-License-Key`.
    2.  Validate file type (allow only images/pdf) and size (< 5MB).
    3.  Generate S3 Presigned PUT URL for key: `receipts/<license_id>/<timestamp>_<filename>`.
    4.  Return URL to client.
*   **Response:**
    *   `200 OK`: `{ "uploadUrl": "https://...", "fileKey": "receipts/..." }`

### 4.3 Feature: Receipt View (Presigned URL)
**Endpoint:** `GET /api/storage/view-url?key=<fileKey>`

*   **Description:** Generates a temporary URL to view a private image.
*   **Logic:**
    1.  Validate `X-License-Key`.
    2.  Verify `fileKey` starts with `receipts/<license_id>/` (Prevent viewing other users' files).
    3.  Generate S3 Presigned GET URL (valid for 1 hour).
    4.  Return URL.

### 4.4 Feature: License Status
**Endpoint:** `GET /api/license/status`

*   **Description:** Used by the UI to show "Pro" badge and usage bars.
*   **Response:**
    *   `200 OK`: Returns `tier`, `limits`, and `usage` objects from KV.

---

## 5. Admin Management API

These endpoints are for internal use (or connected to a payment webhook like Stripe) to provision access.

### 5.1 Create License
**Endpoint:** `POST /api/admin/licenses`

*   **Headers:** `X-Admin-Secret: <SECRET>`
*   **Request Body:**
    ```json
    {
      "tier": "pro",
      "duration_months": 12 // Optional, for expiration calc
    }
    ```
*   **Logic:**
    1.  Validate Admin Secret.
    2.  Generate a new UUID `key`.
    3.  Create the default KV object (see Section 3).
    4.  Store in KV.
*   **Response:**
    *   `201 Created`: `{ "licenseKey": "uuid-..." }`

### 5.2 Revoke License
**Endpoint:** `DELETE /api/admin/licenses/:key`

*   **Headers:** `X-Admin-Secret: <SECRET>`
*   **Logic:**
    1.  Set `status` to "revoked" in KV. (Don't delete immediately to preserve usage history/audit).

---

## 6. Rate Limiting Strategy

1.  **Quota Reset:**
    *   The worker checks the `usage.billing_cycle` string (e.g., "2025-12").
    *   If `current_date_string != usage.billing_cycle`, reset counters to 0 and update `billing_cycle`.
2.  **Concurrency:**
    *   Cloudflare Workers scale automatically. We do not need to limit concurrency per se, but we limit *usage volume* via the counters above.
3.  **Abuse Prevention:**
    *   Failed auth attempts should be generic "403" to avoid key enumeration.
    *   Max request size limits (e.g., 100kb for JSON bodies).
    *   Usage limits are “best effort” and may slightly exceed quota.

## 7. Configuration Requirements (Environment Variables)

The following secrets must be set in the Cloudflare Pages project settings:

*   `GEMINI_API_KEY`: Google AI Studio Key.
*   `AWS_ACCESS_KEY_ID`: For S3/R2.
*   `AWS_SECRET_ACCESS_KEY`: For S3/R2.
*   `AWS_BUCKET_NAME`: Target bucket.
*   `AWS_REGION`: Bucket region.
*   `ADMIN_SECRET`: High-entropy string for admin operations.
*   `KV_NAMESPACE_ID`: ID of the bound KV namespace.

---

## 8. Security & Prompt Defense

### 8.1 Prompt Injection Mitigation
To prevent users from hijacking the LLM for general-purpose chat or creative writing (Token Theft):

1.  **Strict Output Parsing:** The backend must attempt to parse the AI response as JSON. If `JSON.parse()` fails, the response is discarded, and an error is returned. The user never sees the raw text.
2.  **Input Length Cap:** The `/api/ai/extract` endpoint will reject any input string longer than **300 characters**. Legitimate expense descriptions are rarely longer than this.
3.  **Token Limit:** The Gemini API call will be configured with `maxOutputTokens: 500`. This prevents the generation of long-form content.
4.  **Deterministic Sampling:** Set `temperature: 0` to minimize creativity and hallucination.
5.  **Schema Enforcement:** Use Gemini's `responseMimeType: "application/json"` feature (where supported) or appended system instructions ("Output ONLY JSON") to strictly constrain the format.

### 8.2 Abuse Prevention
1.  **Rate Limiting:** As defined in Section 6, the hard cap on monthly requests limits the financial exposure per compromised or malicious user.
2.  **Presigned URL Constraints:**
    *   Upload URLs are valid for only **60 seconds**.
    *   `Content-Length-Range` header will be enforced in the S3 signature to prevent uploading files larger than 5MB.
    *   `Content-Type` must match image/pdf types.
3.  **Isolation:** Users can only access objects under `receipts/<their_license_id>/`. Path traversal attacks are mitigated by strict key generation on the server.

---

## 9. AI Behavior & System Prompt

### 9.1 Interaction Model
The AI acts as a **Conversational Data Extraction Agent**. It does not assume single-shot success.

*   **Stateless Backend:** The server does NOT store conversation history.
*   **Stateful Client:** The client must send the `current_state` (partially collected data) and `history` (previous messages) with each new user input.

### 9.2 Updated API Request Schema (Section 4.1)
The `/api/ai/extract` endpoint is updated to support conversational context.

**Request Body:**
```json
{
  "userInput": "It was 50 bucks",
  "currentDate": "2025-12-31T10:00:00Z",
  "categories": ["Food", "Transport", "Shopping"],
  "currency": "MYR",
  "previousState": { // Optional: Data collected so far
    "name": "Dinner",
    "category": "Food"
  },
  "history": [ // Optional: Last 3 turns for context
    { "role": "user", "text": "I had dinner" },
    { "role": "assistant", "text": "Okay, how much was it?" }
  ]
}
```

### 9.3 System Prompt Definition

**Persona:**
> You are a precise and helpful Personal Finance Assistant. Your ONLY goal is to extract a valid expense record from the conversation. You speak concisely.

**Logic Flow:**
1.  Analyze `userInput` in the context of `history` and `previousState`.
2.  **IF** you can infer ALL required fields (Name, Amount, Category, Date):
    *   Set `status` to "complete".
    *   Populate `data` with the final record.
    *   `assistant_message` is null.
3.  **IF** information is missing or ambiguous (e.g., "bought food" -> missing amount):
    *   Set `status` to "incomplete".
    *   Populate `data` with what you HAVE found so far.
    *   Set `assistant_message` to a natural language question asking for the *specific* missing piece.
    *   **Defense:** Do not answer general knowledge questions (e.g., "What is the capital of France?"). Reply: "I can only help you track expenses. Please provide the details."

**Output JSON Schema:**
```json
{
  "status": "complete" | "incomplete",
  "data": {
    "name": "string (nullable)",
    "amount": "number (nullable)",
    "category": "string (nullable)",
    "date": "ISO-string (nullable)",
    "currency": "string"
  },
  "assistant_message": "string (nullable)"
}
```

### 9.4 Edge Cases
*   **Currency:** If user says "bucks" or "dollars" but context is `MYR`, assume `MYR` unless explicitly stated otherwise (e.g., "USD 50").
*   **Date:** "Today" = `currentDate`. "Yesterday" = `currentDate - 1 day`.
*   **Ambiguity:** If user says "Apple", ask: "Was this 'Groceries' or 'Electronics'?" instead of guessing.

