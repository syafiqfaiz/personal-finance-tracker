import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MonthlyBudgetProgress from './MonthlyBudgetProgress';
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

describe('MonthlyBudgetProgress', () => {
    it('renders correctly with normal budget', () => {
        render(
            <BrowserRouter>
                <MonthlyBudgetProgress totalSpent={500} totalBudget={1000} />
            </BrowserRouter>
        );

        // Header: Spent RM 500
        expect(screen.getByText(/You've spent/)).toBeInTheDocument();

        // RM 500 appears twice: Once in header, once in footer (remaining)
        const amounts = screen.getAllByText('RM 500');
        expect(amounts).toHaveLength(2);

        // Progress display (depends on implementation, e.g. width style or text)
        // Check for percentage text if displayed
        expect(screen.getByText('50%')).toBeInTheDocument();

        // Footer text
        expect(screen.getByText('remaining')).toBeInTheDocument();
    });

    it('renders correctly when over budget', () => {
        render(
            <BrowserRouter>
                <MonthlyBudgetProgress totalSpent={1200} totalBudget={1000} />
            </BrowserRouter>
        );

        // Header: Spent RM 1,200
        expect(screen.getByText('RM 1,200')).toBeInTheDocument();

        // Percentage is capped at 100% in UI logic or shows actual > 100?
        // Logic: Math.min(100, (totalSpent / totalBudget) * 100) -> 100
        expect(screen.getByText('100%')).toBeInTheDocument();

        // Footer: RM 0 remaining
        expect(screen.getByText('RM 0')).toBeInTheDocument();
    });

    it('renders correctly when no budget is set', () => {
        render(
            <BrowserRouter>
                <MonthlyBudgetProgress totalSpent={100} totalBudget={0} />
            </BrowserRouter>
        );

        // Button should appear
        const button = screen.getByText('No Budget Set (Tap to fix)');
        expect(button).toBeInTheDocument();

        // Clicking it should navigate
        fireEvent.click(button);
        expect(mockNavigate).toHaveBeenCalledWith('/budgets');

        // 100% if no budget
        expect(screen.getByText('100%')).toBeInTheDocument();
    });
});
