import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { isValidElement, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMarkdownFile, resolveContentUrl, resolveMarkdownLink } from '../lib/content.js';
import {
  createUniqueHeadingId,
  extractMarkdownHeadings,
  splitMarkdownSections,
  stripFrontmatter,
} from '../lib/markdown.js';
import MermaidDiagram from './MermaidDiagram.jsx';

export default function MarkdownPage({ className, page, pagePath, markdown, compact = false, onHeadingsChange }) {
  const [loadedMarkdown, setLoadedMarkdown] = useState(markdown ?? '');
  const [loading, setLoading] = useState(Boolean(page && markdown === undefined));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!page || markdown !== undefined) {
      setLoadedMarkdown(markdown ?? '');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    async function loadMarkdown() {
      setLoading(true);
      setError('');

      try {
        const raw = await fetchMarkdownFile(page.path);
        if (active) {
          setLoadedMarkdown(raw);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMarkdown();

    return () => {
      active = false;
    };
  }, [page, markdown]);

  const { headings, sections } = useMemo(() => {
    const cleanMarkdown = stripFrontmatter(loadedMarkdown);
    const rawSections = compact ? [{ id: 'layout', markdown: cleanMarkdown }] : splitMarkdownSections(cleanMarkdown);
    const usedHeadingIds = new Map();
    const nextHeadings = [];
    const nextSections = rawSections.map((section) => {
      const sectionHeadings = extractMarkdownHeadings(section.markdown, usedHeadingIds);
      nextHeadings.push(...sectionHeadings);

      return {
        ...section,
        id: sectionHeadings[0]?.id ?? section.id,
        headingIds: sectionHeadings.map((heading) => heading.id),
      };
    });

    return {
      headings: nextHeadings,
      sections: nextSections,
    };
  }, [loadedMarkdown, compact]);

  useEffect(() => {
    if (!compact && !loading && !error) {
      onHeadingsChange?.(headings);
    }
  }, [compact, error, headings, loading, onHeadingsChange]);

  if (loading) {
    return <div className={`${className ?? ''} markdown-loading`}>Loading content...</div>;
  }

  if (error) {
    return (
      <article className={`${className ?? ''} markdown-error`}>
        <h1>Content unavailable</h1>
        <p>{error}</p>
      </article>
    );
  }

  return (
    <article className={className}>
      {sections.map((section) => (
        <section className="markdown-section" id={section.id} key={section.id}>
          <MarkdownRenderer markdown={section.markdown} pagePath={pagePath} headingIds={section.headingIds} />
        </section>
      ))}
    </article>
  );
}

function MarkdownRenderer({ markdown, pagePath, headingIds = [] }) {
  const pendingHeadingIds = [...headingIds];
  const fallbackHeadingIds = new Map();

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: createHeadingComponent('h1', pendingHeadingIds, fallbackHeadingIds),
        h2: createHeadingComponent('h2', pendingHeadingIds, fallbackHeadingIds),
        h3: createHeadingComponent('h3', pendingHeadingIds, fallbackHeadingIds),
        pre({ children, ...props }) {
          const child = Array.isArray(children) ? children.find(Boolean) : children;

          if (isValidElement(child) && child.type === MermaidDiagram) {
            return child;
          }

          if (isValidElement(child) && isMermaidClass(child.props.className)) {
            return <MermaidDiagram chart={markdownChildrenToString(child.props.children)} />;
          }

          return <pre {...props}>{children}</pre>;
        },
        code({ className = '', children, ...props }) {
          if (isMermaidClass(className)) {
            return <MermaidDiagram chart={markdownChildrenToString(children)} />;
          }

          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        img({ src = '', alt = '', ...props }) {
          return (
            <img
              src={resolveContentUrl(src, pagePath)}
              alt={alt}
              loading="lazy"
              {...props}
            />
          );
        },
        a({ href = '', children, ...props }) {
          const link = resolveMarkdownLink(href, pagePath);

          if (link.type === 'route') {
            return (
              <Link to={link.href} {...props}>
                {children}
              </Link>
            );
          }

          return (
            <a href={link.href} {...props}>
              {children}
            </a>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

function createHeadingComponent(Tag, pendingHeadingIds, fallbackHeadingIds) {
  return function Heading({ children, ...props }) {
    const text = markdownChildrenToString(children);
    const id = pendingHeadingIds.shift() ?? createUniqueHeadingId(text, fallbackHeadingIds);

    return (
      <Tag id={id} {...props}>
        {children}
      </Tag>
    );
  };
}

function isMermaidClass(className = '') {
  return /\blanguage-mermaid\b/i.test(className);
}

function markdownChildrenToString(children) {
  if (Array.isArray(children)) {
    return children.map(markdownChildrenToString).join('').replace(/\n$/, '');
  }

  if (isValidElement(children)) {
    return markdownChildrenToString(children.props.children);
  }

  return String(children ?? '').replace(/\n$/, '');
}
