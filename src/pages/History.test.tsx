import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import History from './History';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSearchParams } from 'react-router-dom';

// Mocks
vi.mock('../store/useFinanceStore');
vi.mock('react-router-dom', () => ({
    useSearchParams: vi.fn()
}));
vi.mock('../components/ExpenseList', () => ({
    default: ({ filterCategory, searchQuery, filterMonth, filterYear }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
        <div data-testid="expense-list">
            List: {filterCategory || 'All'} - {searchQuery} - {filterMonth} - {filterYear}
        </div>
    )
}));

describe('History Page', () => {
    const mockCategories = ['Food', 'Transport'];
    let mockSearchParams: URLSearchParams;
    let mockSetSearchParams: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new URLSearchParams();
        mockSetSearchParams = vi.fn();
        (useSearchParams as any).mockReturnValue([mockSearchParams, mockSetSearchParams]); // eslint-disable-line @typescript-eslint/no-explicit-any
        (useFinanceStore as any).mockReturnValue({ // eslint-disable-line @typescript-eslint/no-explicit-any
            categories: mockCategories
        });
    });

    it('renders category pills', () => {
        render(<History />);
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Food')).toBeInTheDocument();
        expect(screen.getByText('Transport')).toBeInTheDocument();
    });

    it('updates search query', () => {
        render(<History />);
        const searchInput = screen.getByPlaceholderText('Search records...');

        fireEvent.change(searchInput, { target: { value: 'Coffee' } });

        expect(screen.getByTestId('expense-list')).toHaveTextContent('Coffee');
    });

    it('updates URL when category is selected', () => {
        render(<History />);

        const foodPill = screen.getByText('Food');
        fireEvent.click(foodPill);

        expect(mockSearchParams.get('category')).toBe('Food');
        expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it('clears category filter when All is selected', () => {
        // Setup initial state with category selected
        mockSearchParams.set('category', 'Food');
        render(<History />);

        const allPill = screen.getByText('All');
        fireEvent.click(allPill);

        expect(mockSearchParams.has('category')).toBe(false);
        expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it('updates year and month filters', () => {
        render(<History />);

        const yearSelect = screen.getAllByRole('combobox')[1];
        fireEvent.change(yearSelect, { target: { value: '2022' } });

        const monthSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(monthSelect, { target: { value: '0' } }); // January

        expect(screen.getByTestId('expense-list')).toHaveTextContent('2022');
        expect(screen.getByTestId('expense-list')).toHaveTextContent('0');
    });
});
