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
                                schema: {
                                    type: 'object',
                                    properties: {
                                        text: { type: 'string', example: 'Lunch 15.50 at McDonalds' }
                                    },
                                    required: ['text']
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
                                            data: { type: 'object' },
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
                post: {
                    summary: 'Create License Key (Admin)',
                    security: [{ AdminSecret: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        tier: { type: 'string', enum: ['basic', 'pro', 'enterprise'], default: 'pro' }
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
            }
        }
    };
    return c.json(spec);
});

export const onRequest = handle(app);
