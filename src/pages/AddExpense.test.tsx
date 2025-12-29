import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddExpense from './AddExpense';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/useSettingsStore';

// Mock child components with ability to trigger success
vi.mock('../components/AIChat', () => ({
    default: ({ onSuccess }: any) => (
        <div data-testid="ai-chat">
            AI Chat Component
            <button onClick={onSuccess}>Trigger Success</button>
        </div>
    )
}));

vi.mock('../components/ExpenseForm', () => ({
    default: ({ onSuccess }: any) => (
        <div data-testid="expense-form">
            Manual Form Component
            <button onClick={onSuccess}>Trigger Success</button>
        </div>
    )
}));

// Mock store and router
vi.mock('../store/useSettingsStore');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn()
    };
});

describe('AddExpense Page', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate);
    });

    it('renders correctly', () => {
        (useSettingsStore as any).mockReturnValue({ geminiKey: 'test-key' });
        render(
            <BrowserRouter>
                <AddExpense />
            </BrowserRouter>
        );
        expect(screen.getByText('Add Entry')).toBeInTheDocument();
        expect(screen.getByTitle('AI Mode')).toBeInTheDocument();
        expect(screen.getByTitle('Manual Mode')).toBeInTheDocument();
    });

    it('defaults to AI mode if API key exists', () => {
        (useSettingsStore as any).mockReturnValue({ geminiKey: 'test-key' });
        render(
            <BrowserRouter>
                <AddExpense />
            </BrowserRouter>
        );
        expect(screen.getByTestId('ai-chat')).toBeInTheDocument();
    });

    it('defaults to Manual mode if API key is missing', () => {
        (useSettingsStore as any).mockReturnValue({ geminiKey: '' });
        render(
            <BrowserRouter>
                <AddExpense />
            </BrowserRouter>
        );
        expect(screen.getByTestId('expense-form')).toBeInTheDocument();
    });

    it('switches to Manual mode when clicked', () => {
        (useSettingsStore as any).mockReturnValue({ geminiKey: 'test-key' });
        render(
            <BrowserRouter>
                <AddExpense />
            </BrowserRouter>
        );
        const manualBtn = screen.getByTitle('Manual Mode');
        fireEvent.click(manualBtn);
        expect(screen.getByTestId('expense-form')).toBeInTheDocument();
        expect(screen.queryByTestId('ai-chat')).not.toBeInTheDocument();
    });

    it('navigates to history on success in AI mode', () => {
        (useSettingsStore as any).mockReturnValue({ geminiKey: 'test-key' });
        render(
            <BrowserRouter>
                <AddExpense />
            </BrowserRouter>
        );

        const successBtn = screen.getByText('Trigger Success');
        fireEvent.click(successBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/history');
    });

    it('navigates to history on success in Manual mode', () => {
        (useSettingsStore as any).mockReturnValue({ geminiKey: '' }); // Force manual
        render(
            <BrowserRouter>
                <AddExpense />
            </BrowserRouter>
        );

        const successBtn = screen.getByText('Trigger Success');
        fireEvent.click(successBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/history');
    });
});
