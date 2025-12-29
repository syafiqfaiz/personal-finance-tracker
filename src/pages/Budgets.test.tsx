import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Budgets from './Budgets';

// Mock child component
vi.mock('../components/CategoryBudgetManager', () => ({
    default: () => <div data-testid="budget-manager">Budget Manager</div>
}));

describe('Budgets Page', () => {
    it('renders header and budget manager', () => {
        render(<Budgets />);

        expect(screen.getByText('Budgets')).toBeInTheDocument();
        expect(screen.getByText('Set limits and track your spending goals')).toBeInTheDocument();
        expect(screen.getByTestId('budget-manager')).toBeInTheDocument();
    });
});
