Project Brief: AI-First Personal Finance PWA
1. Design Language & Aesthetic
Core Philosophy: "Warm, Organic, and Minimalist." The UI should feel like a premium lifestyle app (inspired by "Daily Coffee"), avoiding the sterile "fintech" look.

Color Palette (Selected: Modern Blue):
Background: Light Slate (#f8fafc) — outer container uses (#e2e8f0).

Primary Accent: Deep Navy (#0f172a) — used for headers, buttons, and active states.

Secondary Accent: Electric Blue (#3b82f6) — used for highlights, links, and interactive elements.

Cards/Containers: Pure White with high corner radius (28px) and subtle shadows.

Status Colors: Red (#ef4444) for warnings/over-budget, Green (#22c55e) for success, Purple (#a855f7) for AI features.

Typography:

Headings: Elegant Serif (Cardo) for a premium feel.

Body/UI: Clean, readable Sans-serif (e.g., Inter or System UI).

UI Components:

Floating Navigation: A white "pill" bar at the bottom with a central, oversized circular Brown FAB (+).

Segmented Controls: Pill-shaped toggles with white backgrounds for active states (Timeframe/Mode selectors).

Selection Cards: Large, tappable cards for categories (Card Radios).

2. Product Requirements (PRD)
Target User: Individuals tracking expenses in Ringgit Malaysia (RM).

Architecture: Offline-First & Serverless (BYOK).

Users provide their own Google Gemini API Key (for AI NLP extraction).

Users provide their own AWS S3 Credentials (for backups and receipt images).

Core Schema: Name/Merchant, Amount (Mandatory), Category (Default: Uncategorized), Tags, Date, Payment Method, Tax Toggle, Receipt Image.

Navigation (Sitemap):

/ Home: Dashboard with Budget Alerts, Stats, and AI Insights.

/history: Infinite scroll list grouped by month with search.

/add: Dual-mode entry (AI Conversational Chat vs. Manual Form).

/budgets: Per-category RM limit tracking with progress bars.

/settings: Key management (Gemini/S3) and Category CRUD.

3. Technical Implementation Context
Frontend: React (Vite-based), mobile-first PWA.

State Management: Zustand.

Storage: IndexedDB (via Dexie.js) for 100% offline data persistence.

AI Logic: Direct client-side calls to Gemini to extract structured JSON from natural language (e.g., "Lunch RM15 today").

4. Interaction Patterns
One-Handed UX: All primary actions (FAB, Nav, Buttons) must be within thumb reach.

AI Clarification: If the user’s input is missing data (e.g., no amount), the AI must prompt for it before saving.

Budgeting: Visual charts should mirror the "Daily Coffee" style—minimalist line/bar graphs against neutral backgrounds.