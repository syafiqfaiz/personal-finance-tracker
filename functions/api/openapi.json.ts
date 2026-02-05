import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono().basePath('/api/openapi.json');

app.get('/', (c) => {
    const spec = {
        openapi: '3.0.0',
        info: {
            title: 'Personal Finance Tracker API',
            version: '1.0.0',
            description: 'Serverless backend API for AI extraction, Cloud Storage, and License management.'
        },
        servers: [
            { url: '/', description: 'Current Environment' },
            { url: 'https://belanja.syafiqfaiz.com', description: 'Production' },
            { url: 'https://staging.belanja-9f0.pages.dev', description: 'Staging' },
            { url: 'http://localhost:8788', description: 'Local Development' }
        ],
        components: {
            securitySchemes: {
                LicenseKey: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-License-Key'
                },
                AdminSecret: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-Admin-Secret'
                }
            }
        },
        tags: [
            { name: 'Extract', description: 'AI-powered expense extraction from text and images' },
            { name: 'Backup', description: 'Secure backup and restore operations' },
            { name: 'URL Signing', description: 'Presigned URL generation for cloud storage' },
            { name: 'Admin', description: 'Administrative operations for license management' },
            { name: 'System', description: 'System health and monitoring endpoints' }
        ],
        paths: {
            '/api/ai/extract': {
                post: {
                    tags: ['Extract'],
                    summary: 'Extract expenses from text',
                    description: 'Process natural language text to extract expense details using AI. Supports conversational input in English and Bahasa Malaysia.',
                    security: [{ LicenseKey: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        raw_text: {
                                            type: 'string',
                                            description: 'Natural language text describing the expense',
                                            example: 'Lunch at Nasi Kandar, paid RM15 with cash'
                                        },
                                        categories: {
                                            type: 'array',
                                            items: { type: 'string' },
                                            description: 'Available expense categories',
                                            example: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment']
                                        },
                                        current_date: {
                                            type: 'string',
                                            format: 'date',
                                            description: 'Current date in ISO 8601 format (YYYY-MM-DD)',
                                            example: '2026-02-04'
                                        },
                                        available_payment_method: {
                                            type: 'array',
                                            items: { type: 'string' },
                                            description: 'Available payment methods',
                                            example: ['Cash', 'Credit Card', 'Debit Card', 'QR Pay', 'Transfer']
                                        },
                                        captured_data: {
                                            type: 'object',
                                            nullable: true,
                                            description: 'Previously captured data from conversation context',
                                            properties: {
                                                name: { type: 'string', nullable: true, example: 'Nasi Kandar Restaurant' },
                                                amount: { type: 'number', nullable: true, example: 15.00 },
                                                category: { type: 'string', nullable: true, example: 'Food' },
                                                payment_method: { type: 'string', nullable: true, example: 'Cash' },
                                                date: { type: 'string', format: 'date', nullable: true, example: '2026-02-04' },
                                                notes: { type: 'string', nullable: true, example: 'Lunch with colleagues' },
                                                confidence: { type: 'string', enum: ['high', 'low'], nullable: true, example: 'high' },
                                                missing_fields: { type: 'array', items: { type: 'string' }, nullable: true, example: [] }
                                            }
                                        }
                                    },
                                    required: ['raw_text', 'categories', 'current_date']
                                },
                                examples: {
                                    simple_expense: {
                                        summary: 'Simple expense entry',
                                        value: {
                                            raw_text: 'Lunch at Nasi Kandar, paid RM15 with cash',
                                            categories: ['Food', 'Transport', 'Shopping', 'Bills'],
                                            current_date: '2026-02-04',
                                            available_payment_method: ['Cash', 'Credit Card', 'Debit Card', 'QR Pay']
                                        }
                                    },
                                    conversational: {
                                        summary: 'Conversational input',
                                        value: {
                                            raw_text: 'beli groceries tadi RM50',
                                            categories: ['Food', 'Groceries', 'Shopping'],
                                            current_date: '2026-02-04',
                                            available_payment_method: ['Cash', 'Credit Card', 'Debit Card']
                                        }
                                    },
                                    with_context: {
                                        summary: 'Follow-up with context',
                                        value: {
                                            raw_text: 'yes, paid with credit card',
                                            categories: ['Food', 'Transport', 'Shopping'],
                                            current_date: '2026-02-04',
                                            available_payment_method: ['Cash', 'Credit Card', 'Debit Card'],
                                            captured_data: {
                                                name: 'Nasi Kandar',
                                                amount: 15,
                                                category: 'Food',
                                                payment_method: null,
                                                date: '2026-02-04',
                                                notes: null,
                                                confidence: 'low',
                                                missing_fields: ['payment_method']
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Extraction successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            response_text: {
                                                type: 'string',
                                                description: 'AI response - clarification question or confirmation message',
                                                example: 'Got it! RM15 for lunch at Nasi Kandar, paid with cash. Should I save this?'
                                            },
                                            captured_data: {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string', nullable: true, example: 'Nasi Kandar' },
                                                    amount: { type: 'number', nullable: true, example: 15.00 },
                                                    category: { type: 'string', nullable: true, example: 'Food' },
                                                    payment_method: { type: 'string', nullable: true, example: 'Cash' },
                                                    date: { type: 'string', format: 'date', nullable: true, example: '2026-02-04' },
                                                    notes: { type: 'string', nullable: true, example: 'Lunch' },
                                                    confidence: { type: 'string', enum: ['high', 'low'], nullable: true, example: 'high' },
                                                    missing_fields: { type: 'array', items: { type: 'string' }, nullable: true, example: [] }
                                                }
                                            },
                                            usage: {
                                                type: 'object',
                                                properties: {
                                                    remaining: { type: 'number', description: 'Remaining AI requests this month', example: 99 }
                                                }
                                            }
                                        }
                                    },
                                    examples: {
                                        high_confidence: {
                                            summary: 'High confidence extraction',
                                            value: {
                                                response_text: 'Got it! RM15 for lunch at Nasi Kandar, paid with cash. Should I save this?',
                                                captured_data: {
                                                    name: 'Nasi Kandar',
                                                    amount: 15.00,
                                                    category: 'Food',
                                                    payment_method: 'Cash',
                                                    date: '2026-02-04',
                                                    notes: 'Lunch',
                                                    confidence: 'high',
                                                    missing_fields: []
                                                },
                                                usage: { remaining: 99 }
                                            }
                                        },
                                        needs_clarification: {
                                            summary: 'Needs clarification',
                                            value: {
                                                response_text: 'I got RM50 for groceries. How did you pay?',
                                                captured_data: {
                                                    name: 'Groceries',
                                                    amount: 50.00,
                                                    category: 'Groceries',
                                                    payment_method: null,
                                                    date: '2026-02-04',
                                                    notes: null,
                                                    confidence: 'low',
                                                    missing_fields: ['payment_method']
                                                },
                                                usage: { remaining: 98 }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized - Invalid or missing license key',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'Invalid license key' }
                                        }
                                    }
                                }
                            }
                        },
                        429: {
                            description: 'Rate limit exceeded',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'Rate limit exceeded' },
                                            remaining: { type: 'number', example: 0 },
                                            reset: { type: 'string', format: 'date-time', example: '2026-03-01T00:00:00.000Z' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/ai/extract-from-receipt': {
                post: {
                    tags: ['Extract'],
                    summary: 'Extract expenses from receipt image',
                    description: 'Process receipt images using Gemini Vision AI to extract merchant name, amount, date, and other expense details.',
                    security: [{ LicenseKey: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        storage_key: {
                                            type: 'string',
                                            description: 'R2 storage key for the uploaded receipt image',
                                            example: 'user_storage/abc-123-def/receipts/1738650000000.jpg'
                                        },
                                        categories: {
                                            type: 'array',
                                            items: { type: 'string' },
                                            description: 'Available expense categories',
                                            example: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment']
                                        },
                                        current_date: {
                                            type: 'string',
                                            format: 'date',
                                            description: 'Current date in ISO 8601 format',
                                            example: '2026-02-04'
                                        },
                                        available_payment_method: {
                                            type: 'array',
                                            items: { type: 'string' },
                                            description: 'Available payment methods',
                                            example: ['Cash', 'Credit Card', 'Debit Card', 'QR Pay', 'Transfer']
                                        }
                                    },
                                    required: ['storage_key']
                                },
                                examples: {
                                    restaurant_receipt: {
                                        summary: 'Restaurant receipt',
                                        value: {
                                            storage_key: 'user_storage/abc-123-def/receipts/1738650000000.jpg',
                                            categories: ['Food', 'Transport', 'Shopping', 'Bills'],
                                            current_date: '2026-02-04',
                                            available_payment_method: ['Cash', 'Credit Card', 'Debit Card', 'QR Pay']
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Receipt processed successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            response_text: { type: 'string', example: 'I found a receipt from Restoran Nasi Kandar for RM15.50. Should I save this?' },
                                            captured_data: {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string', nullable: true, example: 'Restoran Nasi Kandar' },
                                                    amount: { type: 'number', nullable: true, example: 15.50 },
                                                    category: { type: 'string', nullable: true, example: 'Food' },
                                                    payment_method: { type: 'string', nullable: true, example: 'Cash' },
                                                    date: { type: 'string', format: 'date', nullable: true, example: '2026-02-04' },
                                                    notes: { type: 'string', nullable: true, example: 'Lunch' },
                                                    confidence: { type: 'string', enum: ['high', 'low'], example: 'high' },
                                                    missing_fields: { type: 'array', items: { type: 'string' }, example: [] }
                                                }
                                            },
                                            receipt_metadata: {
                                                type: 'object',
                                                properties: {
                                                    storage_key: { type: 'string', example: 'user_storage/abc-123-def/receipts/1738650000000.jpg' },
                                                    merchant_name: { type: 'string', example: 'Restoran Nasi Kandar' },
                                                    receipt_date: { type: 'string', format: 'date', example: '2026-02-04' }
                                                }
                                            },
                                            usage: {
                                                type: 'object',
                                                properties: { remaining: { type: 'number', example: 99 } }
                                            }
                                        }
                                    },
                                    examples: {
                                        successful_extraction: {
                                            summary: 'Successful extraction',
                                            value: {
                                                response_text: 'I found a receipt from Restoran Nasi Kandar for RM15.50. Should I save this?',
                                                captured_data: {
                                                    name: 'Restoran Nasi Kandar',
                                                    amount: 15.50,
                                                    category: 'Food',
                                                    payment_method: 'Cash',
                                                    date: '2026-02-04',
                                                    notes: 'Lunch',
                                                    confidence: 'high',
                                                    missing_fields: []
                                                },
                                                receipt_metadata: {
                                                    storage_key: 'user_storage/abc-123-def/receipts/1738650000000.jpg',
                                                    merchant_name: 'Restoran Nasi Kandar',
                                                    receipt_date: '2026-02-04'
                                                },
                                                usage: { remaining: 99 }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        403: {
                            description: 'Access denied - Invalid storage key ownership',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'Access denied: Invalid key' }
                                        }
                                    }
                                }
                            }
                        },
                        404: {
                            description: 'Receipt image not found',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'Receipt image not found' }
                                        }
                                    }
                                }
                            }
                        },
                        429: {
                            description: 'Rate limit exceeded',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'Rate limit exceeded' },
                                            remaining: { type: 'number', example: 0 },
                                            reset: { type: 'string', format: 'date-time', example: '2026-03-01T00:00:00.000Z' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/backup': {
                post: {
                    tags: ['Backup'],
                    summary: 'Upload encrypted backup',
                    description: 'Upload encrypted backup data with HMAC-SHA256 integrity verification. Automatically rotates old backups (keeps latest 5).',
                    security: [{ LicenseKey: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        integrityHash: {
                                            type: 'string',
                                            description: 'HMAC-SHA256 signature of the data payload using license ID as secret',
                                            example: 'a1b2c3d4e5f6...'
                                        },
                                        data: {
                                            type: 'object',
                                            description: 'Encrypted backup payload containing expenses, categories, and settings',
                                            example: {
                                                expenses: [],
                                                categories: [],
                                                settings: {}
                                            }
                                        }
                                    },
                                    required: ['integrityHash', 'data']
                                },
                                examples: {
                                    backup_upload: {
                                        summary: 'Backup upload',
                                        value: {
                                            integrityHash: 'a1b2c3d4e5f6789abcdef0123456789',
                                            data: {
                                                expenses: [
                                                    { id: 1, name: 'Lunch', amount: 15, category: 'Food', date: '2026-02-04' }
                                                ],
                                                categories: ['Food', 'Transport', 'Shopping'],
                                                settings: { currency: 'MYR' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Backup uploaded successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean', example: true },
                                            timestamp: { type: 'string', format: 'date-time', example: '2026-02-04T10:30:00.000Z' }
                                        }
                                    }
                                }
                            }
                        },
                        403: {
                            description: 'Integrity check failed',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'Integrity check failed. Data may be tampered.' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/backup/latest': {
                get: {
                    tags: ['Backup'],
                    summary: 'Retrieve latest backup',
                    description: 'Get the most recent backup data for the authenticated user.',
                    security: [{ LicenseKey: [] }],
                    responses: {
                        200: {
                            description: 'Latest backup retrieved',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            version: { type: 'number', example: 3 },
                                            timestamp: { type: 'string', format: 'date-time', example: '2026-02-04T10:30:00.000Z' },
                                            integrityHash: { type: 'string', example: 'a1b2c3d4e5f6...' },
                                            data: {
                                                type: 'object',
                                                example: {
                                                    expenses: [],
                                                    categories: [],
                                                    settings: {}
                                                }
                                            }
                                        }
                                    },
                                    examples: {
                                        backup_data: {
                                            summary: 'Backup data',
                                            value: {
                                                version: 3,
                                                timestamp: '2026-02-04T10:30:00.000Z',
                                                integrityHash: 'a1b2c3d4e5f6789abcdef0123456789',
                                                data: {
                                                    expenses: [
                                                        { id: 1, name: 'Lunch', amount: 15, category: 'Food', date: '2026-02-04' }
                                                    ],
                                                    categories: ['Food', 'Transport', 'Shopping'],
                                                    settings: { currency: 'MYR' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        404: {
                            description: 'No backups found',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'No backups found' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/backup/status': {
                get: {
                    tags: ['Backup'],
                    summary: 'Check backup status',
                    description: 'Check if a backup exists and get the timestamp of the latest backup.',
                    security: [{ LicenseKey: [] }],
                    responses: {
                        200: {
                            description: 'Backup status retrieved',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            exists: { type: 'boolean', example: true },
                                            timestamp: { type: 'string', format: 'date-time', nullable: true, example: '2026-02-04T10:30:00.000Z' }
                                        }
                                    },
                                    examples: {
                                        backup_exists: {
                                            summary: 'Backup exists',
                                            value: {
                                                exists: true,
                                                timestamp: '2026-02-04T10:30:00.000Z'
                                            }
                                        },
                                        no_backup: {
                                            summary: 'No backup',
                                            value: {
                                                exists: false,
                                                timestamp: null
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/storage/upload-url': {
                post: {
                    tags: ['URL Signing'],
                    summary: 'Get Presigned PUT URL',
                    description: 'Generate a presigned URL for uploading files to cloud storage (receipts, attachments).',
                    security: [{ LicenseKey: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        filename: {
                                            type: 'string',
                                            description: 'Name of the file to upload',
                                            example: 'receipt_20260204.jpg'
                                        },
                                        contentType: {
                                            type: 'string',
                                            enum: ['image/jpeg', 'image/png', 'application/pdf'],
                                            description: 'MIME type of the file',
                                            example: 'image/jpeg'
                                        }
                                    },
                                    required: ['filename', 'contentType']
                                },
                                examples: {
                                    jpeg_receipt: {
                                        summary: 'JPEG receipt',
                                        value: {
                                            filename: 'receipt_20260204.jpg',
                                            contentType: 'image/jpeg'
                                        }
                                    },
                                    png_receipt: {
                                        summary: 'PNG receipt',
                                        value: {
                                            filename: 'receipt_20260204.png',
                                            contentType: 'image/png'
                                        }
                                    },
                                    pdf_document: {
                                        summary: 'PDF document',
                                        value: {
                                            filename: 'invoice_20260204.pdf',
                                            contentType: 'application/pdf'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Presigned URL generated',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            url: {
                                                type: 'string',
                                                description: 'Presigned URL for uploading (valid for 1 hour)',
                                                example: 'https://example.r2.cloudflarestorage.com/...'
                                            },
                                            key: {
                                                type: 'string',
                                                description: 'Storage key to reference this file later',
                                                example: 'user_storage/abc-123-def/receipts/1738650000000.jpg'
                                            }
                                        }
                                    },
                                    examples: {
                                        upload_url: {
                                            summary: 'Upload URL response',
                                            value: {
                                                url: 'https://example.r2.cloudflarestorage.com/belanja-storage/user_storage/abc-123-def/receipts/1738650000000.jpg?X-Amz-Algorithm=...',
                                                key: 'user_storage/abc-123-def/receipts/1738650000000.jpg'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/storage/view-url': {
                get: {
                    tags: ['URL Signing'],
                    summary: 'Get Presigned GET URL',
                    description: 'Generate a presigned URL for viewing/downloading files from cloud storage.',
                    security: [{ LicenseKey: [] }],
                    parameters: [
                        {
                            name: 'key',
                            in: 'query',
                            required: true,
                            schema: { type: 'string' },
                            description: 'Storage key of the file to view',
                            example: 'user_storage/abc-123-def/receipts/1738650000000.jpg'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Presigned URL generated',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            url: {
                                                type: 'string',
                                                description: 'Presigned URL for viewing (valid for 1 hour)',
                                                example: 'https://example.r2.cloudflarestorage.com/...'
                                            }
                                        }
                                    },
                                    examples: {
                                        view_url: {
                                            summary: 'View URL response',
                                            value: {
                                                url: 'https://example.r2.cloudflarestorage.com/belanja-storage/user_storage/abc-123-def/receipts/1738650000000.jpg?X-Amz-Algorithm=...'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/admin/licenses': {
                get: {
                    tags: ['Admin'],
                    summary: 'List Licenses (Admin)',
                    description: 'Retrieve a list of all licenses with optional filtering by tier or email.',
                    security: [{ AdminSecret: [] }],
                    parameters: [
                        {
                            name: 'tier',
                            in: 'query',
                            schema: { type: 'string', enum: ['basic', 'pro', 'enterprise'] },
                            description: 'Filter by license tier',
                            example: 'pro'
                        },
                        {
                            name: 'email',
                            in: 'query',
                            schema: { type: 'string' },
                            description: 'Filter by user email',
                            example: 'user@example.com'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'List of licenses',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'string', example: 'abc-123-def' },
                                                        status: { type: 'string', enum: ['active', 'revoked', 'expired'], example: 'active' },
                                                        tier: { type: 'string', enum: ['basic', 'pro', 'enterprise'], example: 'pro' },
                                                        limits: {
                                                            type: 'object',
                                                            example: { ai_requests_per_month: 100 }
                                                        },
                                                        usage: {
                                                            type: 'object',
                                                            example: { ai_requests: 25 }
                                                        },
                                                        email: { type: 'string', example: 'user@example.com' }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    examples: {
                                        license_list: {
                                            summary: 'License list',
                                            value: {
                                                data: [
                                                    {
                                                        id: 'abc-123-def',
                                                        status: 'active',
                                                        tier: 'pro',
                                                        limits: { ai_requests_per_month: 100 },
                                                        usage: { ai_requests: 25 },
                                                        email: 'user@example.com'
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized - Invalid admin secret',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'Unauthorized' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Admin'],
                    summary: 'Create License Key (Admin)',
                    description: 'Create a new license key for a user with specified tier.',
                    security: [{ AdminSecret: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        tier: {
                                            type: 'string',
                                            enum: ['basic', 'pro', 'enterprise'],
                                            default: 'pro',
                                            description: 'License tier',
                                            example: 'pro'
                                        },
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            description: 'User email address',
                                            example: 'newuser@example.com'
                                        }
                                    },
                                    required: ['email']
                                },
                                examples: {
                                    pro_license: {
                                        summary: 'Pro license',
                                        value: {
                                            email: 'newuser@example.com',
                                            tier: 'pro'
                                        }
                                    },
                                    basic_license: {
                                        summary: 'Basic license',
                                        value: {
                                            email: 'basicuser@example.com',
                                            tier: 'basic'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'License created',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string', example: 'abc-123-def-456' },
                                            key: { type: 'string', example: 'abc-123-def-456' }
                                        }
                                    },
                                    examples: {
                                        created_license: {
                                            summary: 'Created license',
                                            value: {
                                                id: 'f2430f5c-5c4e-4c0e-b12b-3f390d00c826',
                                                key: 'f2430f5c-5c4e-4c0e-b12b-3f390d00c826'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/admin/licenses/{id}': {
                get: {
                    tags: ['Admin'],
                    summary: 'Get License Details (Admin)',
                    description: 'Retrieve detailed information about a specific license.',
                    security: [{ AdminSecret: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'License ID',
                            example: 'abc-123-def'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'License details',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string', example: 'abc-123-def' },
                                                    key: { type: 'string', example: 'abc-123-def' },
                                                    status: { type: 'string', enum: ['active', 'revoked', 'expired'], example: 'active' },
                                                    tier: { type: 'string', enum: ['basic', 'pro', 'enterprise'], example: 'pro' },
                                                    limits: { type: 'object', example: { ai_requests_per_month: 100 } },
                                                    usage: { type: 'object', example: { ai_requests: 25 } },
                                                    email: { type: 'string', example: 'user@example.com' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        404: {
                            description: 'License not found',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'License not found' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                put: {
                    tags: ['Admin'],
                    summary: 'Update License (Admin)',
                    description: 'Update license status, tier, or email.',
                    security: [{ AdminSecret: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'License ID',
                            example: 'abc-123-def'
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'string',
                                            enum: ['active', 'revoked', 'expired'],
                                            description: 'License status',
                                            example: 'active'
                                        },
                                        tier: {
                                            type: 'string',
                                            enum: ['basic', 'pro', 'enterprise'],
                                            description: 'License tier',
                                            example: 'enterprise'
                                        },
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            description: 'User email',
                                            example: 'updated@example.com'
                                        }
                                    }
                                },
                                examples: {
                                    upgrade_tier: {
                                        summary: 'Upgrade to enterprise',
                                        value: {
                                            tier: 'enterprise'
                                        }
                                    },
                                    revoke_license: {
                                        summary: 'Revoke license',
                                        value: {
                                            status: 'revoked'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'License updated',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string', example: 'abc-123-def' },
                                                    key: { type: 'string', example: 'abc-123-def' },
                                                    status: { type: 'string', example: 'active' },
                                                    tier: { type: 'string', example: 'enterprise' },
                                                    limits: { type: 'object' },
                                                    usage: { type: 'object' },
                                                    email: { type: 'string', example: 'user@example.com' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        404: {
                            description: 'License not found',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'License not found' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/health': {
                get: {
                    tags: ['System'],
                    summary: 'Health Check',
                    description: 'Check if the API is running and responsive. No authentication required.',
                    responses: {
                        200: {
                            description: 'API is healthy',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'ok' },
                                            timestamp: { type: 'string', format: 'date-time', example: '2026-02-04T10:30:00.000Z' }
                                        }
                                    },
                                    examples: {
                                        healthy: {
                                            summary: 'Healthy response',
                                            value: {
                                                status: 'ok',
                                                timestamp: '2026-02-04T10:30:00.000Z'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    return c.json(spec);
});

export const onRequest = handle(app);
