import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RecurringExpenseService } from '../services/RecurringExpenseService';
import { type RecurringExpense } from '../db/db';
import { formatCurrency, formatDate } from '../utils/formatters';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SnoozeDialog from './SnoozeDialog';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface PaymentDialogProps {
    template: RecurringExpense;
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

function PaymentDialog({ template, onClose, onConfirm }: PaymentDialogProps) {
    const [amount, setAmount] = useState(template.amount);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(amount);
    };

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
                        Mark as Paid
                    </h1>
                </div>

                <p className="text-sm text-slate-600 mb-6 font-jakarta">{template.name}</p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6 space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                            Amount (RM)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full bg-white rounded-2xl border border-slate-200 py-4 pl-14 pr-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                                min="0"
                                step="0.01"
                                required
                                autoFocus
                                placeholder="0"
                            />
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-jakarta text-sm">
                                RM
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                            Confirm Payment
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

export default function RecurringExpenseChecklist() {
    const [reminders, setReminders] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [paymentDialog, setPaymentDialog] = useState<RecurringExpense | null>(null);
    const [snoozeDialog, setSnoozeDialog] = useState<RecurringExpense | null>(null);

    const loadReminders = async () => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const dueReminders = await RecurringExpenseService.getDueReminders(today);
            setReminders(dueReminders);
        } catch (error) {
            console.error('Failed to load reminders:', error);
            toast.error('Failed to load reminders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReminders();
    }, []);

    const handlePay = async (template: RecurringExpense, amount: number) => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            await RecurringExpenseService.processAction(template.id, {
                type: 'PAY',
                amount,
                date: today
            });
            toast.success(`Marked ${template.name} as paid`);
            setPaymentDialog(null);
            await loadReminders();
        } catch (error) {
            console.error('Failed to process payment:', error);
            toast.error('Failed to mark as paid');
        }
    };

    const handleSkip = async (template: RecurringExpense) => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            await RecurringExpenseService.processAction(template.id, {
                type: 'SKIP',
                date: today
            });
            toast.success(`Skipped ${template.name}`);
            await loadReminders();
        } catch (error) {
            console.error('Failed to skip:', error);
            toast.error('Failed to skip reminder');
        }
    };

    const handleSnooze = async (template: RecurringExpense, snoozeUntil: string) => {
        try {
            await RecurringExpenseService.processAction(template.id, {
                type: 'SNOOZE',
                date: format(new Date(), 'yyyy-MM-dd'),
                snoozeUntil
            });
            toast.success(`Snoozed ${template.name}`);
            setSnoozeDialog(null);
            await loadReminders();
        } catch (error) {
            console.error('Failed to snooze:', error);
            toast.error('Failed to snooze reminder');
        }
    };

    if (loading) {
        return null; // Don't show anything while loading
    }

    if (reminders.length === 0) {
        return null; // Hide widget when no reminders
    }

    const displayedReminders = showAll ? reminders : reminders.slice(0, 3);
    const hasMore = reminders.length > 3;

    return (
        <>
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold font-jakarta text-slate-900 uppercase tracking-widest">
                        Payment Checklist
                    </h2>
                    <span className="text-[10px] font-bold font-jakarta text-slate-500 uppercase tracking-wider">
                        {reminders.length} {reminders.length === 1 ? 'item' : 'items'} due
                    </span>
                </div>

                <div className="space-y-3">
                    {displayedReminders.map((template) => (
                        <div
                            key={template.id}
                            className="bg-slate-50 rounded-2xl p-4 border border-slate-100"
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold font-jakarta text-slate-900 text-sm truncate">{template.name}</h3>
                                    <p className="text-xs text-slate-500 font-jakarta mt-1">
                                        Due: {formatDate(template.nextDueDate)}
                                    </p>
                                </div>
                                <span className="font-bold font-jakarta text-slate-900 text-sm whitespace-nowrap">
                                    {template.amount === 0 ? 'Variable' : formatCurrency(template.amount)}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setPaymentDialog(template)}
                                    className="py-2 px-3 rounded-xl bg-green-600 text-white text-xs font-bold font-jakarta hover:bg-green-700 transition-all shadow-sm"
                                >
                                    Pay
                                </button>
                                <button
                                    onClick={() => handleSkip(template)}
                                    className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold font-jakarta hover:bg-white transition-all"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={() => setSnoozeDialog(template)}
                                    className="py-2 px-3 rounded-xl border border-blue-200 text-blue-700 text-xs font-bold font-jakarta hover:bg-blue-50 transition-all"
                                >
                                    Snooze
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {hasMore && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold font-jakarta text-blue-600 hover:bg-blue-50 transition-all"
                    >
                        {showAll ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                Show Less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                Show {reminders.length - 3} More
                            </>
                        )}
                    </button>
                )}
            </div>

            {paymentDialog && (
                <PaymentDialog
                    template={paymentDialog}
                    onClose={() => setPaymentDialog(null)}
                    onConfirm={(amount) => handlePay(paymentDialog, amount)}
                />
            )}

            {snoozeDialog && (
                <SnoozeDialog
                    templateName={snoozeDialog.name}
                    onClose={() => setSnoozeDialog(null)}
                    onConfirm={(snoozeUntil) => handleSnooze(snoozeDialog, snoozeUntil)}
                />
            )}
        </>
    );
}
