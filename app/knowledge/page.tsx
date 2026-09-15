'use client';

import { useMemo, useState } from 'react';
import { BookOpen, PanelLeft, Plus, Save, User, X } from 'lucide-react';
import { useKnowledges } from '@/hooks/useKnowledges';
import {
  collectTags,
  filterKnowledges,
  getCategoryPath,
  linkedKnowledges,
  parseTagsInput,
  tagsToInput,
} from '@/lib/knowledge';
import { Knowledge } from '@/types/database';
import KnowledgeLayout from '@/components/knowledge/KnowledgeLayout';
import KnowledgeSidebar from '@/components/knowledge/KnowledgeSidebar';
import ArticleView from '@/components/knowledge/ArticleView';
import MarkdownEditor from '@/components/knowledge/MarkdownEditor';
import KnowledgeMetaForm from '@/components/knowledge/KnowledgeMetaForm';
import WikiLinkList from '@/components/knowledge/WikiLinkList';

type Draft = {
  title: string;
  content: string;
  tagsInput: string;
  majorId: number | null;
  categoryId: number | null;
};

export default function KnowledgePage() {
  const {
    categories,
    knowledges,
    authorName,
    setAuthorName,
    needsAuthorInput,
    isLoading,
    loadError,
    addCategory,
    addKnowledge,
    updateKnowledge,
    deleteKnowledge,
  } = useKnowledges();

  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [selectedMinorId, setSelectedMinorId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saveError, setSaveError] = useState('');
  const [collapsedMajors, setCollapsedMajors] = useState<Set<number>>(new Set());

  const tags = useMemo(() => collectTags(knowledges), [knowledges]);
  const expandedMajors = useMemo(() => {
    const ids = categories.filter((c) => c.parent_id === null).map((c) => c.id);
    return new Set(ids.filter((id) => !collapsedMajors.has(id)));
  }, [categories, collapsedMajors]);
  const isBrowsingAll = searchQuery.trim().length > 0 || selectedTag != null;
  const visibleKnowledges = useMemo(
    () =>
      filterKnowledges(knowledges, {
        query: searchQuery,
        tag: selectedTag,
        categoryId: isBrowsingAll ? null : selectedMinorId,
      }),
    [knowledges, searchQuery, selectedTag, selectedMinorId, isBrowsingAll]
  );

  const selected = knowledges.find((k) => k.id === selectedId) ?? null;
  const displayed =
    selected && selectedTag && !(selected.tags ?? []).includes(selectedTag) ? null : selected;

  const confirmLeaveEdit = () => {
    if (!isEditing) return true;
    return confirm('編集中の内容は破棄されます。よろしいですか？');
  };

  const expandMajor = (id: number) => {
    setCollapsedMajors((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleMajor = (id: number) => {
    setCollapsedMajors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectKnowledge = (knowledge: Knowledge, options?: { skipConfirm?: boolean }) => {
    if (!options?.skipConfirm && !confirmLeaveEdit()) return;
    const path = getCategoryPath(categories, knowledge.category_id);
    setSelectedId(knowledge.id);
    setSelectedMinorId(knowledge.category_id);
    setSelectedMajorId(path.major?.id ?? null);
    if (path.major) expandMajor(path.major.id);
    setIsEditing(false);
    setDraft(null);
    setSaveError('');
    setIsSidebarOpen(false);
  };

  const handleAddCategory = async (parentId: number | null, name: string) => {
    const { data, error } = await addCategory(parentId, name);
    if (error) {
      alert(error);
      return false;
    }
    if (!data) return false;
    if (parentId === null) {
      expandMajor(data.id);
      setSelectedMajorId(data.id);
      setSelectedMinorId(null);
      setSelectedId(null);
    } else {
      expandMajor(parentId);
      setSelectedMajorId(parentId);
      setSelectedMinorId(data.id);
      setSelectedId(null);
    }
    setIsEditing(false);
    return true;
  };

  const startEdit = () => {
    if (!selected) return;
    const path = getCategoryPath(categories, selected.category_id);
    setDraft({
      title: selected.title,
      content: selected.content,
      tagsInput: tagsToInput(selected.tags),
      majorId: path.major?.id ?? null,
      categoryId: selected.category_id,
    });
    setSaveError('');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(null);
    setSaveError('');
  };

  const handleSave = async () => {
    if (!selected || !draft) return;
    if (!draft.categoryId) {
      setSaveError('小項目を選択してください。');
      return;
    }
    setIsSaving(true);
    const { data, error } = await updateKnowledge(selected.id, {
      title: draft.title.trim() || '無題のドキュメント',
      content: draft.content,
      tags: parseTagsInput(draft.tagsInput),
      category_id: draft.categoryId,
    });
    setIsSaving(false);
    if (error || !data) {
      setSaveError(error || '保存に失敗しました。');
      return;
    }
    const path = getCategoryPath(categories, data.category_id);
    setSelectedMinorId(data.category_id);
    setSelectedMajorId(path.major?.id ?? null);
    if (path.major) expandMajor(path.major.id);
    setIsEditing(false);
    setDraft(null);
    setSaveError('');
  };

  const handleCreate = async () => {
    if (!selectedMinorId) {
      alert('先に小項目を選択してください。');
      return;
    }
    const { data, error } = await addKnowledge(selectedMinorId);
    if (error || !data) {
      alert(error || '作成に失敗しました。');
      return;
    }
    selectKnowledge(data, { skipConfirm: true });
    const path = getCategoryPath(categories, data.category_id);
    setDraft({
      title: data.title,
      content: data.content,
      tagsInput: '',
      majorId: path.major?.id ?? null,
      categoryId: data.category_id,
    });
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`「${selected.title}」を削除しますか？`)) return;
    const { error } = await deleteKnowledge(selected.id);
    if (error) {
      alert(error);
      return;
    }
    setSelectedId(null);
    setIsEditing(false);
    setDraft(null);
  };

  const showingList = !displayed && (isBrowsingAll || selectedMinorId != null);

  return (
    <KnowledgeLayout
      sidebarOpen={isSidebarOpen}
      onCloseSidebar={() => setIsSidebarOpen(false)}
      sidebar={
        <KnowledgeSidebar
          categories={categories}
          knowledges={visibleKnowledges}
          allKnowledges={knowledges}
          tags={tags}
          searchQuery={searchQuery}
          selectedTag={selectedTag}
          selectedMajorId={selectedMajorId}
          selectedMinorId={selectedMinorId}
          selectedId={selectedId}
          expandedMajors={expandedMajors}
          onSearchChange={setSearchQuery}
          onTagClick={(tag) => {
            if (isEditing && !confirmLeaveEdit()) return;
            setSelectedTag((current) => (current === tag ? null : tag));
            if (isEditing) {
              setIsEditing(false);
              setDraft(null);
            }
          }}
          onToggleMajor={toggleMajor}
          onSelectMinor={(majorId, minorId) => {
            if (isEditing && !confirmLeaveEdit()) return;
            setSelectedMajorId(majorId);
            setSelectedMinorId(minorId);
            setSelectedId(null);
            setSearchQuery('');
            setIsEditing(false);
            setDraft(null);
            setIsSidebarOpen(false);
          }}
          onSelectKnowledge={selectKnowledge}
          onAddCategory={handleAddCategory}
          onExpandMajor={expandMajor}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />
      }
    >
      {needsAuthorInput && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-3">
          <User className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-xs font-bold text-red-700 shrink-0">最終更新者名（プロフィール未取得）:</span>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="あなたの名前"
            className="px-3 py-1.5 border border-red-200 rounded text-sm w-48 outline-none focus:border-red-500 bg-white"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 font-bold">読み込み中...</div>
      ) : loadError ? (
        <div className="flex-1 flex items-center justify-center text-red-500 text-sm px-6 text-center">{loadError}</div>
      ) : isEditing && selected && draft ? (
        <>
          <div className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="md:hidden p-2 bg-blue-50 rounded-md text-blue-600"
                onClick={() => setIsSidebarOpen(true)}
              >
                <PanelLeft className="w-5 h-5" />
              </button>
              <h2 className="font-bold text-gray-800 truncate">ドキュメントを編集</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-md inline-flex items-center gap-1"
              >
                <X className="w-4 h-4" /> キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-md inline-flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
          {saveError && <div className="bg-red-50 text-red-700 text-xs font-bold px-4 py-2 border-b border-red-100">{saveError}</div>}
          <div className="bg-white border-b px-4 md:px-6 py-4">
            <KnowledgeMetaForm
              draft={draft}
              categories={categories}
              onChange={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
            />
          </div>
          <MarkdownEditor
            value={draft.content}
            onChange={(content) => setDraft((current) => (current ? { ...current, content } : current))}
            knowledges={knowledges}
            categories={categories}
            currentId={selected.id}
          />
          <WikiLinkList
            items={linkedKnowledges(draft.content, knowledges, { excludeId: selected.id })}
            categories={categories}
            compact
          />
        </>
      ) : displayed ? (
        <>
          <div className="md:hidden bg-white border-b p-3 flex items-center gap-2">
            <button
              type="button"
              className="p-2 bg-blue-50 rounded-md text-blue-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-gray-800 truncate">{displayed.title}</span>
          </div>
          <ArticleView
            knowledge={displayed}
            knowledges={knowledges}
            categories={categories}
            onEdit={startEdit}
            onDelete={handleDelete}
            onSelectKnowledge={selectKnowledge}
          />
        </>
      ) : showingList ? (
        <>
          <div className="bg-white border-b p-4 md:p-6 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="md:hidden p-2 bg-blue-50 rounded-md text-blue-600 shrink-0"
                onClick={() => setIsSidebarOpen(true)}
              >
                <PanelLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                {searchQuery.trim() ? (
                  <>
                    <p className="text-xs font-bold text-gray-400">横断検索結果</p>
                    <h2 className="text-lg md:text-2xl font-bold text-gray-800 truncate">「{searchQuery}」</h2>
                  </>
                ) : selectedTag ? (
                  <>
                    <p className="text-xs font-bold text-gray-400">タグ</p>
                    <h2 className="text-lg md:text-2xl font-bold text-gray-800 truncate">{selectedTag}</h2>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-gray-400">
                      {getCategoryPath(categories, selectedMinorId).major?.name}
                    </p>
                    <h2 className="text-lg md:text-2xl font-bold text-gray-800 truncate">
                      {getCategoryPath(categories, selectedMinorId).minor?.name}
                    </h2>
                  </>
                )}
              </div>
            </div>
            {selectedMinorId && !searchQuery.trim() && (
              <button
                type="button"
                onClick={handleCreate}
                className="bg-blue-600 text-white px-3 md:px-5 py-2 rounded-md font-bold text-xs md:text-sm hover:bg-blue-700 flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">新しいドキュメント</span>
                <span className="md:hidden">追加</span>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-3">
              {visibleKnowledges.length === 0 ? (
                <p className="text-center text-gray-400 py-16">
                  {searchQuery.trim() || selectedTag ? '一致するドキュメントはありません。' : 'まだドキュメントがありません。'}
                </p>
              ) : (
                visibleKnowledges.map((knowledge) => (
                  <button
                    key={knowledge.id}
                    type="button"
                    onClick={() => selectKnowledge(knowledge)}
                    className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 md:p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition"
                  >
                    <h3 className="font-bold text-gray-800 mb-1">{knowledge.title}</h3>
                    <p className="text-xs text-gray-400">
                      {new Date(knowledge.updated_at).toLocaleDateString('ja-JP')}
                      <span className="mx-1.5">•</span>
                      最終更新: {knowledge.author_name}
                    </p>
                    {knowledge.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {knowledge.tags.map((tag) => (
                          <span key={tag} className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {knowledge.content && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{knowledge.content}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="md:hidden bg-white border-b p-4 flex items-center gap-3">
            <button
              type="button"
              className="p-2 bg-blue-50 rounded-md text-blue-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-gray-800">政策ナレッジ</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <BookOpen className="w-16 h-16 mb-4 text-gray-200" />
            <p className="hidden md:block">左のカテゴリから小項目を選ぶか、検索・タグでドキュメントを探してください。</p>
            <p className="md:hidden">左上のリストからカテゴリを選んでください。</p>
          </div>
        </div>
      )}
    </KnowledgeLayout>
  );
}
