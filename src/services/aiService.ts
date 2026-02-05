import { api } from './api';
import { PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD } from '../constants/app';

export interface ExtractedExpense {
    name: string;
    amount: number;
    category: string;
    paymentMethod: string;
    date: string; // ISO string
    notes: string;
    confidence: "high" | "low";
    missingFields: string[];
    responseText?: string;
}

export const extractExpenseWithAI = async (
    input: string,
    categories: string[],
    previousState?: ExtractedExpense
): Promise<ExtractedExpense> => {
    const currentDate = new Date().toISOString();


    // Map frontend camelCase to backend snake_case
    const capturedContext = previousState ? {
        name: previousState.name,
        amount: previousState.amount,
        category: previousState.category,
        payment_method: previousState.paymentMethod,
        date: previousState.date,
        notes: previousState.notes,
        confidence: previousState.confidence,
        missing_fields: previousState.missingFields
    } : undefined;



    const result = await api.extractExpenses(input, categories, currentDate, [...PAYMENT_METHODS], capturedContext);
    const data = result.captured_data;

    return {
        name: data.name || "Miscellaneous",
        amount: data.amount || 0,
        category: data.category || "Others",
        paymentMethod: data.payment_method || DEFAULT_PAYMENT_METHOD,
        date: data.date || currentDate,
        notes: data.notes || "",
        confidence: data.confidence || "low",
        missingFields: data.missing_fields || [],
        responseText: result.response_text
    };
};
