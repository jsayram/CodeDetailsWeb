'use client';

import React, { useEffect, useId, useState, useCallback } from 'react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

/**
 * Clean up any mermaid error elements from the DOM
 */
function cleanupMermaidErrors() {
  // Remove elements containing mermaid error text
  const allElements = document.body.querySelectorAll('*');
  allElements.forEach(el => {
    const text = el.textContent || '';
    // Only remove if it's a small element containing just the error (not whole sections)
    if (text.includes('Syntax error in text') && 
        text.includes('mermaid version') && 
        text.length < 200 &&
        el.children.length === 0) {
      el.remove();
    }
  });
  
  // Also try to find and remove the specific error pre/div elements
  document.querySelectorAll('#d, [id^="d-"]').forEach(el => {
    if (el.textContent?.includes('mermaid version')) {
      el.remove();
    }
  });
}

/**
 * Attempt to fix common mermaid syntax issues
 */
function sanitizeMermaidChart(chart: string): string {
  let sanitized = chart.trim();
  
  // Fix " - - " which should be " -- " or just " - "
  sanitized = sanitized.replace(/\s-\s-\s/g, ' - ');
  
  // Fix unescaped parentheses inside square bracket labels - they break mermaid
  // Pattern: ["text (something)"] -> ["text - something"]
  sanitized = sanitized.replace(/\["([^"]*)\(([^)]*)\)([^"]*)"\]/g, '["$1- $2$3"]');
  
  // Fix bracket syntax issues: [/path: description)] -> ["/path: description"]
  sanitized = sanitized.replace(/\[\/([^\]]+)\)\]/g, '["/$1"]');
  
  // Fix standalone parentheses in node definitions
  // D[/path/[slug]: full form)] -> D["/path/slug - full form"]
  sanitized = sanitized.replace(/\[([^\]]*)\)\]/g, '["$1"]');
  
  // Fix forward slashes in node labels - wrap in quotes if not already quoted
  // Pattern: A[/dashboard/admin] -> A["/dashboard/admin"]
  // But don't double-quote: A["/dashboard/admin"] stays as is
  sanitized = sanitized.replace(/\[([^\]"]*\/[^\]"]*)\]/g, (match, content) => {
    // If content starts with forward slash for trapezoid shape, skip
    if (/^\/[^\/]/.test(content) && !content.includes(' ')) {
      return match; // This might be a trapezoid shape, leave as is
    }
    // Wrap paths with slashes in quotes
    return `["${content}"]`;
  });
  
  // Fix node labels with colons that aren't quoted
  // Pattern: A[path: description] -> A["path: description"]
  sanitized = sanitized.replace(/\[([^\]"]*:[^\]"]+)\]/g, '["$1"]');
  
  return sanitized;
}

/**
 * MermaidDiagram Component
 * Renders Mermaid diagrams with theme awareness
 * Re-renders when chart content changes (e.g., on chapter navigation)
 */
export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, className = '' }) => {
  const uniqueId = useId();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [svgContent, setSvgContent] = useState<string>('');

  // Set up MutationObserver to catch and remove mermaid error elements
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            const text = node.textContent || '';
            if (text.includes('Syntax error in text') && text.includes('mermaid version')) {
              node.remove();
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    // Initial cleanup
    cleanupMermaidErrors();

    return () => {
      observer.disconnect();
      cleanupMermaidErrors();
    };
  }, []);

  useEffect(() => {
    // Reset state when chart changes
    setStatus('loading');
    setSvgContent('');
    setErrorMsg('');
    
    let cancelled = false;
    // Create unique ID for this render - mermaid requires valid HTML ID (no colons from useId)
    const diagramId = `mermaid-${uniqueId.replace(/:/g, '-')}-${Date.now()}`;

    const render = async () => {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 50));
      if (cancelled) return;
      
      try {
        const mermaid = (await import('mermaid')).default;
        if (cancelled) return;
        
        const isDark = document.documentElement.classList.contains('dark');

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          flowchart: { htmlLabels: true, curve: 'basis' },
          suppressErrorRendering: true, // Don't render error messages in DOM
          logLevel: 5, // Fatal only - suppress all other logs including errors
        });

        // Sanitize the chart to fix common syntax issues
        const sanitizedChart = sanitizeMermaidChart(chart);

        // Temporarily suppress console.error during mermaid operations
        const originalError = console.error;
        console.error = (...args: unknown[]) => {
          // Only suppress mermaid-related errors
          const msg = args[0]?.toString() || '';
          if (msg.includes('Error parsing') || msg.includes('Lexical error') || msg.includes('mermaid')) {
            return; // Suppress
          }
          originalError.apply(console, args);
        };

        try {
          // Validate syntax first before rendering
          try {
            await mermaid.parse(sanitizedChart, { suppressErrors: true });
          } catch {
            // Parse can throw, treat as invalid - don't render if syntax is bad
            throw new Error('Invalid diagram syntax');
          }

          const { svg } = await mermaid.render(diagramId, sanitizedChart);
          if (cancelled) return;
          
          setSvgContent(svg);
          setStatus('success');
        } finally {
          // Restore console.error
          console.error = originalError;
        }
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : 'Invalid diagram syntax');
        setStatus('error');
        
        // Clean up any error elements mermaid may have added to the DOM
        setTimeout(() => {
          const errorElements = document.querySelectorAll('[id^="d"][id*="mermaid"], .error-icon, .error-text');
          errorElements.forEach(el => {
            if (el.textContent?.includes('Syntax error') || el.textContent?.includes('mermaid version')) {
              el.remove();
            }
          });
          // Also remove any orphaned pre elements with mermaid errors
          document.querySelectorAll('pre').forEach(el => {
            if (el.textContent?.includes('mermaid version') && el.textContent?.includes('Syntax error')) {
              el.remove();
            }
          });
        }, 100);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [chart, uniqueId]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(chart);
  }, [chart]);

  if (status === 'loading') {
    return (
      <div className={`my-4 rounded-lg border border-border ${className}`}>
        <div className="px-4 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
          Mermaid Diagram
        </div>
        <div className="p-6 flex items-center justify-center min-h-[150px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Rendering...</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`my-4 rounded-lg border border-amber-300/50 dark:border-amber-700/50 ${className}`}>
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-300/50 dark:border-amber-700/50 flex items-center justify-between">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Diagram could not be rendered
          </span>
          <button 
            onClick={handleCopy} 
            className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors"
          >
            Copy Source
          </button>
        </div>
        <details className="group">
          <summary className="px-4 py-2 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
            View diagram source code
          </summary>
          <div className="p-4 bg-muted/30 overflow-x-auto border-t border-border">
            <pre className="text-xs whitespace-pre-wrap text-muted-foreground"><code>{chart}</code></pre>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className={`my-4 rounded-lg border border-border ${className}`}>
      <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Mermaid Diagram</span>
        <button 
          onClick={handleCopy} 
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
        >
          Copy
        </button>
      </div>
      <div 
        className="p-4 bg-background overflow-x-auto flex justify-center min-h-[100px]"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
};

export default MermaidDiagram;
