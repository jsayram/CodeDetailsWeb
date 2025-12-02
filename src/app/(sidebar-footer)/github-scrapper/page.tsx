'use client';

import React, { useState, useCallback } from 'react';
import { useAuth, SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderGit2,
  Play,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { LLMProviderSelector } from '@/components/llm/LLMProviderSelector';
import { CodeParticlesElement } from '@/components/Elements/CodeParticlesElement';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { HeaderSection } from '@/components/layout/HeaderSection';
import { FooterSection } from '@/components/layout/FooterSection';
import { PageBanner } from '@/components/ui/page-banner';
import { useSupabaseToken } from '@/hooks/use-SupabaseClerkJWTToken';
import { ProjectsProvider } from '@/providers/projects-provider';
import { isValidGitHubUrl } from '@/repoScrapper';

interface LLMConfig {
  providerId: string;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
}

interface GenerationProgress {
  stage: string;
  message: string;
  progress: number;
  currentChapter?: number;
  totalChapters?: number;
  chapterName?: string;
}

interface GeneratedDoc {
  projectName: string;
  projectSlug: string;
  chapters: Array<{
    filename: string;
    title: string;
  }>;
}

function GitHubScrapperContent() {
  const { isSignedIn } = useAuth();
  
  // Form state
  const [repoUrl, setRepoUrl] = useState('');
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    providerId: 'openai',
    modelId: 'gpt-4o-mini',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDoc | null>(null);
  
  // Validation
  const isValidUrl = repoUrl ? isValidGitHubUrl(repoUrl) : false;
  const canGenerate = isSignedIn && isValidUrl && llmConfig.providerId && llmConfig.modelId;

  // Handle LLM config changes
  const handleLLMConfigChange = useCallback((config: LLMConfig) => {
    setLlmConfig(config);
  }, []);

  // Handle form submission
  const handleGenerate = async () => {
    if (!canGenerate) return;
    
    setIsGenerating(true);
    setError(null);
    setProgress({ stage: 'initializing', message: 'Starting...', progress: 0 });
    
    try {
      const response = await fetch('/api/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          llmProvider: llmConfig.providerId,
          llmModel: llmConfig.modelId,
          llmApiKey: llmConfig.apiKey,
          llmBaseUrl: llmConfig.baseUrl,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Generation failed');
      }
      
      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }
      
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        
        // Parse SSE events
        const lines = fullResponse.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.progress) {
                setProgress(data.progress);
              }
              if (data.result) {
                setGeneratedDoc(data.result);
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore parse errors for partial JSON
            }
          }
        }
      }
      
      setProgress({ stage: 'complete', message: 'Documentation generated!', progress: 100 });
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    if (!generatedDoc) return;
    
    try {
      const response = await fetch(`/api/docs/${generatedDoc.projectSlug}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedDoc.projectName}-docs.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="flex justify-center w-full mb-10">
      <div className="w-full max-w-7xl mx-auto px-4 2xl:px-8 3xl:px-12">
        <div className="flex flex-col gap-6 mb-6 py-3">
          {/* Page Banner */}
          <div className="mb-4">
            <PageBanner
              icon={<FolderGit2 className="h-8 w-8 text-fuchsia-500" />}
              bannerTitle="GitHub Scrapper"
              description="Generate architecture documentation for any GitHub repository using AI"
              isUserBanner={false}
              gradientFrom="purple-900"
              gradientVia="fuchsia-800"
              gradientTo="pink-800"
              borderColor="border-purple-700/40"
              textGradient="from-purple-400 via-fuchsia-400 to-pink-400"
            />
          </div>

          {/* Code Particles Background */}
          <div className="relative">
            <CodeParticlesElement
              quantity="high"
              speed="slow"
              size="mixed"
              includeEmojis={true}
              includeKeywords={true}
              includeSymbols={true}
              syntaxHighlight="vscode"
              depth="layered"
              containerClassName="absolute inset-0 -z-5 pointer-events-none opacity-20"
            />

            {/* Main Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative z-10"
            >
            <Card className="backdrop-blur-sm bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generate Documentation
                </CardTitle>
                <CardDescription>
                  Enter a GitHub repository URL to generate architecture documentation
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Auth Check */}
                <SignedOut>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Authentication Required</AlertTitle>
                    <AlertDescription>
                      Please sign in to generate documentation.
                      <SignInButton mode="modal">
                        <Button variant="link" className="px-2 h-auto">
                          Sign In
                        </Button>
                      </SignInButton>
                    </AlertDescription>
                  </Alert>
                </SignedOut>

                <SignedIn>
                  {/* Repository URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="repo-url">GitHub Repository URL</Label>
                    <Input
                      id="repo-url"
                      placeholder="https://github.com/owner/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      disabled={isGenerating}
                      className={repoUrl && !isValidUrl ? 'border-destructive' : ''}
                    />
                    {repoUrl && !isValidUrl && (
                      <p className="text-sm text-destructive">
                        Please enter a valid GitHub repository URL
                      </p>
                    )}
                  </div>

                  {/* LLM Provider Selection */}
                  <div className="space-y-2">
                    <Label>LLM Provider & Model</Label>
                    <LLMProviderSelector
                      onConfigChange={handleLLMConfigChange}
                      disabled={isGenerating}
                      showTestButton={false}
                    />
                  </div>

                  {/* Advanced Options */}
                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Advanced Options
                        </span>
                        <Badge variant="outline">{showAdvanced ? 'Hide' : 'Show'}</Badge>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Advanced options like custom file patterns and exclusions coming soon.
                        </AlertDescription>
                      </Alert>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />

                  {/* Progress Display */}
                  <AnimatePresence>
                    {progress && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{progress.message}</span>
                          <span className="text-sm text-muted-foreground">{progress.progress}%</span>
                        </div>
                        <Progress value={progress.progress} className="h-2" />
                        {progress.currentChapter && progress.totalChapters && (
                          <p className="text-xs text-muted-foreground">
                            Chapter {progress.currentChapter} of {progress.totalChapters}
                            {progress.chapterName && `: ${progress.chapterName}`}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Display */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Generation Failed</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Success Display */}
                  {generatedDoc && (
                    <Alert className="border-green-500 bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertTitle>Documentation Generated!</AlertTitle>
                      <AlertDescription className="mt-2">
                        <p className="mb-2">
                          Generated {generatedDoc.chapters.length} chapters for{' '}
                          <strong>{generatedDoc.projectName}</strong>
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" asChild>
                            <a href={`/github-scrapper/docs/${generatedDoc.projectSlug}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Docs
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleDownloadZip}>
                            <Download className="h-4 w-4 mr-2" />
                            Download ZIP
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate || isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Generating Documentation...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Generate Documentation
                      </>
                    )}
                  </Button>
                </SignedIn>
              </CardContent>
            </Card>
            </motion.div>

            {/* Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-8 relative z-10"
            >
              <Card className="backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg">How it Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="step-1">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">1</Badge>
                          Repository Analysis
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        The system crawls the GitHub repository, extracting file signatures,
                        interfaces, and key code structures. Large files are automatically
                        truncated to focus on important patterns.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="step-2">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">2</Badge>
                          Abstraction Identification
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        AI identifies the major subsystems and architectural components
                        that define what the project does. This includes entry points,
                        core logic, data models, and external integrations.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="step-3">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">3</Badge>
                          Relationship Mapping
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        The system analyzes how components interact with each other,
                        creating a comprehensive map of dependencies and data flows.
                        This produces Mermaid diagrams showing the architecture.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="step-4">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">4</Badge>
                          Documentation Generation
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        Each subsystem gets a detailed chapter explaining its purpose,
                        implementation, and usage. Chapters include code examples,
                        flowcharts, and sequence diagrams.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GitHubScrapperPage() {
  const { user } = useUser();
  const { token } = useSupabaseToken();

  return (
    <ProjectsProvider token={token} userId={user?.id ?? null}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderSection />
          <GitHubScrapperContent />
          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </ProjectsProvider>
  );
}
