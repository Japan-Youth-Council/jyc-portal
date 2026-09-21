'use client';

import { Knowledge, PolicyCategory } from '@/types/database';
import WysiwygMarkdownEditor from '@/components/editor/WysiwygMarkdownEditor';

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
  return (
    <WysiwygMarkdownEditor
      value={value}
      onChange={onChange}
      placeholder="本文を入力..."
      variant="fill"
      wiki={{ knowledges, categories, currentId }}
    />
  );
}
