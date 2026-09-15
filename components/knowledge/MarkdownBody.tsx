'use client';

import { isValidElement, ReactNode } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { replaceWikiLinksToMarkdown, uniqueHeadingId } from '@/lib/knowledge';
import { Knowledge } from '@/types/database';

function getNodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return getNodeText(node.props.children);
  return '';
}

export default function MarkdownBody({
  content,
  knowledges = [],
  onWikiLink,
}: {
  content: string;
  knowledges?: Knowledge[];
  onWikiLink?: (knowledge: Knowledge) => void;
}) {
  const used = new Map<string, number>();
  const heading = (Tag: 'h1' | 'h2' | 'h3') => {
    function Heading({ children }: { children?: ReactNode }) {
      const id = uniqueHeadingId(getNodeText(children), used);
      return <Tag id={id} className="scroll-mt-24">{children}</Tag>;
    }
    Heading.displayName = `Wiki${Tag.toUpperCase()}`;
    return Heading;
  };

  const components: Components = {
    h1: heading('h1'),
    h2: heading('h2'),
    h3: heading('h3'),
    a: ({ href, children }) => {
      if (href?.startsWith('wiki:')) {
        const id = Number(href.slice(5));
        const target = Number.isFinite(id) ? knowledges.find((item) => item.id === id) : null;
        if (!target) {
          return <span className="wiki-broken-link">{children}</span>;
        }
        if (!onWikiLink) {
          return <span className="wiki-internal-link">{children}</span>;
        }
        return (
          <button
            type="button"
            onClick={() => onWikiLink(target)}
            className="wiki-internal-link"
          >
            {children}
          </button>
        );
      }
      const external = href?.startsWith('http');
      return (
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {children}
        </a>
      );
    },
  };

  if (!content.trim()) {
    return <p className="text-gray-400">本文はまだありません。</p>;
  }

  return (
    <div className="wiki-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {replaceWikiLinksToMarkdown(content, knowledges)}
      </ReactMarkdown>
    </div>
  );
}
