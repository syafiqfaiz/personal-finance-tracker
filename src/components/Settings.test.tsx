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
    const mockSetS3Config = vi.fn();
    const mockLoadSettings = vi.fn();

    const defaultStore = {
        userName: 'Test User',
        licenseKey: 'initial-key',
        s3Config: {
            bucket: '',
            region: '',
            accessKeyId: '',
            secretAccessKey: '',
        },
        isLoading: false,
        setUserName: mockSetUserName,
        setLicenseKey: mockSetLicenseKey,
        setS3Config: mockSetS3Config,
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
});
