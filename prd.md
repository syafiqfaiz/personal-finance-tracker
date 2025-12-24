# Product Requirements Document (PRD) - Personal Finance PWA

## 1. Overview

The AI-First Personal Finance Tracker is an **installable React PWA** designed to help individuals track expenses efficiently using an AI-powered conversational interface. The app is built with an **offline-first** philosophy, ensuring full expense logging capabilities without internet connectivity, only requiring a connection for AI processing (unless a local SLM is used).

---

## 2. Goals & Objectives

### Primary Goals

* Minimalist, friction-free expense tracking for individuals.
* High-performance, installable web experience (PWA).
* AI-driven natural language input for fast logging.
* Reliable offline functionality for core features.

### Success Metrics

* Expense creation completed in under 5 seconds.
* 100% data persistence on the local device.
* Successful "Add to Home Screen" (A2HS) experience.
* **Mobile-First UX**: 100% of UI elements optimized for one-handed thumb navigation.
* **Offline Accuracy**: Zero functional lag during offline entry.

---

## 3. Target Users

### Primary Users

* Individuals who want a lightweight, fast way to track daily spending in Ringgit Malaysia (RM).

---

## 4. In-Scope Features

### 4.1 Expense Management (Individual Only)

* AI-assisted conversational expense entry.
* Manual expense creation and editing.
* **Strict Expense Schema**:
  | Field | Required | Default | Notes |
  | :--- | :--- | :--- | :--- |
  | **Name/Merchant** | Yes | - | AI extracted or manual |
  | **Amount** | Yes | 0.00 | Mandatory for save |
  | **Category** | Yes | Uncategorized | System category if deleted |
  | **Tags** | No | [] | Multi-select allowed |
  | **Date** | Yes | Today | Auto-filled if missing |
  | **Payment Method**| No | Cash | |
  | **Notes** | No | - | Optional free text |
  | **Tax Deductible**| Yes | False | Toggle |
  | **Receipt Image** | No | - | S3 Remote + Local Cache |

* **Data Portability & Backup**:
  - Manual export of all data to **CSV**.
  - **Cloud Backup**: Automated daily backup of database state to S3.
  - **Cloud Receipt Storage**: Receipts stored in S3, with local caching for offline view.
* **Category/Tag Management**:
  - `Uncategorized` is a **system-reserved**, non-deletable category.
  - Deleting a category moves items to `Uncategorized`.

### 4.2 AI Chat Capabilities (Optional)

* **Natural Language Extraction**: (Name, Amount, Category, Tags, Date).
* **BYO-AI Model**: Users must provide their own **Google Gemini API Key** in the settings for this feature to work.
* **Multi-turn Clarification**: If any mandatory attribute is missing, AI will prompt the user specifically for that information.
* **Confidence Signals**: AI highlights fields it is "unsure" about in the confirmation UI.
* **Offline Fallback**: If offline, AI chat shows "Online only feature" and redirect button to manual entry.
* **Confirmation & Fallback**:
  - User confirms -> Saved.
  - User disagrees -> Redirect to manual form pre-filled with AI's best guess for correction.

### 4.3 Cloud Data & Backup (Optional)

* **BYO-S3 Model**: Users provide their own S3 bucket credentials (Bucket name, Region, Access Key, Secret Key).
* **Backup**: Automated daily database export to user's S3.
* **Storage**: Receipts uploaded to user's S3, cached locally.
* **Privacy**: Credentials stored **locally only** in the browser's secure storage.

### 4.4 Settings & Key Management

* **Configuration UI**: Dedicated settings page for inputting/resetting API keys and S3 credentials.
* **Validation**: Simple connectivity test for provided keys.

### 4.3 Category & Tag Management

* **Default Categories**: App initializes with: `Food`, `Transport`, `Rent`, `Groceries`, `Entertainment`, `Healthcare`, `Others`.
* **Manual Management**: Users can create, rename, and delete categories and tags.
* **Deletion behavior**:
  - If a **Category** is deleted, all associated expenses are moved to "Uncategorized".
  - If a **Tag** is deleted, it is removed from all associated expenses (expense remains).

### 4.4 Dashboard, Filtering & History

* **Primary Dashboard**:
  - Summary cards: `Total Spent Today`, `Total Spent This Month`.
  - Visualization: Top Spending Categories (Pie/Bar chart).
* **Global Search**: Search bar to query expenses by `Name/Merchant` or `Notes`.
* **Filtering**: Filter expenses by Category, Tags, and Date Range.
* **Historical View**: Infinite scroll list of all past expenses.

### 4.5 Budgeting

* **Per-Category Budget**: Ability to set a monthly RM limit for each category (e.g., Food: RM500, Transport: RM200).
* **Monthly Tracking**: Budgets are tracked per calendar month.
* **Progress Visualization**: View spending vs. budget for each category and total monthly progress.

---

## 5. Out of Scope

* Backend synchronization (Phase 1).
* Household/Family management.
* Multi-currency support (RM only).
* Bill splitting.

---

## 6. User Flows

### 6.1 AI Expense Entry

1. User taps AI Icon.
2. User types natural language input (e.g., "Nasi Lemak RM15 yesterday").
3. AI extracts attributes: `Name`, `Amount`, `Category`, `Tags`, `Date`.
4. **Missing Attribute Check**: If `Amount` or `Category` or `Date` is missing, AI asks a follow-up question.
5. User provides missing details.
6. User confirms and saves.

### 6.2 Manual Entry

1. User opens Add Expense screen
2. User fills expense details
3. User creates new tags if needed
4. Expense saved locally

### 6.3 Expense Editing

1. User selects an expense
2. User edits fields
3. Changes saved locally

### 6.4 Budget Setup

1. User views budgets
2. User sets or edits monthly budgets

---

## 7. Non-Functional Requirements

* **Installability**: Must meet PWA standards (manifest.json, Service Worker).
* **Update Strategy**: Implemented "New Version Available" toast notification with an immediate "Reload" action to ensure users run the latest version.
* **Mobile-First Design**: Optimized for touch interaction, minimum button size 44x44px.
* **Performance**: UI response time < 100ms.
* **Offline-First**: Core logic (manual entry, budget viewing, history) MUST work 100% offline.

---

## 8. Technical Requirements

* **Frontend**: React (Vite-based for speed).
* **State Management**: Zustand.
* **Storage**: IndexedDB (via Dexie.js).
* **Architecture**: 100% Serverless/Backend-less.
* **AI Integration**: Google Gemini API (Direct from client with user key).
* **Cloud Integration**: AWS SDK for JS (Direct from client with user key).

---

## 9. Assumptions & Constraints

* Single currency: MYR (RM).
* Single device data (no cloud backup in this phase).

---

## 10. Future Enhancements

* **Security**: Local Passcode or Biometric (FaceID/TouchID) lock.
* **Advanced Analytics**: Daily expense summary and monthly budgeting report.
* **Local SLM**: 100% offline AI processing.
* **Multi-currency**: Support for non-RM transactions.
* **Household/Family**: Shared tracking and real-time sync.
