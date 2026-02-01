import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from './Settings';
import { useSettingsStore } from '../store/useSettingsStore';
import { backupService } from '../services/backupService';

// Mock the store
vi.mock('../store/useSettingsStore', () => ({
    useSettingsStore: vi.fn(),
}));

// Mock backup service
vi.mock('../services/backupService', () => ({
    backupService: {
        createBackup: vi.fn(),
        restoreBackup: vi.fn(),
    }
}));

describe('Settings', () => {
    const mockSetLicenseKey = vi.fn();
    const mockSetUserName = vi.fn();
    const mockLoadSettings = vi.fn();

    const defaultStore = {
        userName: 'Test User',
        licenseKey: 'initial-key',
        isLoading: false,
        lastBackupAt: null,
        setUserName: mockSetUserName,
        setLicenseKey: mockSetLicenseKey,
        loadSettings: mockLoadSettings,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSettingsStore as any).mockReturnValue(defaultStore);
    });

    describe('Loading State', () => {
        it('shows loading message when isLoading is true', () => {
            (useSettingsStore as any).mockReturnValue({
                ...defaultStore,
                isLoading: true
            });

            render(<Settings />);
            expect(screen.getByText('Loading settings...')).toBeInTheDocument();
        });
    });

    describe('Profile Settings', () => {
        it('renders profile section with user name input', () => {
            render(<Settings />);
            expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
            expect(screen.getByText('Save Profile')).toBeInTheDocument();
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

        it('shows error message when profile save fails', async () => {
            mockSetUserName.mockRejectedValueOnce(new Error('Failed'));

            render(<Settings />);

            const nameInput = screen.getByPlaceholderText('Enter your name');
            fireEvent.change(nameInput, { target: { value: 'New Name' } });

            const saveButton = screen.getByText('Save Profile');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to update profile.')).toBeInTheDocument();
            });
        });

        it('dismisses success message when X button is clicked', async () => {
            render(<Settings />);

            const saveButton = screen.getByText('Save Profile');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
            });

            const closeButton = screen.getAllByRole('button').find(btn =>
                btn.querySelector('svg')?.classList.contains('lucide-x')
            );

            if (closeButton) {
                fireEvent.click(closeButton);
                await waitFor(() => {
                    expect(screen.queryByText('Profile updated successfully!')).not.toBeInTheDocument();
                });
            }
        });
    });

    describe('License Settings', () => {
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

        it('shows error message when license save fails', async () => {
            mockSetLicenseKey.mockRejectedValueOnce(new Error('Failed'));

            render(<Settings />);

            const input = screen.getByLabelText('License Key');
            fireEvent.change(input, { target: { value: 'new-key' } });

            const saveButton = screen.getByText('Save License');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to save license key.')).toBeInTheDocument();
            });
        });

        it('does not show Gemini API key input', () => {
            render(<Settings />);
            expect(screen.queryByLabelText('API Key')).not.toBeInTheDocument();
            expect(screen.queryByText('Google Gemini Pro')).not.toBeInTheDocument();
        });
    });

    describe('Backup Functionality', () => {
        it('renders backup button', () => {
            render(<Settings />);
            expect(screen.getByText('Backup Now')).toBeInTheDocument();
        });

        it('calls backup service when Create Backup is clicked', async () => {
            (backupService.createBackup as any).mockResolvedValueOnce(true);

            render(<Settings />);

            const backupButton = screen.getByText('Backup Now');
            fireEvent.click(backupButton);

            await waitFor(() => {
                expect(backupService.createBackup).toHaveBeenCalledWith(true);
            });
        });

        it('disables backup button while backup is in progress', async () => {
            let resolveBackup: any;
            const backupPromise = new Promise(resolve => {
                resolveBackup = resolve;
            });
            (backupService.createBackup as any).mockReturnValue(backupPromise);

            render(<Settings />);

            const backupButton = screen.getByText('Backup Now');
            fireEvent.click(backupButton);

            await waitFor(() => {
                expect(screen.getByText('Backing up...')).toBeInTheDocument();
            });

            resolveBackup(true);
        });

        it('displays last backup time when available', () => {
            (useSettingsStore as any).mockReturnValue({
                ...defaultStore,
                lastBackupAt: '2024-01-01T12:00:00Z'
            });

            render(<Settings />);
            expect(screen.getByText(/Last Backup/)).toBeInTheDocument();
        });
    });

    describe('Restore Functionality', () => {
        it('renders restore button', () => {
            render(<Settings />);
            expect(screen.getByText('Restore Data')).toBeInTheDocument();
        });

        it('shows confirmation dialog when restore button is clicked', async () => {
            render(<Settings />);

            const restoreButton = screen.getByText('Restore Data');
            fireEvent.click(restoreButton);

            await waitFor(() => {
                expect(screen.getByText(/This will OVERWRITE/)).toBeInTheDocument();
            });
        });

        it('calls restore service when confirmed', async () => {
            (backupService.restoreBackup as any).mockResolvedValueOnce(undefined);

            render(<Settings />);

            const restoreButton = screen.getByText('Restore Data');
            fireEvent.click(restoreButton);

            await waitFor(() => {
                expect(screen.getByText(/This will OVERWRITE/)).toBeInTheDocument();
            });

            const confirmButton = screen.getByText('Yes, Overwrite');
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(backupService.restoreBackup).toHaveBeenCalled();
            });
        });

        it('does not call restore when cancelled', async () => {
            render(<Settings />);

            const restoreButton = screen.getByText('Restore Data');
            fireEvent.click(restoreButton);

            await waitFor(() => {
                expect(screen.getByText(/This will OVERWRITE/)).toBeInTheDocument();
            });

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(backupService.restoreBackup).not.toHaveBeenCalled();
        });

        it('disables restore button while restore is in progress', async () => {
            let resolveRestore: any;
            const restorePromise = new Promise(resolve => {
                resolveRestore = resolve;
            });
            (backupService.restoreBackup as any).mockReturnValue(restorePromise);

            render(<Settings />);

            const restoreButton = screen.getByText('Restore Data');
            fireEvent.click(restoreButton);

            await waitFor(() => {
                expect(screen.getByText(/This will OVERWRITE/)).toBeInTheDocument();
            });

            const confirmButton = screen.getByText('Yes, Overwrite');
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(screen.getByText('Restoring...')).toBeInTheDocument();
            });

            resolveRestore(undefined);
        });
    });

    describe('Status Messages', () => {
        it('shows success status with green styling', async () => {
            render(<Settings />);

            const saveButton = screen.getByText('Save Profile');
            fireEvent.click(saveButton);

            await waitFor(() => {
                const statusDiv = screen.getByText('Profile updated successfully!').closest('div');
                expect(statusDiv).toHaveClass('bg-green-50');
            });
        });

        it('shows error status with red styling', async () => {
            mockSetUserName.mockRejectedValueOnce(new Error('Failed'));

            render(<Settings />);

            const saveButton = screen.getByText('Save Profile');
            fireEvent.click(saveButton);

            await waitFor(() => {
                const statusDiv = screen.getByText('Failed to update profile.').closest('div');
                expect(statusDiv).toHaveClass('bg-red-50');
            });
        });
    });
});
