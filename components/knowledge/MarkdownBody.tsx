'use client';

import { isValidElement, MouseEvent, ReactNode } from 'react';
import ReactMarkdown, { Components, defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { replaceWikiLinksToViewMarkdown, uniqueHeadingId, wikiIdFromHref } from '@/lib/knowledge';
import { Knowledge } from '@/types/database';

function getNodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return getNodeText(node.props.children);
  return '';
}

function urlTransform(url: string) {
  if (url.startsWith('wiki:') || url.startsWith('#wiki-')) return url;
  return defaultUrlTransform(url);
}

export default function MarkdownBody({
  content,
  knowledges = [],
  onWikiLink,
  className,
  emptyText = '本文はまだありません。',
}: {
  content: string;
  knowledges?: Knowledge[];
  onWikiLink?: (knowledge: Knowledge) => void;
  className?: string;
  emptyText?: string;
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

  const openWiki = (event: MouseEvent<HTMLAnchorElement>, target: Knowledge) => {
    event.preventDefault();
    onWikiLink?.(target);
  };

  const components: Components = {
    h1: heading('h1'),
    h2: heading('h2'),
    h3: heading('h3'),
    a: ({ href, children }) => {
      const wikiId = wikiIdFromHref(href);
      if (wikiId != null) {
        const target = knowledges.find((item) => Number(item.id) === wikiId) ?? null;
        if (!target) {
          return <span className="wiki-broken-link">{children}</span>;
        }
        if (!onWikiLink) {
          return <span className="wiki-internal-link">{children}</span>;
        }
        return (
          <a
            href={`#wiki-${wikiId}`}
            className="wiki-internal-link"
            onClick={(event) => openWiki(event, target)}
          >
            {children}
          </a>
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
    return <p className="text-gray-400 italic">{emptyText}</p>;
  }

  return (
    <div className={className ? `wiki-prose ${className}` : 'wiki-prose'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        urlTransform={urlTransform}
        components={components}
      >
        {replaceWikiLinksToViewMarkdown(content, knowledges)}
      </ReactMarkdown>
    </div>
  );
}
