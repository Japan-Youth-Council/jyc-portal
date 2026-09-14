'use client';

import { useEffect, useRef, useState } from 'react';
import { Bold, Code, Heading2, Italic, Link as LinkIcon, List } from 'lucide-react';
import { insertAtLineStart, insertAtSelection } from '@/lib/knowledge';
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
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    const el = textareaRef.current;
    const pending = pendingSelection.current;
    if (!el || !pending) return;
    el.focus();
    el.setSelectionRange(pending.start, pending.end);
    pendingSelection.current = null;
  }, [value]);

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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 border-b bg-white px-2 py-1.5">
        <div className="flex flex-wrap gap-1">
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
          <MarkdownBody content={value} />
        </div>
      </div>
    </div>
  );
}
