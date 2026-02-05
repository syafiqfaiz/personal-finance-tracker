# Product Requirements Document (PRD)

## Feature Name

**Share Receipt to AI Chat**

## Status

Draft v2 - Updated 2026-02-05

## Owner

Product / Tech Lead

## Target Release

v0.5.x

---

## 1. Problem Statement

Users frequently make payments using external banking or e-wallet apps. After completing a payment, the receipt exists outside the personal finance tracker, forcing users to manually:

* Download the receipt
* Upload it into the app
* Or re-enter expense details by hand

This creates friction, breaks user flow, and discourages consistent expense tracking.

The goal is to allow users to **share a payment receipt directly from a banking app into the PWA**, where the **AI chat automatically ingests, uploads, and extracts expense data** with minimal user effort.

---

## 2. Goal & Success Metric

### Primary Goal

Enable the PWA to appear as a **share destination** in the Android system share sheet, allowing users to send receipts directly into the app's AI chat.

### Success Metric (Primary)

* User can tap **Share → [App Name]** after a payment (Android only)
* Receipt appears inside the AI chat
* AI successfully extracts expense information without manual upload

**Binary success:**

> Share → App opens → Receipt visible in AI chat → AI extraction begins

### Measurement

Success will be measured through:
* Analytics event: `share_receipt_success` (fired when receipt appears in chat and AI extraction starts)
* Manual testing on target Android devices/browsers
* User feedback in initial rollout

---

## 3. Non-Goals

* No requirement to influence or control banking app behavior
* No guarantee of structured receipt formats
* No requirement for real-time bank integrations
* No advanced reconciliation or fraud detection in this phase
* **No iOS support** (Web Share Target API not supported in Safari PWAs)

---

## 4. User Flow

### Happy Path (Android Only)

1. User completes payment in banking / e-wallet app
2. User taps **Share** on receipt
3. OS share sheet appears
4. User selects **[Personal Finance Tracker]**
5. PWA launches to `/share` route showing "Receiving your receipt..." with loading indicator
6. Receipt file uploads to storage (1-3 seconds)
7. On success, redirects to AI chat (main route)
8. Chat clears to fresh state
9. AI chat shows "Extracting details from your receipt..."
10. AI extracts merchant, amount, date, and category
11. AI shows confirmation card
12. User confirms and expense is saved

### Fallback Path

* If sharing is unavailable or fails:
  * Manual upload via chat (existing functionality)
  * Paste receipt text
  * Upload screenshot

### Error Paths

#### Unauthenticated User
1. User shares receipt while not logged in
2. App opens to `/share` route
3. Redirects to `/settings` page
4. Shows error message: **"This feature is only enabled for authenticated users"**
5. Receipt is NOT saved or queued
6. User must add license key, then share receipt again

#### Upload Failure
1. User shares receipt
2. Upload to storage fails (network error, file corrupted, etc.)
3. Show error message on `/share` page
4. Provide retry button or redirect to chat with manual upload option

#### Unsupported File
1. User shares unsupported file type
2. Show error: "Unsupported file type. Please share PDF or image files."
3. Redirect to chat

---

## 5. Supported Share Inputs

### Must Support

* PDF receipts (`application/pdf`)
* Image receipts (`image/jpeg`, `image/png`, `image/webp`)
* Plain text (for text-based receipts)
* URLs (receipt links)

### File Size Limits

**Maximum file size:** 10MB (aligns with existing `MAX_FILE_SIZE` constant in `src/constants/app.ts`)

**Behavior when exceeded:**
* Show error: "File too large. Maximum size is 10MB"
* Redirect to chat with manual upload option

### Multiple Format Handling

If user shares multiple items simultaneously (e.g., PDF + text):
* **Priority:** File (PDF/image) takes precedence
* Text and URL are ignored
* Process only the first file

**Future consideration:** Support multiple files in one share (v2+)

---

## 6. Platform Scope

### Android (Full Support - Priority)

**Supported Browsers:**
* Chrome 89+
* Samsung Internet 14+
* Edge 89+

**Expected behavior:**
* PWA appears in system share sheet alongside native apps (WhatsApp, Telegram, etc.)
* File-based sharing fully supported
* Text and URL sharing supported

**Unsupported Browsers:**
* Firefox for Android (Web Share Target API support is incomplete)
* Show "unsupported browser" message if detected? **[Open Question]**

### iOS (Not Supported)

* **Web Share Target API is not supported in Safari PWAs as of iOS 17**
* App will NOT appear in iOS share sheet
* Users must use manual upload via the existing chat upload button
* No special handling or error messages needed (feature is invisible to iOS users)

**Decision:** This is an **Android-only feature** for v1. iOS support depends on Apple implementing Web Share Target API in Safari.

---

## 7. Functional Requirements

### PWA & Manifest

* App must be installable (Add to Home Screen)
* `manifest.json` must define a valid `share_target`
* HTTPS is mandatory

**Manifest Configuration:**

```json
{
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "files": [
        {
          "name": "receipt",
          "accept": ["image/*", "application/pdf"]
        }
      ],
      "text": "text",
      "url": "url"
    }
  }
}
```

**Field name:** `receipt` - The `/share` route will extract the file from `FormData.get('receipt')`

### Share Handling

* App must handle `POST` multipart form data at `/share` route
* Service worker must intercept and process POST requests
* Shared content must open a dedicated share context (loading page)
* Receipt must be uploaded to storage using existing upload logic
* After successful upload, redirect to AI chat

### Service Worker Requirements

**Existing infrastructure:** App is a PWA and already has service worker support.

**Required functionality:**
* Intercept POST requests to `/share`
* Extract form data (file, text, or URL)
* Pass data to app for processing
* Handle offline scenarios (show error if offline)

### Chat State Management

**When receipt is shared:**
* **Clear all existing chat messages** (start fresh)
* **Unsaved/pending expenses are lost** without warning

**Decision:** No warning will be shown. The share action always clears the chat immediately. This prioritizes the new receipt over any pending work.

### AI Processing

* Automatically detect receipt type by MIME type
* Extract:
  * Amount
  * Date
  * Merchant
  * Currency
  * Category (suggested)
* Use existing `/api/extract` endpoint (supports PDF and images)
* Confidence scoring (implicit in AI response)
* Show confirmation card for user review

### UX Requirements

* No empty screens during share flow
* Immediate visual confirmation that receipt was received
* Loading states during upload and extraction
* Chat message flow:
  1. "Receiving your receipt..." (on `/share` page)
  2. "Extracting details from your receipt..." (in chat after redirect)
  3. Confirmation card with extracted data

---

## 8. Technical Requirements

### Web APIs

* Web Share Target API (Android Chrome 89+)
* File Handling API
* Fetch API for file uploads

### Routing

* **New route:** `/share` - Dedicated share entry point
  * Handles POST requests from share target
  * Shows loading UI
  * Uploads file to storage
  * Redirects to chat on success
  * Shows errors on failure

* **Existing route:** `/` (or main chat route)
  * Receives redirect from `/share` with file reference
  * Clears chat state
  * Initiates AI extraction

### Storage

* Use existing cloud storage upload logic (same as manual upload in AIChat.tsx)
* No backend changes required
* File handling behaves identically to user uploading via chat

### Authentication

* Feature requires valid license key (authenticated user)
* Unauthenticated users are redirected to `/settings` page
* Error message shown: "This feature is only enabled for authenticated users"
* Receipt is NOT saved or queued for unauthenticated users
* User must add license key and share receipt again

---

## 9. Security & Privacy

* Receipt files are treated as sensitive financial data
* Files uploaded to existing cloud storage with same encryption as manual uploads
* No third-party uploads without user consent (AI extraction uses existing API)
* Temporary files in browser memory are cleared after upload
* Cloud backup follows existing encryption standards

---

## 10. Analytics & Observability

### Events to Track

| Event Name | When Fired | Properties |
|------------|------------|------------|
| `share_attempt` | `/share` route is accessed | `platform`, `file_type`, `file_size` |
| `share_upload_success` | File successfully uploaded to storage | `file_type`, `file_size`, `upload_duration_ms` |
| `share_upload_failure` | File upload fails | `error_type`, `file_type` |
| `share_extraction_start` | AI extraction begins in chat | `file_type` |
| `share_extraction_success` | AI returns extracted data | `extraction_duration_ms`, `confidence_score` |
| `share_extraction_failure` | AI extraction fails | `error_type` |
| `share_expense_saved` | User confirms and saves expense | `time_from_share_to_save` |

**Privacy:**
* No user-identifying receipt content stored in analytics
* Only metadata (file type, size, timing) is tracked

---

## 11. Risks & Constraints

### Known Limitations

* **iOS not supported** - Web Share Target API unavailable in Safari PWAs
* Banking apps may restrict share formats or file types
* Inconsistent receipt layouts affect AI extraction accuracy
* OCR accuracy varies by image quality
* Browser compatibility limited to Chromium-based browsers on Android

### Mitigation Strategies

* Graceful fallbacks to manual upload
* Clear error messages for unsupported scenarios
* Manual correction via AI chat confirmation flow
* Existing error handling from AIChat.tsx

### Technical Risks

> [!CAUTION]
> **Service Worker Requirement:** If app doesn't currently have a service worker, this adds significant complexity and testing surface area.

---

## 12. Browser Compatibility Decision

**Firefox Android:** Let it fail gracefully with existing error handling (no special detection or warnings).

**Rationale:** Simpler implementation, fewer edge cases to maintain, consistent error handling across all unsupported scenarios.

---

## 13. Definition of Done

### Functional Requirements

* ✅ PWA appears in Android share sheet (Chrome, Samsung Internet, Edge)
* ✅ Receipt successfully lands in AI chat after share
* ✅ Chat clears to fresh state when receipt is shared
* ✅ AI extracts expense fields using existing `/api/extract` endpoint
* ✅ User can confirm and save expense
* ✅ No manual upload required for happy path
* ✅ Unauthenticated users see error message
* ✅ Upload failures show error with retry/fallback options

### Technical Requirements

* ✅ `manifest.json` updated with `share_target` configuration
* ✅ Service worker handles POST requests to `/share`
* ✅ `/share` route implemented with loading UI and error handling
* ✅ Chat state management clears on share
* ✅ Analytics events implemented and verified

### Testing Requirements

* ✅ Manual testing on:
  * Android Chrome (latest)
  * Samsung Internet (latest)
  * Android Edge (latest)
* ✅ Test scenarios:
  * Share PDF receipt
  * Share image receipt (JPEG, PNG, WebP)
  * Share while unauthenticated
  * Share with network failure
  * Share oversized file
  * Share unsupported file type
* ✅ Verify analytics events fire correctly
* ✅ Verify no regressions in manual upload flow

### Documentation

* ✅ Update user documentation with share feature instructions
* ✅ Note iOS limitation in user-facing docs
* ✅ Update developer documentation with service worker requirements

---

## 14. Future Enhancements (Out of Scope for v1)

* Deep linking into specific chat threads or categories
* iOS support (pending Apple API support)
* Background processing without foreground confirmation
* Receipt history/archive view

**Explicitly Not Planned:**
* Multiple files in one share (architecture decision: single file only)
