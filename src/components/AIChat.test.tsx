import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIChat from './AIChat';
import { useSettingsStore } from '../store/useSettingsStore';
import { extractExpenseWithAI } from '../services/aiService';

// Mock dependencies
vi.mock('../store/useSettingsStore', () => ({
    useSettingsStore: vi.fn(),
}));

vi.mock('../store/useFinanceStore', () => ({
    useFinanceStore: vi.fn(() => ({
        categories: ['Food', 'Transport'],
        addExpense: vi.fn(),
    })),
}));

vi.mock('../services/aiService', () => ({
    extractExpenseWithAI: vi.fn(),
}));

describe('AIChat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows license required message when no license key', () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: '' });
        render(<AIChat />);
        expect(screen.getByText('License Required')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('e.g., Spent 12 on dinner at KFC')).not.toBeInTheDocument();
    });

    it('enables chat input when license key exists', () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: 'valid-key' });
        render(<AIChat />);
        expect(screen.queryByText('License Required')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g., Spent 12 on dinner at KFC')).toBeEnabled();
    });

    it('calls extractExpenseWithAI when message sent', async () => {
        (useSettingsStore as any).mockReturnValue({ licenseKey: 'valid-key' });
        (extractExpenseWithAI as any).mockResolvedValue({
            name: 'KFC',
            amount: 15,
            category: 'Food',
            date: new Date().toISOString(),
            notes: 'Lunch',
            confidence: 'high',
            missingFields: []
        });

        render(<AIChat />);

        const input = screen.getByPlaceholderText('e.g., Spent 12 on dinner at KFC');
        fireEvent.change(input, { target: { value: 'KFC 15' } });

        const submitButton = screen.getByRole('button', { name: '' }); // The send button has no text, just icon
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(extractExpenseWithAI).toHaveBeenCalledWith('KFC 15', ['Food', 'Transport']);
        });
    });
});
