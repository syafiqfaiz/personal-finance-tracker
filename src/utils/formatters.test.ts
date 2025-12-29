import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyPrecise, formatDate, formatRelativeTime } from '../utils/formatters';

describe('formatters', () => {
    describe('formatCurrency', () => {
        it('formats MYR currency correctly', () => {
            expect(formatCurrency(1234.56)).toBe('RM\u00A01,235');
            expect(formatCurrency(0)).toBe('RM\u00A00');
            expect(formatCurrency(-50)).toBe('-RM\u00A050');
        });
    });

    describe('formatCurrencyPrecise', () => {
        it('formats currency with 2 decimal places by default', () => {
            expect(formatCurrencyPrecise(1.23456)).toBe('RM\u00A01.23');
        });
    });

    describe('formatDate', () => {
        it('formats date correctly', () => {
            const date = new Date('2023-12-25T10:00:00');
            expect(formatDate(date)).toContain('Dec 25, 2023');
        });

        it('handles ISO string inputs', () => {
            expect(formatDate('2023-12-25')).toContain('Dec 25, 2023');
        });
    });

    describe('formatRelativeTime', () => {
        it('formats relative time correctly', () => {
            const now = new Date();

            // Just now (< 60s)
            expect(formatRelativeTime(new Date(now.getTime() - 30 * 1000))).toBe('Just now');

            // Minutes ago (< 1h)
            expect(formatRelativeTime(new Date(now.getTime() - 5 * 60 * 1000))).toBe('5m ago');

            // Hours ago (< 24h)
            expect(formatRelativeTime(new Date(now.getTime() - 2 * 60 * 60 * 1000))).toBe('2h ago');

            // Yesterday (< 48h)
            expect(formatRelativeTime(new Date(now.getTime() - 25 * 60 * 60 * 1000))).toBe('Yesterday');

            // Older (Full date)
            expect(formatRelativeTime(new Date('2022-01-01'))).toContain('Jan 1, 2022');
        });
    });
});
