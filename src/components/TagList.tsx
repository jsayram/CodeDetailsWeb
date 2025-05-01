"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTags } from "@/app/actions/tags";
import type { TagInfo } from "@/db/operations/tag-operations";
import { GenericLoadingState } from "@/components/LoadingState/GenericLoadingState";
import { Input } from "@/components/ui/input";

export function TagList() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickedTag, setClickedTag] = useState<string | null>(null);
  const router = useRouter();

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const allTags = await getTags();
      setTags(allTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tags");
      console.error("Error fetching tags:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleTagClick = (tagName: string) => {
    setClickedTag(tagName);
    router.push(`/tags/${encodeURIComponent(tagName)}`);
  };

  // Filter tags based on search query
  const filteredTags = tags.filter((tag) => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    return tag.name.toLowerCase().includes(searchLower);
  });

  // Separate filtered tags into active and inactive
  const activeTags = filteredTags.filter((tag) => (tag.count ?? 0) > 0);
  const inactiveTags = filteredTags.filter(
    (tag) => !tag.count || tag.count === 0
  );

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
    <div className="space-y-8">
      {/* Search Input */}
      <div className="flex gap-4 items-center">
        <Input
          type="search"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Active Tags Section */}
      <section className="transition-all">
        <h2 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary/80 to-primary text-transparent bg-clip-text">
          Active Tags ({activeTags.length})
        </h2>
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          role="list"
        >
          {activeTags.map((tag) => (
            <div
              key={tag.id}
              className="group relative bg-card hover:bg-primary/5 hover:border-primary/20 border border-border
                text-card-foreground rounded-lg p-4 shadow-sm transition-all duration-200 
                hover:shadow-md cursor-pointer transform hover:-translate-y-0.5"
              role="listitem"
              onClick={() => handleTagClick(tag.name)}
            >
              <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                {clickedTag === tag.name ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    #{tag.name}
                  </span>
                ) : (
                  <>#{tag.name}</>
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary/60"></span>
                {tag.count} project{tag.count === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Inactive Tags Section */}
      {inactiveTags.length > 0 && !searchQuery && (
        <section className="transition-all">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            Tags Without Projects ({inactiveTags.length})
          </h2>
          <div className="bg-muted/30 rounded-lg p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Be the first to create projects for these tags! 🚀
            </p>
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              role="list"
            >
              {inactiveTags.map((tag) => (
                <div
                  key={tag.id}
                  className="bg-background/50 text-muted-foreground/60
                    rounded-lg p-3 shadow-sm select-none
                    border border-dashed border-muted-foreground/20
                    hover:border-primary/20 hover:text-muted-foreground/80 transition-all duration-200"
                  role="listitem"
                  aria-disabled="true"
                >
                  <h3 className="text-sm font-medium">#{tag.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No results message */}
      {searchQuery && filteredTags.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No tags found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
