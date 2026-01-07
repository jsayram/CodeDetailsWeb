'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Copy, FileCode } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * CodeBlock Component
 * Syntax-highlighted code block with copy button and optional line numbers
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  language = 'plaintext',
  filename,
  showLineNumbers = false,
  children,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const code = typeof children === 'string' ? children : String(children);
  const lines = code.split('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('my-4 rounded-lg overflow-hidden border border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileCode className="h-4 w-4" />
          {filename && <span className="font-mono">{filename}</span>}
          {!filename && language && <span className="font-mono">{language}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="bg-zinc-950 dark:bg-zinc-900 overflow-x-auto">
        <pre className="p-4 text-sm">
          <code className="text-zinc-100">
            {showLineNumbers ? (
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="hover:bg-zinc-800/50">
                      <td className="pr-4 text-zinc-500 select-none text-right w-8 font-mono">
                        {i + 1}
                      </td>
                      <td className="font-mono whitespace-pre">{line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span className="font-mono whitespace-pre">{code}</span>
            )}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
