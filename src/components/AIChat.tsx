import React, { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { extractExpenseWithAI, type ExtractedExpense } from '../services/aiService';
import { Send, Sparkles, AlertCircle, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { getRandomGreeting } from '../constants/greetings';
import { validateReceiptFile } from '../utils/fileValidation';
import { api } from '../services/api';
import { receiptOperations } from '../db/receiptOperations';
import { ExpenseService } from '../services/ExpenseService';

interface AIChatProps {
    onSuccess?: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

const AIChat: React.FC<AIChatProps> = ({ onSuccess }) => {
    const { categories } = useFinanceStore();
    const { licenseKey } = useSettingsStore();

    const [messages, setMessages] = useState<Message[]>(() => [
        { id: Date.now().toString(), role: 'assistant', text: getRandomGreeting() }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentContext, setCurrentContext] = useState<ExtractedExpense | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Receipt upload state
    const [hasUploadedReceipt, setHasUploadedReceipt] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [receiptMetadata, setReceiptMetadata] = useState<{
        storageKey: string;
        merchantName: string;
        receiptDate: string;
    } | null>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isProcessing]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !licenseKey) return;

        const userText = input.trim();
        setInput('');
        setError(null);

        // Add User Message
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
        setMessages(prev => [...prev, userMsg]);

        setIsProcessing(true);
        try {
            const result = await extractExpenseWithAI(userText, categories, currentContext);

            setCurrentContext(result);

            // Add AI Message
            if (result.responseText) {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    text: result.responseText
                };
                setMessages(prev => [...prev, aiMsg]);
            }

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('AI failed to process.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = async () => {
        if (!currentContext) return;

        // Use ExpenseService directly to get the expense ID
        const newExpense = await ExpenseService.addExpense({
            name: currentContext.name,
            amount: currentContext.amount,
            category: currentContext.category,
            tags: [],
            timestamp: new Date(currentContext.date),
            notes: currentContext.notes,
            paymentMethod: currentContext.paymentMethod || 'Cash',
            isTaxDeductible: false,
            receiptUrl: receiptMetadata?.storageKey, // Store storage key
        });

        // Manually update the store state
        const { expenses } = useFinanceStore.getState();
        useFinanceStore.setState({
            expenses: [newExpense, ...expenses].sort((a, b) => {
                const dateDiff = (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0);
                if (dateDiff !== 0) return dateDiff;
                const createdA = a.createdAt?.getTime() || 0;
                const createdB = b.createdAt?.getTime() || 0;
                return createdB - createdA;
            })
        });

        // Link receipt to expense if exists
        if (receiptMetadata) {
            const receipts = await receiptOperations.getAllByUser(licenseKey!);
            const receipt = receipts.find(r => r.storageKey === receiptMetadata.storageKey && !r.expenseId);
            if (receipt) {
                await receiptOperations.linkToExpense(receipt.id, newExpense.id);
            }
        }

        toast.success('Expense added via AI');
        // Reset state but keep chat history
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: 'Expense added! What else?' }]);
        setCurrentContext(undefined);
        setReceiptMetadata(null);

        if (onSuccess) {
            onSuccess();
        }
    };

    const handleDiscard = () => {
        setCurrentContext(undefined);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: 'Cancelled. What else would you like to add?' }]);
    };

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        const validationError = validateReceiptFile(file);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // 1. Request presigned URL
            const uploadUrlResponse = await api.getUploadUrl(file.name, file.type);

            // 2. Upload to R2 using presigned URL
            const uploadResponse = await fetch(uploadUrlResponse.url, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload receipt to storage');
            }

            // 3. Extract data from receipt
            const extractionResult = await api.extractFromReceipt(
                uploadUrlResponse.key,
                categories,
                new Date().toISOString().split('T')[0],
                ['Cash', 'Credit Card', 'QR Pay', 'Transfer']
            );

            // 4. Save receipt metadata to IndexedDB
            await receiptOperations.create({
                userId: licenseKey!,
                storageKey: uploadUrlResponse.key,
                merchantName: extractionResult.receipt_metadata.merchant_name,
                receiptDate: extractionResult.receipt_metadata.receipt_date
            });

            // 5. Update state
            setReceiptMetadata({
                storageKey: extractionResult.receipt_metadata.storage_key,
                merchantName: extractionResult.receipt_metadata.merchant_name,
                receiptDate: extractionResult.receipt_metadata.receipt_date
            });
            setCurrentContext({
                name: extractionResult.captured_data.name || '',
                amount: extractionResult.captured_data.amount || 0,
                category: extractionResult.captured_data.category || '',
                paymentMethod: extractionResult.captured_data.payment_method || 'Cash',
                date: extractionResult.captured_data.date || new Date().toISOString().split('T')[0],
                notes: extractionResult.captured_data.notes || '',
                confidence: extractionResult.captured_data.confidence || 'low',
                missingFields: extractionResult.captured_data.missing_fields || [],
                responseText: extractionResult.response_text
            });
            setHasUploadedReceipt(true);

            // 6. Add AI response to chat
            if (extractionResult.response_text) {
                const aiMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    text: extractionResult.response_text
                };
                setMessages(prev => [...prev, aiMsg]);
            }

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                toast.error(err.message);
            } else {
                setError('Failed to process receipt');
                toast.error('Failed to process receipt');
            }
        } finally {
            setIsUploading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    if (!licenseKey) {
        return (
            <div className="bg-purple-50 p-8 rounded-[28px] border border-purple-100 text-center space-y-4 animate-slide-up">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-purple-100">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-purple-900 uppercase tracking-widest">License Required</h3>
                    <p className="text-xs text-purple-700 font-medium mt-2 leading-relaxed px-4">Provide a License Key in your profile to enable AI expense extraction.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex flex-col">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                            ? 'bg-slate-900 text-white rounded-br-none'
                            : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                            }`}>
                            {msg.role === 'assistant' && (
                                <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-50">
                                    <Sparkles className="w-3 h-3 text-purple-500" />
                                    <span className="text-[10px] font-black text-purple-900 uppercase tracking-widest">AI Assistant</span>
                                </div>
                            )}
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-slate-50 p-4 rounded-2xl rounded-bl-none flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={scrollRef} />
            </div>

            {/* ERROR */}
            {error && (
                <div className="flex items-center space-x-3 text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-bold tracking-tight">{error}</span>
                </div>
            )}

            {/* CONFIRMATION CARD (Only when confidence is high) */}
            {currentContext && currentContext.confidence === 'high' && (
                <div className="bg-white rounded-[20px] shadow-xl shadow-purple-900/5 border border-purple-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-500 flex-shrink-0">
                    <div className="bg-slate-900 px-4 py-3 flex items-center space-x-2">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Entry Preview</span>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-baseline">
                            <div className="space-y-0.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Merchant</label>
                                <p className="text-xl font-serif text-slate-900">{currentContext.name}</p>
                            </div>
                            <div className="text-right space-y-0.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</label>
                                <p className="text-xl font-black text-slate-900 tracking-tight">RM {currentContext.amount.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                                <span className="text-xs font-semibold text-slate-900">{currentContext.category}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                                <span className="text-xs font-semibold text-slate-900">
                                    {(() => {
                                        const d = new Date(currentContext.date);
                                        return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
                                    })()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment</span>
                                <span className="text-xs font-semibold text-slate-900">{currentContext.paymentMethod}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button onClick={handleDiscard} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-[10px] text-slate-600 hover:bg-slate-50 transition-colors">
                                Discard
                            </button>
                            <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-slate-900 font-bold text-[10px] text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98]">
                                Confirm Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UPLOAD BUTTON - Only show before first message */}
            {messages.length === 1 && !hasUploadedReceipt && (
                <div className="mb-4">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 border-2 border-dashed border-purple-200 rounded-xl cursor-pointer hover:bg-purple-100 transition-colors">
                        <Camera className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-bold text-purple-900 uppercase tracking-widest">
                            {isUploading ? 'Uploading...' : 'Upload Receipt'}
                        </span>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleReceiptUpload}
                            className="hidden"
                            disabled={isUploading}
                        />
                    </label>
                </div>
            )}

            {/* INPUT AREA */}
            <form onSubmit={handleSend} className="relative group flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={currentContext ? "Reply to refine..." : "Type expenses naturally..."}
                    className="w-full bg-white rounded-full border border-slate-200 shadow-sm py-4 pl-6 pr-14 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 text-sm font-medium transition-all placeholder:text-slate-400"
                    disabled={isProcessing}
                />
                <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white w-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition-all disabled:bg-slate-100 disabled:text-slate-300 active:scale-95"
                    disabled={!input.trim() || isProcessing}
                >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </form>
        </div>
    );
};

export default AIChat;
