import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import IconPicker from '../IconPicker';
import ConfirmDialog from '../ConfirmDialog';

export interface CategoryFormData {
    name: string;
    limit: string;
    icon: string;
    originalName?: string;
}

interface EditCategoryDialogProps {
    initialData: CategoryFormData;
    onSave: (data: CategoryFormData) => void;
    onCancel: () => void;
    onDelete: (categoryName: string) => void;
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
    initialData,
    onSave,
    onCancel,
    onDelete
}) => {
    const [formData, setFormData] = useState<CategoryFormData>(initialData);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Reset form when initialData changes
    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const handleChange = (field: keyof CategoryFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return createPortal(
        <div className="fixed inset-0 bg-slate-50 z-50 animate-slide-up">
            <div className="max-w-md mx-auto px-6 py-6">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <button
                        onClick={onCancel}
                        className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-serif text-slate-900">
                        {formData.originalName ? 'Edit Category' : 'New Category'}
                    </h1>
                </div>

                {/* Edit Form */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                            Category Name & Icon
                        </label>
                        <div className="flex gap-3">
                            <IconPicker
                                selectedIcon={formData.icon}
                                onSelect={(icon) => handleChange('icon', icon)}
                            />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="flex-1 bg-white rounded-2xl border border-slate-200 py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                                placeholder="Category name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">
                            Monthly Budget (RM)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.limit}
                                onChange={(e) => handleChange('limit', e.target.value)}
                                className="w-full bg-white rounded-2xl border border-slate-200 py-4 pl-14 pr-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-bold font-jakarta text-slate-900 transition-all"
                                placeholder="0"
                            />
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-jakarta text-sm">
                                RM
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 ml-1">Leave empty for no budget limit</p>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button
                            onClick={() => onSave(formData)}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-full shadow-lg hover:bg-slate-800 transition-all"
                        >
                            {formData.originalName ? 'Save Changes' : 'Create Category'}
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full bg-white text-slate-600 font-bold font-jakarta py-4 rounded-full border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>

                        {formData.originalName && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full text-red-500 font-medium py-4 rounded-full hover:bg-red-50 transition-all flex items-center justify-center space-x-2"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="font-bold font-jakarta">Delete Category</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Category?"
                message={`Are you sure you want to delete "${formData.originalName}"? usage history will be moved to "Uncategorized".`}
                onConfirm={() => {
                    if (formData.originalName) onDelete(formData.originalName);
                    setShowDeleteConfirm(false);
                }}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>,
        document.body
    );
};

export default EditCategoryDialog;
