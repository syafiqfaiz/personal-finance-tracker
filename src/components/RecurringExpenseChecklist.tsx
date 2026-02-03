import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RecurringExpenseService } from '../services/RecurringExpenseService';
import { type RecurringExpense } from '../db/db';
import { formatCurrency, formatDate } from '../utils/formatters';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SnoozeDialog from './SnoozeDialog';
import { ArrowLeft, ChevronDown, ChevronUp, Upload, FileText, Trash2, Camera, Image } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { compressImage, blobToDataURL } from '../services/imageService';
import { useIsMobile } from '../hooks/useIsMobile';
import { api } from '../services/api';

interface PaymentDialogProps {
    template: RecurringExpense;
    onClose: () => void;
    onConfirm: (amount: number, date: string, receiptBlob: Blob | null) => void;
}

function PaymentDialog({ template, onClose, onConfirm }: PaymentDialogProps) {
    const [amount, setAmount] = useState(template.amount);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const isMobile = useIsMobile();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (file.type === 'application/pdf') {
                setReceiptBlob(file);
                const preview = await blobToDataURL(file);
                setReceiptPreview(preview);
            } else {
                const compressed = await compressImage(file);
                setReceiptBlob(compressed);
                const preview = await blobToDataURL(compressed);
                setReceiptPreview(preview);
            }
        } catch (err) {
            console.error('Failed to process file:', err);
            toast.error('Failed to process file. Please try another one.');
        }
    };

    const removeReceipt = () => {
        setReceiptBlob(null);
        setReceiptPreview(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(amount, date, receiptBlob);
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

                    <div className="mb-6 space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                            Payment Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-white rounded-2xl border border-slate-200 py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                            required
                        />
                    </div>

                    {/* Receipt Upload */}
                    <div className="space-y-4">
                        <label className="block text-center text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">Receipt Photo</label>
                        {receiptPreview ? (
                            <div className="relative group rounded-[28px] overflow-hidden border border-slate-100 aspect-video bg-white shadow-sm flex items-center justify-center">
                                {receiptBlob?.type === 'application/pdf' ? (
                                    <div className="text-center space-y-2">
                                        <FileText className="w-12 h-12 text-red-500 mx-auto" />
                                        <p className="text-xs font-bold text-slate-700">PDF Document</p>
                                    </div>
                                ) : (
                                    <img src={receiptPreview} alt="Receipt" className="w-full h-full object-contain" />
                                )}

                                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center gap-4">
                                    <label className="p-4 bg-white rounded-full text-slate-900 cursor-pointer shadow-lg hover:bg-slate-50 transition-colors">
                                        <Upload className="w-6 h-6" />
                                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                                    </label>
                                    <button type="button" onClick={removeReceipt} className="p-4 bg-white rounded-full text-red-500 shadow-lg hover:bg-red-50 transition-colors">
                                        <Trash2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            isMobile ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Camera Button */}
                                    <label className="flex flex-col items-center justify-center py-8 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:border-blue-500 transition-all cursor-pointer group active:scale-95">
                                        <div className="bg-slate-50 p-4 rounded-full mb-3 group-hover:bg-blue-50 transition-colors text-blue-500">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">Camera</span>
                                        <span className="text-[10px] text-slate-400 font-medium mt-1">Take Photo</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>

                                    {/* Gallery Button */}
                                    <label className="flex flex-col items-center justify-center py-8 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:border-blue-500 transition-all cursor-pointer group active:scale-95">
                                        <div className="bg-slate-50 p-4 rounded-full mb-3 group-hover:bg-blue-50 transition-colors text-slate-400 group-hover:text-blue-500">
                                            <Image className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">Gallery</span>
                                        <span className="text-[10px] text-slate-400 font-medium mt-1">Files or PDF</span>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            ) : (
                                /* Desktop Upload Button */
                                <label className="flex flex-col items-center justify-center py-12 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:border-blue-500 transition-all cursor-pointer group active:scale-95 border-dashed border-2">
                                    <div className="bg-slate-50 p-4 rounded-full mb-3 group-hover:bg-blue-50 transition-colors text-slate-400 group-hover:text-blue-500">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <span className="text-sm font-bold font-jakarta text-slate-900 uppercase tracking-widest">Upload Receipt</span>
                                    <span className="text-xs text-slate-400 font-medium mt-1">Drag & drop or click to browse</span>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )
                        )}
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
    const { loadAppData } = useFinanceStore();

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

    const handlePay = async (template: RecurringExpense, amount: number, date: string, receiptBlob: Blob | null) => {
        try {
            let receiptUrl: string | undefined;

            // Upload receipt if provided
            if (receiptBlob) {
                try {
                    const filename = receiptBlob.type === 'application/pdf' ? 'receipt.pdf' : 'receipt.jpg';
                    const uploadUrlResponse = await api.getUploadUrl(filename, receiptBlob.type);

                    // Upload to R2 using presigned URL
                    await fetch(uploadUrlResponse.url, {
                        method: 'PUT',
                        headers: { 'Content-Type': receiptBlob.type },
                        body: receiptBlob
                    });

                    receiptUrl = uploadUrlResponse.key;
                } catch (error) {
                    console.error('Upload failed', error);
                    toast.error('Failed to upload receipt');
                    return;
                }
            }

            await RecurringExpenseService.processAction(template.id, {
                type: 'PAY',
                amount,
                date,
                receiptUrl
            });
            toast.success(`Marked ${template.name} as paid`);
            setPaymentDialog(null);
            await loadReminders();
            await loadAppData(); // Reload expenses to show the new expense immediately
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
                    onConfirm={(amount, date, receiptBlob) => handlePay(paymentDialog, amount, date, receiptBlob)}
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
