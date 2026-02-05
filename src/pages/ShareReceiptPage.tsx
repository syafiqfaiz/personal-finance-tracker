import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/useSettingsStore';
import { api } from '../services/api';
import { validateReceiptFile } from '../utils/fileValidation';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const DB_NAME = 'share-target-db';
const STORE_NAME = 'shared-files';
const DB_VERSION = 1;

interface SharedData {
    id: string;
    file?: File;
    text?: string;
    url?: string;
    timestamp: number;
}

const ShareReceiptPage = () => {
    const navigate = useNavigate();
    const { licenseKey } = useSettingsStore();
    const [status, setStatus] = useState<'loading' | 'uploading' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Helpers defined outside or inside? Inside effect is cleaner for deps, 
    // but IDB helpers are generic. Let's keep IDB helpers outside effect but inside component
    // or just defined as consts inside effect if they don't need reuse.
    // To satisfy linter and keep it clean, I'll define helpers outside and not list them in deps 
    // (since they are pure functions if I move DB constants inside or keep them static global).
    // Actually, best practice: define them outside component if they don't use props/state.

    useEffect(() => {
        const getSharedData = (): Promise<SharedData | null> => {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        resolve(null);
                        return;
                    }
                    const tx = db.transaction(STORE_NAME, 'readonly');
                    const store = tx.objectStore(STORE_NAME);
                    const getRequest = store.get('latest');

                    getRequest.onsuccess = () => resolve(getRequest.result);
                    getRequest.onerror = () => reject(getRequest.error);
                };
            });
        };

        const clearSharedData = (): Promise<void> => {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onsuccess = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        resolve();
                        return;
                    }
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    const deleteRequest = store.delete('latest');
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                };
            });
        };

        const processSharedReceipt = async () => {
            try {
                setStatus('loading');

                // 1. Check authentication
                if (!licenseKey) {
                    navigate('/settings', {
                        state: { error: 'This feature is only enabled for authenticated users' },
                        replace: true
                    });
                    return;
                }

                // 2. Get data from IDB
                const data = await getSharedData();

                if (!data || !data.file) {
                    if (!data) {
                        navigate('/', { replace: true });
                        return;
                    }
                    setErrorMessage('No receipt file found in shared content.');
                    setStatus('error');
                    return;
                }

                const file = data.file;

                // 3. Validate file
                const validationError = validateReceiptFile(file);
                if (validationError) {
                    setErrorMessage(validationError);
                    setStatus('error');
                    return;
                }

                // 4. Upload
                setStatus('uploading');

                const uploadUrlResponse = await api.getUploadUrl(file.name, file.type);

                const uploadRes = await fetch(uploadUrlResponse.url, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type
                    }
                });

                if (!uploadRes.ok) {
                    throw new Error('Failed to upload receipt to cloud storage');
                }

                // 5. Cleanup and Redirect
                await clearSharedData();

                navigate('/', {
                    state: {
                        sharedReceipt: {
                            storageKey: uploadUrlResponse.key,
                            fileName: file.name,
                            fileType: file.type
                        }
                    },
                    replace: true
                });

            } catch (error) {
                console.error('Share processing failed:', error);
                setErrorMessage(error instanceof Error ? error.message : 'Failed to process shared receipt');
                setStatus('error');
            }
        };

        processSharedReceipt();
    }, [licenseKey, navigate]);

    // Retry handler - needs to re-run the process. 
    // Since logic is inside effect, we can force a re-run by toggling a key or 
    // extracting logic to a useCallback. 
    // Let's refactor slightly to allow manual retry from button.
    // We can't easily call the effect function from outside.
    // CLEANER SOLUTION: Move logic to useCallback and use it in effect.

    // HOWEVER, to avoid "restoring" complexity, I will just do a simple window reload 
    // for "Try Again" or just navigate to /share (which is current page) to re-mount.

    const handleRetry = () => {
        window.location.reload();
    };

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Processing Failed</h2>
                <p className="text-slate-600 mb-8 max-w-xs">{errorMessage}</p>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={handleRetry}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold active:scale-95 transition-transform"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <button
                        onClick={() => navigate('/', { replace: true })}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold active:scale-95 transition-transform"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-purple-900/5 flex items-center justify-center mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin relative z-10" />
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                {status === 'uploading' ? 'Uploading Receipt...' : 'Receiving Receipt...'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
                {status === 'uploading'
                    ? 'Sending to secure cloud storage'
                    : 'Processing shared content'}
            </p>
        </div>
    );
};

export default ShareReceiptPage;
