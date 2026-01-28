import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { authMiddleware } from '../../core/middleware';
import { License, LicenseRepository } from '../../core/licenseRepository';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { corsMiddleware } from '../../core/corsMiddleware';
import { securityMiddleware } from '../../core/securityMiddleware';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

type Bindings = {
    LICENSE_STORE: KVNamespace;
    ASSETS_BUCKET: R2Bucket;
    VITE_GEMINI_API_KEY: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    R2_ENDPOINT_URL: string;
};

type Variables = {
    license: License;
};

interface ReceiptExtractionRequest {
    storage_key: string;
    categories: string[];
    current_date: string;
    available_payment_method: string[];
}

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

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
    .basePath('/api/ai/extract-from-receipt');

app.use('*', corsMiddleware);
app.use('*', securityMiddleware);
app.use('*', authMiddleware);

app.post('/', async (c) => {
    const license = c.get('license');
    const repo = new LicenseRepository(c.env.LICENSE_STORE);

    // Check Rate Limit (shared with text-based extraction)
    const usageCheck = await repo.incrementAIUsage(license.id);
    if (!usageCheck.allowed) {
        return c.json({
            error: 'Rate limit exceeded',
            remaining: 0,
            reset: GetNextMonthStart()
        }, 429);
    }

    // Parse Body
    let body: ReceiptExtractionRequest;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'Invalid JSON body' }, 400);
    }

    // Validate required fields
    if (!body || !body.storage_key) {
        return c.json({ error: 'Missing "storage_key" field' }, 400);
    }

    // Validate S3 Key Ownership
    const expectedPrefix = `user_storage/${license.id}/`;
    if (!body.storage_key.startsWith(expectedPrefix)) {
        return c.json({ error: 'Access denied: Invalid key' }, 403);
    }

    // Fetch Image from R2 using AWS SDK (same as upload)
    const s3Client = new S3Client({
        region: 'auto',
        endpoint: c.env.R2_ENDPOINT_URL,
        credentials: {
            accessKeyId: c.env.R2_ACCESS_KEY_ID,
            secretAccessKey: c.env.R2_SECRET_ACCESS_KEY
        }
    });

    let imageBuffer: ArrayBuffer;
    try {

        const command = new GetObjectCommand({
            Bucket: c.env.R2_BUCKET_NAME,
            Key: body.storage_key
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            console.error('[R2 DEBUG] No body in S3 response');
            return c.json({ error: 'Receipt image not found' }, 404);
        }

        // Convert stream to ArrayBuffer
        imageBuffer = await response.Body.transformToByteArray();
    } catch (error) {
        console.error('S3 Get Error:', error);
        return c.json({ error: 'Failed to access receipt image' }, 400);
    }

    // Construct Vision Prompt
    const prompt = buildVisionPrompt(
        body.categories || [],
        body.available_payment_method || ['Cash', 'Credit Card', 'QR Pay', 'Transfer'],
        body.current_date || new Date().toISOString().split('T')[0]
    );

    // Call Gemini Vision API
    const genAI = new GoogleGenerativeAI(c.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });


    try {
        // imageBuffer was already fetched above from S3  
        const base64Image = arrayBufferToBase64(imageBuffer);

        // Call Gemini Vision with inline image data

        // Call Gemini Vision with inline image data
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            }
        ]);

        const response = result.response;
        const text = response.text();

        // Parse Key-Value Response
        const parsedData = parseKVResponse(text);

        // Extract merchant name and date for receipt metadata
        const merchantName = parsedData.name || 'Unknown Merchant';
        const receiptDate = parsedData.date || body.current_date;

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
            receipt_metadata: {
                storage_key: body.storage_key,
                merchant_name: merchantName,
                receipt_date: receiptDate
            },
            usage: {
                remaining: usageCheck.remaining
            }
        });

    } catch (error) {
        console.error('Gemini Vision API Error:', error);

        // Return conversational error message (fallback)
        return c.json({
            response_text: "I couldn't read the receipt clearly. Can you tell me the merchant name and amount?",
            captured_data: {
                name: null,
                amount: null,
                category: null,
                payment_method: null,
                date: body.current_date,
                notes: null,
                confidence: 'low',
                missing_fields: ['name', 'amount', 'category', 'payment_method']
            },
            receipt_metadata: {
                storage_key: body.storage_key,
                merchant_name: 'Unknown',
                receipt_date: body.current_date
            },
            usage: {
                remaining: usageCheck.remaining
            }
        });
    }
});


function buildVisionPrompt(categories: string[], paymentMethods: string[], currentDate: string): string {
    return `
You are analyzing a receipt image for a Malaysian personal finance app.
Extract transaction details from the receipt.

TONE & STYLE RULES (IMPORTANT)
Friendly, warm, Malaysian-casual tone.
Light humour is encouraged only in response_text.
Never lecture, scold, or shame the user.
If asking questions, keep them short and natural (like chat, not a form).
Do not include emojis.
Do not mention "confidence", "missing fields", or system terms in response_text.

CONTEXT:
Categories: [${categories.join(', ')}]
Payment Methods: [${paymentMethods.join(', ')}]
Current Date: ${currentDate}

INSTRUCTIONS:
1. Extract merchant name, total amount (in RM), transaction date, and payment method if visible.
2. Infer the most appropriate category from the list provided.
3. If critical information is missing or unclear, set confidence to 'low' and ask for clarification in response_text.
4. If all critical fields are extracted, set confidence to 'high' and provide a warm confirmation message.
5. Dates must be in ISO 8601 format (YYYY-MM-DD).
6. Select category from the list. If none fit, use "Uncategorized".
7. Select payment method from the list. If not visible on receipt, use "Cash".
8. The name is important. Try to infer the merchant name from the receipt. Only use "Miscellaneous" if absolutely no name can be inferred.
9. Output strictly in the following Key-Value format (no markdown, no json):

name: <merchant_name>
amount: <number>
category: <category>
payment_method: <payment_method>
date: <YYYY-MM-DD>
notes: <any_additional_context>
confidence: <high|low>
missing_fields: <comma_separated_list_or_empty>
response_text: <conversational_message>
`;
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

function GetNextMonthStart(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

function arrayBufferToBase64(buffer: Uint8Array | ArrayBuffer): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export const onRequest = handle(app);
