# PRD: Cloud Backup & Restore

## 1. Overview
**Goal:** Provide a seamless, automated way for users to secure their data and sync it between devices using Cloudflare R2.
**Strategy:** **"Cloud Sync" Model**. The app periodically snapshots the local database and uploads it to the secure cloud.
**Architecture:**
*   **Storage:** Cloudflare R2.
*   **Organization:** Buckets are strictly purposefully scoped by `license_key`.
*   **Versioning:** The server maintains the **last 5 backups** per user (FIFO rotation).
*   **Assets:** Receipt images remain in R2; the backup file only contains *references* (keys).

## 2. User Stories
*   **As a user**, I want to click one button to back up my data immediately.
*   **As a user**, I want to know exactly when my last backup was performed.
*   **As a user**, I want the app to automatically back up my data daily, but only if I've actually added new expenses.
*   **As a user**, I want to restore my data on a new phone just by entering my License Key.

## 3. Functional Requirements

### 3.1. Manual Backup
*   **UI Location:** Settings Page > "Data Management" section.
*   **UI Elements:**
    *   **"Backup Now" Button**: Triggers an immediate backup.
    *   **Status Label**: Displays "Last Backup: [Date/Time]" or "Never".
*   **Process:**
    1.  User clicks "Backup Now".
    2.  App gathers all data (`expenses`, `receipts`, `budgets`, `settings`).
    3.  **Integrity Check (Signing)**: App calculates `HMAC-SHA256` of the data using the `License Key` as the secret.
    4.  App sends JSON (including `integrityHash`) to `POST /api/backup`.
    5.  **Failure Handling**:
        *   If upload fails (network error, timeout), app **retries once**.
        *   If still failing, show "Backup Failed" toast. Do **not** update "Last Backup" timestamp.
    6.  On success, update local "Last Backup" timestamp.
    7.  **Success Feedback**: Show "Backup Successful" toast.

### 3.2. Automated "Smart" Backup
*   **Trigger:** Checked on Application Launch (or Resume).
*   **Conditions (ALL must be true):**
    1.  **Time Elapsed:** It has been > 24 hours since the last successful backup.
    2.  **Data Changed:** New data has been added/modified since the last backup.
        *   *Implementation:* Compare `lastBackupTimestamp` vs. `lastDataModificationTimestamp`.
*   **Background Behavior:**
    *   The backup happens silently in the background.
    *   If it fails, retry quietly on next launch (do not alert user unless critical).

### 3.3. Restore Sync
*   **Trigger:** "Restore Data" button (or "Sync from Cloud" on fresh install).
*   **Process:**
    1.  App calls `GET /api/backup/latest`.
    2.  **Server** verifies License Key.
    3.  **Server** returns the most recent backup JSON.
    4.  **Integrity Check (Verify)**: App calculates `HMAC-SHA256` of the received data using the local `License Key`.
        *   *Failure:* If hash mismatches, assert "Data Corruption" or "Wrong License". Abort.
    5.  **User Confirmation (Crucial)**:
        *   Show Dialog: "Backup found from [Date]. Restore and overwrite local data?"
        *   User must click "CONFIRM" explicitly.
    6.  **App** wipes local DB.
    7.  **App** imports the JSON data.
    8.  **App** reloads.

## 4. Technical Specifications

### 4.1. API Endpoints

#### `POST /api/backup`
*   **Headers:** `X-License-Key`, `Content-Type: application/json`
*   **Body:** Full `data.json` dump.
*   **Server Logic:**
    1.  Validate License Key.
    2.  **Save to R2**: Attempt to save `user_storage/{license_key}/backup/{timestamp}.json`.
        *   *Failure Handling:* If this fails (network/R2 error), abort immediately. Return 500. Do **NOT** delete any old backups.
    3.  **Rotation (Cleanup)**: 
        *   List all files in `user_storage/{license_key}/backup/`.
        *   Sort by date.
        *   If count > 5, delete the oldest file(s) until count == 5.
    4.  Return `{ success: true, timestamp: "..." }`.

#### `GET /api/backup/latest`
*   **Headers:** `X-License-Key`
*   **Server Logic:**
    1.  List files in `user_storage/{license_key}/backup/`.
    2.  Sort by timestamp (descending).
    3.  Fetch and return the content of the first (newest) file.
    4.  If empty, return 404.

#### `GET /api/backup/status` (Optional Optimization)
*   **Headers:** `X-License-Key`
*   **Server Logic:** Return metadata of the latest backup `{ timestamp: "..." }`.
*   *Use Case:* Allows the app to update the "Last Backup" label if a backup was made on a *different* device.

### 4.2. Local State Management (Settings Store)
*   `lastBackupAt`: Timestamp of last successful upload.
*   `dataModifiedAt`: Timestamp of last local write operation (add expense, update budget, etc.).

## 5. Security & Privacy
*   **Auth:** The `License Key` acts as the authentication token.
    *   *Risk:* If someone guesses a license key, they can restore that user's data.
    *   *Mitigation:* License keys must be UUIDs (high entropy). Rate limiting on API endpoints to prevent brute-force scanning.
*   **Encryption:** Data is stored as JSON in R2. (Future Scope: Client-side encryption before upload).

## 6. Schema (Backup Format)
(Same as V3 Schema defined previously)
```json
{
  "version": 3,
  "timestamp": "ISO-Date",
  "integrityHash": "hmac-sha256-...", 
  "data": { "expenses": [...], "receipts": [...], ... }
}
```

## 7. Success Criteria
1.  **Performance:** Backup upload completes in < 2 seconds for a typical user database (< 2MB).
2.  **Reliability:** Restore successfully recovers 100% of linked records (Expenses ↔ Receipts) on a clean device.
3.  **Data Integrity:** Restore **MUST** fail if the `integrityHash` does not match the computed HMAC (Data + License Key).
4.  **Safety:** Restore **MUST** require explicit user confirmation after download and before write.
4.  **Data Hygiene:** The server **never** stores more than 5 backup files per user.
5.  **Smart Automation:** The app **never** uploads a backup if no data has changed since the last backup (saving bandwidth).

## 8. Testing Plan

### 8.1. Unit Tests
*   **Backend (`functions/api/backup`)**:
    *   `POST /`: Mock R2. Verify valid JSON is saved. Verify 6th file triggers deletion of the 1st file. Verify invalid license returns 401.
    *   `GET /latest`: Verify it returns the file with the largest timestamp. Verify 404 if directory empty.
*   **Frontend (`src/services/backupService`)**:
    *   `shouldRunBackup()`: Test logic matrix:
        *   (Time < 24h, Data Changed) -> False
        *   (Time > 24h, Data Unchanged) -> False
        *   (Time > 24h, Data Changed) -> True
    *   `integrityCheck`: Verify that modifying 1 character in the JSON causes verification to fail.

### 8.2. Integration Tests
*   **End-to-End Restoration Flow**:
    1.  Seeding: Create a user, add 5 expenses, upload 2 receipts.
    2.  Backup: Trigger manual backup.
    3.  Wipe: Clear IndexedDB (Simulate new device).
    4.  Restore: Click "Restore" with same license key.
    5.  Verification: Assert DB contains exactly 5 expenses and 2 receipts. Assert receipts point to valid R2 URLs.
