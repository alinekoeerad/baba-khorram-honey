/**
 * TemplatePicker Component (Brief Section 7)
 * Visual preview cards for section templates with thumbnail, description, and selection state.
 */

'use client';

import React from 'react';
import { TEMPLATE_REGISTRY, TemplateDefinition } from '@/server/services/homepage-template-service';
import { SectionType } from '@prisma/client';
import { Check } from 'lucide-react';

interface TemplatePickerProps {
  selectedTemplateId: string;
  onSelectTemplate: (template: TemplateDefinition) => void;
  filterSectionType?: SectionType | null;
}

export function TemplatePicker({
  selectedTemplateId,
  onSelectTemplate,
  filterSectionType,
}: TemplatePickerProps) {
  const templates = Object.values(TEMPLATE_REGISTRY).filter((t) =>
    filterSectionType ? t.sectionType === filterSectionType : true
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {templates.map((tpl) => {
        const isSelected = selectedTemplateId === tpl.id;
        return (
          <div
            key={tpl.id}
            onClick={() => onSelectTemplate(tpl)}
            className={`group relative rounded-xl border-2 overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between bg-white text-right ${
              isSelected
                ? 'border-[#F59E0B] ring-4 ring-[#FBBF24]/20 shadow-lg'
                : 'border-stone-200 hover:border-amber-400 hover:shadow-md'
            }`}
          >
            {/* Visual Thumbnail / Mini Render */}
            <div className="relative w-full h-36 bg-stone-100 overflow-hidden border-b border-stone-100">
              <img
                src={tpl.thumbnail}
                alt={tpl.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2.5 right-3 text-white text-xs font-black drop-shadow-md">
                {tpl.sectionType}
              </div>

              {isSelected && (
                <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shadow-md">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-sm text-[#2B2017] group-hover:text-[#D97706] transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-stone-500 font-bold leading-relaxed mt-1">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-stone-400">
                <span>پس‌زمینه پیش‌فرض: {tpl.defaultBackground === 'WOOD' ? 'چوبی' : 'ساده'}</span>
                <span className="text-amber-600 font-black">انتخاب</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
