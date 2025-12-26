### **Product Requirements Document: Recurring Expense Reminders**

| | |
| :--- | :--- |
| **Feature Name** | Recurring Expense Reminders |
| **Document Status**| Draft |
| **Author** | Gemini |
| **Date** | 2025-12-26 |

### 1. Introduction & Problem Statement

Users of the Personal Finance Tracker currently log all expenses manually. This process is repetitive and prone to error for regular, predictable payments such as rent, subscriptions (Netflix, Spotify), utility bills, and loan payments. Forgetting to log these expenses leads to inaccurate financial records and budget tracking, undermining the app's core value proposition.

This feature introduces a "reminder" system for recurring expenses. Instead of full automation, the system will prompt the user to confirm and record these transactions as they become due. This provides a balance of convenience and user control, ensuring data accuracy while reducing manual data entry.

### 2. Goals & Objectives

*   **User Goal:** To track recurring payments accurately with minimal effort and never forget to log a regular expense.
*   **Product Goal:** To increase user retention and daily engagement by making the app an indispensable tool for managing all types of financial transactions.
*   **Business Goal:** To establish a feature foundation that can later be expanded with forecasting and advanced budgeting capabilities.

### 3. Scope

#### **3.1. In Scope (Minimum Viable Product - MVP)**

*   **Template Creation:** Users can create a "recurring expense template" with a category, description, amount, frequency, and start date.
*   **Template Management:** Users can view, edit, pause/resume, and delete their saved templates.
*   **Supported Frequencies:** The initial release will support `weekly` and `monthly` frequencies.
*   **Reminder UI:** A new module on the main dashboard will display reminders for expenses that are currently due.
*   **Reminder Actions:** Each reminder will have two actions:
    *   **Record Expense:** Pre-fills the "Add Expense" form for the user to confirm or edit before saving.
    *   **Dismiss:** Skips the expense for the current period without creating a transaction.
*   **Reminder Logic:** The system will check for due expenses on app startup and generate the necessary reminders. It will handle reminders that were missed since the last app use.

#### **3.2. Out of Scope (Future Enhancements)**

*   **Push Notifications:** System-level notifications that appear when the app is not open.
*   **Advanced Scheduling:** Frequencies like "every X months," "yearly," or specific rules like "the last Friday of the month."
*   **Full Automation:** Automatically creating expense records without user confirmation.
*   **Reporting & Forecasting:** Advanced reports showing future committed spending based on recurring expenses.

### 4. User Personas & Stories

*   **Persona:** A busy professional who wants to maintain accurate financial records but has little time for manual data entry.

*   **User Stories:**
    1.  **As a user, I want to define my monthly rent payment once, so the app reminds me to record it on the first of every month.**
    2.  **As a user, when my monthly utility bill is due, I want to be prompted to record it so I can update the exact amount before saving.**
    3.  **As a user, I want to see a list of all my recurring payments, so I can easily pause my gym membership fee when I go on vacation.**
    4.  **As a user, if I forget to open the app for a week, I want to see all the reminders I missed so I can quickly catch up on my expense logging.**

### 5. Functional Requirements

#### **FR-1: Recurring Expense Template Creation**
*   A new form shall be created allowing users to define a recurring expense.
*   The form must capture the following fields:
    *   `amount` (number)
    *   `categoryId` (selection)
    *   `description` (text)
    *   `frequency` (selection: 'weekly', 'monthly')
    *   `dayOfWeek` (selection, conditional on `frequency` being 'weekly')
    *   `dayOfMonth` (selection, conditional on `frequency` being 'monthly')
    *   `startDate` (date)

#### **FR-2: Template Management**
*   A new screen shall list all user-created recurring expense templates.
*   Each item in the list must display the description, amount, and frequency.
*   Users must be able to perform the following actions on a template:
    *   **Edit:** Open the creation form pre-filled with the template's data.
    *   **Pause/Resume:** Toggle the `isActive` status of the template. Paused templates will not generate reminders.
    *   **Delete:** Permanently remove the template.

#### **FR-3: Reminder Generation Logic**
*   On app initialization, the system will check all `active` recurring expense templates.
*   For each template, it will compare the `lastGeneratedDate` with the `frequency` and current date to determine if one or more reminders are due.
*   A reminder is considered due if its scheduled date is on or before the current date and after the `lastGeneratedDate`.

#### **FR-4: Reminder UI Module**
*   A new UI module, titled "Due Reminders," shall be displayed on the main dashboard (`Home.tsx`).
*   This module will only be visible if there is at least one due reminder.
*   Each reminder will be displayed as a card containing the expense `description`, `amount`, and due date.
*   Each card will have two buttons: "Record" and "Dismiss."

#### **FR-5: User Actions**
*   **On "Record" click:**
    1.  The application will navigate to the "Add Expense" view.
    2.  The form fields will be pre-populated with data from the reminder.
    3.  Upon successful submission of the expense, the `lastGeneratedDate` on the corresponding template will be updated, and the reminder card will be removed from the UI.
*   **On "Dismiss" click:**
    1.  The `lastGeneratedDate` on the corresponding template will be updated.
    2.  The reminder card will be removed from the UI. No expense will be logged.

### 6. Data & Schema Design

A new table/object-store, `recurring_expenses`, is required.

**New Table: `recurring_expenses`**
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key. |
| `amount` | `number` | The cost of the expense. |
| `categoryId`| `string` | Foreign key linking to the expense category. |
| `description`| `string` | Short description. |
| `frequency` | `string` | 'weekly', 'monthly'. |
| `dayOfWeek` | `number` | 0-6 (Sun-Sat), for weekly frequency. |
| `dayOfMonth` | `number` | 1-31, for monthly frequency. |
| `startDate` | `Date` | The date from which the recurrence should start. |
| `lastGeneratedDate` | `Date` | The due date of the last reminder that was actioned. |
| `isActive` | `boolean` | `true` by default. Used for pausing/resuming. |

**Modification to `expenses` table:**
A new optional field will be added.
| Field | Type | Description |
| :--- | :--- | :--- |
| `recurringExpenseId` | `string` (nullable) | Links the created expense back to its template. |

### 7. Non-Functional Requirements
*   **Performance:** The reminder check on app startup must not noticeably delay the rendering of the main screen. It should execute in under 500ms for a typical user.
*   **Usability:** Recording an expense via a reminder should take no more than two clicks.
*   **Data Integrity:** The system must ensure that no duplicate reminders are generated for the same period. State changes must be atomic.

### 8. Success Metrics
*   **Adoption Rate:** >30% of monthly active users create at least one recurring expense template within 60 days of launch.
*   **Engagement Rate:** >70% of displayed reminders are actioned (recorded or dismissed) by the user.
*   **Task Completion:** A measurable decrease in the average time spent creating expenses that are identified as recurring.

### 9. Open Questions & Dependencies
*   **Dependency:** UI/UX mockups for the template management screen and the dashboard reminder module are required before development can begin.
*   **Open Question:** How should the system handle monthly reminders for days that do not exist in a given month (e.g., a reminder set for the 31st in February)?
    *   **Proposal for MVP:** For monthly reminders, if the scheduled `dayOfMonth` is greater than the number of days in the current month, the reminder will fall on the last day of that month.
