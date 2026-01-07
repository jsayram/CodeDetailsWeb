'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ChapterInfo {
  filename: string;
  title: string;
  order: number;
}

interface ProjectMeta {
  projectName: string;
  repoUrl: string;
  projectSlug: string;
}

interface DocChaptersContextType {
  chapters: ChapterInfo[];
  setChapters: (chapters: ChapterInfo[]) => void;
  currentChapter: string | null;
  setCurrentChapter: (chapter: string | null) => void;
  projectMeta: ProjectMeta | null;
  setProjectMeta: (meta: ProjectMeta | null) => void;
  isDocPage: boolean;
  setIsDocPage: (isDocPage: boolean) => void;
}

const DocChaptersContext = createContext<DocChaptersContextType | null>(null);

export function DocChaptersProvider({ children }: { children: React.ReactNode }) {
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
  const [projectMeta, setProjectMeta] = useState<ProjectMeta | null>(null);
  const [isDocPage, setIsDocPage] = useState(false);

  return (
    <DocChaptersContext.Provider
      value={{
        chapters,
        setChapters,
        currentChapter,
        setCurrentChapter,
        projectMeta,
        setProjectMeta,
        isDocPage,
        setIsDocPage,
      }}
    >
      {children}
    </DocChaptersContext.Provider>
  );
}

export function useDocChapters() {
  const context = useContext(DocChaptersContext);
  if (!context) {
    // Return a safe default if not in provider (for pages that don't use it)
    return {
      chapters: [],
      setChapters: () => {},
      currentChapter: null,
      setCurrentChapter: () => {},
      projectMeta: null,
      setProjectMeta: () => {},
      isDocPage: false,
      setIsDocPage: () => {},
    };
  }
  return context;
}
