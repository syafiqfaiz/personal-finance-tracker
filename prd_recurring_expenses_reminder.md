# Product Requirements Document: Recurring Expenses & Payment Checklist

| Metadata | Details |
| :--- | :--- |
| **Feature Name** | Recurring Expenses Reminder (The "Payment Checklist") |
| **Target Release** | v0.4.0 |
| **Status** | DRAFT |
| **Owner** | Tech Lead |
| **Last Updated** | 2026-02-02 |

## 1. Executive Summary & Problem Statement

### 1.1 Problem
Users currently suffer from "administrative fatigue" by having to manually re-enter predictable expenses (Rent, Netflix, Loan Repayments) every month. This friction leads to:
1.  **Data Gaps:** Users forget to log an expense, leading to inaccurate analytics.
2.  **User Drop-off:** The tedium of manual entry reduces long-term retention.
3.  **Mental Load:** Users must remember *what* they haven't paid yet.

### 1.2 Proposed Solution
Transform the application from a passive "logger" into an active "checklist".
We will introduce a **Recurring Expense Engine** that:
1.  Allows defining a recurrence pattern (Template).
2.  Automatically generates "Due Items" (Reminders) based on time.
3.  Provides a specific "Payment Checklist" UI where users can "Mark as Paid" or "Skipped".
4.  Converts confirmed reminders into actual `Expense` records.

> **Tech Lead Assessment:** We are opting for a **Client-Side Lazy Generation** approach. We will not run background cron jobs on the server. Instead, when the user opens the app, we calculate what is due. This aligns with our Local-First (Dexie) architecture. usage of `vite-plugin-pwa` allows this to feel native.

---

## 2. Goals & Success Metrics

### 2.1 Primary Goals
*   **Accuracy:** Ensure 100% of fixed costs are captured without manual amount entry.
*   **Convenience:** Reduce clicks to log a monthly rent from ~7 (Open > Add > Cat > Amt > Desc > Date > Save) to ~2 (Checklist > Mark Paid).

### 2.2 Success Metrics
*   **Adoption:** 40% of Active Users define at least 3 recurring expenses.
*   **Interaction:** 80% of generated reminders are converted to expenses (vs dismissed/ignored).
*   **Resiliency:** 100% of user templates and their states (`lastActionedDate`) are successfully restored when simulating a device switch (Backup/Restore).
*   **Code Quality:** Achieve >90% unit test coverage for the `RecurringExpenseService` and logic engine, ensuring the core business logic is isolated and testable.

---

## 3. User Stories

| ID | Actor | Story | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **US-1** | User | I want to set up my Rent to repeat monthly. | Form allows selecting "Monthly", Day of Month, and Default Amount. |
| **US-2** | User | I want to see a list of bills I haven't paid this month. | "Due Reminders" section appears on Dashboard when items are due. |
| **US-3** | User | I want to pay my electric bill, but the amount is different this month. | Clicking "Pay" opens a modal pre-filled with defaults, allowing amount edit before saving. |
| **US-4** | User | I want to skip a subscription I paused this month. | "Dismiss/Skip" action removes the reminder without creating an expense. |
| **US-5** | User | I want to see what I missed while I was away for 2 months. | System generates reminders for *all* missed past intervals, not just the latest one. |
| **US-6** | User | I want to pause my Gym membership while I am injured. | Template list allows "Pausing" a recurring item so it stops generating reminders until Resumed. |
| **US-7** | User | I want to update my Rent amount because the landlord raised it. | "Edit" action on Template Management page allows changing amount/date, updating for *future* reminders. |
| **US-8** | User | I want to remove a subscription I cancelled. | "Delete" action permanently removes the template and stops all future reminders. |
| **US-9** | User | I want to snooze a reminder because I'll pay it next week. | "Snooze" action hides the reminder from the dashboard until selected date. |

---

## 4. Functional Requirements

### 4.1 Recurring Templates (Data Model)
The system shall allow creating `RecurringExpense` entities with:
*   `base_amount`: Default value (editable on confirmation).
*   `chronology`:
    *   `frequency`: `MONTHLY` (Strictly monthly for MVP).
    *   `day_of_month`: 1-31 (Day to trigger).
*   `metadata`: Title, Category ID.
*   `status`: `ACTIVE` | `PAUSED`.

### 4.2 Reminder Generation Logic (The "Engine")
*   **Trigger:** App Startup / Foregrounding.
*   **Algorithm:**
    1.  Fetch all `RecurringExpense` templates WHERE `status` is `ACTIVE`.
    2.  Check `snoozedUntil`. If `snoozedUntil > TODAY`, skip.
    3.  Check `last_generated_at` (date).
    4.  Calculate `next_due_date` based on frequency.
    5.  If `next_due_date` <= `TODAY`:
        *   Generate a `Reminder` object (in-memory or persisted state).
        *   Repeat if multiple intervals missed (Catch-up logic), up to a cap (e.g., 12 occurrences) to prevent infinite loops.

### 4.3 The "Payment Checklist" UI
*   **Location:** Home Dashboard (Top Section).
*   **State:**
    *   *Empty:* Hidden.
    *   *Active:* Shows list of card/items.
*   **Item Content:** "Due: [Date] - [Name] - [Amount]".
*   **Actions:**
    *   **[Tick/Pay]:** Opens confirmation -> Creates `Expense` -> Updates Template `last_generated_at`.
    *   **[X/Skip]:** Shows confirmation -> Updates Template `last_generated_at` -> No `Expense` created.
    *   **[Snooze]:** Opens date picker (or presets: 1d, 3d, 1w) -> Updates Template `snoozedUntil` -> Hides Reminder.
    *(Implicit)*: Paused items do not appear here.

### 4.4 Template Management Page (New Screen)
*   **Route:** `/recurring-expenses` (or accessible via Settings).
*   **Purpose:** View and manage the *rules* (Templates), not the due reminders.
*   **Features:**
    *   List view of all Templates.
    *   Toggle switch to set `ACTIVE` / `PAUSED`.
    *   Edit / Delete actions.
    *   "Add New" button.

### 4.5 Edge Cases handling
*   **Variable Amounts:** Users can set `amount: 0` for unknown bills (e.g., Credit Card bills). The UI must prompt for "Enter Amount" instead of "Pay $0".
*   **Month End Overflow:** If scheduled for 31st, and it's February (28 days):
    *   *Requirement:* Trigger on the *last valid day* of the month (28th/29th).
*   **Late Actions:** If a user pays a due item 5 days late, the `lastGeneratedAt` (better named `lastActionedDate`) must record the **original due date** (e.g., Feb 1st), not the transaction date (Feb 5th), to maintain correct interval calculations.
*   **Deletion:** If a user deletes the resulting `Expense`, the system must NOT regenerate the reminder immediately. (The "Event" was technically handled).

---

## 5. Technical Specification

### 5.1 Database Schema (Dexie/IndexedDB)
We need a new object store `recurring_expenses`.

```typescript
interface RecurringExpense {
  id: string; // UUID
  userId?: string;
  name: string;
  amount: number; // Can be 0 for variable inputs
  categoryId: string;
  frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY'; // MVP: Restrict UI to MONTHLY. DB supports all.
  dayOfMonth: number; // 1-31
  startDate: string; // ISO Date (For reference of when it started)
  nextDueDate: string; // ISO Date (Pre-calculated next occurrence)
  lastActionedDate?: string; // ISO Date (The DUE DATE of the last paid/skipped item, NOT the execution time)
  lastActionType?: 'PAID' | 'SKIPPED' | 'MISSED'; // Track the nature of the last action
  snoozedUntil?: string; // ISO Date. If Present AND > Today, do not show reminder.
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Changes to `Expense`:**
*   add `recurringExpenseId?: string` (Foreign Key link for auditing).
*   add `isRecurringInstance?: boolean` (Optional flag for UI logic).

### 5.2 Migration Strategy
1.  **Version Bump:** Dexie version increment.
2.  **Schema Definition:** Add `recurring_expenses` table.
3.  **Data:** No data migration needed for existing expenses (start fresh).

### 5.3 Technical Challenges & Risks
*   **Risk:** `nextDueDate` drift.
    *   *Mitigation:* Always calculate from `startDate` using a library like `date-fns`. `next = addSteps(startDate, n_intervals)`. Do not just do `last + 1 month` repeatedly as it drifts over years.
*   **Risk:** Offline/Sync Conflicts.
    *   *Mitigation:* Last-Write-Wins on the Template. The Check actions are local. If two devices generate the same reminder, we might get duplicates.
    *   *Decision:* Acceptable for MVP. User can delete duplicate Expense.
*   **Risk:** 'Ghost Skips' (Lack of Audit History).
    *   *Description:* Skipped reminders do not create an Expense record. There is no historical proof that a user skipped a payment vs forgot it.
    *   *Decision:* **ACCEPTED for MVP.** Simplicity preferred over full auditability.

### 5.4 Integration with Backup System
*   **Requirement:** The `recurring_expenses` object store MUST be included in the Backup JSON payload.
*   **Format:** `data: { ..., recurring_expenses: [...] }`.
*   **Verification:** Restore tests must confirm that `RecurringExpense` items appear after a wipe + restore cycle.

---

## 6. Security & Privacy
*   **Data Integrity:** Ensure specific validations on `amount` (non-negative).
*   **Isolation:** If multi-user support exists, filter strictly by `userId`.

## 7. Future Work (Non-Blocking)
*   **Forecasting Chart:** Show "Projected Balance" logic using these reminders.
