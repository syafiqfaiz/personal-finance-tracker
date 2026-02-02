import { useState } from 'react';
import { createPortal } from 'react-dom';
import { format, addDays, addWeeks } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

interface SnoozeDialogProps {
    templateName: string;
    onClose: () => void;
    onConfirm: (snoozeUntil: string) => void;
}

export default function SnoozeDialog({ templateName, onClose, onConfirm }: SnoozeDialogProps) {
    const [selectedOption, setSelectedOption] = useState<'1d' | '3d' | '1w' | 'custom'>('1d');
    const [customDate, setCustomDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let snoozeUntil: string;
        const today = new Date();

        switch (selectedOption) {
            case '1d':
                snoozeUntil = format(addDays(today, 1), 'yyyy-MM-dd');
                break;
            case '3d':
                snoozeUntil = format(addDays(today, 3), 'yyyy-MM-dd');
                break;
            case '1w':
                snoozeUntil = format(addWeeks(today, 1), 'yyyy-MM-dd');
                break;
            case 'custom':
                if (!customDate) {
                    alert('Please select a date');
                    return;
                }
                snoozeUntil = customDate;
                break;
        }

        onConfirm(snoozeUntil);
    };

    const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    return createPortal(
        <div className="fixed inset-0 bg-white z-50 animate-slide-up overflow-y-auto">
            <div className="max-w-md mx-auto px-6 py-6 min-h-full">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-serif text-slate-900">
                        Snooze Reminder
                    </h1>
                </div>

                <p className="text-sm text-slate-600 mb-6 font-jakarta">{templateName}</p>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-3 mb-6">
                        <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                            <input
                                type="radio"
                                name="snooze"
                                value="1d"
                                checked={selectedOption === '1d'}
                                onChange={() => setSelectedOption('1d')}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="flex-1 text-sm font-medium font-jakarta text-slate-900">1 Day</span>
                            <span className="text-xs text-slate-500 font-jakarta">
                                {format(addDays(new Date(), 1), 'MMM d')}
                            </span>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                            <input
                                type="radio"
                                name="snooze"
                                value="3d"
                                checked={selectedOption === '3d'}
                                onChange={() => setSelectedOption('3d')}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="flex-1 text-sm font-medium font-jakarta text-slate-900">3 Days</span>
                            <span className="text-xs text-slate-500 font-jakarta">
                                {format(addDays(new Date(), 3), 'MMM d')}
                            </span>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                            <input
                                type="radio"
                                name="snooze"
                                value="1w"
                                checked={selectedOption === '1w'}
                                onChange={() => setSelectedOption('1w')}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="flex-1 text-sm font-medium font-jakarta text-slate-900">1 Week</span>
                            <span className="text-xs text-slate-500 font-jakarta">
                                {format(addWeeks(new Date(), 1), 'MMM d')}
                            </span>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                            <input
                                type="radio"
                                name="snooze"
                                value="custom"
                                checked={selectedOption === 'custom'}
                                onChange={() => setSelectedOption('custom')}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="flex-1 text-sm font-medium font-jakarta text-slate-900">Custom Date</span>
                        </label>

                        {selectedOption === 'custom' && (
                            <div className="ml-7">
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    min={minDate}
                                    className="w-full bg-slate-50 rounded-2xl border border-slate-200 py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium font-jakarta transition-all"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 space-y-3">
                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                            Snooze
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full bg-white text-slate-600 font-bold font-jakarta py-4 rounded-full border border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
