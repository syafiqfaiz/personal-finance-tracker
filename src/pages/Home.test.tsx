import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './Home';

// Mock the child component to isolate page testing
vi.mock('../components/Dashboard', () => ({
    default: () => <div data-testid="dashboard">Dashboard Component</div>
}));

describe('Home Page', () => {
    it('renders the Dashboard component', () => {
        render(<Home />);
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
});
