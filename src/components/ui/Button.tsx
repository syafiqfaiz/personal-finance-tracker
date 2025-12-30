import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
    fullWidth?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    fullWidth = false,
    className = '',
    size = 'md',
    disabled,
    ...props
}) => {
    const baseStyles = "font-bold font-jakarta uppercase tracking-widest rounded-full transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

    const sizes = {
        sm: "py-2 px-4 text-xs",
        md: "py-4 px-6 text-sm",
        lg: "py-5 px-8 text-base"
    };

    const variants = {
        primary: "bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95",
        secondary: "bg-white text-slate-900 border border-slate-200 shadow-sm hover:border-blue-500 hover:text-blue-600 active:bg-slate-50",
        danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 active:scale-95",
        ghost: "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100"
    };

    return (
        <button
            className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </button>
    );
};
