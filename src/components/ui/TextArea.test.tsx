import { render, screen, fireEvent } from '@testing-library/react';
import { TextArea } from './TextArea';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

describe('TextArea', () => {
    it('renders with label', () => {
        render(<TextArea label="Comments" />);
        expect(screen.getByText('Comments')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('displays error message', () => {
        render(<TextArea error="Required field" />);
        expect(screen.getByText('Required field')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
    });

    it('handles typing', () => {
        const handleChange = vi.fn();
        render(<TextArea onChange={handleChange} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } });
        expect(handleChange).toHaveBeenCalledTimes(1);
    });
});
