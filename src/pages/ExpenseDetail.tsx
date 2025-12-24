import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ChevronLeft, Edit3, Trash2, Calendar, CreditCard, FileText, Maximize2, X } from 'lucide-react';
import { blobToDataURL } from '../services/imageService';

const ExpenseDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { expenses, deleteExpense } = useFinanceStore();

    const expense = expenses.find((e) => e.id === id);
    const [receiptUrl, setReceiptUrl] = React.useState<string | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

    React.useEffect(() => {
        if (expense?.localReceipt) {
            blobToDataURL(expense.localReceipt).then(setReceiptUrl);
        } else {
            setReceiptUrl(null);
        }
    }, [expense?.localReceipt]);

    if (!expense) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Expense not found.</p>
                <button onClick={() => navigate('/history')} className="text-blue-600 font-bold mt-4">Go Back</button>
            </div>
        );
    }

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            await deleteExpense(expense.id);
            navigate('/history');
        }
    };

    return (
        <div className="space-y-8 animate-slide-up pb-10">
            <header className="flex items-center justify-between pt-2">
                <button onClick={() => navigate('/history')} className="p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors bg-white rounded-full shadow-sm border border-slate-100">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex space-x-3">
                    <Link
                        to={`/history/${expense.id}/edit`}
                        className="p-3 bg-white text-slate-900 rounded-full border border-slate-100 shadow-sm transition-all active:scale-95"
                    >
                        <Edit3 className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="p-3 bg-white text-red-500 rounded-full border border-slate-100 shadow-sm transition-all active:scale-95"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="text-center space-y-2">
                <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-100">
                    {expense.category}
                </div>
                <h2 className="text-4xl font-serif text-slate-900">{expense.name}</h2>
                <div className="flex items-center justify-center space-x-1 mt-4">
                    <span className="text-slate-400 font-bold text-lg">RM</span>
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{expense.amount.toFixed(0)}</span>
                    <span className="text-slate-400 font-bold text-lg pt-4">.{expense.amount.toFixed(2).split('.')[1]}</span>
                </div>
                <p className="text-sm text-slate-400 font-medium mt-2">{new Date(expense.timestamp).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-6">
                    <div className="flex justify-between items-center group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-slate-50 p-3.5 rounded-2xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Payment Method</p>
                                <p className="font-bold text-slate-900">{expense.paymentMethod}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-slate-50 p-3.5 rounded-2xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Recorded At</p>
                                <p className="font-bold text-slate-900">{new Date(expense.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </div>

                    {expense.notes && (
                        <div className="group">
                            <div className="flex items-start space-x-4">
                                <div className="bg-slate-50 p-3.5 rounded-2xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes</p>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4 py-1">
                                        "{expense.notes}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {receiptUrl && (
                    <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receipt Attachment</p>
                            <button
                                onClick={() => setIsLightboxOpen(true)}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
                            >
                                View full size
                            </button>
                        </div>
                        <div
                            className="relative group rounded-[20px] overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer"
                            onClick={() => setIsLightboxOpen(true)}
                        >
                            <img src={receiptUrl} alt="Receipt" className="w-full h-auto max-h-80 object-contain mx-auto" />
                            <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white p-3 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                                    <Maximize2 className="w-5 h-5 text-slate-900" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox / Fullscreen */}
            {isLightboxOpen && receiptUrl && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-6 animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        className="absolute top-8 right-8 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/10"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={receiptUrl}
                        alt="Receipt Fullscreen"
                        className="max-w-full max-h-full object-contain rounded-[24px]"
                    />
                </div>
            )}
        </div>
    );
};

export default ExpenseDetail;
