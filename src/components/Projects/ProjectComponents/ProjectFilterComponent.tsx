import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectFilterComponentProps {
  onFilterChange: (filters: {
    sortBy?: string;
    difficulty?: string;
    showMyProjects?: boolean;
  }) => void;
  showFilters?: boolean;
  initialFilters: {
    sortBy: string;
    difficulty: string;
    showMyProjects: boolean;
  };
}

export function ProjectFilterComponent({
  onFilterChange,
  showFilters = true,
  initialFilters,
}: ProjectFilterComponentProps) {
  if (!showFilters) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Select
        value={initialFilters.sortBy}
        onValueChange={(value) => onFilterChange({ sortBy: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="recently-edited">Recently Edited</SelectItem>
          <SelectItem value="popular">Most Popular</SelectItem>
          <SelectItem value="alphabetical">A-Z</SelectItem>
          <SelectItem value="alphabetical-desc">Z-A</SelectItem>
          <SelectItem value="most-tagged">Most Tagged</SelectItem>
          <SelectItem value="least-favorited">Least Popular</SelectItem>
          <SelectItem value="trending">Trending</SelectItem>
          <SelectItem value="random">Random</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={initialFilters.difficulty}
        onValueChange={(value) => onFilterChange({ difficulty: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Difficulties</SelectItem>
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="advanced">Advanced</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="show-my-projects"
          className="rounded border-gray-300 text-primary focus:ring-primary"
          checked={initialFilters.showMyProjects}
          onChange={(e) => onFilterChange({ showMyProjects: e.target.checked })}
        />
        <label htmlFor="show-my-projects" className="text-sm">
          Show my projects only
        </label>
      </div>
    </div>
  );
}
