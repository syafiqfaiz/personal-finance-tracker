import React, { useState } from 'react';
import { AVAILABLE_ICONS, getIconComponent } from '../utils/iconUtils';
import { ChevronDown } from 'lucide-react';

interface IconPickerProps {
    selectedIcon: string;
    onSelect: (iconName: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-white border border-slate-200 rounded-2xl py-4 px-4 hover:bg-slate-50 transition-all"
            >
                <div className="w-6 h-6 text-slate-600 flex items-center justify-center">
                    {getIconComponent(selectedIcon, { className: 'w-5 h-5' })}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-14 left-0 z-20 w-64 bg-white border border-slate-100 rounded-3xl shadow-xl p-4 grid grid-cols-5 gap-2 animate-slide-up">
                        {AVAILABLE_ICONS.map((icon) => (
                            <button
                                key={icon.name}
                                type="button"
                                onClick={() => {
                                    onSelect(icon.name);
                                    setIsOpen(false);
                                }}
                                className={`p-2 rounded-xl flex items-center justify-center transition-all ${selectedIcon === icon.name
                                    ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-100'
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                    }`}
                                title={icon.label}
                            >
                                <icon.component className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default IconPicker;
