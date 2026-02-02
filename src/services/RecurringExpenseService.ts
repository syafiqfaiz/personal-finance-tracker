import { db, type RecurringExpense, type Expense } from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, addWeeks, addYears, format, parseISO, lastDayOfMonth, min } from 'date-fns';

interface CreateTemplateData {
    name: string;
    amount: number;
    categoryId: string;
    dayOfMonth: number;
    startDate: string; // YYYY-MM-DD
}

interface ProcessActionPayload {
    type: 'PAY' | 'SKIP' | 'SNOOZE';
    amount?: number;
    date: string; // YYYY-MM-DD (the original due date)
    snoozeUntil?: string; // YYYY-MM-DD (for SNOOZE action)
}

export const RecurringExpenseService = {
    /**
     * Create a new recurring expense template
     */
    async createTemplate(data: CreateTemplateData): Promise<string> {
        const id = uuidv4();
        const now = new Date().toISOString();

        const template: RecurringExpense = {
            id,
            name: data.name,
            amount: data.amount,
            categoryId: data.categoryId,
            frequency: 'MONTHLY', // MVP: Fixed to monthly
            dayOfMonth: data.dayOfMonth,
            startDate: data.startDate,
            nextDueDate: data.startDate, // First occurrence
            isActive: true,
            createdAt: now,
            updatedAt: now
        };

        await db.recurringExpenses.add(template);
        return id;
    },

    /**
     * Get all due reminders (active templates where nextDueDate <= today AND not snoozed)
     */
    async getDueReminders(today?: string): Promise<RecurringExpense[]> {
        const todayStr = today || format(new Date(), 'yyyy-MM-dd');

        const allTemplates = await db.recurringExpenses.toArray();

        // Filter for active, due, and not snoozed
        return allTemplates.filter((template) => {
            if (!template.isActive) return false;
            if (template.nextDueDate > todayStr) return false;
            if (template.snoozedUntil && template.snoozedUntil > todayStr) return false;
            return true;
        });
    },

    /**
     * Calculate the next due date based on frequency
     * Handles month-end overflow correctly (e.g., Jan 31 -> Feb 28 -> Mar 31)
     */
    calculateNextDueDate(
        startDate: string,
        dayOfMonth: number,
        frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY',
        intervals: number
    ): string {
        const start = parseISO(startDate);
        let nextDate: Date;

        switch (frequency) {
            case 'MONTHLY':
                nextDate = addMonths(start, intervals);
                break;
            case 'WEEKLY':
                nextDate = addWeeks(start, intervals);
                break;
            case 'YEARLY':
                nextDate = addYears(start, intervals);
                break;
        }

        // Handle day-of-month overflow (e.g., Jan 31 -> Feb 28)
        if (frequency === 'MONTHLY' || frequency === 'YEARLY') {
            const lastDay = lastDayOfMonth(nextDate);
            const targetDay = new Date(nextDate.getFullYear(), nextDate.getMonth(), dayOfMonth);

            // If target day exceeds month's last day, use last day
            nextDate = min([targetDay, lastDay]);
        }

        return format(nextDate, 'yyyy-MM-dd');
    },

    /**
     * Process an action on a recurring expense (PAY, SKIP, SNOOZE)
     */
    async processAction(templateId: string, action: ProcessActionPayload): Promise<void> {
        const template = await db.recurringExpenses.get(templateId);
        if (!template) throw new Error('Template not found');

        const now = new Date().toISOString();

        switch (action.type) {
            case 'PAY': {
                // Create expense
                const expense: Expense = {
                    id: uuidv4(),
                    name: template.name,
                    amount: action.amount ?? template.amount,
                    category: template.categoryId,
                    tags: [],
                    timestamp: parseISO(action.date),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    paymentMethod: 'Cash', // Default
                    isTaxDeductible: false,
                    recurringExpenseId: templateId,
                    isRecurringInstance: true
                };

                await db.expenses.add(expense);

                // Calculate next due date
                const currentDueDate = parseISO(template.nextDueDate);
                const nextDueDate = this.calculateNextDueDate(
                    template.startDate,
                    template.dayOfMonth,
                    template.frequency,
                    Math.floor(
                        (currentDueDate.getTime() - parseISO(template.startDate).getTime()) /
                        (30 * 24 * 60 * 60 * 1000)
                    ) + 1
                );

                // Update template
                await db.recurringExpenses.update(templateId, {
                    nextDueDate,
                    lastActionedDate: action.date,
                    lastActionType: 'PAID',
                    snoozedUntil: undefined, // Clear snooze
                    updatedAt: now
                });
                break;
            }

            case 'SKIP': {
                // Calculate next due date
                const currentDueDate = parseISO(template.nextDueDate);
                const nextDueDate = this.calculateNextDueDate(
                    template.startDate,
                    template.dayOfMonth,
                    template.frequency,
                    Math.floor(
                        (currentDueDate.getTime() - parseISO(template.startDate).getTime()) /
                        (30 * 24 * 60 * 60 * 1000)
                    ) + 1
                );

                // Update template (no expense created)
                await db.recurringExpenses.update(templateId, {
                    nextDueDate,
                    lastActionedDate: action.date,
                    lastActionType: 'SKIPPED',
                    snoozedUntil: undefined, // Clear snooze
                    updatedAt: now
                });
                break;
            }

            case 'SNOOZE': {
                if (!action.snoozeUntil) throw new Error('snoozeUntil required for SNOOZE action');

                // Update template with snooze date
                await db.recurringExpenses.update(templateId, {
                    snoozedUntil: action.snoozeUntil,
                    updatedAt: now
                });
                break;
            }
        }
    },

    /**
     * Update a template
     */
    async updateTemplate(
        templateId: string,
        updates: Partial<Pick<RecurringExpense, 'name' | 'amount' | 'categoryId' | 'dayOfMonth' | 'isActive'>>
    ): Promise<void> {
        await db.recurringExpenses.update(templateId, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    },

    /**
     * Delete a template
     */
    async deleteTemplate(templateId: string): Promise<void> {
        await db.recurringExpenses.delete(templateId);
    },

    /**
     * Get all templates
     */
    async getAllTemplates(): Promise<RecurringExpense[]> {
        return await db.recurringExpenses.toArray();
    }
};
