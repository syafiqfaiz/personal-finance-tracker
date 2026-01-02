import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { authMiddleware } from '../../core/middleware';
import { License, LicenseRepository } from '../../core/licenseRepository';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { corsMiddleware } from '../../core/corsMiddleware';
import { securityMiddleware } from '../../core/securityMiddleware';

type Bindings = {
    LICENSE_STORE: KVNamespace;
    VITE_GEMINI_API_KEY: string;
};

type Variables = {
    license: License;
};

interface CapturedData {
    name: string | null;
    amount: number | null;
    category: string | null;
    payment_method: string | null;
    date: string | null;
    notes: string | null;
    confidence: 'high' | 'low' | null;
    missing_fields: string[] | null;
}

interface ExtractionRequest {
    raw_text: string;
    categories: string[];
    current_date: string;
    available_payment_method: string[];
    captured_data: CapturedData;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api/ai/extract');

app.use('*', corsMiddleware);
app.use('*', securityMiddleware);
app.use('*', authMiddleware);

app.post('/', async (c) => {
    const license = c.get('license');
    const repo = new LicenseRepository(c.env.LICENSE_STORE);

    // Check Rate Limit
    const usageCheck = await repo.incrementAIUsage(license.id);

    if (!usageCheck.allowed) {
        return c.json({
            error: 'Rate limit exceeded',
            remaining: 0,
            reset: GetNextMonthStart()
        }, 429);
    }

    // Parse Body
    let body: ExtractionRequest;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'Invalid JSON body' }, 400);
    }

    if (!body || !body.raw_text) {
        return c.json({ error: 'Missing "raw_text" field' }, 400);
    }

    if (body.raw_text.length > 10000) {
        return c.json({ error: 'Text too long (max 10000 chars)' }, 400);
    }

    // Construct System Prompt
    const prompt = `
You are a transaction extraction assistant. Your goal is to extract transaction details from the user's input.
The user's input might be partial or complete.

CONTEXT:
Categories: [${body.categories.join(', ')}]
Payment Methods: [${body.available_payment_method.join(', ')}]
Current Date: ${body.current_date}

PREVIOUSLY CAPTURED DATA:
${JSON.stringify(body.captured_data, null, 2)}

INSTRUCTIONS:
1. Analyze the "User Input" below.
2. Update the captured data.
3. If information is missing or ambiguous, ask a clarification question in 'response_text'.
4. The name is important. Try to infer a specific name. Only use "Miscellaneous" if absolutely no name can be inferred.
5. If no date is provided or can be inferred, use the Current Date. Ensure dates (input and output) are strictly in ISO 8601 format (YYYY-MM-DD).
6. Notes should contain any extra context not covered by other fields.
7. Confidence should be 'low' if important fields (name, amount, category, payment_method) are missing.
8. If confidence is high, set 'response_text' to a cheerful, warm confirmation message (e.g., 'Got it!', 'Recorded!', etc.).
9. Output strictly in the following Key-Value format (no markdown, no json):

name: <value>
amount: <value>
category: <value>
payment_method: <value>
date: <value>
notes: <value>
confidence: <value>
missing_fields: <comma_separated_list>
response_text: <value>
`;

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(c.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    try {
        const result = await model.generateContent([prompt, `User Input: "${body.raw_text}"`]);
        const response = result.response;
        const text = response.text();

        // Parse Key-Value Response
        const parsedData = parseKVResponse(text);

        return c.json({
            response_text: parsedData.response_text,
            captured_data: {
                name: parsedData.name,
                amount: parsedData.amount,
                category: parsedData.category,
                payment_method: parsedData.payment_method,
                date: parsedData.date,
                notes: parsedData.notes,
                confidence: parsedData.confidence,
                missing_fields: parsedData.missing_fields
            },
            usage: {
                remaining: usageCheck.remaining
            }
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        return c.json({ error: 'Failed to process with AI' }, 500);
    }
});

interface ParsedKV {
    name: string | null;
    amount: number | null;
    category: string | null;
    payment_method: string | null;
    date: string | null;
    notes: string | null;
    confidence: 'high' | 'low' | null;
    missing_fields: string[] | null;
    response_text: string | null;
    [key: string]: string | number | string[] | null;
}

function parseKVResponse(text: string): ParsedKV {
    const lines = text.split('\n');
    const result: ParsedKV = {
        name: null,
        amount: null,
        category: null,
        payment_method: null,
        date: null,
        notes: null,
        confidence: null,
        missing_fields: [],
        response_text: null
    };

    for (const line of lines) {
        const match = line.match(/^([a-z_]+):\s*(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();

            if (key === 'missing_fields') {
                result[key] = value ? value.split(',').map(s => s.trim()) : [];
            } else if (key === 'amount') {
                const num = parseFloat(value);
                result[key] = isNaN(num) ? null : num;
            } else if (value === 'null' || value === '') {
                // Keep default null
            } else {
                result[key] = value;
            }
        }
    }

    return result;
}

function GetNextMonthStart() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

export const onRequest = handle(app);
