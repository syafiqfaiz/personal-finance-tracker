import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom'; // Ensure jest-dom matchers are available

describe('Button', () => {
    it('renders correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('applies variant classes', () => {
        render(<Button variant="danger">Delete</Button>);
        const button = screen.getByRole('button', { name: /delete/i });
        expect(button).toHaveClass('bg-red-50');
        expect(button).toHaveClass('text-red-600');
    });

    it('applies size classes', () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByRole('button', { name: /small/i })).toHaveClass('text-xs');
        expect(screen.getByRole('button', { name: /small/i })).toHaveClass('py-2');

        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByRole('button', { name: /large/i })).toHaveClass('text-base');
        expect(screen.getByRole('button', { name: /large/i })).toHaveClass('py-5');
    });

    it('shows loader when isLoading is true', () => {
        render(<Button isLoading>Loading</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
        // The loader is an SVG, strictly speaking we might look for a specific class or check if children are still present
        expect(screen.getByText('Loading')).toBeInTheDocument();
    });
});
