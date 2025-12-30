import React, { forwardRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    centerText?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
    label,
    error,
    centerText = false,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="space-y-4">
            {label && (
                <label className="block text-center text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">
                    {label}
                </label>
            )}
            <div className="relative">
                <textarea
                    ref={ref}
                    className={`
                        w-full bg-white rounded-[20px] border border-slate-100 shadow-sm py-5 px-6 
                        outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 
                        font-medium font-jakarta text-slate-600 transition-all placeholder:text-slate-400
                        ${centerText ? 'text-center' : 'text-left'}
                        ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 text-center font-medium animate-slide-up">{error}</p>
            )}
        </div>
    );
});

TextArea.displayName = 'TextArea';
