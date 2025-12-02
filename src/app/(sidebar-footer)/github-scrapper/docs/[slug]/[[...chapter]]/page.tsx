'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderGit2,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
  List,
  Github,
  Calendar,
  Bot,
  Edit3,
  Save,
  X,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { DocumentationViewer } from '@/components/created_mds';
import { CodeParticlesElement } from '@/components/Elements/CodeParticlesElement';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { HeaderSection } from '@/components/layout/HeaderSection';
import { FooterSection } from '@/components/layout/FooterSection';
import { PageBanner } from '@/components/ui/page-banner';
import { useUser } from '@clerk/nextjs';
import { useSupabaseToken } from '@/hooks/use-SupabaseClerkJWTToken';
import { ProjectsProvider } from '@/providers/projects-provider';
import { useDocChapters } from '@/providers/doc-chapters-provider';

interface ProjectMeta {
  userId: string;
  repoUrl: string;
  projectName: string;
  createdAt: string;
  chapters: string[];
  llmProvider?: string;
  llmModel?: string;
}

interface ChapterInfo {
  filename: string;
  title: string;
  order: number;
}

interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

export default function DocViewerPage() {
  const { user } = useUser();
  const { token } = useSupabaseToken();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const projectSlug = params.slug as string;
  const chapterFile = (params.chapter as string[] | undefined)?.[0] || '-1_overview.md';
  const isEditMode = searchParams.get('edit') === 'true';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [chapters, setChaptersState] = useState<ChapterInfo[]>([]);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeHeading, setActiveHeading] = useState<string>('');
  
  // Check if user owns this documentation
  const isOwner = meta?.userId === user?.id;
  
  // Use the doc chapters context to share with sidebar
  const { setChapters, setCurrentChapter, setProjectMeta, setIsDocPage } = useDocChapters();
  
  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    const url = new URL(window.location.href);
    if (isEditMode) {
      url.searchParams.delete('edit');
    } else {
      url.searchParams.set('edit', 'true');
      setEditContent(currentContent);
    }
    router.replace(url.pathname + url.search, { scroll: false });
  }, [isEditMode, router, currentContent]);
  
  // Save edited content
  const handleSave = async () => {
    if (!isOwner) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const response = await fetch(`/api/docs/${projectSlug}/${chapterFile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.detail || 'Failed to save changes');
      }
      
      // Update the displayed content
      setCurrentContent(editContent);
      
      // Exit edit mode
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      router.replace(url.pathname + url.search, { scroll: false });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Extract headings from markdown content for TOC
  const tocHeadings = useMemo<TOCHeading[]>(() => {
    if (!currentContent) return [];
    
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const headings: TOCHeading[] = [];
    const idCounts = new Map<string, number>();
    let match;
    
    while ((match = headingRegex.exec(currentContent)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      // Create a URL-friendly ID
      let id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      
      // Ensure unique IDs by appending a counter if duplicate
      const count = idCounts.get(id) || 0;
      idCounts.set(id, count + 1);
      if (count > 0) {
        id = `${id}-${count}`;
      }
      
      headings.push({ id, text, level });
    }
    
    return headings;
  }, [currentContent]);
  
  // Scroll to heading
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveHeading(id);
    }
  }, []);
  
  // Current chapter index
  const currentChapterIndex = chapters.findIndex(
    (c) => c.filename === chapterFile
  );
  
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;
  
  // Load project metadata
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const response = await fetch(`/api/docs/${projectSlug}/meta`);
        if (!response.ok) {
          throw new Error('Project not found');
        }
        const data = await response.json();
        setMeta(data);
        
        // Build chapters list (overview + numbered chapters)
        const chapterList: ChapterInfo[] = [
          { filename: '-1_overview.md', title: 'Overview', order: -1 },
        ];
        
        // Add chapters from metadata
        if (data.chapters && Array.isArray(data.chapters)) {
          for (const chapter of data.chapters) {
            if (typeof chapter === 'object' && chapter.filename) {
              chapterList.push({
                filename: chapter.filename,
                title: chapter.title || chapter.filename.replace(/^\d+_/, '').replace(/\.md$/, '').replace(/-/g, ' '),
                order: chapter.order ?? 0,
              });
            } else if (typeof chapter === 'string') {
              // Handle legacy format where chapters is string[]
              const match = chapter.match(/^(\d+)_(.+)\.md$/);
              if (match) {
                const order = parseInt(match[1], 10);
                const title = match[2].replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                chapterList.push({ filename: chapter, title, order });
              }
            }
          }
        }
        
        const sortedChapters = chapterList.sort((a, b) => a.order - b.order);
        setChaptersState(sortedChapters);
        
        // Update the context for sidebar
        setChapters(sortedChapters);
        setProjectMeta({
          projectName: data.projectName,
          repoUrl: data.repoUrl,
          projectSlug,
        });
        setIsDocPage(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      }
    };
    
    loadMeta();
    
    // Cleanup: reset doc page state when leaving
    return () => {
      setIsDocPage(false);
      setChapters([]);
      setProjectMeta(null);
    };
  }, [projectSlug, setChapters, setProjectMeta, setIsDocPage]);
  
  // Update current chapter in context when it changes
  useEffect(() => {
    setCurrentChapter(chapterFile);
  }, [chapterFile, setCurrentChapter]);
  
  // Load chapter content
  useEffect(() => {
    const loadChapter = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/docs/${projectSlug}/${chapterFile}`);
        if (!response.ok) {
          throw new Error('Chapter not found');
        }
        const content = await response.text();
        setCurrentContent(content);
        // Also set editContent if we're in edit mode (e.g., navigated directly with ?edit=true)
        if (isEditMode) {
          setEditContent(content);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter');
      } finally {
        setLoading(false);
      }
    };
    
    if (projectSlug) {
      loadChapter();
    }
  }, [projectSlug, chapterFile, isEditMode]);
  
  // Handle chapter navigation
  const navigateToChapter = (filename: string) => {
    if (filename === '-1_overview.md') {
      router.push(`/github-scrapper/docs/${projectSlug}`);
    } else {
      router.push(`/github-scrapper/docs/${projectSlug}/${filename}`);
    }
  };
  
  // Error state - still wrap in proper layout
  if (error && !meta) {
    return (
      <ProjectsProvider token={token} userId={user?.id ?? null}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <HeaderSection />
            <main className="flex-1 px-4 py-12">
              <div className="container mx-auto max-w-4xl">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="mt-4">
                  <Button asChild>
                    <Link href="/github-scrapper">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back to GitHub Scrapper
                    </Link>
                  </Button>
                </div>
              </div>
            </main>
            <FooterSection />
          </SidebarInset>
        </SidebarProvider>
      </ProjectsProvider>
    );
  }
  
  return (
    <ProjectsProvider token={token} userId={user?.id ?? null}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderSection />
          
          <div className="flex justify-center w-full mb-20">
            <div className="w-full max-w-7xl mx-auto px-4 2xl:px-8 3xl:px-12">
              <div className="flex flex-col gap-6 mb-6 py-3">
                {/* Page Banner - Matching tags page style (purple/indigo theme) */}
                <PageBanner
                  icon={<FolderGit2 className="h-8 w-8 text-primary" />}
                  bannerTitle={meta?.projectName || projectSlug}
                  description={
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      {meta?.repoUrl && (
                        <a 
                          href={meta.repoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm hover:underline"
                        >
                          <Github className="h-4 w-4" /> View Repository <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {meta?.llmProvider && (
                        <span className="flex items-center gap-1 text-sm">
                          <Bot className="h-4 w-4" /> {meta.llmProvider}{meta.llmModel ? ` / ${meta.llmModel}` : ''}
                        </span>
                      )}
                      {meta?.createdAt && (
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" /> {new Date(meta.createdAt).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-sm">
                        <FileText className="h-4 w-4" /> {chapters.length} Chapters
                      </span>
                    </div>
                  }
                  isUserBanner={false}
                  gradientFrom="purple-900"
                  gradientVia="indigo-800"
                  gradientTo="blue-800"
                  borderColor="border-purple-700/40"
                  textGradient="from-fuchsia-400 via-purple-400 to-indigo-400"
                />
              </div>
              
              <CodeParticlesElement
                quantity="medium"
                speed="slow"
                size="medium"
                includeKeywords={true}
                syntaxHighlight="vscode"
                depth="layered"
                opacityRange={[0.01, 0.1]}
                lightModeOpacityRange={[0.01, 0.2]}
                containerClassName="pointer-events-none"
              />
              
              {/* Main Content Area with TOC */}
              <div className="relative z-10 flex gap-8">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center py-20"
                      >
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </motion.div>
                    ) : error ? (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error Loading Chapter</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        {/* Edit/View Toggle for Owner */}
                        {isOwner && (
                          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{chapterFile}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isEditMode ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleEditMode}
                                    disabled={isSaving}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"
                                  >
                                    {isSaving ? (
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4 mr-1" />
                                    )}
                                    Save Changes
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={toggleEditMode}
                                >
                                  <Edit3 className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Save Error Alert */}
                        {saveError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error Saving</AlertTitle>
                            <AlertDescription>{saveError}</AlertDescription>
                          </Alert>
                        )}
                        
                        {/* Edit Mode or View Mode */}
                        {isEditMode && isOwner ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Edit3 className="h-4 w-4" />
                              <span>Editing markdown content</span>
                            </div>
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[500px] font-mono text-sm bg-background/50 resize-y"
                              placeholder="Enter markdown content..."
                            />
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Preview:</span>
                            </div>
                            <div className="border rounded-lg p-4 bg-background/50">
                              <DocumentationViewer content={editContent} projectSlug={projectSlug} />
                            </div>
                          </div>
                        ) : (
                          <DocumentationViewer content={currentContent} projectSlug={projectSlug} />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Navigation Footer */}
                  {!loading && !error && (
                    <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-6 border-t">
                      {/* Previous Button */}
                      <div className="w-full sm:w-auto order-2 sm:order-1">
                        {prevChapter ? (
                          <Button
                            variant="outline"
                            type="button"
                            className="w-full sm:w-auto cursor-pointer hover:bg-accent"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigateToChapter(prevChapter.filename);
                            }}
                          >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            <span className="max-w-[150px] truncate">{prevChapter.title}</span>
                          </Button>
                        ) : (
                          <div className="hidden sm:block" />
                        )}
                      </div>
                      
                      {/* Download Button - Hidden on mobile, centered */}
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="hidden sm:flex cursor-pointer hover:bg-accent order-3 sm:order-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(`/api/docs/${projectSlug}/download`, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download All
                      </Button>
                      
                      {/* Next Button */}
                      <div className="w-full sm:w-auto order-1 sm:order-3">
                        {nextChapter ? (
                          <Button 
                            type="button"
                            className="w-full sm:w-auto cursor-pointer hover:bg-primary/90"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigateToChapter(nextChapter.filename);
                            }}
                          >
                            <span className="max-w-[150px] truncate">{nextChapter.title}</span>
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        ) : (
                          <div className="hidden sm:block" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right Sidebar - Table of Contents (sticky) */}
                {!loading && !error && tocHeadings.length > 0 && (
                  <aside className="hidden xl:block w-64 shrink-0 relative">
                    <div className="sticky top-24 max-h-[calc(100vh-8rem)]">
                      <div className="bg-card/80 backdrop-blur-sm rounded-lg border p-4 flex flex-col max-h-[calc(100vh-10rem)]">
                        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground flex-shrink-0">
                          <List className="h-4 w-4" />
                          On this page
                        </div>
                        <nav className="space-y-1 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
                          {tocHeadings.map((heading, index) => (
                            <button
                              key={`${heading.id}-${index}`}
                              onClick={() => scrollToHeading(heading.id)}
                              type="button"
                              className={cn(
                                'block w-full text-left text-sm py-1.5 transition-colors cursor-pointer hover:text-foreground',
                                heading.level === 1 && 'font-medium',
                                heading.level === 2 && 'pl-3 text-muted-foreground',
                                heading.level === 3 && 'pl-6 text-muted-foreground text-xs',
                                activeHeading === heading.id
                                  ? 'text-primary font-medium'
                                  : 'text-muted-foreground'
                              )}
                            >
                              <span className="line-clamp-2">{heading.text}</span>
                            </button>
                          ))}
                        </nav>
                      </div>
                    </div>
                  </aside>
                )}
              </div>
            </div>
          </div>
          
          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </ProjectsProvider>
  );
}
