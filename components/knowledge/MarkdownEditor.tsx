'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, BookMarked, Code, Heading2, Italic, Link as LinkIcon, List, Search } from 'lucide-react';
import { formatWikiLink, getCategoryPath, insertAtLineStart, insertAtSelection } from '@/lib/knowledge';
import { Knowledge, PolicyCategory } from '@/types/database';
import MarkdownBody from './MarkdownBody';

type Tool = {
  label: string;
  icon: typeof Bold;
  run: (value: string, start: number, end: number) => { next: string; cursor?: number; selectStart?: number; selectEnd?: number };
};

const TOOLS: Tool[] = [
  {
    label: '太字',
    icon: Bold,
    run: (value, start, end) => insertAtSelection(value, start, end, '**', '**'),
  },
  {
    label: '斜体',
    icon: Italic,
    run: (value, start, end) => insertAtSelection(value, start, end, '*', '*'),
  },
  {
    label: '見出し',
    icon: Heading2,
    run: (value, start) => insertAtLineStart(value, start, '## '),
  },
  {
    label: 'リスト',
    icon: List,
    run: (value, start) => insertAtLineStart(value, start, '- '),
  },
  {
    label: 'リンク',
    icon: LinkIcon,
    run: (value, start, end) => {
      const selected = value.slice(start, end) || 'リンクテキスト';
      const wrapped = insertAtSelection(value, start, end, '[', '](https://)');
      if (!value.slice(start, end)) {
        return { next: value.slice(0, start) + `[${selected}](https://)` + value.slice(end), selectStart: start + 1, selectEnd: start + 1 + selected.length };
      }
      return wrapped;
    },
  },
  {
    label: 'コード',
    icon: Code,
    run: (value, start, end) => {
      const selected = value.slice(start, end);
      if (selected.includes('\n')) {
        return insertAtSelection(value, start, end, '```\n', '\n```');
      }
      return insertAtSelection(value, start, end, '`', '`');
    },
  },
];

export default function MarkdownEditor({
  value,
  onChange,
  knowledges,
  categories,
  currentId,
}: {
  value: string;
  onChange: (next: string) => void;
  knowledges: Knowledge[];
  categories: PolicyCategory[];
  currentId: number | null;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);
  const insertRange = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  useEffect(() => {
    const el = textareaRef.current;
    const pending = pendingSelection.current;
    if (!el || !pending) return;
    el.focus();
    el.setSelectionRange(pending.start, pending.end);
    pendingSelection.current = null;
  }, [value]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [pickerOpen]);

  const candidates = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    return knowledges
      .filter((item) => item.id !== currentId)
      .filter((item) => {
        if (!query) return true;
        const path = getCategoryPath(categories, item.category_id);
        return [item.title, path.major?.name, path.minor?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 40);
  }, [knowledges, categories, currentId, pickerQuery]);

  const applyTool = (tool: Tool) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const result = tool.run(value, start, end);
    const selectStart = result.selectStart ?? result.cursor ?? start;
    const selectEnd = result.selectEnd ?? result.cursor ?? end;
    pendingSelection.current = { start: selectStart, end: selectEnd };
    onChange(result.next);
  };

  const openPicker = () => {
    const el = textareaRef.current;
    insertRange.current = {
      start: el?.selectionStart ?? value.length,
      end: el?.selectionEnd ?? value.length,
    };
    setPickerQuery('');
    setPickerOpen(true);
  };

  const insertWikiLink = (knowledge: Knowledge) => {
    const token = formatWikiLink(knowledge);
    const { start, end } = insertRange.current;
    const next = value.slice(0, start) + token + value.slice(end);
    pendingSelection.current = { start: start + token.length, end: start + token.length };
    onChange(next);
    setPickerOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 border-b bg-white px-2 py-1.5">
        <div className="flex flex-wrap gap-1 items-center">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.label}
                type="button"
                title={tool.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyTool(tool)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              title="Wikiリンク挿入"
              onMouseDown={(e) => e.preventDefault()}
              onClick={openPicker}
              className="inline-flex items-center gap-1 px-1.5 py-1.5 rounded hover:bg-purple-50 text-purple-700"
            >
              <BookMarked className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-bold">Wikiリンク</span>
            </button>
            {pickerOpen && (
              <div className="absolute left-0 top-full mt-1 z-30 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="ドキュメントを検索"
                    className="w-full pl-8 pr-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {candidates.length === 0 ? (
                    <p className="text-xs text-gray-400 px-2 py-4 text-center">該当するドキュメントがありません。</p>
                  ) : (
                    <ul>
                      {candidates.map((item) => {
                        const path = getCategoryPath(categories, item.category_id);
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => insertWikiLink(item)}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-purple-50"
                            >
                              <span className="block text-sm font-bold text-gray-800 truncate">{item.title}</span>
                              <span className="block text-[11px] text-gray-400 truncate">
                                {path.major?.name || '未分類'}
                                {path.minor ? ` › ${path.minor.name}` : ''}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="lg:hidden flex text-xs font-bold bg-gray-100 rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setMobileTab('edit')}
            className={`px-2.5 py-1 rounded ${mobileTab === 'edit' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`px-2.5 py-1 rounded ${mobileTab === 'preview' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
          >
            プレビュー
          </button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Markdown で本文を入力..."
          className={`w-full h-full min-h-[280px] lg:min-h-0 p-4 text-sm font-mono leading-relaxed outline-none resize-none bg-white border-r border-gray-100 ${
            mobileTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        />
        <div
          className={`h-full min-h-[280px] lg:min-h-0 overflow-y-auto p-4 bg-gray-50 ${
            mobileTab === 'edit' ? 'hidden lg:block' : 'block'
          }`}
        >
          <MarkdownBody content={value} knowledges={knowledges} />
        </div>
      </div>
    </div>
  );
}
