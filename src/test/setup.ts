import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver
const ResizeObserverMock = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Mock IndexedDB
const indexedDBMock = {
    open: vi.fn(),
};
vi.stubGlobal('indexedDB', indexedDBMock);

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
const createMockTable = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        where: vi.fn((field) => ({
            equals: vi.fn((value) => ({
                toArray: vi.fn(() => Promise.resolve(storage.filter(i => i[field] === value))),
                first: vi.fn(() => Promise.resolve(storage.find(i => i[field] === value))),
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

const mockExpenses = createMockTable();
const mockBudgets = createMockTable();
const mockSettings = createMockTable();
const mockReceipts = createMockTable();

// Add where().and() support for receipts table (used in getOrphanedReceipts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(mockReceipts.where as any) = vi.fn((field) => ({
    equals: vi.fn((value) => ({
        and: vi.fn((predicate) => ({
            toArray: vi.fn(() => {
                const storage = mockReceipts.toArray();
                return storage.then(items =>
                    items.filter(item =>
                        Object.entries(item).some(([k, v]) => k === field ? v === value : false) &&
                        predicate(item)
                    )
                );
            })
        })),
        first: vi.fn(() => {
            const storage = mockReceipts.toArray();
            return storage.then(items =>
                items.find(item => Object.entries(item).some(([k, v]) => k === field ? v === value : false))
            );
        }),
        toArray: vi.fn(() => {
            const storage = mockReceipts.toArray();
            return storage.then(items =>
                items.filter(item => Object.entries(item).some(([k, v]) => k === field ? v === value : false))
            );
        }),
        modify: vi.fn(),
        delete: vi.fn()
    })),
    startsWith: vi.fn(),
}));

vi.mock('../db/db', () => ({
    db: {
        expenses: mockExpenses,
        budgets: mockBudgets,
        settings: mockSettings,
        receipts: mockReceipts,
    },
    FinanceDB: vi.fn()
}));

// Expose clear function for tests
export const resetDb = () => {
    mockExpenses.clear();
    mockBudgets.clear();
    mockSettings.clear();
    mockReceipts.clear();
};
