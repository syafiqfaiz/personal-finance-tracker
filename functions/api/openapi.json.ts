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
        paths: {
            '/api/ai/extract': {
                post: {
                    tags: ['Extract'],
                    summary: 'Extract expenses from text',
                    security: [{ LicenseKey: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        raw_text: { type: 'string' },
                                        categories: { type: 'array', items: { type: 'string' } },
                                        current_date: { type: 'string' },
                                        available_payment_method: { type: 'array', items: { type: 'string' } },
                                        captured_data: {
                                            type: 'object',
                                            nullable: true,
                                            properties: {
                                                name: { type: 'string', nullable: true },
                                                amount: { type: 'number', nullable: true },
                                                category: { type: 'string', nullable: true },
                                                payment_method: { type: 'string', nullable: true },
                                                date: { type: 'string', nullable: true },
                                                notes: { type: 'string', nullable: true },
                                                confidence: { type: 'string', enum: ['high', 'low'], nullable: true },
                                                missing_fields: { type: 'array', items: { type: 'string' }, nullable: true }
                                            }
                                        }
                                    },
                                    required: ['raw_text', 'categories', 'current_date']
                                },
                                example: {
                                    raw_text: "cash, dekat ayza",
                                    categories: ["food", "groceries"],
                                    current_date: "2026-01-03",
                                    available_payment_method: ["cash", "credit card", "debit card"],
                                    captured_data: {
                                        name: "Miscellaneous",
                                        amount: 10,
                                        category: "food",
                                        payment_method: "Unknown",
                                        date: "2026-01-03",
                                        notes: "nasi goreng",
                                        confidence: "low",
                                        missing_fields: ["payment_method"]
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Extraction success',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            response_text: { type: 'string', description: 'Clarification question or confirmation' },
                                            captured_data: {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string', nullable: true },
                                                    amount: { type: 'number', nullable: true },
                                                    category: { type: 'string', nullable: true },
                                                    payment_method: { type: 'string', nullable: true },
                                                    date: { type: 'string', nullable: true },
                                                    notes: { type: 'string', nullable: true },
                                                    confidence: { type: 'string', enum: ['high', 'low'], nullable: true },
                                                    missing_fields: { type: 'array', items: { type: 'string' }, nullable: true }
                                                }
                                            },
                                            usage: { type: 'object', properties: { remaining: { type: 'number' } } }
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
                    security: [{ LicenseKey: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        filename: { type: 'string' },
                                        contentType: { type: 'string', enum: ['image/jpeg', 'image/png', 'application/pdf'] }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'URL generated',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            url: { type: 'string' },
                                            key: { type: 'string' }
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
                    security: [{ LicenseKey: [] }],
                    parameters: [
                        { name: 'key', in: 'query', required: true, schema: { type: 'string' } }
                    ],
                    responses: {
                        200: {
                            description: 'URL generated',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            url: { type: 'string' }
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
                    security: [{ AdminSecret: [] }],
                    parameters: [
                        { name: 'tier', in: 'query', schema: { type: 'string' } },
                        { name: 'email', in: 'query', schema: { type: 'string' } }
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
                                                        id: { type: 'string' },
                                                        status: { type: 'string' },
                                                        limits: { type: 'object' },
                                                        usage: { type: 'object' },
                                                        email: { type: 'string' }
                                                    }
                                                }
                                            }
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
                    security: [{ AdminSecret: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        tier: { type: 'string', enum: ['basic', 'pro', 'enterprise'], default: 'pro' },
                                        email: { type: 'string', example: 'user@example.com' }
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
                                            id: { type: 'string' },
                                            key: { type: 'string' }
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
                    security: [{ AdminSecret: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
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
                                                    id: { type: 'string' },
                                                    key: { type: 'string' },
                                                    status: { type: 'string' },
                                                    limits: { type: 'object' },
                                                    usage: { type: 'object' },
                                                    email: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        404: { description: 'License not found' }
                    }
                },
                put: {
                    tags: ['Admin'],
                    summary: 'Update License (Admin)',
                    security: [{ AdminSecret: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
                                        tier: { type: 'string', enum: ['basic', 'pro', 'enterprise'] },
                                        email: { type: 'string' }
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
                                                    id: { type: 'string' },
                                                    key: { type: 'string' },
                                                    status: { type: 'string' },
                                                    limits: { type: 'object' },
                                                    usage: { type: 'object' },
                                                    email: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        404: { description: 'License not found' }
                    }
                }
            }
        }
    };
    return c.json(spec);
});

export const onRequest = handle(app);
