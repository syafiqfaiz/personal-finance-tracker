import React, { useState } from 'react';
import { useFinanceStore, SYSTEM_CATEGORY, type Expense } from '../store/useFinanceStore';
import { PlusCircle, Upload, FileText, Trash2 } from 'lucide-react';
import { compressImage, blobToDataURL } from '../services/imageService';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TextArea } from './ui/TextArea';

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
                <Input
                    label="Description"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What did you buy?"
                    centerText
                    required
                />

                {/* Amount Section (The big one) */}
                <Input
                    label="Cost"
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    centerText
                    className="text-2xl"
                    leftIcon={<span className="font-bold font-jakarta">RM</span>}
                />

                {/* Grid controls */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Category Selection */}
                    <Select
                        label="Category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        centerText
                    >
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </Select>

                    {/* Payment Method Selection */}
                    <Select
                        label="Payment Method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        centerText
                    >
                        {['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer'].map((method) => (
                            <option key={method} value={method}>{method}</option>
                        ))}
                    </Select>

                    {/* Date Selection */}
                    <Input
                        label="Date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        centerText
                    />
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

                            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center gap-4">
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
                <div className="pt-4 border-t border-slate-100">
                    <TextArea
                        label="Notes"
                        id="notes-area"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your notes here..."
                        rows={3}
                    />
                </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6">
                <Button type="submit" fullWidth>
                    {isEditing ? 'Update Record' : 'Save Expense'}
                </Button>
            </div>
        </form>
    );
};

export default ExpenseForm;
