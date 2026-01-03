import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractExpenseWithAI } from './aiService';
import { api } from './api';

// Mock the API module
vi.mock('./api', () => ({
    api: {
        extractExpenses: vi.fn()
    }
}));

describe('aiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('extracts expense data correctly', async () => {
        const mockCapturedData = {
            name: 'Starbucks',
            amount: 15.50,
            category: 'Food',
            payment_method: 'Cash',
            date: '2023-12-25T10:00:00.000Z',
            notes: 'Coffee',
            confidence: 'high' as const,
            missing_fields: []
        };

        (api.extractExpenses as any).mockResolvedValue({
            captured_data: mockCapturedData,
            response_text: 'Got it!'
        });

        const result = await extractExpenseWithAI('Spent RM15.50 at Starbucks', ['Food']);

        expect(result.name).toBe('Starbucks');
        expect(result.amount).toBe(15.50);
        expect(result.paymentMethod).toBe('Cash');
        expect(api.extractExpenses).toHaveBeenCalledWith('Spent RM15.50 at Starbucks', ['Food'], expect.any(String), expect.any(Array), undefined);
    });

    it('handles miscellaneous/defaults when API returns partial data', async () => {
        // Test robustness
        (api.extractExpenses as any).mockResolvedValue({
            captured_data: {
                name: null,
                amount: null,
                category: null,
                confidence: 'low'
            },
            response_text: 'What did you buy?'
        });

        const result = await extractExpenseWithAI('test', [], undefined);

        expect(result.name).toBe('Miscellaneous');
        expect(result.amount).toBe(0);
    });
});
