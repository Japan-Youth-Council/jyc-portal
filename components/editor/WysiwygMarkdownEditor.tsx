'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  BookMarked,
  Code,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Search,
} from 'lucide-react';
import {
  formatWikiMarkdownLink,
  getCategoryPath,
  replaceMarkdownWikiHrefsToTokens,
  replaceWikiLinksToMarkdown,
} from '@/lib/knowledge';
import { Knowledge, PolicyCategory } from '@/types/database';

function ToolbarButton({
  label,
  active,
  onClick,
  children,
  className = '',
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`rounded p-1.5 ${
        active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
      } ${className}`}
    >
      {children}
    </button>
  );
}

const LINK_OPTIONS = {
  openOnClick: false,
  autolink: true,
  defaultProtocol: 'https' as const,
  protocols: ['http', 'https', 'wiki'],
  HTMLAttributes: {
    rel: 'noreferrer',
  },
  isAllowedUri: (url: string, ctx: { defaultValidate: (url: string) => boolean }) =>
    url.startsWith('wiki:') || ctx.defaultValidate(url),
};

export default function WysiwygMarkdownEditor({
  value,
  onChange,
  placeholder = '本文を入力...',
  variant = 'compact',
  wiki,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  variant?: 'compact' | 'fill';
  wiki?: {
    knowledges: Knowledge[];
    categories: PolicyCategory[];
    currentId: number | null;
  };
}) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const initialContent = wiki ? replaceWikiLinksToMarkdown(value, wiki.knowledges) : value;

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    content: initialContent,
    contentType: 'markdown',
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: LINK_OPTIONS,
      }),
      Markdown.configure({
        markedOptions: {
          gfm: true,
          breaks: true,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    onUpdate: ({ editor: current }) => {
      const markdown = current.getMarkdown();
      onChange(wiki ? replaceMarkdownWikiHrefsToTokens(markdown) : markdown);
    },
  });

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
    if (!wiki) return [];
    const query = pickerQuery.trim().toLowerCase();
    return wiki.knowledges
      .filter((item) => item.id !== wiki.currentId)
      .filter((item) => {
        if (!query) return true;
        const path = getCategoryPath(wiki.categories, item.category_id);
        return [item.title, path.major?.name, path.minor?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 40);
  }, [wiki, pickerQuery]);

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('リンク先のURLを入力してください', previous || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(`[${url.trim()}](${url.trim()})`, { contentType: 'markdown' })
        .run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const toggleCode = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, '\n');
    if (editor.isActive('codeBlock') || selected.includes('\n')) {
      editor.chain().focus().toggleCodeBlock().run();
      return;
    }
    editor.chain().focus().toggleCode().run();
  };

  const insertWikiLink = (knowledge: Knowledge) => {
    if (!editor) return;
    const token = formatWikiMarkdownLink(knowledge);
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(token, { contentType: 'markdown' }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: `wiki:${knowledge.id}` }).run();
    }
    setPickerOpen(false);
  };

  return (
    <div className={variant === 'fill' ? 'flex-1 flex flex-col min-h-0' : ''}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            label="太字"
            active={editor?.isActive('bold')}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="斜体"
            active={editor?.isActive('italic')}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="見出し"
            active={editor?.isActive('heading', { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="リスト"
            active={editor?.isActive('bulletList')}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="番号リスト"
            active={editor?.isActive('orderedList')}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="リンク" active={editor?.isActive('link')} onClick={setLink}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="コード"
            active={editor?.isActive('code') || editor?.isActive('codeBlock')}
            onClick={toggleCode}
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          {wiki && (
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                title="Wikiリンク挿入"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setPickerQuery('');
                  setPickerOpen((open) => !open);
                }}
                className="inline-flex items-center gap-1 rounded px-1.5 py-1.5 text-purple-700 hover:bg-purple-50"
              >
                <BookMarked className="h-4 w-4" />
                <span className="hidden text-[11px] font-bold sm:inline">Wikiリンク</span>
              </button>
              {pickerOpen && (
                <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-lg sm:w-80">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      value={pickerQuery}
                      onChange={(event) => setPickerQuery(event.target.value)}
                      placeholder="ドキュメントを検索"
                      className="w-full rounded-md border py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {candidates.length === 0 ? (
                      <p className="px-2 py-4 text-center text-xs text-gray-400">該当するドキュメントがありません。</p>
                    ) : (
                      <ul>
                        {candidates.map((item) => {
                          const path = getCategoryPath(wiki.categories, item.category_id);
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => insertWikiLink(item)}
                                className="w-full rounded-md px-2 py-1.5 text-left hover:bg-purple-50"
                              >
                                <span className="block truncate text-sm font-bold text-gray-800">{item.title}</span>
                                <span className="block truncate text-[11px] text-gray-400">
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
          )}
        </div>
        <p className="px-1 text-[11px] font-bold text-gray-400">見たまま編集できます</p>
      </div>
      <EditorContent
        editor={editor}
        className={
          variant === 'fill'
            ? 'wysiwyg-editor wysiwyg-fill wiki-prose bg-white'
            : 'wysiwyg-editor wysiwyg-compact wiki-prose wiki-prose-compact bg-white'
        }
      />
    </div>
  );
}
