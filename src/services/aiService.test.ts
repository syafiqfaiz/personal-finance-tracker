import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('aiService', () => {
    let extractExpenseWithAI: any;
    let GoogleGenerativeAIMock: any;
    let mockGenerateContent: any;

    beforeEach(async () => {
        vi.resetModules();

        mockGenerateContent = vi.fn();
        const mockGetGenerativeModel = vi.fn(() => ({
            generateContent: mockGenerateContent
        }));

        // Use class for constructor compatibility
        class MockGenAI {
            getGenerativeModel = mockGetGenerativeModel;
        }

        GoogleGenerativeAIMock = MockGenAI;

        vi.doMock('@google/generative-ai', () => ({
            GoogleGenerativeAI: MockGenAI
        }));

        const module = await import('./aiService');
        extractExpenseWithAI = module.extractExpenseWithAI;
    });

    it('extracts expense data correctly', async () => {
        const mockResponseText = JSON.stringify({
            name: 'Starbucks',
            amount: 15.50,
            category: 'Food',
            date: '2023-12-25T10:00:00.000Z',
            notes: 'Coffee',
            confidence: 'high',
            missingFields: []
        });

        mockGenerateContent.mockResolvedValue({
            response: { text: () => mockResponseText }
        });

        const result = await extractExpenseWithAI('fake-key', 'Spent RM15.50 at Starbucks', ['Food']);

        expect(result.name).toBe('Starbucks');
        expect(result.amount).toBe(15.50);
        expect(mockGenerateContent).toHaveBeenCalled();
        // Since we use a class, checking if constructor was called is harder unless we spy on prototype or use a wrapper.
        // But verifying logic (mockGenerateContent called) is sufficient for now.
    });

    it('throws error on invalid JSON', async () => {
        mockGenerateContent.mockResolvedValue({
            response: { text: () => 'Not JSON' }
        });

        await expect(extractExpenseWithAI('key', 'test', [])).rejects.toThrow('Could not parse AI response');
    });
});
