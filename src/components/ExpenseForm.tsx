import React, { useState } from 'react';
import { useFinanceStore, SYSTEM_CATEGORY, type Expense } from '../store/useFinanceStore';
import { PlusCircle, Upload, FileText, Trash2 } from 'lucide-react';
import { compressImage, blobToDataURL } from '../services/imageService';
import { toast } from 'sonner';

interface ExpenseFormProps {
    initialData?: Partial<Expense>;
    onSuccess?: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, onSuccess }) => {
    const { categories, addExpense, updateExpense } = useFinanceStore();

    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [category, setCategory] = useState(initialData?.category || categories[0] || SYSTEM_CATEGORY);
    const [date, setDate] = useState(initialData?.timestamp ? new Date(initialData.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'Cash');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [receiptBlob, setReceiptBlob] = useState<Blob | null>(initialData?.localReceipt || null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

    // Load preview if initial blob exists
    React.useEffect(() => {
        if (initialData?.localReceipt) {
            blobToDataURL(initialData.localReceipt).then(setReceiptPreview);
        }
    }, [initialData?.localReceipt]);

    const isEditing = !!initialData?.id;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (file.type === 'application/pdf') {
                setReceiptBlob(file);
                // Creating a fake data URL or just a placeholder for PDF logic
                // For PDF, blobToDataURL still works to create a base64 string, 
                // but we might not want to display it as an image. 
                // We'll still convert it so we can "preview" logic checks pass.
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;

        const expenseData = {
            name,
            amount: parseFloat(amount),
            category,
            tags: initialData?.tags || [],
            timestamp: new Date(date),
            notes,
            paymentMethod,
            isTaxDeductible: initialData?.isTaxDeductible || false,
            localReceipt: receiptBlob || undefined,
        };

        if (isEditing && initialData.id) {
            await updateExpense(initialData.id, expenseData);
            toast.success('Transaction updated successfully');
        } else {
            await addExpense(expenseData);
            toast.success('Expense added successfully');
        }

        if (onSuccess) {
            onSuccess();
        } else {
            setName('');
            setAmount('');
            setNotes('');
            setPaymentMethod('Cash');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10 animate-slide-up pb-10">
            {/* Header Section */}
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto border border-slate-100 mb-4">
                    <PlusCircle className="w-8 h-8 text-blue-500 opacity-20" />
                </div>
                <h2 className="text-3xl font-serif text-slate-900">{isEditing ? 'Edit Record' : 'Add Expense'}</h2>
                <p className="text-sm text-slate-500 font-medium px-4">
                    Log your spending details with category, amount, and more.
                </p>
            </div>

            <div className="space-y-8">
                {/* Merchant Name */}
                <div className="space-y-4">
                    <label className="block text-center text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">Description</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="What did you buy?"
                        className="w-full bg-white rounded-[20px] border border-slate-100 shadow-sm py-5 px-6 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-center font-bold font-jakarta text-slate-900 transition-all placeholder:text-slate-400"
                    />
                </div>

                {/* Amount Section (The big one) */}
                <div className="space-y-4">
                    <label className="block text-center text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">Cost</label>
                    <div className="relative max-w-[240px] mx-auto">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold font-jakarta text-slate-400">RM</span>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-full bg-white rounded-[20px] border border-slate-100 shadow-sm py-5 pl-14 pr-6 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-2xl font-bold font-jakarta text-slate-900 text-center transition-all"
                        />
                    </div>
                </div>

                {/* Grid controls */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Category Selection */}
                    <div className="space-y-4">
                        <label className="block text-center text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-white rounded-[20px] border border-slate-100 shadow-sm py-5 px-6 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-bold font-jakarta text-slate-900 appearance-none text-center transition-all"
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                        <label className="block text-center text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full bg-white rounded-[20px] border border-slate-100 shadow-sm py-5 px-6 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-bold font-jakarta text-slate-900 appearance-none text-center transition-all"
                        >
                            {['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer'].map((method) => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-4">
                        <label className="block text-center text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-white rounded-[20px] border border-slate-100 shadow-sm py-5 px-6 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-bold font-jakarta text-slate-900 text-center transition-all"
                        />
                    </div>
                </div>

                {/* Receipt Photo Section */}
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

                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <label className="p-4 bg-white rounded-full text-slate-900 cursor-pointer shadow-lg">
                                    <Upload className="w-6 h-6" />
                                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                                </label>
                                <button type="button" onClick={removeReceipt} className="p-4 bg-white rounded-full text-red-500 shadow-lg">
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center py-10 bg-white border border-slate-100 rounded-[28px] shadow-sm hover:border-blue-500 transition-all cursor-pointer group">
                            <div className="bg-slate-50 p-4 rounded-full mb-3 group-hover:bg-blue-50 transition-colors">
                                <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                            </div>
                            <span className="text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">Upload Receipt</span>
                            <span className="text-[10px] text-slate-400 font-medium mt-1">PDF or Images</span>
                            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                        </label>
                    )}
                </div>

                {/* Notes Input */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="block text-center text-xs font-bold font-jakarta text-slate-900 uppercase tracking-widest">Notes</label>
                    <textarea
                        id="notes-area"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your notes here..."
                        className="w-full bg-white rounded-[20px] border border-slate-100 shadow-sm py-5 px-6 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium font-jakarta text-slate-600 transition-all"
                        rows={3}
                    />
                </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6">
                <button
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold font-jakarta uppercase tracking-widest py-5 rounded-full shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
                >
                    {isEditing ? 'Update Record' : 'Save Expense'}
                </button>
            </div>
        </form>
    );
};

export default ExpenseForm;
