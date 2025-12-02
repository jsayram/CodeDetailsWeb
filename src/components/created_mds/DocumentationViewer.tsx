'use client';

import React, { useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MermaidDiagram } from './MermaidDiagram';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';
import { cn } from '@/lib/utils';

// Dynamically import ReactMarkdown to handle ESM module
const ReactMarkdown = dynamic(
  () => import('react-markdown').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </div>
    ),
  }
);

interface DocumentationViewerProps {
  content: string;
  className?: string;
}

/**
 * DocumentationViewer Component
 * Main component for rendering generated documentation markdown
 * Handles Mermaid diagrams, code blocks, and callouts
 */
export const DocumentationViewer: React.FC<DocumentationViewerProps> = ({
  content,
  className,
}) => {
  // Custom components for ReactMarkdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const components: any = useMemo(
    () => ({
      // Handle code blocks - detect mermaid for special rendering
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code: ({ node, className: codeClassName, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(codeClassName || '');
        const language = match ? match[1] : '';
        const codeContent = String(children).replace(/\n$/, '');

        // Check if it's a mermaid diagram
        if (language === 'mermaid') {
          return <MermaidDiagram chart={codeContent} />;
        }

        // Check if it's inline code
        const isInline = !match;
        if (isInline) {
          return (
            <code
              className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm"
              {...props}
            >
              {children}
            </code>
          );
        }

        // Block code
        return (
          <CodeBlock language={language} showLineNumbers={codeContent.split('\n').length > 5}>
            {codeContent}
          </CodeBlock>
        );
      },

      // Handle blockquotes - convert to callouts based on content
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blockquote: ({ node, children, ...props }: any) => {
        const text = String(children);
        
        // Detect callout types from common patterns
        if (text.includes('[!NOTE]') || text.includes('[!INFO]')) {
          return (
            <Callout type="info">
              {text.replace(/\[!(NOTE|INFO)\]/gi, '').trim()}
            </Callout>
          );
        }
        if (text.includes('[!WARNING]') || text.includes('[!CAUTION]')) {
          return (
            <Callout type="warning">
              {text.replace(/\[!(WARNING|CAUTION)\]/gi, '').trim()}
            </Callout>
          );
        }
        if (text.includes('[!TIP]')) {
          return (
            <Callout type="tip">
              {text.replace(/\[!TIP\]/gi, '').trim()}
            </Callout>
          );
        }
        if (text.includes('[!ERROR]') || text.includes('[!DANGER]')) {
          return (
            <Callout type="error">
              {text.replace(/\[!(ERROR|DANGER)\]/gi, '').trim()}
            </Callout>
          );
        }

        // Default blockquote
        return (
          <blockquote
            className="my-4 border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground"
            {...props}
          >
            {children}
          </blockquote>
        );
      },

      // Headings with anchor links and IDs for TOC navigation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h1: ({ node, children, ...props }: any) => {
        const text = String(children);
        const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        return (
          <h1 id={id} className="scroll-mt-24 text-3xl font-bold mt-8 mb-4 group" {...props}>
            {children}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">#</a>
          </h1>
        );
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h2: ({ node, children, ...props }: any) => {
        const text = String(children);
        const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        return (
          <h2 id={id} className="scroll-mt-24 text-2xl font-semibold mt-8 mb-4 pb-2 border-b group" {...props}>
            {children}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">#</a>
          </h2>
        );
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h3: ({ node, children, ...props }: any) => {
        const text = String(children);
        const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        return (
          <h3 id={id} className="scroll-mt-24 text-xl font-semibold mt-6 mb-3 group" {...props}>
            {children}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity text-sm">#</a>
          </h3>
        );
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h4: ({ node, children, ...props }: any) => {
        const text = String(children);
        const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        return (
          <h4 id={id} className="scroll-mt-24 text-lg font-semibold mt-4 mb-2 group" {...props}>
            {children}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity text-sm">#</a>
          </h4>
        );
      },

      // Paragraphs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p: ({ node, children, ...props }: any) => (
        <p className="my-4 leading-7" {...props}>
          {children}
        </p>
      ),

      // Lists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ul: ({ node, children, ...props }: any) => (
        <ul className="my-4 ml-6 list-disc space-y-1" {...props}>
          {children}
        </ul>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ol: ({ node, children, ...props }: any) => (
        <ol className="my-4 ml-6 list-decimal space-y-1" {...props}>
          {children}
        </ol>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      li: ({ node, children, ...props }: any) => (
        <li className="leading-7" {...props}>
          {children}
        </li>
      ),

      // Links
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      a: ({ node, children, href, ...props }: any) => (
        <a
          href={href}
          target={href?.startsWith('http') ? '_blank' : undefined}
          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-primary hover:underline"
          {...props}
        >
          {children}
        </a>
      ),

      // Tables
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      table: ({ node, children, ...props }: any) => (
        <div className="my-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" {...props}>
            {children}
          </table>
        </div>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thead: ({ node, children, ...props }: any) => (
        <thead className="bg-muted/50" {...props}>
          {children}
        </thead>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tr: ({ node, children, ...props }: any) => (
        <tr className="border-b last:border-0" {...props}>
          {children}
        </tr>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      th: ({ node, children, ...props }: any) => (
        <th className="px-4 py-2 text-left font-semibold" {...props}>
          {children}
        </th>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      td: ({ node, children, ...props }: any) => (
        <td className="px-4 py-2" {...props}>
          {children}
        </td>
      ),

      // Horizontal rule
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hr: ({ node, ...props }: any) => (
        <hr className="my-8 border-t border-border" {...props} />
      ),

      // Images
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      img: ({ node, src, alt, ...props }: any) => (
        <img
          src={src}
          alt={alt || ''}
          className="my-4 rounded-lg max-w-full h-auto"
          loading="lazy"
          {...props}
        />
      ),
    }),
    []
  );

  return (
    <div className={cn('prose prose-neutral dark:prose-invert max-w-none', className)}>
      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        }
      >
        <ReactMarkdown components={components}>
          {content}
        </ReactMarkdown>
      </Suspense>
    </div>
  );
};

export default DocumentationViewer;
