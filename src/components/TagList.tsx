"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTags } from "@/app/actions/tags";
import type { TagInfo } from "@/db/operations/tag-operations";
import { GenericLoadingState } from "@/components/LoadingState/GenericLoadingState";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { HighlightText } from "@/components/HighlightText";

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
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200" />
        <Input
          type="search"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-base rounded-xl border-2 border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-md transition-all duration-200"
        />
      </div>

      {/* Active Tags Section */}
      <section className="transition-all">
        <h2 className="text-sm font-semibold mb-3 bg-gradient-to-r from-primary/80 to-primary text-transparent bg-clip-text">
          Active Tags ({activeTags.length})
        </h2>
        <div
          className="grid grid-cols-2 gap-2"
          role="list"
        >
          {activeTags.map((tag) => (
            <div
              key={tag.id}
              className="group relative bg-card hover:bg-primary/5 hover:border-primary/20 border border-border
                text-card-foreground rounded-md p-2.5 shadow-sm transition-all duration-200 
                hover:shadow-md cursor-pointer transform hover:-translate-y-0.5 min-w-0"
              role="listitem"
              onClick={() => handleTagClick(tag.name)}
            >
              <div className="flex items-center justify-between min-w-0">
                <h3 className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                  {clickedTag === tag.name ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      <span className="truncate">#<HighlightText text={tag.name} highlight={searchQuery} /></span>
                    </span>
                  ) : (
                    <span className="truncate">#<HighlightText text={tag.name} highlight={searchQuery} /></span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                  {tag.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Inactive Tags Section */}
      {inactiveTags.length > 0 && !searchQuery && (
        <section className="transition-all">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">
            Tags Without Projects ({inactiveTags.length})
          </h2>
          <div className="bg-muted/30 rounded-lg p-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Be the first to create projects for these tags! 🚀
            </p>
            <div
              className="grid grid-cols-2 gap-2"
              role="list"
            >
              {inactiveTags.map((tag) => (
                <div
                  key={tag.id}
                  className="bg-background/50 text-muted-foreground/60
                    rounded-md p-2 shadow-sm select-none
                    border border-dashed border-muted-foreground/20
                    hover:border-primary/20 hover:text-muted-foreground/80 transition-all duration-200 min-w-0"
                  role="listitem"
                  aria-disabled="true"
                >
                  <h3 className="text-sm font-medium truncate">#<HighlightText text={tag.name} highlight={searchQuery} /></h3>
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
