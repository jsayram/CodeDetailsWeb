'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  Unlink,
  Sparkles,
  FolderGit2,
  Calendar,
} from 'lucide-react';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';

interface LinkedDocInfo {
  hasLinkedDoc: boolean;
  doc?: {
    slug: string;
    projectName: string;
    repoUrl: string;
    createdAt: string;
    chapterCount: number;
  } | null;
}

interface LinkedDocumentationSectionProps {
  projectSlug: string;
  isOwner: boolean;
}

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LinkedDocumentationSection({
  projectSlug,
  isOwner,
}: LinkedDocumentationSectionProps) {
  const { mutate } = useSWRConfig();
  const [isUnlinking, setIsUnlinking] = useState(false);

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
    if (!data?.doc?.slug) return;

    setIsUnlinking(true);
    try {
      const response = await fetch(`/api/docs/${data.doc.slug}/link-project`, {
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
  const doc = data?.doc;
  if (!doc) return null;

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
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FolderGit2 className="h-4 w-4" />
                {doc.projectName}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {doc.chapterCount} chapters
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(doc.createdAt).toLocaleDateString()}
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
                  href={doc.repoUrl}
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
                <Link href={`/github-scrapper/docs/${doc.slug}`}>
                  <BookOpen className="h-4 w-4 mr-1" />
                  Read Documentation
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
