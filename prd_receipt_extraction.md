### **Product Requirements Document: AI-Powered Receipt Extraction**

|                     |                                              |
| :------------------ | :------------------------------------------- |
| **Feature Name**    | AI-Powered Receipt Extraction                |
| **Document Status** | Refined – V2 (Architecture Aligned)          |
| **Author**          | Gemini                                       |
| **Date**            | 2026-01-25                                   |
| **Last Updated**    | 2026-01-25 (Technical Specification Added)   |

---

## Document Changelog

| Version | Date       | Changes                                                      |
| :------ | :--------- | :----------------------------------------------------------- |
| V1      | 2026-01-05 | Initial PRD draft                                            |
| V2      | 2026-01-25 | Architecture alignment, technical specs, conversational flow |

---

## 0. Technical Context

### Current Architecture

* **Frontend**: React PWA (TypeScript, Vite, Tailwind CSS)
* **Backend**: Cloudflare Pages Functions (Hono framework)
* **Database**: IndexedDB (Dexie) - client-side storage
* **Storage**: AWS S3 with presigned URLs
* **AI**: Google Gemini 2.0 Flash (multimodal capable)
* **Auth**: License-based (Cloudflare KV)

### Existing Conversational AI Flow

The application already has a conversational AI expense logging system (`AIChat.tsx`):

1. User types natural language input (e.g., "lunch at mamak RM15")
2. Backend endpoint `POST /api/ai/extract` processes the text
3. AI extracts expense details and responds conversationally
4. When confidence is "high", a confirmation card appears
5. User confirms to save the expense to IndexedDB

### Integration Point

Receipt extraction will **extend** the existing chat flow by:

* Adding an image upload option at the start of the conversation
* Using Gemini Vision API to extract text from receipt images
* Feeding extracted text into the same conversational AI pipeline
* Maintaining the same confirmation and refinement flow

---

## 1. Introduction & Problem Statement

Logging expenses via manual data entry introduces unnecessary friction, especially when users are transcribing data from physical receipts. This results in slower logging, reduced consistency, and higher error rates. Since expense tracking is a core workflow, any friction directly impacts engagement and retention.

This feature enables users to upload a photo of a receipt and have an AI system extract key details and pre-fill the expense form. The user’s role is reduced to reviewing, editing if necessary, and confirming the expense. The AI is explicitly an assistive system, not a source of truth.

---

## 2. Goals & Objectives

### User Goal

* Log an expense from a receipt with minimal effort and without manual transcription.

### Product Goal

* Reduce time-to-log for receipt-based expenses.
* Create a perceived “magic” moment that differentiates the app from traditional finance trackers.

### Business Goal

* Increase feature stickiness and long-term retention by lowering daily usage friction.

---

## 3. Scope

### 3.1 In Scope (V1)

* **Receipt Upload Trigger**: Upload option available ONLY at the beginning of the chat (before first user message)
* **Image Upload**: Single receipt image (PNG, JPG, JPEG only)
* **Client-Side Validation**:
  * Maximum file size: 5MB (enforced before upload)
  * File type validation with user-friendly error messages
* **AI Extraction** (using Gemini Vision):
  * Merchant name
  * Transaction date
  * Total amount
  * Expense category (inferred from existing user categories)
  * Payment method (if visible on receipt)
* **Conversational Refinement**: AI asks for missing compulsory fields via chat
* **Receipt Storage**:
  * Upload to S3 via presigned URLs
  * Metadata stored in IndexedDB `receipts` table
  * Receipt attachment linked to expense record
* **Confirmation Flow**: Same as existing text-based AI (high-confidence card with extracted data)
* **Receipt Viewing**: View receipt in expense history with merchant name and date metadata
* **Quota Management**: Receipt scans share the existing 100 AI requests/month limit
* **Retention**: Receipts stored indefinitely in S3

### 3.2 Explicit Assumptions (V1 Constraints)

* One receipt maps to exactly one expense.
* Upload option disappears after user sends first chat message.
* No split payments, vouchers, refunds, or adjustments are supported.
* No retry, reprocess, or correction flows beyond conversational refinement.
* AI extraction failures trigger conversational fallback (AI asks user to provide details manually via chat).
* HEIC format is NOT supported (iPhone users must convert to JPG first).

### 3.3 Out of Scope (Post-V1)

* Line-item extraction.
* Batch receipt uploads.
* PDF receipt support.
* Receipt inbox or receipt management gallery.
* Currency detection and conversion.
* Receipt upload after chat conversation has started.
* Server-side image format conversion (HEIC → JPG).

---

## 4. Product Principles

* **AI Is Assistive, Not Authoritative**: All AI-extracted values are treated as suggestions and must be reviewed by the user before saving.
* **User Confirmation Is Mandatory**: No expense is ever auto-saved from AI output.
* **Constrained Intelligence**: AI outputs must conform strictly to system-defined schemas and user-owned data.

---

## 5. User Persona & Stories

### Persona

Users who receive physical receipts for everyday transactions and want a fast, low-effort way to record expenses accurately.

### User Stories

1. As a user, I want to upload a photo of my receipt at the start of a chat conversation so the AI can extract the details for me.
2. As a user, I want the AI to conversationally ask me for any missing information from the receipt (like category or payment method).
3. As a user, if the AI cannot read my receipt clearly, I want it to ask me to provide the details via chat instead of blocking me.
4. As a user, I want to see a confirmation card with all extracted details before saving the expense.
5. As a user, I want to view the receipt image when reviewing past expenses, along with the merchant name and date.
6. As a user, I want clear error messages if my receipt image is too large or in an unsupported format.

---

## 5.5. Conversational Flow Examples

### Example 1: Successful Extraction (High Confidence)

```
[User uploads receipt image]

AI: "I see a receipt from Starbucks for RM18.50 on Jan 25, 2026. 
     Paid with Credit Card. Should I categorize this as Food & Drink?"

User: "yes"

AI: [Shows confirmation card with all details]
    "Perfect! Ready to save this expense?"

User: "confirm"

AI: "Expense added! What else?"
```

### Example 2: Missing Category (Low Confidence)

```
[User uploads receipt image]

AI: "Got it! I see RM45.00 from Guardian Pharmacy on Jan 24. 
     What category should this go under?"

User: "health"

AI: [Shows confirmation card]
    "Alright, RM45.00 for Guardian Pharmacy under Health. 
     Paid with Cash on Jan 24. Looks good?"

User: "yes"

AI: "Expense added! What else?"
```

### Example 3: Extraction Failure

```
[User uploads receipt image]

AI: "I couldn't read the receipt clearly. Can you tell me the 
     merchant name and amount?"

User: "mamak corner, rm15"

AI: "Got it! RM15.00 from Mamak Corner. What category?"

User: "food"

AI: [Shows confirmation card]
    "Perfect! RM15.00 for Mamak Corner under Food. Confirm?"

User: "yes"

AI: "Expense added! What else?"
```

### Example 4: User Corrects Extracted Data

```
[User uploads receipt image]

AI: "I see RM25.00 from KFC on Jan 25. Category: Food & Drink?"

User: "actually it was rm23.50"

AI: "Noted! Updated to RM23.50. Still from KFC on Jan 25?"

User: "yes"

AI: [Shows confirmation card with corrected amount]
    "Alright, RM23.50 for KFC under Food & Drink. Confirm?"

User: "yes"

AI: "Expense added! What else?"
```

---

## 6. Functional Requirements

### FR-1: Receipt Upload UI Flow (Frontend)

* **Upload Trigger**: An image upload button shall be visible in the `AIChat` component ONLY before the user sends their first message.
* **Client-Side Validation**:
  * File size must not exceed 5MB (validated before upload attempt)
  * File type must be `image/jpeg`, `image/png`, or `image/jpg`
  * If validation fails, display user-friendly error message via toast notification
* **Upload Process**:
  1. User selects image from device
  2. Frontend requests presigned S3 URL from `POST /api/storage/upload-url`
  3. Frontend uploads image directly to S3 using presigned URL
  4. Frontend sends S3 key to `POST /api/ai/extract-from-receipt`
  5. UI displays loading state during AI processing
* **Post-Upload Behavior**:
  * Upload button disappears after successful upload or after user sends first text message
  * Chat continues with AI's response to the receipt extraction

### FR-2: Receipt Extraction API (Backend)

* **New Endpoint**: `POST /api/ai/extract-from-receipt`
* **Request Body**:
  ```json
  {
    "s3_key": "user_storage/{userId}/receipts/{year}/{month}/{filename}",
    "categories": ["Food", "Transport", "Shopping"],
    "current_date": "2026-01-25",
    "available_payment_method": ["Cash", "Credit Card", "QR Pay", "Transfer"]
  }
  ```
* **Processing**:
  1. Validate user owns the S3 key (path must start with `user_storage/{licenseId}/`)
  2. Generate presigned S3 view URL
  3. Send image URL to Gemini Vision API with extraction prompt
  4. Parse AI response into structured data
  5. Increment AI usage quota (shared with text-based extraction)
* **Response**:
  ```json
  {
    "response_text": "I see a receipt from Starbucks for RM18.50. What category should this go under?",
    "captured_data": {
      "name": "Starbucks",
      "amount": 18.50,
      "category": null,
      "payment_method": "Credit Card",
      "date": "2026-01-25",
      "notes": null,
      "confidence": "low",
      "missing_fields": ["category"]
    },
    "receipt_metadata": {
      "s3_key": "user_storage/...",
      "merchant_name": "Starbucks",
      "receipt_date": "2026-01-25"
    },
    "usage": {
      "remaining": 99
    }
  }
  ```
* **Error Handling**:
  * If Gemini Vision fails: Return conversational error message (e.g., "I couldn't read the receipt clearly. Can you tell me the merchant name and amount?")
  * If quota exceeded: Return 429 with remaining quota info
  * If S3 key invalid: Return 403 Forbidden

### FR-3: Conversational Refinement

* After receipt extraction, the AI shall use the same conversational flow as text-based extraction
* AI asks for missing compulsory fields via chat
* User can provide additional details or corrections through natural language
* Subsequent messages use `POST /api/ai/extract` (existing endpoint) with `captured_data` context

### FR-4: Receipt Storage (Frontend)

* **New IndexedDB Table**: `receipts`
  * Schema:
    ```typescript
    interface Receipt {
      id: string;              // UUID
      userId: string;          // License ID
      s3Key: string;           // S3 object key
      merchantName: string;    // Extracted merchant name
      receiptDate: string;     // ISO date from receipt
      uploadedAt: Date;        // Upload timestamp
      expenseId?: string;      // Linked expense (null if not confirmed)
    }
    ```
* **Storage Flow**:
  1. After successful AI extraction, save receipt metadata to `receipts` table
  2. When user confirms expense, update `expenseId` in receipt record
  3. Update `Expense` record with `receiptUrl` (S3 presigned view URL)

### FR-5: Receipt Viewing

* In expense history/detail view, if `receiptUrl` exists:
  * Display receipt icon with merchant name and date
  * On tap, open full-screen image viewer showing the receipt
  * Generate fresh presigned S3 URL via `POST /api/storage/view-url` (existing endpoint)

---

## 7. Data Model

### Receipts Table (IndexedDB)

Stored in `FinanceDB.receipts` using Dexie:

| Field        | Type   | Description                                    | Indexed |
| ------------ | ------ | ---------------------------------------------- | ------- |
| id           | string | Primary key (UUID)                             | ✓       |
| userId       | string | License ID (owner)                             | ✓       |
| s3Key        | string | S3 object key                                  | -       |
| merchantName | string | Extracted merchant name                        | -       |
| receiptDate  | string | ISO date from receipt                          | -       |
| uploadedAt   | Date   | Upload timestamp                               | ✓       |
| expenseId    | string | Linked expense ID (null if not confirmed yet)  | ✓       |

**Dexie Schema Definition**:
```typescript
receipts: 'id, userId, uploadedAt, expenseId'
```

### Expenses Table (Existing - Updated)

The existing `Expense` interface already supports receipt attachments:

```typescript
interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  tags: string[];
  timestamp: Date;
  notes?: string;
  paymentMethod: string;
  isTaxDeductible: boolean;
  receiptUrl?: string;      // S3 presigned view URL (regenerated on demand)
  localReceipt?: Blob;      // NOT USED for this feature
  // ... other fields
}
```

**Relationship**: `receipts.expenseId` → `expenses.id` (one-to-one)

---

## 8. Non-Functional Requirements

* **Security**: 
  * Presigned S3 upload URLs expire in 5 minutes
  * Presigned S3 view URLs expire in 1 hour
  * All URLs are user-scoped (validated by license ID)
* **Performance**:
  * Target <5 seconds for receipt extraction on WiFi
  * Target <8 seconds on mobile data
  * Client-side validation prevents unnecessary uploads
* **Cost Control**:
  * Maximum image size: 5MB (enforced client-side)
  * Supported formats: JPEG, PNG only (client-side validation)
  * Monthly per-user scan quota: 100 (shared with text-based AI extraction)
* **Storage**:
  * Receipts stored indefinitely in S3 (no expiration policy)
  * S3 path structure: `user_storage/{userId}/receipts/{year}/{month}/{filename}`
* **Observability**:
  * Track extraction latency and failure rates
  * Track which AI-filled fields are edited before save
  * Monitor quota usage per license

---

## 9. Success Metrics

* ≥25% of monthly active users use receipt extraction within 30 days.
* ≥80% of successful scans result in a saved expense.
* ≥70% of saved expenses require edits to no more than one field.
* Reduction in average time-to-log compared to manual entry.

---

## 10. Open Questions & Decisions

### ✅ Resolved

* ~~What monthly scan limit best balances cost and perceived value?~~ → **100 scans/month (shared quota)**
* ~~What retention policy should apply to attached receipts long-term?~~ → **Indefinite storage**

### 🔄 For Implementation Phase

* Should we implement a "receipt preview" before sending to AI (to let users confirm image quality)?
* Should category inference improve over time based on user edits (ML feedback loop)?
* How should we handle "orphaned receipts" (uploaded but never confirmed as expense)?
  * Option A: Auto-delete after 7 days
  * Option B: Keep indefinitely for debugging
  * Option C: Show in a "Draft Receipts" section
* Should we add analytics to track:
  * Average extraction accuracy by merchant type?
  * Most common extraction failures?
  * User edit patterns (which fields get corrected most often)?

---

## 11. Technical Implementation Notes

### Key Files to Modify

**Frontend**:
- `src/components/AIChat.tsx` - Add image upload button and handling
- `src/db/db.ts` - Add `receipts` table schema (Dexie migration)
- `src/services/aiService.ts` - Add `extractExpenseFromReceipt()` function
- `src/services/api.ts` - Add API client method for `/api/ai/extract-from-receipt`
- `src/pages/ExpenseDetail.tsx` - Add receipt viewing functionality

**Backend**:
- `functions/api/ai/extract-from-receipt.ts` - New endpoint (similar to `extract.ts`)
- `functions/core/geminiVisionService.ts` - New service for Gemini Vision API calls

### Gemini Vision API Integration

**Prompt Structure**:
```
You are analyzing a receipt image for a Malaysian personal finance app.
Extract the following information:
- Merchant name
- Total amount (in RM)
- Transaction date (ISO format)
- Payment method (if visible)

Categories available: [Food, Transport, Shopping, ...]
Payment methods: [Cash, Credit Card, QR Pay, Transfer]

Output in key-value format:
name: <merchant>
amount: <number>
...
```

**API Call**:
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
const result = await model.generateContent([
  prompt,
  {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64ImageData // or use S3 presigned URL
    }
  }
]);
```

### Database Migration (Dexie)

Add to `src/db/db.ts`:
```typescript
this.version(3).stores({
  expenses: 'id, name, amount, category, *tags, timestamp, createdAt',
  budgets: 'id, category, monthPeriod',
  settings: 'key',
  receipts: 'id, userId, uploadedAt, expenseId' // NEW
});
```

### Error Handling Checklist

- [ ] File size validation (client-side)
- [ ] File type validation (client-side)
- [ ] S3 upload failure (network error)
- [ ] Gemini Vision API failure (service down)
- [ ] Gemini Vision API timeout (>30s)
- [ ] Quota exceeded (429 response)
- [ ] Invalid S3 key (403 Forbidden)
- [ ] Malformed AI response (parsing error)

### Testing Considerations

**Unit Tests**:
- File validation logic (size, type)
- AI response parsing
- Receipt metadata extraction

**Integration Tests**:
- Full upload → extraction → save flow
- Quota enforcement
- S3 presigned URL generation

**Manual Testing**:
- Various receipt types (restaurant, grocery, pharmacy)
- Poor quality images (blurry, rotated)
- Non-receipt images (should fail gracefully)
- Quota limit edge cases

---

## Appendix A: Refinement Summary (V1 → V2)

### Major Changes from Original PRD

#### 1. Architecture Alignment
- **V1**: Generic implementation with server-side database
- **V2**: Aligned to React PWA + Cloudflare Functions + IndexedDB architecture

#### 2. User Flow
- **V1**: Form-based pre-fill approach
- **V2**: Conversational chat integration (extends existing AI flow)

#### 3. Upload Trigger
- **V1**: "Add from Receipt" button on dashboard
- **V2**: Upload option in chat (only before first message)

#### 4. Data Storage
- **V1**: Server-side `Receipts` table with `status`, `extractedData`, `aiModel`, `aiPromptVersion`
- **V2**: Client-side IndexedDB with minimal fields: `id`, `userId`, `s3Key`, `merchantName`, `receiptDate`, `uploadedAt`, `expenseId`

#### 5. File Validation
- **V1**: Server-side enforcement, HEIC support mentioned
- **V2**: Client-side validation (5MB, JPEG/PNG only), HEIC explicitly out of scope

#### 6. Error Handling
- **V1**: "Fall back to manual entry without recovery options"
- **V2**: Conversational fallback (AI asks user to provide details via chat)

### Decision Matrix

| Question | V1 Assumption | V2 Decision | Rationale |
|----------|---------------|-------------|-----------|
| Upload trigger | Dashboard button | Chat start only | Simpler UX, aligns with conversational flow |
| Image formats | PNG, JPG, HEIC | JPEG, PNG only | No server-side conversion, Gemini compatibility |
| File size limit | Server-side enforcement | 5MB client-side | Prevents unnecessary S3 costs |
| Quota tracking | Separate for receipts | Shared with text AI | Simpler implementation, existing infrastructure |
| Receipt retention | Open question | Indefinite storage | Tax compliance, user expectation |
| Database location | Server-side table | IndexedDB (client) | Offline-first architecture |
| Confirmation UI | Pre-filled form | Conversational card + icon | Consistent with existing UX |
| Error handling | Block user | Conversational fallback | Maintains chat flow |

### Scope Clarifications

**Explicitly In Scope (V2)**:
- ✅ Upload at chat start only
- ✅ Client-side validation with user-friendly errors
- ✅ Conversational refinement for missing fields
- ✅ Receipt icon with metadata in expense history
- ✅ Shared AI quota (100/month)

**Explicitly Out of Scope (V2)**:
- ❌ Upload after chat starts
- ❌ HEIC format support
- ❌ Server-side image conversion
- ❌ PDF receipts
- ❌ Batch uploads
- ❌ Line-item extraction
- ❌ Receipt inbox/gallery

### Technical Debt & Future Enhancements

**Deferred to Post-V1**:
1. Receipt preview before AI processing
2. Orphaned receipt cleanup strategy
3. ML-based category inference improvement
4. Extraction accuracy analytics
5. HEIC format support (requires server-side conversion)
6. PDF receipt support
7. Receipt management gallery

---

## Appendix B: Implementation Checklist

### Phase 1: Backend (Estimated: 2-3 days)

- [ ] Create `functions/api/ai/extract-from-receipt.ts`
- [ ] Implement Gemini Vision API integration
- [ ] Add S3 key validation (user ownership check)
- [ ] Implement quota enforcement (reuse existing logic)
- [ ] Add error handling for all scenarios
- [ ] Write unit tests for API endpoint
- [ ] Update OpenAPI documentation

### Phase 2: Frontend - Database (Estimated: 1 day)

- [ ] Add `receipts` table to `src/db/db.ts` (Dexie v3 migration)
- [ ] Create TypeScript interface for `Receipt`
- [ ] Add CRUD operations for receipts
- [ ] Test database migration locally

### Phase 3: Frontend - Upload Flow (Estimated: 2-3 days)

- [ ] Add image upload button to `AIChat.tsx`
- [ ] Implement client-side file validation (size, type)
- [ ] Add S3 upload logic (presigned URL flow)
- [ ] Implement loading states during upload/processing
- [ ] Add error toast notifications
- [ ] Hide upload button after first message
- [ ] Update `aiService.ts` with receipt extraction function
- [ ] Update `api.ts` with new endpoint client

### Phase 4: Frontend - Receipt Viewing (Estimated: 1-2 days)

- [ ] Add receipt icon to expense detail view
- [ ] Implement full-screen image viewer
- [ ] Add presigned URL regeneration logic
- [ ] Display merchant name and date metadata
- [ ] Handle missing/expired receipts gracefully

### Phase 5: Testing (Estimated: 2 days)

- [ ] Unit tests: File validation logic
- [ ] Unit tests: AI response parsing
- [ ] Integration tests: Full upload → extraction → save flow
- [ ] Integration tests: Quota enforcement
- [ ] Manual testing: Various receipt types
- [ ] Manual testing: Poor quality images
- [ ] Manual testing: Error scenarios
- [ ] Manual testing: Quota limits

### Phase 6: Documentation & Deployment (Estimated: 1 day)

- [ ] Update README with receipt feature
- [ ] Add API documentation (Swagger)
- [ ] Create user guide/help text
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production

**Total Estimated Effort**: 9-12 days

---

**Document Version**: V2 (Architecture Aligned)  
**Last Updated**: 2026-01-25  
**Status**: Ready for Implementation
