'use client';

import { useEffect, useState, useCallback } from 'react';
import { getTags } from '@/app/actions/tags';
import type { TagInfo } from '@/db/operations/tag-operations';
import { GenericLoadingState } from '@/components/LoadingState/GenericLoadingState';

export function TagList() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const allTags = await getTags();
      setTags(allTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tags');
      console.error('Error fetching tags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  if (isLoading) {
    return (
      <div aria-live="polite" aria-busy="true">
        <GenericLoadingState 
          type="card" 
          itemsCount={6} 
          className="animate-in fade-in-50"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4" role="alert" aria-live="polite">
        <div className="p-4 text-destructive bg-destructive/10 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4"
      role="list"
    >
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="bg-card hover:bg-accent text-card-foreground hover:text-accent-foreground 
                     rounded-lg p-3 shadow-sm transition-colors cursor-pointer"
          role="listitem"
        >
          <h3 className="text-sm font-medium">{tag.name}</h3>
        </div>
      ))}
    </div>
  );
}