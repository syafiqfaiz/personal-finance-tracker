import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

describe('Select', () => {
    it('renders with label', () => {
        render(
            <Select label="Choose Category">
                <option value="1">One</option>
            </Select>
        );
        expect(screen.getByText('Choose Category')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('displays error message', () => {
        render(
            <Select error="Invalid selection">
                <option value="1">One</option>
            </Select>
        );
        expect(screen.getByText('Invalid selection')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toHaveClass('border-red-500');
    });

    it('handles change events', () => {
        const handleChange = vi.fn();
        render(
            <Select onChange={handleChange}>
                <option value="a">A</option>
                <option value="b">B</option>
            </Select>
        );

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
        expect(handleChange).toHaveBeenCalledTimes(1);
    });
});
