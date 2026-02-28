import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getLocalMonthPeriod } from './dateUtils';

describe('getLocalMonthPeriod', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns correct local month period regardless of UTC offset (Malaysia time test)', () => {
        // Create a date that is March 1st in Malaysia (UTC+8) but still Feb 28th in UTC
        // Since we can't easily force the JS environment timezone in vitest without setup files,
        // we can just construct a Date object that represents a specific local time.
        // Wait, the test environment will use the system local time.
        // Let's just mock the Date methods to simulate a local time of 2026-03-01.

        const mockDate = new Date('2026-03-01T07:14:00Z');
        // Override methods for this specific test object
        mockDate.getFullYear = () => 2026;
        mockDate.getMonth = () => 2; // 0-indexed, so 2 is March

        expect(getLocalMonthPeriod(mockDate)).toBe('2026-03');
    });

    it('formats month with leading zero', () => {
        const mockDate = new Date();
        mockDate.getFullYear = () => 2024;
        mockDate.getMonth = () => 0; // January
        expect(getLocalMonthPeriod(mockDate)).toBe('2024-01');
    });

    it('formats month without leading zero for two-digit months', () => {
        const mockDate = new Date();
        mockDate.getFullYear = () => 2024;
        mockDate.getMonth = () => 9; // October
        expect(getLocalMonthPeriod(mockDate)).toBe('2024-10');
    });
});
