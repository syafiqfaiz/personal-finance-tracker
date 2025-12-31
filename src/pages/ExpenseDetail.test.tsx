import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import ExpenseDetail from './ExpenseDetail';
import { useFinanceStore } from '../store/useFinanceStore';
import { useParams, useNavigate, MemoryRouter } from 'react-router-dom';
import * as imageService from '../services/imageService';

// Mock dependencies
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: vi.fn()
    };
});

vi.mock('../store/useFinanceStore');
vi.mock('../services/imageService');
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn()
    }
}));

describe('ExpenseDetail Page', () => {
    const mockNavigate = vi.fn();
    const mockExpense = {
        id: '123',
        name: 'Lunch',
        amount: 25.00,
        category: 'Food',
        timestamp: new Date('2023-01-01T12:00:00'),
        paymentMethod: 'Card',
        notes: 'Team lunch',
        localReceipt: new Blob(['test'], { type: 'image/jpeg' })
    };
    const mockDeleteExpense = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate); // eslint-disable-line @typescript-eslint/no-explicit-any
        (useFinanceStore as any).mockReturnValue({ // eslint-disable-line @typescript-eslint/no-explicit-any
            expenses: [mockExpense],
            deleteExpense: mockDeleteExpense
        });
        (imageService.blobToDataURL as any).mockResolvedValue('data:image/jpeg;base64,test'); // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    it('renders expense details correctly', async () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any

        render(
            <MemoryRouter>
                <ExpenseDetail />
            </MemoryRouter>
        );

        // Wait for usage of localReceipt (useEffect triggering setState)
        // This implicitly handles ACT warnings by waiting for the state outcome
        expect(await screen.findByAltText('Receipt')).toBeInTheDocument();

        expect(screen.getByText('Lunch')).toBeInTheDocument();
        // Amount is split into spans: RM, 25, .50
        // Use regex to be safer or query by broader context if needed
        expect(screen.getByText('25')).toBeInTheDocument();
        // .50 might be tricky if it's rendered as .50 or 0.50
        // The code does: .toFixed(2).split('.')[1] -> '50', prepended with '.' -> '.50'
        expect(screen.getByText('.00')).toBeInTheDocument();
        expect(screen.getByText('Food')).toBeInTheDocument();
        expect(screen.getByText('"Team lunch"')).toBeInTheDocument();
    });

    it('handles deletion interaction', async () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(
            <MemoryRouter>
                <ExpenseDetail />
            </MemoryRouter>
        );

        // Wait for receipt load again to stabilize state first
        await screen.findByAltText('Receipt');

        // Target delete button. The structure is Header -> Right Group -> Delete Button (Trash2)
        // Trash2 is an SVG. We can look for containing button.
        // Or finding by known class or role.
        // Let's use custom matcher or just get all buttons and check children or position.
        // Safer approach: Get the container of the Trash2 icon
        // But since we mock Lucide icons slightly differently or they render as SVGs...
        // Let's assume Lucide components render SVGs.
        // Best way: add data-testid to the source if needed, OR index safely.

        const deleteButton = screen.getByRole('button', { name: /delete expense/i });
        await fireEvent.click(deleteButton);

        // Mock window.confirm is NO LONGER USED.
        // Instead, we expect the ConfirmDialog to appear.
        expect(screen.getByText('Delete Expense?')).toBeInTheDocument();

        // Find and click the confirm button in the dialog
        // The confirm button in ConfirmDialog has text "Yes, Delete" by default
        const confirmButton = screen.getByText('Yes, Delete');
        await fireEvent.click(confirmButton);

        // Wait for navigation
        await waitFor(() => {
            expect(mockDeleteExpense).toHaveBeenCalledWith('123');
            expect(toast.success).toHaveBeenCalledWith('Expense deleted');
            expect(mockNavigate).toHaveBeenCalledWith('/history');
        });
    });

    it('cancels deletion when user declines confirmation', async () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        render(
            <MemoryRouter>
                <ExpenseDetail />
            </MemoryRouter>
        );

        await screen.findByAltText('Receipt');

        const deleteButton = screen.getByRole('button', { name: /delete expense/i });
        await fireEvent.click(deleteButton);

        // Expect dialog
        expect(screen.getByText('Delete Expense?')).toBeInTheDocument();

        // Click Cancel
        const cancelButton = screen.getByText('Cancel');
        await fireEvent.click(cancelButton);

        // Verify dialog closed and delete NOT called
        expect(screen.queryByText('Delete Expense?')).not.toBeInTheDocument();
        expect(mockDeleteExpense).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('renders correctly without receipt', async () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any
        const expenseNoReceipt = { ...mockExpense, localReceipt: undefined };

        (useFinanceStore as any).mockReturnValue({ // eslint-disable-line @typescript-eslint/no-explicit-any
            expenses: [expenseNoReceipt],
            deleteExpense: mockDeleteExpense
        });

        render(
            <MemoryRouter>
                <ExpenseDetail />
            </MemoryRouter>
        );

        expect(await screen.findByText('Lunch')).toBeInTheDocument();
        expect(screen.queryByAltText('Receipt')).not.toBeInTheDocument();
        expect(screen.queryByText('Receipt Attachment')).not.toBeInTheDocument();
    });

    it('shows not found for invalid id', () => {
        (useParams as any).mockReturnValue({ id: '999' }); // eslint-disable-line @typescript-eslint/no-explicit-any

        render(
            <MemoryRouter>
                <ExpenseDetail />
            </MemoryRouter>
        );

        expect(screen.getByText('Expense not found.')).toBeInTheDocument();
    });

    it('renders PDF receipt correctly', async () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any
        (imageService.blobToDataURL as any).mockResolvedValue('data:application/pdf;base64,test'); // eslint-disable-line @typescript-eslint/no-explicit-any

        render(
            <MemoryRouter>
                <ExpenseDetail />
            </MemoryRouter>
        );

        await screen.findByText('PDF Document');
        expect(screen.getByText('Click to view')).toBeInTheDocument();
        expect(screen.getByText('Open PDF')).toBeInTheDocument();
    });

    it('opens and closes lightbox for image receipt', async () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any
        // Default mock is image

        render(
            <MemoryRouter>
                <ExpenseDetail />
            </MemoryRouter>
        );

        await screen.findByAltText('Receipt');

        // Find the image container or button to open lightbox
        // The image itself is wrapped in a clickable div to open lightbox
        const image = screen.getByAltText('Receipt');
        fireEvent.click(image);

        // Lightbox should use fixed z-index overlay
        expect(screen.getByAltText('Receipt Fullscreen')).toBeInTheDocument();

        // Close it
        // There is a close button with X icon
        // Or clicking overlay closses it
        const closeButton = screen.getAllByRole('button').find(b => b.querySelector('svg.lucide-x') || b.className.includes('absolute top-8'));
        // Alternatively, click the overlay
        // The overlay has className "fixed inset-0 ..."

        if (closeButton) {
            fireEvent.click(closeButton);
        } else {
            // click overlay
            const overlay = screen.getByAltText('Receipt Fullscreen').parentElement;
            if (overlay) fireEvent.click(overlay);
        }

        expect(screen.queryByAltText('Receipt Fullscreen')).not.toBeInTheDocument();
    });

    it('opens PDF in new window', async () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any
        (imageService.blobToDataURL as any).mockResolvedValue('data:application/pdf;base64,test'); // eslint-disable-line @typescript-eslint/no-explicit-any

        const mockWrite = vi.fn();
        const mockOpen = vi.fn().mockReturnValue({ document: { write: mockWrite } });
        vi.stubGlobal('open', mockOpen);

        render(
            <MemoryRouter>
                <ExpenseDetail />
            </MemoryRouter>
        );

        await screen.findByText('PDF Document');

        // Click the container
        const pdfContainer = screen.getByText('PDF Document').closest('div');
        if (pdfContainer) fireEvent.click(pdfContainer);

        expect(mockOpen).toHaveBeenCalled();
        expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('<iframe'));

        vi.unstubAllGlobals();
    });

    it('handles popup blocked when opening PDF', async () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any
        (imageService.blobToDataURL as any).mockResolvedValue('data:application/pdf;base64,test'); // eslint-disable-line @typescript-eslint/no-explicit-any

        const mockOpen = vi.fn().mockReturnValue(null); // Blocked
        vi.stubGlobal('open', mockOpen);

        render(
            <MemoryRouter>
                <ExpenseDetail />
            </MemoryRouter>
        );

        await screen.findByText('PDF Document');

        const pdfContainer = screen.getByText('PDF Document').closest('div');
        if (pdfContainer) fireEvent.click(pdfContainer);

        expect(mockOpen).toHaveBeenCalled();
        // Should simple not crash

        vi.unstubAllGlobals();
    });

    it('navigates to edit page', async () => {
        (useParams as any).mockReturnValue({ id: '123' }); // eslint-disable-line @typescript-eslint/no-explicit-any

        render(
            <MemoryRouter>
                <ExpenseDetail />
            </MemoryRouter>
        );

        // Wait for state to settle to avoid ACT warnings
        await screen.findByAltText('Receipt');

        const editLink = screen.getAllByRole('link').find(l => l.getAttribute('href') === '/history/123/edit');
        expect(editLink).toBeInTheDocument();
    });
});
