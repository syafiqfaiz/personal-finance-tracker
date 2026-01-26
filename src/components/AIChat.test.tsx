import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIChat from './AIChat';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { extractExpenseWithAI } from '../services/aiService';

// Mock dependencies
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
            expect(screen.queryByText('Entry Preview')).not.toBeInTheDocument(); // Confirmation card hidden
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

        const confirmBtn = screen.getByText('Confirm Entry');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            // ExpenseService.addExpense should be called instead of store's addExpense
            expect(screen.queryByText('Entry Preview')).not.toBeInTheDocument();
            expect(screen.getByText(/Expense added/i)).toBeInTheDocument();
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
