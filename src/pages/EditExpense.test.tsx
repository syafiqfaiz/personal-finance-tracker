import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditExpense from './EditExpense';
import { useFinanceStore } from '../store/useFinanceStore';
import { useParams, useNavigate } from 'react-router-dom';

// Mock dependencies
vi.mock('react-router-dom', () => ({
    useParams: vi.fn(),
    useNavigate: vi.fn()
}));

vi.mock('../store/useFinanceStore', () => ({
    useFinanceStore: vi.fn()
}));

vi.mock('../components/ExpenseForm', () => ({
    default: ({ initialData, onSuccess }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
        <div data-testid="expense-form">
            Expense Form for {initialData?.name}
            <button onClick={onSuccess}>Submit</button>
        </div>
    )
}));

describe('EditExpense Page', () => {
    const mockNavigate = vi.fn();
    const mockExpense = {
        id: '123',
        name: 'Test Expense',
        amount: 100,
        category: 'Food',
        timestamp: new Date()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate); // eslint-disable-line @typescript-eslint/no-explicit-any
        (useFinanceStore as any).mockReturnValue({ // eslint-disable-line @typescript-eslint/no-explicit-any
            expenses: [mockExpense]
        });
    });

    it('renders expense form when id is valid', () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any

        render(<EditExpense />);

        expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
        expect(screen.getByTestId('expense-form')).toBeInTheDocument();
        expect(screen.getByText('Expense Form for Test Expense')).toBeInTheDocument();
    });

    it('navigates correctly on back button click', () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any
        render(<EditExpense />);

        // Setup generic back button click if needed, but header has specific back link
        // The component has a back button in the header
        const backButton = screen.getAllByRole('button')[0]; // ChevronLeft button
        fireEvent.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith('/history/123');
    });

    it('shows not found state for invalid id', () => {
        // ID not in store
        (useParams as any).mockReturnValue({ id: '999' }); // eslint-disable-line @typescript-eslint/no-explicit-any
        render(<EditExpense />);

        expect(screen.getByText('Expense not found.')).toBeInTheDocument();

        const goBackButton = screen.getByText('Go Back');
        fireEvent.click(goBackButton);
        expect(mockNavigate).toHaveBeenCalledWith('/history');
    });

    it('navigates to detail on success', () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any
        render(<EditExpense />);

        const submitButton = screen.getByText('Submit');
        fireEvent.click(submitButton);

        expect(mockNavigate).toHaveBeenCalledWith('/history/123');
    });
});
