import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BudgetCard from './BudgetCard';

describe('BudgetCard', () => {
    const defaultProps = {
        category: 'Food',
        icon: 'Utensils',
        spent: 50,
        limit: 100,
        percent: 50,
        isOver: false,
        onEdit: vi.fn()
    };

    it('renders category name and spent amount', () => {
        render(<BudgetCard {...defaultProps} />);
        expect(screen.getByText('Food')).toBeInTheDocument();
        expect(screen.getByText(/RM\s?50/)).toBeInTheDocument(); // Flexible spacing check
    });

    it('calls onEdit when edit button is clicked', () => {
        render(<BudgetCard {...defaultProps} />);
        const editButton = screen.getByLabelText('Edit budget');
        fireEvent.click(editButton);
        expect(defaultProps.onEdit).toHaveBeenCalledWith('Food');
    });

    it('shows warning style when over budget', () => {
        const props = { ...defaultProps, spent: 150, limit: 100, isOver: true };
        const { container } = render(<BudgetCard {...props} />);
        expect(container.textContent).toContain('Exceeded');
    });
});
