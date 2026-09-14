import { Knowledge, PolicyCategory } from '@/types/database';

export type TocItem = {
  id: string;
  text: string;
  level: 1 | 2 | 3;
};

export function slugify(text: string): string {
  const s = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'heading';
}

export function extractHeadings(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const used = new Map<string, number>();
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const level = match[1].length as 1 | 2 | 3;
    const text = match[2]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`~]/g, '')
      .trim();
    items.push({ id: uniqueHeadingId(text, used), text, level });
  }

  return items;
}

export function uniqueHeadingId(text: string, used = new Map<string, number>()): string {
  const base = slugify(text);
  const n = (used.get(base) ?? 0) + 1;
  used.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

export function parseTagsInput(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of input.split(/[,、]/)) {
    const tag = part.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

export function tagsToInput(tags: string[] | null | undefined): string {
  return (tags ?? []).join(', ');
}

export function collectTags(knowledges: Knowledge[]): string[] {
  const counts = new Map<string, number>();
  for (const knowledge of knowledges) {
    for (const tag of knowledge.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
    .map(([tag]) => tag);
}

export function normalizeKnowledge(row: Omit<Knowledge, 'tags'> & { tags?: string[] | null }): Knowledge {
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

export function getCategoryPath(categories: PolicyCategory[], categoryId: number | null) {
  const minor = categories.find((c) => c.id === categoryId) ?? null;
  const major =
    minor?.parent_id != null
      ? categories.find((c) => c.id === minor.parent_id) ?? null
      : categories.find((c) => c.id === categoryId && c.parent_id === null) ?? null;
  return { major, minor: minor?.parent_id != null ? minor : null };
}

export function filterKnowledges(
  knowledges: Knowledge[],
  options: { query: string; tag: string | null; categoryId: number | null }
): Knowledge[] {
  const query = options.query.trim().toLowerCase();

  return knowledges.filter((knowledge) => {
    if (options.tag && !(knowledge.tags ?? []).includes(options.tag)) return false;

    if (query) {
      const haystack = [knowledge.title, knowledge.content, ...(knowledge.tags ?? [])]
        .join('\n')
        .toLowerCase();
      return haystack.includes(query);
    }

    if (options.categoryId != null) {
      return knowledge.category_id === options.categoryId;
    }

    return true;
  });
}

export function insertAtSelection(
  value: string,
  start: number,
  end: number,
  prefix: string,
  suffix = ''
): { next: string; cursor: number; selectStart: number; selectEnd: number } {
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
  const selectStart = start + prefix.length;
  const selectEnd = selectStart + selected.length;
  const cursor = selected ? selectEnd + suffix.length : selectStart;
  return { next, cursor, selectStart, selectEnd: selected ? selectEnd : selectStart };
}

export function insertAtLineStart(
  value: string,
  start: number,
  prefix: string
): { next: string; cursor: number } {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  return { next, cursor: start + prefix.length };
}
