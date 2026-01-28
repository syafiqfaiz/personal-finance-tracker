import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface ReceiptViewerProps {
    storageKey: string;
    merchantName?: string;
    receiptDate?: string;
    onClose: () => void;
}

const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ storageKey, merchantName, receiptDate, onClose }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const loadImage = async () => {
            try {
                setIsLoading(true);
                const url = await api.getViewUrl(storageKey);
                setImageUrl(url);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load receipt');
            } finally {
                setIsLoading(false);
            }
        };

        loadImage();
    }, [storageKey]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
                <div className="flex-1">
                    {merchantName && (
                        <div className="text-white">
                            <p className="font-bold text-sm">{merchantName}</p>
                            {receiptDate && (
                                <p className="text-xs text-white/60">
                                    {new Date(receiptDate).toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2 mr-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleZoomOut();
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        disabled={zoom <= 0.5}
                    >
                        <ZoomOut className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-white text-sm font-bold min-w-[3rem] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleZoomIn();
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        disabled={zoom >= 3}
                    >
                        <ZoomIn className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Image Container */}
            <div
                className="flex-1 overflow-auto flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
            >
                {isLoading && (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <p className="text-white/60 text-sm">Loading receipt...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}

                {imageUrl && !isLoading && !error && (
                    <img
                        src={imageUrl}
                        alt="Receipt"
                        className="max-w-full max-h-full object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoom})` }}
                    />
                )}
            </div>
        </div>
    );
};

export default ReceiptViewer;
