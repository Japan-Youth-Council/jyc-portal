'use client';

import MarkdownBody from '@/components/knowledge/MarkdownBody';
import WysiwygMarkdownEditor from '@/components/editor/WysiwygMarkdownEditor';

export default function ProjectMarkdownEditor({
  value,
  onChange,
  placeholder = '目的、活動内容、Slackや議事録のリンクを入力してください。',
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-300">
      <WysiwygMarkdownEditor value={value} onChange={onChange} placeholder={placeholder} variant="compact" />
    </div>
  );
}

export function ProjectMarkdownView({ content }: { content: string | null | undefined }) {
  if (!content?.trim()) {
    return <span className="text-sm italic text-gray-400">概要やリンクはまだ設定されていません。</span>;
  }

  return <MarkdownBody content={content} className="wiki-prose-compact" />;
}
