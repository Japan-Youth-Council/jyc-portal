'use client';

import { TocItem } from '@/lib/knowledge';

export default function TableOfContents({
  items,
  compact = false,
}: {
  items: TocItem[];
  compact?: boolean;
}) {
  if (items.length === 0) {
    return compact ? null : (
      <p className="text-xs text-gray-400">見出しがありません</p>
    );
  }

  return (
    <nav aria-label="目次">
      {!compact && <p className="text-xs font-bold text-gray-500 mb-2">目次</p>}
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className={item.level === 1 ? '' : item.level === 2 ? 'pl-3' : 'pl-6'}>
            <a
              href={`#${item.id}`}
              className="text-xs text-gray-600 hover:text-blue-600 leading-snug block"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
