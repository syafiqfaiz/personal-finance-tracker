import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from './Settings';
import { useSettingsStore } from '../store/useSettingsStore';

// Mock the store
vi.mock('../store/useSettingsStore', () => ({
    useSettingsStore: vi.fn(),
}));

vi.mock('../services/s3Service', () => ({
    performFullBackup: vi.fn(),
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
    it('updates S3 configuration when saved', async () => {
        render(<Settings />);

        const bucketInput = screen.getByLabelText('Bucket');
        fireEvent.change(bucketInput, { target: { value: 'new-bucket' } });

        const regionInput = screen.getByLabelText('Region');
        fireEvent.change(regionInput, { target: { value: 'us-east-1' } });

        const accessKeyInput = screen.getByLabelText('Access Key');
        fireEvent.change(accessKeyInput, { target: { value: 'new-access-key' } });

        const secretKeyInput = screen.getByLabelText('Secret Key');
        fireEvent.change(secretKeyInput, { target: { value: 'new-secret-key' } });

        const saveButton = screen.getByText('Save S3 Config');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockSetS3Config).toHaveBeenCalledWith(expect.objectContaining({
                bucket: 'new-bucket',
                region: 'us-east-1',
                accessKeyId: 'new-access-key',
                secretAccessKey: 'new-secret-key'
            }));
        });

        expect(screen.getByText('S3 configuration saved successfully!')).toBeInTheDocument();
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

    it('handles S3 sync correctly', async () => {
        const s3Store = {
            ...defaultStore,
            s3Config: {
                bucket: 'test-bucket',
                region: 'us-east-1',
                accessKeyId: 'test-key',
                secretAccessKey: 'test-secret',
            }
        };
        (useSettingsStore as any).mockReturnValue(s3Store);

        const { performFullBackup } = await import('../services/s3Service');
        (performFullBackup as any).mockResolvedValue(true);

        render(<Settings />);

        const syncButton = screen.getByLabelText('Sync to S3');
        expect(syncButton).toBeInTheDocument();

        fireEvent.click(syncButton);

        expect(screen.getByText('Syncing...')).toBeInTheDocument();

        await waitFor(() => {
            expect(performFullBackup).toHaveBeenCalledWith(s3Store.s3Config);
        });

        expect(screen.getByText('Backup Success!')).toBeInTheDocument();
    });
});
