'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  Unlink,
  Sparkles,
  FolderGit2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
} from 'lucide-react';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';

interface LinkedDocInfo {
  hasLinkedDoc: boolean;
  linkedDoc?: {
    docSlug: string;
    projectName: string;
    repoUrl: string;
    repoOwner: string;
    repoName: string;
    branch: string;
    createdAt: string;
    chapterCount: number;
    chapters: Array<{ filename: string; title: string; order: number }>;
    llmProvider?: string;
    llmModel?: string;
  } | null;
}

interface LinkedDocumentationSectionProps {
  projectSlug: string;
  isOwner: boolean;
}

// Fetcher for SWR - unwraps the success() wrapper
const fetcher = async (url: string): Promise<LinkedDocInfo> => {
  const res = await fetch(url);
  const json = await res.json();
  // API returns { success: true, data: { hasLinkedDoc, linkedDoc } }
  return json.data ?? { hasLinkedDoc: false, linkedDoc: null };
};

export function LinkedDocumentationSection({
  projectSlug,
  isOwner,
}: LinkedDocumentationSectionProps) {
  const { mutate } = useSWRConfig();
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

  // Fetch linked documentation using SWR for caching
  const { data, error, isLoading } = useSWR<LinkedDocInfo>(
    projectSlug ? `/api/projects/slug/${projectSlug}/linked-doc` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Handle unlinking
  const handleUnlink = async () => {
    if (!data?.linkedDoc?.docSlug) return;

    setIsUnlinking(true);
    try {
      const response = await fetch(`/api/docs/${data.linkedDoc.docSlug}/link-project`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unlink documentation');
      }

      // Invalidate caches
      mutate(`/api/projects/slug/${projectSlug}/linked-doc`);
      mutate('/api/docs');
    } catch (err) {
      console.error('Unlink error:', err);
    } finally {
      setIsUnlinking(false);
    }
  };

  // Don't render anything while loading or if no data
  if (isLoading) {
    return (
      <section id="architecture-docs" className="mb-6 sm:mb-8">
        <Card className="overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-pink-500/5">
          <CardContent className="py-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </CardContent>
        </Card>
      </section>
    );
  }

  // If there's no linked doc and user is not owner, don't show anything
  if (!data?.hasLinkedDoc && !isOwner) {
    return null;
  }

  // Empty state for owner - encourage them to generate docs
  if (!data?.hasLinkedDoc && isOwner) {
    return (
      <section id="architecture-docs" className="mb-6 sm:mb-8">
        <Card className="overflow-hidden border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-pink-500/5">
          <CardContent className="py-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Add Architecture Documentation</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Generate AI-powered documentation for your project&apos;s GitHub repository
                  and link it here to help others understand your codebase.
                </p>
              </div>
              <Button
                asChild
                className="mt-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"
              >
                <Link href="/github-scrapper">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Documentation
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Has linked documentation
  const linkedDoc = data?.linkedDoc;
  if (!linkedDoc) return null;

  return (
    <section id="architecture-docs" className="mb-6 sm:mb-8">
      <Card className="overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-pink-500/5 hover:border-purple-500/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  Architecture Documentation
                  <Badge 
                    variant="outline" 
                    className="bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border-purple-500/30 text-purple-400 text-xs"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Deep-dive documentation explaining the codebase architecture
                </CardDescription>
              </div>
            </div>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                    disabled={isUnlinking}
                  >
                    {isUnlinking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Unlink className="h-4 w-4 mr-1" />
                        Unlink
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unlink Documentation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the documentation from this project page.
                      The documentation itself will not be deleted and can be linked again later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-orange-600 text-white hover:bg-orange-500"
                      onClick={handleUnlink}
                    >
                      Unlink
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Stats row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FolderGit2 className="h-4 w-4" />
                {linkedDoc.repoOwner}/{linkedDoc.repoName}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {linkedDoc.chapterCount} chapters
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(linkedDoc.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10"
              >
                <a
                  href={linkedDoc.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Repository
                </a>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-md shadow-purple-500/20"
              >
                <Link href={`/github-scrapper/docs/${linkedDoc.docSlug}`}>
                  <BookOpen className="h-4 w-4 mr-1" />
                  Read Documentation
                </Link>
              </Button>
            </div>
          </div>

          {/* Chapters List - Collapsible for owners */}
          {isOwner && linkedDoc.chapters && linkedDoc.chapters.length > 0 && (
            <Collapsible open={showChapters} onOpenChange={setShowChapters}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between hover:bg-purple-500/10 border border-dashed border-purple-500/30"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">
                      Manage Chapters ({linkedDoc.chapters.length} files)
                    </span>
                  </span>
                  {showChapters ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="rounded-lg border border-purple-500/20 bg-muted/30 overflow-hidden">
                  <div className="px-4 py-2 bg-purple-500/5 border-b border-purple-500/20">
                    <p className="text-xs text-muted-foreground">
                      Click on a chapter to view or edit its content
                    </p>
                  </div>
                  <ScrollArea className="max-h-[300px]">
                    <div className="divide-y divide-border/50">
                      {linkedDoc.chapters
                        .sort((a, b) => a.order - b.order)
                        .map((chapter, index) => (
                          <div
                            key={chapter.filename}
                            className="flex items-center justify-between px-4 py-3 hover:bg-purple-500/5 transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-purple-500">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate" title={chapter.title}>
                                  {chapter.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate" title={chapter.filename}>
                                  {chapter.filename}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-purple-500"
                              >
                                <Link
                                  href={`/github-scrapper/docs/${linkedDoc.docSlug}/${chapter.filename}`}
                                  title="View chapter"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-purple-500"
                              >
                                <Link
                                  href={`/github-scrapper/docs/${linkedDoc.docSlug}/${chapter.filename}?edit=true`}
                                  title="Edit chapter"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
