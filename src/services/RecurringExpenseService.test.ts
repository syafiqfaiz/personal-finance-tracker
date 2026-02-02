import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecurringExpenseService } from './RecurringExpenseService';
import { db } from '../db/db';
import { addMonths, format } from 'date-fns';

// Mock the database
vi.mock('../db/db', () => ({
    db: {
        recurringExpenses: {
            add: vi.fn(),
            update: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
            toArray: vi.fn()
        },
        expenses: {
            add: vi.fn()
        }
    }
}));

describe('RecurringExpenseService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTemplate', () => {
        it('should create a recurring expense template with correct nextDueDate', async () => {
            const templateData = {
                name: 'Rent',
                amount: 1500,
                categoryId: 'housing',
                dayOfMonth: 1,
                startDate: '2026-02-01'
            };

            const mockAdd = vi.fn().mockResolvedValue('test-id');
            (db.recurringExpenses.add as any) = mockAdd;

            await RecurringExpenseService.createTemplate(templateData);

            expect(mockAdd).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Rent',
                    amount: 1500,
                    categoryId: 'housing',
                    frequency: 'MONTHLY',
                    dayOfMonth: 1,
                    isActive: true,
                    nextDueDate: '2026-02-01'
                })
            );
        });
    });

    describe('getDueReminders', () => {
        it('should return reminders when date is due and not snoozed', async () => {
            const today = '2026-02-01';
            const mockTemplates = [
                {
                    id: '1',
                    name: 'Rent',
                    amount: 1500,
                    nextDueDate: '2026-02-01',
                    isActive: true,
                    snoozedUntil: undefined
                }
            ];

            const mockToArray = vi.fn().mockResolvedValue(mockTemplates);
            (db.recurringExpenses.toArray as any) = mockToArray;

            const reminders = await RecurringExpenseService.getDueReminders(today);

            expect(reminders).toHaveLength(1);
            expect(reminders[0].name).toBe('Rent');
        });

        it('should NOT return reminders when snoozed', async () => {
            const today = '2026-02-01';
            const mockTemplates = [
                {
                    id: '1',
                    name: 'Rent',
                    amount: 1500,
                    nextDueDate: '2026-02-01',
                    isActive: true,
                    snoozedUntil: '2026-02-05' // Snoozed until Feb 5
                }
            ];

            const mockToArray = vi.fn().mockResolvedValue(mockTemplates);
            (db.recurringExpenses.toArray as any) = mockToArray;

            const reminders = await RecurringExpenseService.getDueReminders(today);

            expect(reminders).toHaveLength(0);
        });
    });

    describe('calculateNextDueDate', () => {
        it('should handle end-of-month overflow (Jan 31 -> Feb 28)', () => {
            const startDate = '2026-01-31';
            const dayOfMonth = 31;

            // Calculate next month (Feb doesn't have 31 days)
            const nextDate = RecurringExpenseService.calculateNextDueDate(
                startDate,
                dayOfMonth,
                'MONTHLY',
                1
            );

            // Should land on Feb 28 (last day of Feb in non-leap year)
            expect(nextDate).toBe('2026-02-28');
        });

        it('should handle end-of-month overflow (Feb 28 -> Mar 31)', () => {
            const startDate = '2026-01-31';
            const dayOfMonth = 31;

            // Calculate 2 months ahead
            const nextDate = RecurringExpenseService.calculateNextDueDate(
                startDate,
                dayOfMonth,
                'MONTHLY',
                2
            );

            // Should land on Mar 31
            expect(nextDate).toBe('2026-03-31');
        });
    });

    describe('processAction - PAY', () => {
        it('should create expense and advance nextDueDate', async () => {
            const mockTemplate = {
                id: 'template-1',
                name: 'Rent',
                amount: 1500,
                categoryId: 'housing',
                frequency: 'MONTHLY' as const,
                dayOfMonth: 1,
                startDate: '2026-02-01',
                nextDueDate: '2026-02-01',
                isActive: true,
                snoozedUntil: '2026-02-03' // Has snooze
            };

            const mockGet = vi.fn().mockResolvedValue(mockTemplate);
            const mockUpdate = vi.fn().mockResolvedValue(1);
            const mockAddExpense = vi.fn().mockResolvedValue('expense-id');

            (db.recurringExpenses.get as any) = mockGet;
            (db.recurringExpenses.update as any) = mockUpdate;
            (db.expenses.add as any) = mockAddExpense;

            await RecurringExpenseService.processAction('template-1', {
                type: 'PAY',
                amount: 1500,
                date: '2026-02-01'
            });

            // Should create expense
            expect(mockAddExpense).toHaveBeenCalled();

            // Should update template with new nextDueDate and clear snoozedUntil
            expect(mockUpdate).toHaveBeenCalledWith('template-1', {
                nextDueDate: '2026-03-01',
                lastActionedDate: '2026-02-01',
                lastActionType: 'PAID',
                snoozedUntil: undefined, // CLEARED
                updatedAt: expect.any(String)
            });
        });
    });

    describe('processAction - SKIP', () => {
        it('should ONLY advance nextDueDate without creating expense', async () => {
            const mockTemplate = {
                id: 'template-1',
                name: 'Rent',
                amount: 1500,
                categoryId: 'housing',
                frequency: 'MONTHLY' as const,
                dayOfMonth: 1,
                startDate: '2026-02-01',
                nextDueDate: '2026-02-01',
                isActive: true
            };

            const mockGet = vi.fn().mockResolvedValue(mockTemplate);
            const mockUpdate = vi.fn().mockResolvedValue(1);
            const mockAddExpense = vi.fn();

            (db.recurringExpenses.get as any) = mockGet;
            (db.recurringExpenses.update as any) = mockUpdate;
            (db.expenses.add as any) = mockAddExpense;

            await RecurringExpenseService.processAction('template-1', {
                type: 'SKIP',
                date: '2026-02-01'
            });

            // Should NOT create expense
            expect(mockAddExpense).not.toHaveBeenCalled();

            // Should update template
            expect(mockUpdate).toHaveBeenCalledWith('template-1', {
                nextDueDate: '2026-03-01',
                lastActionedDate: '2026-02-01',
                lastActionType: 'SKIPPED',
                snoozedUntil: undefined,
                updatedAt: expect.any(String)
            });
        });
    });
});
