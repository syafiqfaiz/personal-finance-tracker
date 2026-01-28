import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from './Settings';
import { useSettingsStore } from '../store/useSettingsStore';

// Mock the store
vi.mock('../store/useSettingsStore', () => ({
    useSettingsStore: vi.fn(),
}));

describe('Settings', () => {
    const mockSetLicenseKey = vi.fn();
    const mockSetUserName = vi.fn();
    const mockLoadSettings = vi.fn();

    const defaultStore = {
        userName: 'Test User',
        licenseKey: 'initial-key',
        isLoading: false,
        setUserName: mockSetUserName,
        setLicenseKey: mockSetLicenseKey,
        loadSettings: mockLoadSettings,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSettingsStore as any).mockReturnValue(defaultStore);
    });

    it('renders license key input', () => {
        render(<Settings />);
        expect(screen.getByLabelText('License Key')).toBeInTheDocument();
        expect(screen.getByDisplayValue('initial-key')).toBeInTheDocument();
    });

    it('updates license key when saved', async () => {
        render(<Settings />);

        const input = screen.getByLabelText('License Key');
        fireEvent.change(input, { target: { value: 'new-license-key' } });

        const saveButton = screen.getByText('Save License');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockSetLicenseKey).toHaveBeenCalledWith('new-license-key');
        });

        expect(screen.getByText('License key saved successfully!')).toBeInTheDocument();
    });

    it('does not show Gemini API key input', () => {
        render(<Settings />);
        expect(screen.queryByLabelText('API Key')).not.toBeInTheDocument();
        expect(screen.queryByText('Google Gemini Pro')).not.toBeInTheDocument();
    });

    it('updates profile name when saved', async () => {
        render(<Settings />);

        const nameInput = screen.getByPlaceholderText('Enter your name');
        fireEvent.change(nameInput, { target: { value: 'New Name' } });

        const saveButton = screen.getByText('Save Profile');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockSetUserName).toHaveBeenCalledWith('New Name');
        });

        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
});
