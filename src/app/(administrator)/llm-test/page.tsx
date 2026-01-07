'use client';

/**
 * LLM Test Page
 * 
 * Admin page for testing multi-provider LLM integrations.
 * Tests the portable llm/ module with all supported providers.
 */

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Clock, Coins, Sparkles, AlertCircle } from 'lucide-react';
import { LLMProviderSelector } from '@/components/llm/LLMProviderSelector';
import { DarkModeButton } from '@/components/DarkModeButtonComponent';

interface LLMConfig {
  providerId: string;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
}

interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
}

export default function LLMTestPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [cached, setCached] = useState(false);
  
  const [llmConfig, setLLMConfig] = useState<LLMConfig>({
    providerId: 'openai',
    modelId: 'gpt-4o-mini',
  });

  const handleConfigChange = useCallback((config: LLMConfig) => {
    setLLMConfig(config);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    if (!llmConfig.providerId || !llmConfig.modelId) {
      setError('Please select a provider and model');
      return;
    }
    
    setLoading(true);
    setResponse(null);
    setError(null);
    setUsage(null);
    setLatencyMs(null);
    setCached(false);
    
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          provider: llmConfig.providerId,
          model: llmConfig.modelId,
          customApiKey: llmConfig.apiKey || undefined,
          customBaseUrl: llmConfig.baseUrl || undefined,
        }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error?.detail || data.error?.message || 'Unknown error');
      }
      
      setResponse(data.result);
      setLatencyMs(data.metadata?.latencyMs);
      setCached(data.metadata?.cached || false);
      
      if (data.usage) {
        setUsage(data.usage);
      }
    } catch (err) {
      console.error('Error calling LLM:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header with Dark Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Link>
        <DarkModeButton />
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Multi-Provider LLM Test
        </h1>
        <p className="text-muted-foreground">
          Test the portable LLM module with various AI providers
        </p>
      </div>

      {/* Provider Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">🤖 LLM Configuration</CardTitle>
          <CardDescription>Select provider and model to test</CardDescription>
        </CardHeader>
        <CardContent>
          <LLMProviderSelector
            onConfigChange={handleConfigChange}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* Prompt Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">📝 Prompt</CardTitle>
          <CardDescription>Enter your test prompt</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            className="min-h-[150px]"
          />
        </CardContent>
      </Card>

      {/* Submit and Results */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">🚀 Test LLM</CardTitle>
          <CardDescription>
            Using: <code className="px-1 bg-muted rounded">{llmConfig.providerId}</code> / <code className="px-1 bg-muted rounded">{llmConfig.modelId}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSubmit}
            disabled={loading || !prompt.trim() || !llmConfig.providerId || !llmConfig.modelId}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit Prompt'
            )}
          </Button>

          {/* Metadata */}
          {(usage || latencyMs || cached) && (
            <div className="flex flex-wrap gap-3 p-3 bg-muted/50 rounded-lg">
              {cached && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Cached
                </Badge>
              )}
              {latencyMs && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {latencyMs}ms
                </Badge>
              )}
              {usage && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {usage.inputTokens} in / {usage.outputTokens} out
                </Badge>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive mb-1">Error</h4>
                  <p className="text-sm text-destructive/80 whitespace-pre-wrap">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="mt-2 text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="space-y-2">
              <h4 className="font-medium text-green-600 dark:text-green-400">Response:</h4>
              <div className="p-4 bg-card border rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{response}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Providers Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📚 Supported Providers</CardTitle>
          <CardDescription>All providers available in the llm/ module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-3 bg-muted rounded-lg text-center">🤖 OpenAI</div>
            <div className="p-3 bg-muted rounded-lg text-center">🔮 Anthropic</div>
            <div className="p-3 bg-muted rounded-lg text-center">💫 Google</div>
            <div className="p-3 bg-muted rounded-lg text-center">⚡ Groq</div>
            <div className="p-3 bg-muted rounded-lg text-center">🦙 Ollama</div>
            <div className="p-3 bg-muted rounded-lg text-center">🌐 OpenRouter</div>
            <div className="p-3 bg-muted rounded-lg text-center">✖️ xAI</div>
            <div className="p-3 bg-muted rounded-lg text-center">☁️ Azure</div>
          </div>
          
          <Separator className="my-4" />
          
          <p className="text-sm text-muted-foreground">
            The Multi-Provider API uses the portable <code className="px-1 bg-muted rounded">callLLM</code> function 
            which routes to the appropriate SDK based on provider. All calls go through <code className="px-1 bg-muted rounded">/api/llm</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
