import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MonthExpenseSnapshot from './MonthExpenseSnapshot';
import { BrowserRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock data
const mockExpenses = [
    {
        id: '1',
        name: 'Doctor',
        amount: 200,
        category: 'Healthcare',
        tags: [],
        timestamp: new Date(),
        paymentMethod: 'Cash',
        isTaxDeductible: false,
    },
    {
        id: '2',
        name: 'Groceries',
        amount: 300,
        category: 'Food',
        tags: [],
        timestamp: new Date(),
        paymentMethod: 'Credit Card',
        isTaxDeductible: false,
    },
];

const mockBudgets = [
    {
        id: '1',
        category: 'Healthcare',
        limit: 150, // Over budget (200 > 150)
        monthPeriod: new Date().toISOString().slice(0, 7),
    },
    {
        id: '2',
        category: 'Food',
        limit: 500, // Under budget (300 < 500)
        monthPeriod: new Date().toISOString().slice(0, 7),
    },
];

describe('MonthExpenseSnapshot', () => {
    it('renders correctly with expenses', () => {
        render(
            <BrowserRouter>
                <MonthExpenseSnapshot
                    expenses={mockExpenses}
                    totalAmount={500}
                    budgets={mockBudgets}
                />
            </BrowserRouter>
        );

        expect(screen.getByText('Spending This Month')).toBeInTheDocument();
        expect(screen.getByText('RM 500')).toBeInTheDocument(); // Total
        expect(screen.getByText('Healthcare')).toBeInTheDocument();
        expect(screen.getByText('Food')).toBeInTheDocument();
    });

    it('renders budget comparison correctly', () => {
        render(
            <BrowserRouter>
                <MonthExpenseSnapshot
                    expenses={mockExpenses}
                    totalAmount={500}
                    budgets={mockBudgets}
                />
            </BrowserRouter>
        );

        // Healthcare: 200 / 150 (Burst)
        // We look for text content matching RM 200 and / 150
        expect(screen.getByText(/RM 200/)).toBeInTheDocument();
        expect(screen.getByText(/\/ 150/)).toBeInTheDocument();

        // Food: 300 / 500
        expect(screen.getByText(/RM 300/)).toBeInTheDocument();
        expect(screen.getByText(/\/ 500/)).toBeInTheDocument();
    });

    it('handles empty state', () => {
        render(
            <BrowserRouter>
                <MonthExpenseSnapshot expenses={[]} totalAmount={0} budgets={[]} />
            </BrowserRouter>
        );

        expect(screen.getByText('No expenses to analyze yet.')).toBeInTheDocument();
        expect(screen.getByText('Manage Budgets')).toBeInTheDocument();
    });

    it('navigates to /budgets on click', () => {
        render(
            <BrowserRouter>
                <MonthExpenseSnapshot
                    expenses={mockExpenses}
                    totalAmount={500}
                    budgets={mockBudgets}
                />
            </BrowserRouter>
        );

        const card = screen.getByText('Spending This Month').closest('div');
        fireEvent.click(card!);

        expect(mockNavigate).toHaveBeenCalledWith('/budgets');
    });

    it('aggregates "Others" correctly when categories > 3', () => {
        const manyExpenses = [
            { ...mockExpenses[0], id: '1', category: 'Cat1', amount: 100 },
            { ...mockExpenses[0], id: '2', category: 'Cat2', amount: 100 },
            { ...mockExpenses[0], id: '3', category: 'Cat3', amount: 100 },
            { ...mockExpenses[0], id: '4', category: 'Cat4', amount: 50 }, // Should go to Others
            { ...mockExpenses[0], id: '5', category: 'Cat5', amount: 50 }, // Should go to Others
        ];

        render(
            <BrowserRouter>
                <MonthExpenseSnapshot
                    expenses={manyExpenses}
                    totalAmount={400}
                    budgets={[]}
                />
            </BrowserRouter>
        );

        expect(screen.getByText('Cat1')).toBeInTheDocument();
        expect(screen.getByText('Cat2')).toBeInTheDocument();
        // Check for Others category name
        expect(screen.getByText('Others')).toBeInTheDocument();

        // Use getAllByText for "RM 100" because Cat1, Cat2, Cat3 also have 100
        const amounts = screen.getAllByText(/100/);
        expect(amounts.length).toBeGreaterThanOrEqual(4); // Cat1, Cat2, Cat3, Others
    });
});
