import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Yes, Delete',
    cancelText = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 duration-200 border border-white/20 ring-1 ring-slate-900/5">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Icon */}
                    <div className={`p-4 rounded-full ${variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                        {variant === 'danger' ? <Trash2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-serif text-slate-900">{title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3 w-full pt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3.5 px-4 bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-widest rounded-full hover:bg-slate-100 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3.5 px-4 font-black text-xs uppercase tracking-widest rounded-full text-white shadow-lg transition-transform active:scale-95 ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
