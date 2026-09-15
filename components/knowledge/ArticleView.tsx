'use client';

import { FileText, Pencil, Trash2 } from 'lucide-react';
import { extractHeadings, getCategoryPath, linkedKnowledges } from '@/lib/knowledge';
import { Knowledge, PolicyCategory } from '@/types/database';
import MarkdownBody from './MarkdownBody';
import TableOfContents from './TableOfContents';
import WikiLinkList from './WikiLinkList';

export default function ArticleView({
  knowledge,
  knowledges,
  categories,
  onEdit,
  onDelete,
  onSelectKnowledge,
}: {
  knowledge: Knowledge;
  knowledges: Knowledge[];
  categories: PolicyCategory[];
  onEdit: () => void;
  onDelete: () => void;
  onSelectKnowledge: (knowledge: Knowledge) => void;
}) {
  const { major, minor } = getCategoryPath(categories, knowledge.category_id);
  const toc = extractHeadings(knowledge.content);
  const wikiLinks = linkedKnowledges(knowledge.content, knowledges, { excludeId: knowledge.id });
  const updated = new Date(knowledge.updated_at).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      <article className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 pb-10">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <p className="text-[11px] md:text-xs text-gray-400 font-medium mb-1 truncate">
                {major?.name || '未分類'}
                <span className="mx-1.5">›</span>
                {minor?.name || '小項目未設定'}
                <span className="mx-1.5">›</span>
                {knowledge.title}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{knowledge.title}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-2">
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {updated}
                </span>
                <span>最終更新: {knowledge.author_name || '不明'}</span>
              </div>
              {knowledge.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {knowledge.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                <Pencil className="w-3.5 h-3.5" /> 編集
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center p-2 text-red-500 hover:bg-red-50 rounded-md"
                title="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {toc.length > 0 && (
            <details className="xl:hidden mb-6 bg-white border border-gray-100 rounded-lg p-3">
              <summary className="text-xs font-bold text-gray-600 cursor-pointer">目次</summary>
              <div className="mt-2">
                <TableOfContents items={toc} compact />
              </div>
            </details>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-5 md:p-8 shadow-sm">
            <MarkdownBody
              content={knowledge.content}
              knowledges={knowledges}
              onWikiLink={onSelectKnowledge}
            />
          </div>
          <WikiLinkList
            items={wikiLinks}
            categories={categories}
            onSelect={onSelectKnowledge}
          />
        </div>
      </article>
      <aside className="hidden xl:block w-56 shrink-0 border-l bg-white overflow-y-auto p-4">
        <TableOfContents items={toc} />
      </aside>
    </div>
  );
}
