import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ShoppingBag } from 'lucide-react';
import ExpenseCard from './ExpenseCard';
import ReceiptViewer from './ReceiptViewer';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';
import { receiptOperations } from '../db/receiptOperations';

interface ExpenseListProps {
    filterCategory?: string;
    searchQuery?: string;
    filterMonth?: number | null; // 0-indexed, null = all months
    filterYear?: number;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ filterCategory, searchQuery, filterMonth, filterYear }) => {
    const { expenses, deleteExpense } = useFinanceStore();
    const { licenseKey } = useSettingsStore();
    const navigate = useNavigate();
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    const [viewingReceipt, setViewingReceipt] = useState<{
        s3Key: string;
        merchantName?: string;
        receiptDate?: string;
    } | null>(null);

    const filteredExpenses = expenses
        .filter(e => !filterCategory || e.category === filterCategory)
        .filter(e => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return e.name.toLowerCase().includes(query) || (e.notes?.toLowerCase().includes(query));
        })
        .filter(e => {
            // Month/Year filter
            if (filterYear === undefined) return true;
            const date = new Date(e.timestamp);
            const yearMatch = date.getFullYear() === filterYear;
            if (filterMonth === null || filterMonth === undefined) return yearMatch;
            return yearMatch && date.getMonth() === filterMonth;
        });

    const handleReceiptClick = async (e: React.MouseEvent, expenseId: string, s3Key: string) => {
        e.stopPropagation();

        // Try to get receipt metadata from IndexedDB
        try {
            if (licenseKey) {
                const receipt = await receiptOperations.getByExpenseId(expenseId);
                if (receipt) {
                    setViewingReceipt({
                        s3Key: receipt.s3Key,
                        merchantName: receipt.merchantName,
                        receiptDate: receipt.receiptDate
                    });
                    return;
                }
            }
        } catch (err) {
            console.error('Failed to load receipt metadata:', err);
        }

        // Fallback: just show the image without metadata
        setViewingReceipt({ s3Key });
    };

    // Group expenses by month
    const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
        const date = new Date(expense.timestamp);
        const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[month]) groups[month] = [];
        groups[month].push(expense);
        return groups;
    }, {} as Record<string, typeof expenses>);

    if (filteredExpenses.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-500 text-sm italic font-serif">Empty logs.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-slide-up">
            {Object.entries(groupedExpenses).map(([month, items]) => (
                <div key={month} className="space-y-4">
                    <h3 className="text-xl font-serif text-slate-900 border-b border-slate-100 pb-2 ml-1">{month}</h3>
                    <div className="space-y-4">
                        {items.map((expense) => (
                            <ExpenseCard
                                key={expense.id}
                                expense={expense}
                                onClick={() => navigate(`/expenses/${expense.id}`)}
                                onDelete={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmation(expense.id);
                                }}
                                onReceiptClick={expense.receiptUrl ? (e) => handleReceiptClick(e, expense.id, expense.receiptUrl!) : undefined}
                            />
                        ))}
                    </div>
                </div>
            ))}

            <ConfirmDialog
                isOpen={!!deleteConfirmation}
                title="Delete Expense?"
                message="This action cannot be undone. Are you sure you want to remove this record?"
                onConfirm={() => {
                    if (deleteConfirmation) {
                        deleteExpense(deleteConfirmation);
                        toast.success('Expense deleted');
                        setDeleteConfirmation(null);
                    }
                }}
                onCancel={() => setDeleteConfirmation(null)}
            />

            {viewingReceipt && (
                <ReceiptViewer
                    s3Key={viewingReceipt.s3Key}
                    merchantName={viewingReceipt.merchantName}
                    receiptDate={viewingReceipt.receiptDate}
                    onClose={() => setViewingReceipt(null)}
                />
            )}
        </div>
    );
};

export default ExpenseList;
