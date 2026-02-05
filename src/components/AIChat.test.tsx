import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIChat from './AIChat';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { extractExpenseWithAI } from '../services/aiService';

import { useIsMobile } from '../hooks/useIsMobile';

// Mock dependencies
vi.mock('../hooks/useIsMobile', () => ({
    useIsMobile: vi.fn(),
}));
vi.mock('../store/useSettingsStore', () => ({
    useSettingsStore: Object.assign(
        vi.fn(),
        {
            getState: vi.fn(() => ({
                licenseKey: 'valid-key',
                s3Config: {
                    accessKeyId: '',
                    secretAccessKey: '',
                    region: '',
                    bucketName: ''
                }
            }))
        }
    ),
}));

vi.mock('../store/useFinanceStore', () => ({
    useFinanceStore: Object.assign(
        vi.fn(() => ({
            categories: ['Food', 'Transport'],
            addExpense: vi.fn(),
        })),
        {
            getState: vi.fn(() => ({
                expenses: []
            })),
            setState: vi.fn()
        }
    ),
}));

vi.mock('../services/aiService', () => ({
    extractExpenseWithAI: vi.fn(),
}));

vi.mock('../services/ExpenseService', () => ({
    ExpenseService: {
        addExpense: vi.fn((data) => Promise.resolve({ ...data, id: 'test-id', createdAt: new Date(), updatedAt: new Date() }))
    }
}));

vi.mock('../db/receiptOperations', () => ({
    receiptOperations: {
        getAllByUser: vi.fn(() => Promise.resolve([])),
        linkToExpense: vi.fn(() => Promise.resolve())
    }
}));

vi.mock('../constants/greetings', () => ({
    getRandomGreeting: () => 'Mock Greeting'
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AIChat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows license required message when no license key', () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: '' });
        render(<AIChat />);
        expect(screen.getByText('License Required')).toBeInTheDocument();
    });

    it('shows initial greeting', () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: 'valid-key' });
        render(<AIChat />);
        expect(screen.getByText('Mock Greeting')).toBeInTheDocument();
        expect(screen.queryByText('Start a conversation')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type expenses naturally...')).toBeEnabled();
    });

    it('sets capture environment on receipt file input on mobile', () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: 'valid-key' });
        (useIsMobile as any).mockReturnValue(true);
        const { container } = render(<AIChat />);

        // Should have 2 inputs
        const inputs = container.querySelectorAll('input[type="file"]');
        expect(inputs).toHaveLength(2);

        // One should have capture environment (Camera)
        const cameraInput = Array.from(inputs).find(input => input.hasAttribute('capture'));
        expect(cameraInput).toHaveAttribute('capture', 'environment');

        // One should NOT have capture environment (Gallery)
        const galleryInput = Array.from(inputs).find(input => !input.hasAttribute('capture'));
        expect(galleryInput).toBeInTheDocument();
    });

    it('does not sets capture environment on receipt file input on desktop', () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: 'valid-key' });
        (useIsMobile as any).mockReturnValue(false);
        const { container } = render(<AIChat />);

        // Should have 1 input
        const inputs = container.querySelectorAll('input[type="file"]');
        expect(inputs).toHaveLength(1);

        const input = inputs[0];
        expect(input).not.toHaveAttribute('capture');
    });

    it('should accept PDF files in file input', () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: 'valid-key' });
        (useIsMobile as any).mockReturnValue(false);
        const { container } = render(<AIChat />);

        const fileInput = container.querySelector('input[type="file"]');
        expect(fileInput).toHaveAttribute('accept');

        const acceptAttr = fileInput?.getAttribute('accept');
        expect(acceptAttr).toContain('application/pdf');
        expect(acceptAttr).toContain('image/jpeg');
        expect(acceptAttr).toContain('image/png');
    });

    it('handles low confidence response correctly', async () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: 'valid-key' });
        (extractExpenseWithAI as any).mockResolvedValue({
            name: 'Miscellaneous',
            amount: 0,
            category: 'Others',
            paymentMethod: 'Cash',
            date: new Date().toISOString(),
            notes: '',
            confidence: 'low',
            missingFields: ['amount'],
            responseText: 'I need the amount.'
        });

        render(<AIChat />);

        const input = screen.getByPlaceholderText('Type expenses naturally...');
        fireEvent.change(input, { target: { value: 'Lunch at KFC' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(extractExpenseWithAI).toHaveBeenCalledWith('Lunch at KFC', ['Food', 'Transport'], undefined);
            expect(screen.getByText('I need the amount.')).toBeInTheDocument();
            expect(screen.getByText('Entry Preview')).toBeInTheDocument(); // Confirmation card now shows for all contexts
        });
    });

    it('handles high confidence response correctly', async () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: 'valid-key' });
        (extractExpenseWithAI as any).mockResolvedValue({
            name: 'KFC',
            amount: 15,
            category: 'Food',
            paymentMethod: 'Cash',
            date: new Date().toISOString(),
            notes: 'Lunch',
            confidence: 'high',
            missingFields: [],
            responseText: 'Got it!'
        });

        render(<AIChat />);

        const input = screen.getByPlaceholderText('Type expenses naturally...');
        fireEvent.change(input, { target: { value: 'KFC 15' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(extractExpenseWithAI).toHaveBeenCalledWith('KFC 15', ['Food', 'Transport'], undefined);
            expect(screen.getByText('Entry Preview')).toBeInTheDocument();
            expect(screen.getByText('RM 15.00')).toBeInTheDocument();
        });
    });

    it('confirms expense entry correctly', async () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: 'valid-key' });
        const mockSetState = vi.fn();
        const mockGetState = vi.fn(() => ({
            expenses: [
                // Existing expense with older timestamp (should be after new one)
                {
                    id: 'old-expense',
                    name: 'Old Expense',
                    amount: 50,
                    timestamp: new Date('2024-01-01T10:00:00Z'),
                    createdAt: new Date('2024-01-01T09:00:00Z')
                }
            ]
        }));

        (useFinanceStore as any).mockReturnValue({
            categories: ['Food'],
            addExpense: vi.fn(),
        });
        (useFinanceStore as any).getState = mockGetState;
        (useFinanceStore as any).setState = mockSetState;

        (extractExpenseWithAI as any).mockResolvedValue({
            name: 'KFC',
            amount: 15,
            category: 'Food',
            paymentMethod: 'Cash',
            date: new Date().toISOString(),
            notes: 'Lunch',
            confidence: 'high',
            missingFields: [],
            responseText: 'Got it!'
        });

        render(<AIChat />);

        const input = screen.getByPlaceholderText('Type expenses naturally...');
        fireEvent.change(input, { target: { value: 'KFC 15' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Entry Preview')).toBeInTheDocument();
        });

        const confirmBtn = screen.getByText('Confirm Entry');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            // Verify UI feedback
            expect(screen.queryByText('Entry Preview')).not.toBeInTheDocument();
            expect(screen.getByText(/Expense added/i)).toBeInTheDocument();

            // CRITICAL: Verify timestamp sorting logic
            expect(mockSetState).toHaveBeenCalled();
            const setStateCalls = mockSetState.mock.calls;
            const lastCall = setStateCalls[setStateCalls.length - 1][0];

            // Verify expenses array has correct sort order
            expect(lastCall.expenses).toBeDefined();
            expect(lastCall.expenses.length).toBeGreaterThan(1);

            // First expense should be the newer one (descending by timestamp)
            const firstExpense = lastCall.expenses[0];
            expect(firstExpense.name).toBe('KFC');

            // Verify the sorting function handles both Date and string timestamps
            // (This tests the getTime() helper we implemented)
            const timestamps = lastCall.expenses.map((e: any) => {
                const ts = e.timestamp;
                if (ts instanceof Date) return ts.getTime();
                return new Date(ts).getTime();
            });

            // Timestamps should be in descending order
            for (let i = 0; i < timestamps.length - 1; i++) {
                expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
            }
        });
    });

    it('discards expense entry correctly', async () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: 'valid-key' });
        const mockAddExpense = vi.fn();
        (useFinanceStore as any).mockReturnValue({
            categories: ['Food'],
            addExpense: mockAddExpense,
        });

        (extractExpenseWithAI as any).mockResolvedValue({
            name: 'KFC',
            amount: 15,
            category: 'Food',
            paymentMethod: 'Cash',
            date: new Date().toISOString(),
            notes: 'Lunch',
            confidence: 'high',
            missingFields: [],
            responseText: 'Got it!'
        });

        render(<AIChat />);

        const input = screen.getByPlaceholderText('Type expenses naturally...');
        fireEvent.change(input, { target: { value: 'KFC 15' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Entry Preview')).toBeInTheDocument();
        });

        const discardBtn = screen.getByText('Discard');
        fireEvent.click(discardBtn);

        await waitFor(() => {
            expect(mockAddExpense).not.toHaveBeenCalled();
            expect(screen.queryByText('Entry Preview')).not.toBeInTheDocument();
            expect(screen.getByText(/Cancelled/i)).toBeInTheDocument();
        });
    });
});
