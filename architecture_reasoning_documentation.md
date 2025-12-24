# Architecture Reasoning Document – Personal Finance PWA

## 1. Purpose of This Document

This document explains **why** specific architectural decisions were made for the Personal Finance PWA. It is not an implementation guide, but a rationale to:

* Align engineers on trade-offs
* Prevent over-engineering
* Preserve product intent as the system evolves

The guiding principle is **product reliability first, complexity later**.

---

## 2. Core Architectural Principles

### 2.1 Offline-First by Design

**Reasoning:**
Expense tracking happens at the point of spending, where connectivity is unreliable. Offline capability is not an enhancement—it is a core functional requirement.

**Implications:**

* All CRUD operations must work without network access
* Network is treated as an optional dependency
* Failure of AI services must not block expense creation

**Decision:**

* Local-first persistence using IndexedDB
* AI features are additive, never blocking

---

### 2.2 Single-User, Single-Device Scope (Individual Ownership)

**Reasoning:**
Phase 1 focuses on maximum individual control. By allowing users to "Bring Your Own" S3 and AI, we ensure they own their data lifecycle and associated costs.

**Decision:**
* **Zero Backend**: No central server; the PWA talks directly to user-defined S3 and OpenAI endpoints.
* **Local-Only Credentials**: Secrets never leave the device.
* **Optional Features**: Cloud backup and AI are feature-gated by the presence of valid keys.

---

## 3. Technology Selection Rationale

### 3.1 Why PWA Instead of Native / React Native

**Chosen:** React PWA

**Why:**

* Zero installation friction (link → install)
* Instant updates without store review cycles
* Mature offline capabilities (Service Workers, IndexedDB)
* Single codebase, faster iteration

**Explicit Trade-Offs Accepted:**

* Less reliable background execution
* Limited access to biometric APIs (deferred to future)
* Browser storage quotas

These trade-offs are acceptable given Phase 1 goals.

---

### 3.2 Why React + Vite

**Reasoning:**

* Fast cold-start and HMR during development
* Minimal runtime overhead
* Ecosystem maturity

React is used strictly as a UI and state orchestration layer—not as a domain engine.

---

### 3.3 State Management: Zustand

**Reasoning:**

* Predictable, minimal abstraction
* No reducers or boilerplate
* Easy persistence boundaries

**Decision Rule:**

* Zustand for UI and session state
* IndexedDB as the source of truth

State is treated as a **projection of persisted data**, not the authority.

---

### 3.4 Local Storage: IndexedDB via Dexie

**Reasoning:**

* IndexedDB is the only browser storage suitable for structured, long-lived data
* Dexie provides:

  * Transactions
  * Indexed queries
  * Schema versioning

**Design Constraints:**

* Indexed fields: date, categoryId, tagIds
* Paginated reads for lists
* Blob storage for receipts with size limits

IndexedDB is considered a **local database**, not a cache.

---

## 4. Data Ownership & Flow

### 4.1 Source of Truth

**Single source of truth:** IndexedDB

All UI state is derived from persisted data. No business-critical data lives only in memory.

---

### 4.2 Write Path (Expense Creation)

1. User input (AI or manual)
2. Validation against strict schema
3. Atomic write to IndexedDB
4. UI updates from DB subscription

This ensures:

* No phantom state
* No divergence between UI and storage

---

### 4.3 Read Path (Dashboard & History)

* Queries are paginated
* Aggregations computed locally
* Charts consume pre-aggregated selectors

Expensive computations are memoized and scoped.

---

## 5. AI Integration Architecture

### 5.1 AI as an Optional Service

**Reasoning:**
AI improves speed, not correctness.

**Decision:**

* AI never writes directly to storage
* AI outputs are treated as *suggestions*

User confirmation is mandatory before persistence.

---

### 5.2 AI Failure & Confidence Model

* AI responses include per-field confidence flags
* Low-confidence fields are visually highlighted
* Missing mandatory fields trigger clarification
* **Offline Fallback**: AI chat detects offline status and offers immediate redirection to the manual entry form.

This avoids hidden background behavior.

---

### 5.3 Prompt Versioning

AI prompts are versioned alongside the app version.

**Reasoning:**

* Parsing behavior must be reproducible
* Bug reports must be diagnosable

---

## 6. Budgeting Architecture

### 6.1 Budget as Derived Data

Budgets are **constraints**, not stored totals.

* Raw expenses are the only authoritative data
* Budget progress is computed dynamically per month

This avoids reconciliation bugs.

---

### 6.2 Uncategorized Handling

* Uncategorized expenses do not contribute to category budgets
* They are shown separately to encourage cleanup

---

## 7. Performance & Scalability Boundaries

### 7.1 List Rendering

* Virtualized lists
* Fixed page size (e.g. 30–50 items)
* Lazy-loaded receipt images

---

### 7.2 Storage Limits

* Images resized and compressed on capture
* Soft limits with user warnings
* No silent failures

---

## 8. PWA Lifecycle & Updates

### 8.1 Service Worker Strategy

* New version detected → toast notification
* Reload only when no active DB writes

User is always in control of reload timing.

---

### 8.2 Data Persistence

* Storage Persistence API requested on first launch
* User informed of data-loss risks

---

## 9. Security & Privacy Posture

### 9.1 Local Secret Management (LSM)

**Reasoning:**
Storing AWS and Gemini secrets in the browser is non-standard but acceptable for a "Personal Tool" architecture where the user is the owner of both the app and the infrastructure.

**Decision:**
* **Storage**: Store keys in IndexedDB (harder to access via script injection than localStorage).
* **Warning**: Clear UI warnings that keys are stored locally and could be exfiltrated if the device/browser is compromised.

### 9.2 Threat Model (Phase 1)

**Protected Against:**
* Centralized data breaches (as there is no central database).
* Data loss (via optional BYO-S3).

**Not Protected Against:**
* Local data theft (Physical/Malware).
* XSS Exfiltration of keys.

---

## 10. Evolution Path (Intentional Constraints)

This architecture intentionally keeps:

* Domain logic portable
* UI replaceable
* Storage abstracted

This allows future migration to:

* React Native
* Backend sync
* Multi-device support

Without rewriting core business logic.

---

## Final Position

This architecture optimizes for:

* Trust
* Predictability
* Fast iteration

It avoids premature complexity while keeping escape hatches open.

If requirements expand, the architecture bends—it does not break.
