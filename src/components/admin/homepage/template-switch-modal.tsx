/**
 * TemplateSwitchModal Component (Brief Section 7)
 * Allows admins to switch templates with field mapping preview and preserved bucket indicator.
 */

'use client';

import React, { useState } from 'react';
import { TEMPLATE_REGISTRY, analyzeTemplateSwitch, TemplateDefinition } from '@/server/services/homepage-template-service';
import { switchHomepageSectionTemplateAction } from '@/server/actions/homepage-actions';
import { X, ArrowRightLeft, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { TemplatePicker } from './template-picker';

interface TemplateSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  currentTemplateId: string;
  currentContent: Record<string, any>;
  onSuccess: () => void;
}

export function TemplateSwitchModal({
  isOpen,
  onClose,
  sectionId,
  currentTemplateId,
  currentContent,
  onSuccess,
}: TemplateSwitchModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const analysis = selectedTemplate
    ? analyzeTemplateSwitch(currentTemplateId, selectedTemplate.id, currentContent)
    : null;

  const handleConfirmSwitch = async () => {
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    setError(null);

    const res = await switchHomepageSectionTemplateAction(sectionId, selectedTemplate.id);
    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'خطا در تغییر قالب سکشن');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-none shadow-2xl flex flex-col overflow-hidden text-right border-2 border-stone-300 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-[#D97706]" />
            <span className="font-black text-lg text-[#2B2017]">تغییر قالب سکشن</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-none transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <h4 className="text-sm font-black text-stone-700 mb-3">
              قالب مقصد مورد نظر خود را انتخاب کنید:
            </h4>
            <TemplatePicker
              selectedTemplateId={selectedTemplate?.id || currentTemplateId}
              onSelectTemplate={(tpl) => setSelectedTemplate(tpl)}
            />
          </div>

          {/* Field Mapping & Preserved Bucket Warning */}
          {selectedTemplate && selectedTemplate.id !== currentTemplateId && analysis && (
            <div className="p-5 bg-amber-50 border-2 border-amber-400 rounded-none space-y-3">
              <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                <span>بررسی تطبیق داده‌ها (حفظ امن اطلاعات)</span>
              </div>

              <div className="text-xs text-stone-700 space-y-2 leading-relaxed">
                <div>
                  <span className="font-bold text-emerald-800 ml-1">✓ فیلدهای منطبق (منتقل می‌شوند):</span>
                  <span>{analysis.mappedFields.length > 0 ? analysis.mappedFields.join('، ') : 'هیچ‌کدام'}</span>
                </div>

                {analysis.hiddenFields.length > 0 && (
                  <div className="pt-1">
                    <span className="font-bold text-amber-900 ml-1">
                      📦 فیلدهای پنهان‌شده (در مخزن محفوظ نگهداری می‌شوند و با بازگشت به این قالب برمی‌گردند):
                    </span>
                    <span>{analysis.hiddenFields.join('، ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-600 text-red-950 text-xs font-bold rounded-none flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-3 bg-stone-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-none text-xs font-bold text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleConfirmSwitch}
            disabled={!selectedTemplate || selectedTemplate.id === currentTemplateId || isSubmitting}
            className="px-6 py-2.5 rounded-none bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-xs sm:text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2 whitespace-nowrap min-w-max"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال انتقال قالب...</span>
              </>
            ) : (
              <span>تأیید و تغییر قالب</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
