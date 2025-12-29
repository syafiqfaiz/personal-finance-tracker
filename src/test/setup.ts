import '@testing-library/jest-dom';
import { vi } from 'vitest';

declare var global: any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock IndexedDB
const indexedDB = {
    open: vi.fn(),
};
global.indexedDB = indexedDB as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock S3 Client
vi.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: vi.fn(() => ({
            send: vi.fn()
        })),
        PutObjectCommand: vi.fn()
    };
});

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn(() => ({
            getGenerativeModel: vi.fn(() => ({
                generateContent: vi.fn(() => ({
                    response: {
                        text: () => JSON.stringify({
                            name: "Mocked Expense",
                            amount: 100,
                            category: "Food",
                            date: new Date().toISOString(),
                            notes: "Mocked notes",
                            confidence: "high",
                            missingFields: []
                        })
                    }
                }))
            }))
        }))
    };
});

// Mock DB module completely to avoid actual IndexedDB calls
// Mock DB implementation with in-memory storage for better "integration-like" testing
const createMockTable = (name: string) => {
    let storage: any[] = [];
    return {
        toArray: vi.fn(() => Promise.resolve([...storage])),
        add: vi.fn((item) => {
            const id = item.id || Math.random().toString(36).substring(7);
            storage.push({ ...item, id });
            return Promise.resolve(id);
        }),
        put: vi.fn((item) => {
            const index = storage.findIndex(i => (i.key && i.key === item.key) || (i.id && i.id === item.id));
            if (index >= 0) {
                storage[index] = { ...storage[index], ...item };
            } else {
                storage.push(item);
            }
            return Promise.resolve(item.id || item.key);
        }),
        update: vi.fn((id, updates) => {
            const index = storage.findIndex(i => i.id === id);
            if (index >= 0) {
                storage[index] = { ...storage[index], ...updates };
                return Promise.resolve(1);
            }
            return Promise.resolve(0);
        }),
        delete: vi.fn((id) => {
            storage = storage.filter(i => i.id !== id);
            return Promise.resolve();
        }),
        get: vi.fn((key) => {
            return Promise.resolve(storage.find(i => i.key === key || i.id === key));
        }),
        where: vi.fn(() => ({
            equals: vi.fn((value) => ({
                toArray: vi.fn(() => Promise.resolve(storage.filter(i => Object.values(i).includes(value)))),
                modify: vi.fn(),
                delete: vi.fn()
            })),
            startsWith: vi.fn(),
        })),
        orderBy: vi.fn(() => ({
            reverse: vi.fn(() => ({
                toArray: vi.fn(() => Promise.resolve([...storage].reverse()))
            }))
        })),
        clear: () => { storage = []; }
    };
};

const mockExpenses = createMockTable('expenses');
const mockBudgets = createMockTable('budgets');
const mockSettings = createMockTable('settings');

vi.mock('../db/db', () => ({
    db: {
        expenses: mockExpenses,
        budgets: mockBudgets,
        settings: mockSettings,
    },
    FinanceDB: vi.fn()
}));

// Expose clear function for tests
export const resetDb = () => {
    mockExpenses.clear();
    mockBudgets.clear();
    mockSettings.clear();
};
