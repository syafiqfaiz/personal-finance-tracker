import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { ShieldCheck, Cloud, RefreshCw, X, User } from 'lucide-react';
import { performFullBackup } from '../services/s3Service';
import { Button } from './ui/Button';

const Settings: React.FC = () => {
    const { userName, licenseKey, s3Config, setUserName, setLicenseKey, setS3Config, isLoading } = useSettingsStore();

    const [localUserName, setLocalUserName] = useState(userName);
    const [localLicenseKey, setLocalLicenseKey] = useState(licenseKey);
    const [localS3, setLocalS3] = useState(s3Config);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });



    useEffect(() => {
        // eslint-disable-next-line
        setLocalUserName(userName);
        setLocalLicenseKey(licenseKey);
        setLocalS3(s3Config);
    }, [userName, licenseKey, s3Config]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading settings...</div>;
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await setUserName(localUserName);
            setStatus({ type: 'success', message: 'Profile updated successfully!' });
        } catch {
            setStatus({ type: 'error', message: 'Failed to update profile.' });
        }
    };

    const handleSaveLicense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await setLicenseKey(localLicenseKey);
            setStatus({ type: 'success', message: 'License key saved successfully!' });
        } catch {
            setStatus({ type: 'error', message: 'Failed to save license key.' });
        }
    };

    const handleSaveS3 = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await setS3Config(localS3);
            setStatus({ type: 'success', message: 'S3 configuration saved successfully!' });
        } catch {
            setStatus({ type: 'error', message: 'Failed to save S3 configuration.' });
        }
    };

    return (
        <div className="space-y-8 animate-slide-up pb-10">
            {status.type && (
                <div className={`mx-1 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    <span className="text-xs font-bold uppercase tracking-tight">{status.message}</span>
                    <button onClick={() => setStatus({ type: null, message: '' })} className="hover:opacity-75">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="space-y-6 px-1">
                {/* Profile Settings */}
                <section className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-slate-50 p-3 rounded-2xl text-slate-900">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold font-jakarta text-slate-900 uppercase tracking-widest">Your Profile</h2>
                            <p className="text-[10px] text-slate-500 font-bold font-jakarta uppercase">Personalize your experience</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold font-jakarta text-slate-900 uppercase tracking-widest ml-1">Display Name</label>
                            <input
                                type="text"
                                value={localUserName}
                                onChange={(e) => setLocalUserName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-slate-50 rounded-2xl border border-slate-100 py-4 px-6 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium font-jakarta transition-all"
                            />
                        </div>
                        <Button type="submit" fullWidth>
                            Save Profile
                        </Button>
                    </form>
                </section>

                {/* License Management */}
                <section className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold font-jakarta text-slate-900 uppercase tracking-widest">Account & License</h2>
                            <p className="text-[10px] text-slate-500 font-bold font-jakarta uppercase">Unlock Premium Features</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveLicense} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="license-key" className="text-[10px] font-bold font-jakarta text-slate-900 uppercase tracking-widest ml-1">License Key</label>
                            <input
                                id="license-key"
                                type="text"
                                value={localLicenseKey}
                                onChange={(e) => setLocalLicenseKey(e.target.value)}
                                placeholder="Enter your license key..."
                                className="w-full bg-slate-50 rounded-2xl border border-slate-100 py-4 px-6 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium font-jakarta transition-all"
                            />
                        </div>
                        <Button type="submit" variant="secondary" fullWidth>
                            Save License
                        </Button>
                    </form>

                    {/* Education Card */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                        <div className="flex items-start space-x-2">
                            <div className="min-w-[4px] h-[4px] rounded-full bg-slate-400 mt-1.5" />
                            <p className="text-xs text-slate-500 leading-relaxed">
                                <span className="font-bold text-slate-700">Optional:</span> This key is only required if you wish to use the advanced AI extraction features.
                            </p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <div className="min-w-[4px] h-[4px] rounded-full bg-slate-400 mt-1.5" />
                            <p className="text-xs text-slate-500 leading-relaxed">
                                <span className="font-bold text-slate-700">Get Access:</span> Contact <a href="https://www.linkedin.com/in/syafiqfaiz/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Syafiq Faiz</a> to request a key.
                            </p>
                        </div>
                    </div>
                </section>

                {/* S3 Configuration */}
                <section className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-50 p-3 rounded-2xl text-blue-500">
                                <Cloud className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold font-jakarta text-slate-900 uppercase tracking-widest">Cloud Vault</h2>
                                <p className="text-[10px] text-slate-500 font-bold font-jakarta uppercase">Amazon S3 Storage</p>
                            </div>
                        </div>
                        {s3Config.accessKeyId && (
                            <button
                                onClick={async () => {
                                    try {
                                        setStatus({ type: 'success', message: 'Syncing...' });
                                        await performFullBackup(s3Config);
                                        setStatus({ type: 'success', message: 'Backup Success!' });
                                    } catch {
                                        setStatus({ type: 'error', message: 'Sync Failed' });
                                    }
                                }}
                                aria-label="Sync to S3"
                                className="bg-blue-50 text-blue-600 p-2.5 rounded-full hover:bg-blue-100 transition-colors border border-blue-100"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSaveS3} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="s3-bucket" className="text-[10px] font-bold font-jakarta text-slate-900 uppercase tracking-widest ml-1">Bucket</label>
                                <input
                                    id="s3-bucket"
                                    type="text"
                                    value={localS3.bucket}
                                    onChange={(e) => setLocalS3({ ...localS3, bucket: e.target.value })}
                                    className="w-full bg-slate-50 rounded-2xl border border-slate-100 py-3.5 px-5 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium font-jakarta transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="s3-region" className="text-[10px] font-bold font-jakarta text-slate-900 uppercase tracking-widest ml-1">Region</label>
                                <input
                                    id="s3-region"
                                    type="text"
                                    value={localS3.region}
                                    onChange={(e) => setLocalS3({ ...localS3, region: e.target.value })}
                                    className="w-full bg-slate-50 rounded-2xl border border-slate-100 py-3.5 px-5 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium font-jakarta transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="s3-access-key" className="text-[10px] font-bold font-jakarta text-slate-900 uppercase tracking-widest ml-1">Access Key</label>
                            <input
                                id="s3-access-key"
                                type="text"
                                value={localS3.accessKeyId}
                                onChange={(e) => setLocalS3({ ...localS3, accessKeyId: e.target.value })}
                                className="w-full bg-slate-50 rounded-2xl border border-slate-100 py-3.5 px-5 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium font-jakarta transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="s3-secret-key" className="text-[10px] font-bold font-jakarta text-slate-900 uppercase tracking-widest ml-1">Secret Key</label>
                            <input
                                id="s3-secret-key"
                                type="password"
                                value={localS3.secretAccessKey}
                                onChange={(e) => setLocalS3({ ...localS3, secretAccessKey: e.target.value })}
                                className="w-full bg-slate-50 rounded-2xl border border-slate-100 py-3.5 px-5 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium font-jakarta transition-all"
                            />
                        </div>
                        <Button type="submit" variant="secondary" fullWidth>
                            Save S3 Config
                        </Button>
                    </form>
                </section>
            </div>

            <footer className="text-center space-y-1 py-4">
                <p className="text-[10px] font-bold font-jakarta text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Your data stays on your device
                </p>
            </footer>
        </div>
    );
};

export default Settings;
