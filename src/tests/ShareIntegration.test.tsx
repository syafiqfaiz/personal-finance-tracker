import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ShareReceiptPage from '../pages/ShareReceiptPage';
import AddExpense from '../pages/AddExpense';
import { api } from '../services/api';
import { useSettingsStore } from '../store/useSettingsStore';
import 'fake-indexeddb/auto'; // Automatically mocks IndexedDB

// Mock dependencies
vi.unmock('react-router-dom');

vi.mock('../services/api', () => ({
    api: {
        getUploadUrl: vi.fn(),
        extractFromReceipt: vi.fn(),
    }
}));

vi.mock('../store/useSettingsStore', () => ({
    useSettingsStore: Object.assign(
        vi.fn(() => ({ licenseKey: 'test-license-key' })),
        { getState: () => ({ licenseKey: 'test-license-key' }) }
    )
}));

// Mock receiptOperations to avoid DB dependency issues
vi.mock('../db/receiptOperations', () => ({
    receiptOperations: {
        create: vi.fn().mockResolvedValue({ id: 'test-receipt-id' }),
        getAllByUser: vi.fn().mockResolvedValue([]),
        linkToExpense: vi.fn(),
    }
}));

vi.mock('../store/useFinanceStore', () => {
    const stableState = {
        categories: ['Food', 'Transport'],
        addExpense: vi.fn(),
    };
    return {
        useFinanceStore: Object.assign(
            vi.fn(() => stableState),
            {
                getState: vi.fn(() => ({ expenses: [] })),
                setState: vi.fn()
            }
        )
    };
});

vi.mock('../services/ExpenseService', () => ({
    ExpenseService: {
        addExpense: vi.fn()
    }
}));

vi.mock('../services/analytics', () => ({
    AnalyticsService: {
        trackEvent: vi.fn()
    }
}));

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Mock window.fetch for the direct R2 upload
global.fetch = vi.fn();

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Share Receipt Integration Flow', () => {
    // Use a plain object to avoid potential structured clone issues with File/Blob in the test environment
    const mockFile = {
        name: 'receipt.jpg',
        type: 'image/jpeg',
        size: 5000
    } as unknown as File;

    const DB_NAME = 'share-target-db';
    const STORE_NAME = 'shared-files';
    const DB_VERSION = 1;

    beforeEach(async () => {
        vi.resetModules(); // Ensure clean module registry
        vi.clearAllMocks();

        // Mock API responses
        (api.getUploadUrl as any).mockResolvedValue({
            url: 'https://fake-upload-url.com/put',
            key: 'user/receipts/test-key.jpg'
        });

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({})
        });

        (api.extractFromReceipt as any).mockResolvedValue({
            response_text: 'I found a receipt from Starbucks.',
            captured_data: {
                name: 'Starbucks',
                amount: 15.50,
                category: 'Food',
                payment_method: 'Credit Card',
                date: '2023-10-27',
                notes: 'Coffee',
                confidence: 'high',
                missing_fields: []
            },
            receipt_metadata: {
                storage_key: 'user/receipts/test-key.jpg',
                merchant_name: 'Starbucks',
                receipt_date: '2023-10-27'
            }
        });

        // Setup IndexedDB with shared file
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put({
                    id: 'test-id',
                    file: mockFile,
                    timestamp: Date.now()
                }, 'latest');
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            };
        });
    });

    // Suppress console errors for specific known warnings
    const originalError = console.error;
    beforeAll(() => {
        console.error = (...args) => {
            if (/Encountered two children with the same key/.test(args[0])) return;
            originalError.call(console, ...args);
        };
    });

    afterAll(() => {
        console.error = originalError;
    });

    afterEach(async () => {
        // Cleanup IndexedDB - simplify to avoid timeouts
        try {
            const request = indexedDB.deleteDatabase(DB_NAME);
            request.onerror = () => { }; // Ignore errors
        } catch (e) {
            // Ignore
        }
    });

    it('successfully uploads shared file and verifies confirmation dialog in AI Chat', { timeout: 15000 }, async () => {
        render(
            <MemoryRouter initialEntries={['/share']}>
                <Routes>
                    <Route path="/share" element={<ShareReceiptPage />} />
                    <Route path="/add" element={<AddExpense />} />
                </Routes>
            </MemoryRouter>
        );

        // 1. Verify ShareReceiptPage loads
        expect(screen.getByText('Receiving Receipt...')).toBeInTheDocument();

        // 2. Wait for upload URL generation and upload
        await waitFor(() => {
            expect(api.getUploadUrl).toHaveBeenCalledWith('receipt.jpg', 'image/jpeg');
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('https://fake-upload-url.com/put', expect.objectContaining({
                method: 'PUT',
                body: mockFile
            }));
        });

        // 3. Verify redirect to /add and AI Chat processing
        // The redirects happen automatically on success. We wait for AI Chat elements.

        // Wait for extraction call
        await waitFor(() => {
            expect(api.extractFromReceipt).toHaveBeenCalledWith(
                'user/receipts/test-key.jpg',
                expect.any(Array),
                expect.any(String),
                expect.any(Array)
            );
        }, { timeout: 3000 });

        // 4. VERIFY SUCCESS METRIC: Confirmation Dialog (Entry Preview)
        await waitFor(() => {
            // Debug failure
            const errorElement = screen.queryByText(/Sorry/);
            if (errorElement) {
                console.error('DEBUG: Found error in UI:', errorElement.textContent);
            }
            const licenseRequired = screen.queryByText(/License Required/i);
            if (licenseRequired) {
                console.error('DEBUG: Found License Required message');
            }

            // "Entry Preview" is the header of the confirmation card in AIChat
            expect(screen.getByText('Entry Preview')).toBeInTheDocument();

            // Check for extracted data using getByText since it renders as text
            expect(screen.getByText('Starbucks')).toBeInTheDocument();
            expect(screen.getByText(/15\.50/)).toBeInTheDocument();

            // Verify AI response text
            expect(screen.getByText('I found a receipt from Starbucks.')).toBeInTheDocument();
        }, { timeout: 15000 });
    });
});
