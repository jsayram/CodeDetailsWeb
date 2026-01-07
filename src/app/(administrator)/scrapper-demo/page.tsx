'use client';

/**
 * Repository Scrapper Demo Page
 * 
 * Admin page for testing the portable repoScrapper/ module.
 * Demonstrates GitHub repository crawling and file analysis.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DarkModeButton } from '@/components/DarkModeButtonComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Loader2, 
  FolderGit2, 
  FileCode, 
  FileText, 
  Clock,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  FileSearch,
} from 'lucide-react';
import {
  includedPatternCategories,
  excludedPatternCategories,
} from '@/repoScrapper/patterns';
import type { PatternCategory } from '@/repoScrapper';

interface CrawlResult {
  success: boolean;
  files?: Array<{
    path: string;
    content: string;
    size: number;
    language?: string;
  }>;
  stats?: {
    totalFiles: number;
    totalSize: number;
    languages: Record<string, number>;
  };
  error?: string;
  latencyMs?: number;
}

export default function ScrapperDemoPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('patterns');

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) return;
    
    setLoading(true);
    setResult(null);
    setSelectedFile(null);
    
    const startTime = Date.now();
    
    try {
      const res = await fetch('/api/repo/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          githubToken: githubToken || undefined,
        }),
      });
      
      const data = await res.json();
      
      setResult({
        ...data,
        latencyMs: Date.now() - startTime,
      });
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        latencyMs: Date.now() - startTime,
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'go', 'rs'].includes(ext || '')) {
      return <FileCode className="h-4 w-4 text-blue-500" />;
    }
    if (['md', 'txt', 'json', 'yaml', 'yml'].includes(ext || '')) {
      return <FileText className="h-4 w-4 text-green-500" />;
    }
    return <FileSearch className="h-4 w-4 text-gray-500" />;
  };

  const renderPatternCategory = (category: PatternCategory) => (
    <div key={category.label} className="space-y-2">
      <h4 className="font-medium text-sm">{category.label}</h4>
      <p className="text-xs text-muted-foreground">{category.description}</p>
      <div className="flex flex-wrap gap-1">
        {category.pattern.map((p: string) => (
          <Badge key={p} variant="outline" className="text-[10px] font-mono">
            {p}
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-6xl">
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
          <FolderGit2 className="h-8 w-8 text-primary" />
          Repository Scrapper Demo
        </h1>
        <p className="text-muted-foreground">
          Test the portable repoScrapper/ module for GitHub repository crawling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Input & Patterns */}
        <div className="lg:col-span-1 space-y-6">
          {/* Repository Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Repository
              </CardTitle>
              <CardDescription>Enter a GitHub repository URL to crawl</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCrawl} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="repoUrl" className="text-sm font-medium">Repository URL</label>
                  <Input
                    id="repoUrl"
                    placeholder="https://github.com/owner/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="token" className="text-sm font-medium">GitHub Token (optional)</label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="ghp_xxxx (for private repos)"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for private repositories or higher rate limits
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading || !repoUrl.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Crawling...
                    </>
                  ) : (
                    <>
                      <FolderGit2 className="h-4 w-4 mr-2" />
                      Crawl Repository
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Pattern Browser */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📁 File Patterns</CardTitle>
              <CardDescription>Patterns used for file filtering</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="patterns" className="flex-1">Include</TabsTrigger>
                  <TabsTrigger value="exclude" className="flex-1">Exclude</TabsTrigger>
                </TabsList>
                
                <TabsContent value="patterns">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {includedPatternCategories.map(renderPatternCategory)}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="exclude">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {excludedPatternCategories.map(renderPatternCategory)}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Results
                </span>
                {result?.latencyMs && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {result.latencyMs}ms
                  </Badge>
                )}
              </CardTitle>
              {result?.stats && (
                <CardDescription>
                  {result.stats.totalFiles} files, {(result.stats.totalSize / 1024).toFixed(1)} KB total
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Crawling repository...</p>
                  <p className="text-sm">This may take a moment for large repos</p>
                </div>
              )}

              {/* Error State */}
              {result?.error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-destructive mb-1">Error</h4>
                      <p className="text-sm text-destructive/80">{result.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State */}
              {result?.success && result.files && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
                  {/* File List */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-2 bg-muted border-b">
                      <h4 className="text-sm font-medium">Files ({result.files.length})</h4>
                    </div>
                    <ScrollArea className="h-[450px]">
                      <div className="p-2 space-y-1">
                        {result.files.map((file) => (
                          <button
                            key={file.path}
                            onClick={() => setSelectedFile(file.path)}
                            className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 hover:bg-accent transition-colors ${
                              selectedFile === file.path ? 'bg-accent' : ''
                            }`}
                          >
                            {getFileIcon(file.path)}
                            <span className="truncate flex-1">{file.path}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {(file.size / 1024).toFixed(1)}KB
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* File Content Preview */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-2 bg-muted border-b">
                      <h4 className="text-sm font-medium truncate">
                        {selectedFile || 'Select a file'}
                      </h4>
                    </div>
                    <ScrollArea className="h-[450px]">
                      {selectedFile ? (
                        <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
                          {result.files.find(f => f.path === selectedFile)?.content || 'No content'}
                        </pre>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p className="text-sm">Select a file to preview</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && !result && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FolderGit2 className="h-12 w-12 mb-4 opacity-50" />
                  <p>Enter a repository URL and click &quot;Crawl Repository&quot;</p>
                  <p className="text-sm">Supports public and private GitHub repositories</p>
                </div>
              )}

              {/* Stats */}
              {result?.stats?.languages && Object.keys(result.stats.languages).length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.stats.languages).map(([lang, count]) => (
                        <Badge key={lang} variant="secondary">
                          {lang}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">📚 About the Scrapper Module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-1">🕷️ Crawler</h4>
              <p className="text-muted-foreground text-xs">
                Pure function that crawls GitHub repos via API with pattern filtering
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-1">💾 Cache</h4>
              <p className="text-muted-foreground text-xs">
                Pluggable storage adapters (localStorage, Postgres/Supabase)
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-1">🔧 Generator</h4>
              <p className="text-muted-foreground text-xs">
                LLM prompts and utilities for content generation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
