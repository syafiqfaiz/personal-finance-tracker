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
            { url: 'https://personal-finance-tracker.pages.dev', description: 'Production' },
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
                    summary: 'Extract expenses from text',
                    security: [{ LicenseKey: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                type: 'object',
                                properties: {
                                    raw_text: { type: 'string', example: 'beli kfc RM25' },
                                    categories: { type: 'array', items: { type: 'string' }, example: ['Food', 'Transport'] },
                                    current_date: { type: 'string', example: '2026-01-02' },
                                    available_payment_method: { type: 'array', items: { type: 'string' }, example: ['Cash', 'Card'] },
                                    captured_data: {
                                        type: 'object',
                                        nullable: true,
                                        properties: {
                                            name: { type: 'string', nullable: true, example: 'KFC' },
                                            amount: { type: 'number', nullable: true, example: 25.00 },
                                            category: { type: 'string', nullable: true, example: 'Food' },
                                            payment_method: { type: 'string', nullable: true, example: 'Cash' },
                                            date: { type: 'string', nullable: true, example: '2026-01-02' },
                                            notes: { type: 'string', nullable: true, example: 'Dinner' },
                                            confidence: { type: 'string', enum: ['high', 'low'], nullable: true, example: 'high' },
                                            missing_fields: { type: 'array', items: { type: 'string' }, nullable: true, example: [] }
                                        }
                                    }
                                },
                                required: ['raw_text', 'categories', 'current_date']
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
