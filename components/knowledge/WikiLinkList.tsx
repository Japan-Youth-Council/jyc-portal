'use client';

import { FileText } from 'lucide-react';
import { getCategoryPath } from '@/lib/knowledge';
import { Knowledge, PolicyCategory } from '@/types/database';

export default function WikiLinkList({
  items,
  categories,
  onSelect,
  compact = false,
}: {
  items: { knowledge: Knowledge | null; title: string }[];
  categories: PolicyCategory[];
  onSelect?: (knowledge: Knowledge) => void;
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className={compact
      ? 'border-t bg-white px-4 py-3 max-h-40 overflow-y-auto'
      : 'mt-6 bg-white border border-gray-100 rounded-xl p-5 md:p-6 shadow-sm'
    }>
      <h2 className={`font-bold text-gray-700 ${compact ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
        リンクしているドキュメント
      </h2>
      <ul className="space-y-1.5">
        {items.map((item, index) => {
          const path = item.knowledge
            ? getCategoryPath(categories, item.knowledge.category_id)
            : { major: null, minor: null };
          const label = item.knowledge?.title ?? item.title;
          const key = item.knowledge ? `doc-${item.knowledge.id}` : `missing-${index}-${item.title}`;

          if (!item.knowledge) {
            return (
              <li key={key} className="text-sm text-gray-400 px-2 py-1.5">
                {label}
                <span className="ml-2 text-[11px]">（見つかりません）</span>
              </li>
            );
          }

          const body = (
            <>
              <FileText className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-blue-700 truncate">{label}</span>
                <span className="block text-[11px] text-gray-400 truncate">
                  {path.major?.name || '未分類'}
                  {path.minor ? ` › ${path.minor.name}` : ''}
                </span>
              </span>
            </>
          );

          if (!onSelect) {
            return (
              <li key={key} className="px-2 py-1.5 flex items-start gap-2">
                {body}
              </li>
            );
          }

          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelect(item.knowledge!)}
                className="w-full text-left px-2 py-1.5 rounded-md hover:bg-blue-50 transition flex items-start gap-2"
              >
                {body}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
