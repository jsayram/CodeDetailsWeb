'use client';

import React, { useEffect, useId, useState, useCallback } from 'react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
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
        });

        const { svg } = await mermaid.render(diagramId, chart.trim());
        if (cancelled) return;
        
        setSvgContent(svg);
        setStatus('success');
      } catch (err) {
        if (cancelled) return;
        console.error('Mermaid render error:', err);
        setErrorMsg(err instanceof Error ? err.message : 'Render failed');
        setStatus('error');
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
      <div className={`my-4 rounded-lg border border-red-300 dark:border-red-800 ${className}`}>
        <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 border-b border-red-300 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">Error: {errorMsg}</p>
        </div>
        <div className="p-4 bg-muted overflow-x-auto">
          <pre className="text-xs whitespace-pre-wrap"><code>{chart}</code></pre>
        </div>
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
