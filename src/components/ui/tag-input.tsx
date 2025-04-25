import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Loader2 } from "lucide-react";
import { Tag } from "./tag";
import { TagInfo } from "@/db/operations/tag-operations";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface TagInputProps extends React.HTMLAttributes<HTMLDivElement> {
  tags: TagInfo[];
  onAddTag: (tagId: string) => Promise<void>;
  onRemoveTag: (tagId: string) => Promise<void>;
  searchTags: (query: string) => Promise<TagInfo[]>;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  searchTags,
  placeholder = "Add a tag...",
  disabled = false,
  className,
  ...props
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search for tag suggestions when input changes
  useEffect(() => {
    const search = async () => {
      if (inputValue.trim().length > 0) {
        setLoading(true);
        try {
          const results = await searchTags(inputValue);
          // Filter out tags that are already selected
          const filteredResults = results.filter(
            suggestion => !tags.some(tag => tag.id === suggestion.id)
          );
          setSuggestions(filteredResults);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error searching tags:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, searchTags, tags]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : -1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          await handleSelectTag(suggestions[selectedSuggestionIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  const handleSelectTag = async (tag: TagInfo) => {
    await onAddTag(tag.id);
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("w-full space-y-2", className)} {...props}>
      {/* Display selected tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <Tag 
            key={tag.id}
            variant="default"
            size="md"
            removable
            onRemove={() => onRemoveTag(tag.id)}
          >
            {tag.name}
          </Tag>
        ))}
      </div>
      
      {/* Tag input with suggestions */}
      <div className="relative" ref={containerRef}>
        <div className="flex w-full items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => inputValue.trim() && setShowSuggestions(true)}
              placeholder={placeholder}
              disabled={disabled || loading}
              className="w-full"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  className={cn(
                    "px-3 py-2 cursor-pointer hover:bg-accent",
                    selectedSuggestionIndex === index && "bg-accent"
                  )}
                  onClick={() => handleSelectTag(suggestion)}
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}