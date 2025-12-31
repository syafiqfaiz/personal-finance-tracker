import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditCategoryDialog, { type CategoryFormData } from './EditCategoryDialog';

describe('EditCategoryDialog', () => {
    const mockSave = vi.fn();
    const mockCancel = vi.fn();
    const mockDelete = vi.fn();

    const initialData: CategoryFormData = {
        name: 'Food',
        limit: '500',
        icon: 'Utensils',
        originalName: 'Food'
    };

    it('renders correctly via portal', () => {
        const { baseElement } = render(
            <EditCategoryDialog
                initialData={initialData}
                onSave={mockSave}
                onCancel={mockCancel}
                onDelete={mockDelete}
            />
        );

        // Verify content exists
        expect(screen.getByText('Edit Category')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Food')).toBeInTheDocument();

        // Verify it is in the body (baseElement)
        expect(baseElement.contains(screen.getByText('Edit Category'))).toBe(true);
    });

    it('renders inside a container but portals out', () => {
        render(
            <div data-testid="container">
                <EditCategoryDialog
                    initialData={initialData}
                    onSave={mockSave}
                    onCancel={mockCancel}
                    onDelete={mockDelete}
                />
            </div>
        );

        const container = screen.getByTestId('container');
        const dialogContent = screen.getByText('Edit Category'); // Finding an element inside the dialog

        // The dialog content should NOT be inside the container div if portaled correctly
        // Note: In JSDOM/React Test Lib, createPortal renders into the target node.
        // Since we target document.body, it should be a direct child of body (or close to it), not in #container
        expect(container).not.toContainElement(dialogContent);
    });

    it('handles interactions correctly', () => {
        render(
            <EditCategoryDialog
                initialData={initialData}
                onSave={mockSave}
                onCancel={mockCancel}
                onDelete={mockDelete}
            />
        );

        // Input change
        const input = screen.getByDisplayValue('Food');
        fireEvent.change(input, { target: { value: 'New Food' } });
        expect(input).toHaveValue('New Food');

        // Cancel
        fireEvent.click(screen.getByText('Cancel'));
        expect(mockCancel).toHaveBeenCalled();

        // Save
        fireEvent.click(screen.getByText('Save Changes'));
        expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Food' }));
    });
});
