import { api } from './api';

export interface ExtractedExpense {
    name: string;
    amount: number;
    category: string;
    date: string; // ISO string
    notes: string;
    confidence: "high" | "low";
    missingFields: string[];
}

export const extractExpenseWithAI = async (
    input: string,
    categories: string[]
): Promise<ExtractedExpense> => {
    const availablePaymentMethods = ["Cash", "Credit Card", "QR Pay", "Transfer"]; // Default or fetch from store if available
    const currentDate = new Date().toISOString();

    const result = await api.extractExpenses(input, categories, currentDate, availablePaymentMethods);
    const data = result.captured_data;

    return {
        name: data.name || "Miscellaneous",
        amount: data.amount || 0,
        category: data.category || "Others",
        date: data.date || currentDate,
        notes: data.notes || "",
        confidence: data.confidence || "low",
        missingFields: data.missing_fields || [],
    };
};
