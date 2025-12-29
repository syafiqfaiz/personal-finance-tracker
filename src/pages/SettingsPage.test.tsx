import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsPage from './SettingsPage';

// Mock child components
vi.mock('../components/Settings', () => ({
    default: () => <div data-testid="settings-component">Settings Component</div>
}));

describe('SettingsPage', () => {
    it('renders the page header and settings component', () => {
        render(<SettingsPage />);

        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Connectivity & Security')).toBeInTheDocument();
        expect(screen.getByTestId('settings-component')).toBeInTheDocument();
        expect(screen.getByText('Local-First Storage Active')).toBeInTheDocument();
    });
});
