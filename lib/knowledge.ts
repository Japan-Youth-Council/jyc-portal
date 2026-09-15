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

export type WikiLinkRef = {
  id: number | null;
  title: string;
};

const WIKI_LINK_RE = /\[\[(\d+):([^\]]+)\]\]|\[\[([^\]]+)\]\]/g;

function mapNonFenceLines(markdown: string, mapLine: (line: string) => string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let inFence = false;
  return lines
    .map((line) => {
      if (/^```/.test(line.trim())) {
        inFence = !inFence;
        return line;
      }
      return inFence ? line : mapLine(line);
    })
    .join('\n');
}

export function formatWikiLink(knowledge: Knowledge): string {
  const title = knowledge.title.replace(/[\[\]]/g, '').trim() || '無題のドキュメント';
  return `[[${knowledge.id}:${title}]]`;
}

export function parseWikiLinks(markdown: string): WikiLinkRef[] {
  const refs: WikiLinkRef[] = [];
  const seen = new Set<string>();
  mapNonFenceLines(markdown, (line) => {
    const re = new RegExp(WIKI_LINK_RE.source, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(line))) {
      const id = match[1] ? Number(match[1]) : null;
      const title = (match[2] ?? match[3] ?? '').trim();
      if (!title && id == null) continue;
      const key = id != null ? `id:${id}` : `title:${title.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      refs.push({ id, title });
    }
    return line;
  });
  return refs;
}

export function resolveWikiLink(ref: WikiLinkRef, knowledges: Knowledge[]): Knowledge | null {
  if (ref.id != null) {
    return knowledges.find((item) => item.id === ref.id) ?? null;
  }
  const title = ref.title.toLowerCase();
  return knowledges.find((item) => item.title.toLowerCase() === title) ?? null;
}

export function linkedKnowledges(
  markdown: string,
  knowledges: Knowledge[],
  options?: { excludeId?: number | null }
): { knowledge: Knowledge | null; title: string }[] {
  return parseWikiLinks(markdown)
    .map((ref) => {
      const knowledge = resolveWikiLink(ref, knowledges);
      return { knowledge, title: knowledge?.title ?? ref.title };
    })
    .filter((item) => item.knowledge?.id !== options?.excludeId);
}

export function replaceWikiLinksToMarkdown(markdown: string, knowledges: Knowledge[]): string {
  return mapNonFenceLines(markdown, (line) =>
    line.replace(new RegExp(WIKI_LINK_RE.source, 'g'), (_full, idStr, titled, titleOnly) => {
      const id = idStr ? Number(idStr) : null;
      const title = (titled ?? titleOnly ?? '').trim();
      const found = resolveWikiLink({ id, title }, knowledges);
      const label = (found?.title ?? title).replace(/\]/g, '');
      if (found) return `[${label}](wiki:${found.id})`;
      return `[${label}](wiki:missing)`;
    })
  );
}
