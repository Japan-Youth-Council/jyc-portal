'use client';

import { FormEvent, KeyboardEvent, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, FileText, Plus, Search, Tag, X } from 'lucide-react';
import { Knowledge, PolicyCategory } from '@/types/database';

export default function KnowledgeSidebar({
  categories,
  knowledges,
  allKnowledges,
  tags,
  searchQuery,
  selectedTag,
  selectedMajorId,
  selectedMinorId,
  selectedId,
  expandedMajors,
  onSearchChange,
  onTagClick,
  onToggleMajor,
  onSelectMinor,
  onSelectKnowledge,
  onAddCategory,
  onExpandMajor,
  onCloseMobile,
}: {
  categories: PolicyCategory[];
  knowledges: Knowledge[];
  allKnowledges: Knowledge[];
  tags: string[];
  searchQuery: string;
  selectedTag: string | null;
  selectedMajorId: number | null;
  selectedMinorId: number | null;
  selectedId: number | null;
  expandedMajors: Set<number>;
  onSearchChange: (value: string) => void;
  onTagClick: (tag: string) => void;
  onToggleMajor: (id: number) => void;
  onSelectMinor: (majorId: number, minorId: number) => void;
  onSelectKnowledge: (knowledge: Knowledge) => void;
  onAddCategory: (parentId: number | null, name: string) => Promise<boolean>;
  onExpandMajor: (id: number) => void;
  onCloseMobile: () => void;
}) {
  const [isAddingMajor, setIsAddingMajor] = useState(false);
  const [newMajorName, setNewMajorName] = useState('');
  const [addingMinorFor, setAddingMinorFor] = useState<number | null>(null);
  const [newMinorName, setNewMinorName] = useState('');

  const majors = categories.filter((c) => c.parent_id === null);
  const isSearching = searchQuery.trim().length > 0;
  const searchHits = isSearching ? knowledges : [];

  const submitMajor = async () => {
    const ok = await onAddCategory(null, newMajorName);
    setIsAddingMajor(false);
    setNewMajorName('');
    return ok;
  };

  const submitMinor = async (majorId: number) => {
    const ok = await onAddCategory(majorId, newMinorName);
    setAddingMinorFor(null);
    setNewMinorName('');
    return ok;
  };

  const onKeyDownSubmit = (event: KeyboardEvent<HTMLInputElement>, submit: () => void) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
    if (event.key === 'Escape') {
      setIsAddingMajor(false);
      setAddingMinorFor(null);
    }
  };

  const preventForm = (event: FormEvent) => event.preventDefault();

  return (
    <>
      <div className="p-4 border-b bg-gray-50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <h2 className="font-bold text-gray-700">政策ナレッジ</h2>
          </div>
          <button type="button" className="md:hidden p-1 text-gray-400 hover:bg-gray-200 rounded" onClick={onCloseMobile}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="タイトル・本文・タグを検索"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 pb-8 space-y-5">
        {tags.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-gray-400 mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> タグ
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                    selectedTag === tag
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>
        )}

        {isSearching && (
          <section>
            <p className="text-[11px] font-bold text-gray-400 mb-2">検索結果 ({searchHits.length})</p>
            {searchHits.length === 0 ? (
              <p className="text-xs text-gray-400 px-1">一致するドキュメントはありません。</p>
            ) : (
              <ul className="space-y-1">
                {searchHits.map((knowledge) => (
                  <li key={knowledge.id}>
                    <button
                      type="button"
                      onClick={() => onSelectKnowledge(knowledge)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-start gap-1.5 ${
                        selectedId === knowledge.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="truncate">{knowledge.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-bold text-gray-400">カテゴリ</p>
            <button
              type="button"
              onClick={() => setIsAddingMajor(true)}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="大項目を追加"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {isAddingMajor && (
            <form onSubmit={preventForm} className="mb-2">
              <input
                autoFocus
                value={newMajorName}
                onChange={(e) => setNewMajorName(e.target.value)}
                onBlur={() => { if (newMajorName.trim()) submitMajor(); else setIsAddingMajor(false); }}
                onKeyDown={(e) => onKeyDownSubmit(e, submitMajor)}
                placeholder="大項目名..."
                className="w-full border rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
              />
            </form>
          )}

          {majors.length === 0 && !isAddingMajor && (
            <p className="text-xs text-gray-400 px-1 py-2">＋ から大項目を追加してください。</p>
          )}

          <div className="space-y-1">
            {majors.map((major) => {
              const minors = categories.filter((c) => c.parent_id === major.id);
              const expanded = expandedMajors.has(major.id);
              return (
                <div key={major.id}>
                  <div className="flex items-center group">
                    <button
                      type="button"
                      onClick={() => onToggleMajor(major.id)}
                      className={`flex-1 flex items-center gap-1 px-1.5 py-1.5 rounded text-sm font-bold ${
                        selectedMajorId === major.id ? 'text-blue-800' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <span className="truncate">{major.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { onExpandMajor(major.id); setAddingMinorFor(major.id); }}
                      className="p-1 text-gray-400 hover:text-blue-600 opacity-100 md:opacity-0 group-hover:opacity-100"
                      title="小項目を追加"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {expanded && (
                    <div className="ml-3 pl-2 border-l border-gray-200 space-y-1 mb-2">
                      {addingMinorFor === major.id && (
                        <form onSubmit={preventForm}>
                          <input
                            autoFocus
                            value={newMinorName}
                            onChange={(e) => setNewMinorName(e.target.value)}
                            onBlur={() => { if (newMinorName.trim()) submitMinor(major.id); else setAddingMinorFor(null); }}
                            onKeyDown={(e) => onKeyDownSubmit(e, () => submitMinor(major.id))}
                            placeholder="小項目名..."
                            className="w-full border rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                          />
                        </form>
                      )}
                      {minors.map((minor) => {
                        const docs = allKnowledges.filter((k) => k.category_id === minor.id);
                        const selected = selectedMinorId === minor.id;
                        return (
                          <div key={minor.id}>
                            <button
                              type="button"
                              onClick={() => onSelectMinor(major.id, minor.id)}
                              className={`w-full text-left px-2 py-1 rounded text-sm ${
                                selected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {minor.name}
                            </button>
                            {selected && (
                              <ul className="mt-0.5 mb-1 space-y-0.5">
                                {docs.length === 0 && (
                                  <li className="text-[11px] text-gray-400 px-2 py-1">ドキュメントなし</li>
                                )}
                                {docs.map((doc) => (
                                  <li key={doc.id}>
                                    <button
                                      type="button"
                                      onClick={() => onSelectKnowledge(doc)}
                                      className={`w-full text-left px-2 py-1 rounded text-xs flex items-start gap-1 ${
                                        selectedId === doc.id ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-600 hover:bg-gray-50'
                                      }`}
                                    >
                                      <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span className="truncate">{doc.title}</span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
