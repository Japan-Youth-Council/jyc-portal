'use client';

import { PolicyCategory } from '@/types/database';

type DraftMeta = {
  title: string;
  tagsInput: string;
  majorId: number | null;
  categoryId: number | null;
};

export default function KnowledgeMetaForm({
  draft,
  categories,
  onChange,
}: {
  draft: DraftMeta;
  categories: PolicyCategory[];
  onChange: (patch: Partial<DraftMeta>) => void;
}) {
  const majors = categories.filter((c) => c.parent_id === null);
  const minors = categories.filter((c) => c.parent_id === draft.majorId);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">タイトル</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="ドキュメントのタイトル"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">大項目</label>
          <select
            value={draft.majorId ?? ''}
            onChange={(e) => {
              const majorId = e.target.value ? Number(e.target.value) : null;
              onChange({ majorId, categoryId: null });
            }}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="">選択してください</option>
            {majors.map((major) => (
              <option key={major.id} value={major.id}>{major.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">小項目</label>
          <select
            value={draft.categoryId ?? ''}
            onChange={(e) => onChange({ categoryId: e.target.value ? Number(e.target.value) : null })}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
            disabled={draft.majorId == null}
          >
            <option value="">選択してください</option>
            {minors.map((minor) => (
              <option key={minor.id} value={minor.id}>{minor.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">タグ（カンマ区切り）</label>
        <input
          type="text"
          value={draft.tagsInput}
          onChange={(e) => onChange({ tagsInput: e.target.value })}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="例: 教育, 提言, マニュアル"
        />
      </div>
    </div>
  );
}
