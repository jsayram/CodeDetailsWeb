"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Project } from "@/types/models/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Settings2, ChevronUp } from "lucide-react";
import { FormattedDate } from "@/lib/FormattedDate";
import {
  PROJECT_CATEGORIES,
  ProjectCategory,
} from "@/constants/project-categories";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/utils/stringUtils";
import { useAuth } from "@clerk/nextjs";
import { FavoriteButton } from "./FavoriteButton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

interface ProjectTableViewProps {
  projects: Project[];
  onViewDetails?: (id: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onDeleteProject?: (id: string, isPermanent?: boolean) => void;
  onUpdateProject?: (project: Project) => void;
}

interface SortConfig {
  key: keyof Project;
  direction: "asc" | "desc";
}

export function ProjectTableView({
  projects,
  onViewDetails,
  onToggleFavorite,
  onDeleteProject,
  onUpdateProject,
}: ProjectTableViewProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created_at",
    direction: "desc",
  });
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectTableHiddenColumns');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectTableColumnWidths');
      return saved ? JSON.parse(saved) : {
        title: 250,
        description: 300,
        category: 150,
        tags: 200,
        creator: 180,
        created_at: 150,
        actions: 180,
      };
    }
    return {
      title: 250,
      description: 300,
      category: 150,
      tags: 200,
      creator: 180,
      created_at: 150,
      actions: 180,
    };
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [navigatingProjectId, setNavigatingProjectId] = useState<string | null>(
    null
  );
  const [loadingTag, setLoadingTag] = useState<string | null>(null);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  const getDisplayName = (project: Project): string => {
    if (project.profile?.full_name) {
      return project.profile.full_name;
    }
    if (project.profile?.first_name || project.profile?.last_name) {
      return [project.profile.first_name, project.profile.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
    }
    return (
      project.profile?.username?.split("@")[0] ||
      project.profile?.email_address?.split("@")[0] ||
      "Unknown user"
    );
  };

  const initResizableDescription = (cell: HTMLElement) => {
    const content = cell.querySelector(
      ".table-description-content"
    ) as HTMLElement;
    const handle = cell.querySelector(".resize-handle") as HTMLElement;

    if (!content || !handle) return;

    let startY = 0;
    let startHeight = 0;
    let isResizing = false;

    const handleResize = (e: MouseEvent) => {
      if (!isResizing) return;

      requestAnimationFrame(() => {
        const delta = e.pageY - startY;
        const newHeight = Math.max(80, Math.min(400, startHeight + delta));
        content.style.height = `${newHeight}px`;
      });
    };

    const stopResize = () => {
      if (!isResizing) return;

      isResizing = false;
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
      document.body.style.cursor = "";
      handle.classList.remove("resizing");

      // Add transition back after resizing is done
      content.style.transition = "height 0.15s ease-out";
    };

    const startResize = (e: MouseEvent) => {
      // Prevent click event from bubbling to parent elements
      e.preventDefault();
      e.stopPropagation();

      isResizing = true;
      startY = e.pageY;
      startHeight = content.offsetHeight;

      // Remove transition during resize for better performance
      content.style.transition = "none";

      // Change cursor for entire document during resize
      document.body.style.cursor = "ns-resize";
      handle.classList.add("resizing");

      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
    };

    // Set initial height if not already set
    if (!content.style.height) {
      content.style.height = "80px";
    }

    // Clean up old event listener before adding new one
    handle.removeEventListener("mousedown", startResize);
    handle.addEventListener("mousedown", startResize);

    // Return cleanup function
    return () => {
      handle.removeEventListener("mousedown", startResize);
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
    };
  };

  useEffect(() => {
    const cells = document.querySelectorAll(".table-description-cell");
    const cleanupFunctions: Array<() => void> = [];

    cells.forEach((cell) => {
      const cleanup = initResizableDescription(cell as HTMLElement);
      if (cleanup) cleanupFunctions.push(cleanup);
    });

    // Cleanup on unmount or when projects change
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [projects]);

  const handleSort = (key: keyof Project) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleTagClick = async (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.info(
        <div className="relative flex flex-row items-center gap-2">
          <Image
            src="/images/mascot.png"
            alt="Code Minion"
            width={50}
            height={50}
            className="relative rounded-md"
          />
          <p>You have to sign in to browse projects by categories silly</p>
        </div>
      );
      return;
    }

    const currentPath = window.location.pathname;
    const tagPath = `/tags/${encodeURIComponent(tag)}`;

    if (currentPath === tagPath) {
      toast.dismiss();
      toast.info(
        <div className="relative flex flex-row items-center gap-2">
          <Image
            src="/images/mascot.png"
            alt="Code Minion"
            width={50}
            height={50}
            className="relative rounded-md"
          />
          <p>
            You are already on the <Badge>#{tag}</Badge> tag page silly
          </p>
        </div>
      );
      return;
    }

    // Set loading state and toast to make it obvious
    setLoadingTag(tag);
    try {
      // Add artificial delay to make spinner visible during development
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await router.push(tagPath);
    } finally {
      setLoadingTag(null);
    }
  };

  const handleCategoryClick = async (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.info(
        <div className="relative flex flex-row items-center gap-2">
          <Image
            src="/images/mascot.png"
            alt="Code Minion"
            width={50}
            height={50}
            className="relative rounded-md"
          />
          <p>You have to sign in to browse projects by categories silly</p>
        </div>
      );

      return;
    }

    // Check if we're already on this category page
    const currentPath = window.location.pathname;
    const categoryPath = `/categories/${encodeURIComponent(category)}`;
    if (currentPath === categoryPath) {
      toast.dismiss();
      toast.info(
        <div className="relative flex flex-row items-center gap-2">
          <Image
            src="/images/mascot.png"
            alt="Code Minion"
            width={50}
            height={50}
            className="relative rounded-md"
          />
          <p>You are already on this category silly</p>
        </div>
      );
      return; // Don't navigate if we're already on this category
    }

    // Set loading state and toast to make it obvious
    setLoadingCategory(category);
    try {
      // Add artificial delay to make spinner visible during development
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await router.push(categoryPath);
    } finally {
      setLoadingCategory(null);
    }
  };

  const handleRowClick = async (project: Project) => {
    if (navigatingProjectId === project.id) return;
    setNavigatingProjectId(project.id);
    await router.push(`/projects/${project.slug}`);
  };

  const sortedProjects = useMemo(() => {
    const sorted = [...projects];
    sorted.sort((a, b) => {
      if (sortConfig.key === "created_at" || sortConfig.key === "updated_at") {
        const dateA = new Date(a[sortConfig.key] || 0).getTime();
        const dateB = new Date(b[sortConfig.key] || 0).getTime();
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];

      // Handle null/undefined values
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueB == null) return sortConfig.direction === "asc" ? 1 : -1;

      // Compare non-null values
      if (valueA < valueB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [projects, sortConfig]);

  const toggleColumnVisibility = (columnName: string) => {
    setHiddenColumns((current) => {
      const newHiddenColumns = current.includes(columnName)
        ? current.filter((col) => col !== columnName)
        : [...current, columnName];
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('projectTableHiddenColumns', JSON.stringify(newHiddenColumns));
      }
      
      return newHiddenColumns;
    });
  };

  const handleColumnResize = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = columnWidths[columnKey] || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.pageX - startX;
      const newWidth = Math.max(100, startWidth + diff);
      
      setColumnWidths(prev => {
        const updated = { ...prev, [columnKey]: newWidth };
        if (typeof window !== 'undefined') {
          localStorage.setItem('projectTableColumnWidths', JSON.stringify(updated));
        }
        return updated;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const columns = [
    { key: "title", label: "Title", required: true },
    { key: "description", label: "Description", required: false },
    { key: "category", label: "Category", required: false },
    { key: "tags", label: "Tags", required: false },
    { key: "creator", label: "Creator", required: false },
    { key: "created_at", label: "Created", required: false },
  ];

  const dimOpacityValue = 0.2;

  return (
    <div className="w-full overflow-auto flex justify-center">
      <div className="w-full max-w-[95%] mb-8">
        <div className="mb-4 flex justify-end">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnSettings((s) => !s)}
              className="cursor-pointer"
            >
            <Settings2 className="h-4 w-4 mr-2" />
            Columns
          </Button>
          {showColumnSettings && (
            <div className="absolute right-0 mt-2 p-2 bg-card rounded-md shadow-lg border z-50">
              {columns
                .filter((col) => !col.required)
                .map((column) => (
                  <div
                    key={column.key}
                    className="flex items-center space-x-2 p-2"
                  >
                    <Checkbox
                      id={`col-${column.key}`}
                      checked={!hiddenColumns.includes(column.key)}
                      onCheckedChange={() => toggleColumnVisibility(column.key)}
                    />
                    <label htmlFor={`col-${column.key}`} className="text-sm cursor-pointer">
                      {column.label}
                    </label>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <table className="responsive-table w-full border-separate border-spacing-y-2" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {columns.map(
              (column) =>
                !hiddenColumns.includes(column.key) && (
                  <th
                    key={column.key}
                    onClick={() =>
                      handleSort(
                        column.key === "creator"
                          ? "profile"
                          : (column.key as keyof Project)
                      )
                    }
                    className="cursor-pointer hover:bg-muted/50 transition-colors relative"
                    style={{ width: `${columnWidths[column.key]}px`, minWidth: '100px' }}
                  >
                    <div className="flex items-center space-x-1 overflow-hidden">
                      <span className="truncate">{column.label}</span>
                      {sortConfig.key ===
                        (column.key === "creator" ? "profile" : column.key) && (
                        <ChevronUp
                          className={`h-4 w-4 transition-transform flex-shrink-0 ${
                            sortConfig.direction === "desc" ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-primary/50 hover:bg-primary transition-colors"
                      onMouseDown={(e) => handleColumnResize(column.key, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                )
            )}
            <th className="relative" style={{ width: `${columnWidths.actions}px`, minWidth: '100px' }}>
              <span>Actions</span>
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-primary/50 hover:bg-primary transition-colors"
                onMouseDown={(e) => handleColumnResize('actions', e)}
                onClick={(e) => e.stopPropagation()}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedProjects.map((project) => {
            const isOwner = project.user_id === userId;
            const isNavigating = navigatingProjectId === project.id;

            return (
              <tr
                key={project.id}
                onClick={() => handleRowClick(project)}
                className="cursor-pointer relative transition-all duration-200 ease-in-out 
            hover:shadow-lg hover:shadow-primary/15 hover:-translate-y-1 
            hover:z-10 hover:border-primary/50 hover:scale-[1.01] 
            hover:ring-1 hover:ring-primary/30
            group border border-transparent"
              >
                {/* Apply the spinner overlay to the first cell and use it as a positioning context */}
                {!hiddenColumns.includes("title") && (
                  <td
                    className="transition-opacity duration-200 relative"
                    style={{ opacity: isNavigating ? dimOpacityValue : 1, width: `${columnWidths.title}px`, wordWrap: 'break-word', whiteSpace: 'normal' }}
                  >
                    {isNavigating && (
                      <span
                        className="absolute z-50 bg-background/60 flex items-center justify-center"
                        style={{
                          top: "50%",
                          left: "50%",
                          width: "100px",
                          height: "100px",
                          transform: "translate(-50%, -50%)",
                          borderRadius: "50%",
                        }}
                      >
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </span>
                    )}
                    <div className="font-medium">{project.title}</div>
                  </td>
                )}

                {/* Rest of the cells */}
                {!hiddenColumns.includes("description") && (
                  <td
                    className="table-description-cell transition-opacity duration-200"
                    style={{ opacity: isNavigating ? dimOpacityValue : 1, width: `${columnWidths.description}px`, wordWrap: 'break-word', whiteSpace: 'normal' }}
                  >
                    <div className="table-description-content relative">
                      {project.description || "No description provided"}
                      <div
                        className="resize-handle absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize 
                                 hover:bg-primary/10 transition-colors"
                        title="Drag to resize"
                      />
                    </div>
                  </td>
                )}
                {!hiddenColumns.includes("category") && (
                  <td
                    className="transition-opacity duration-200"
                    style={{ opacity: isNavigating ? dimOpacityValue : 1, width: `${columnWidths.category}px`, wordWrap: 'break-word', whiteSpace: 'normal' }}
                  >
                    <Badge
                      variant={
                        loadingCategory === project.category
                          ? "default"
                          : "secondary"
                      }
                      className={`capitalize cursor-pointer hover:bg-accent transition-all ${
                        loadingCategory === project.category
                          ? "bg-primary text-primary-foreground font-medium animate-pulse"
                          : ""
                      }`}
                      onClick={(e) => handleCategoryClick(e, project.category)}
                    >
                      <div className="flex items-center gap-2">
                        {loadingCategory === project.category && (
                          <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {PROJECT_CATEGORIES[project.category as ProjectCategory]
                          ?.label || project.category}
                      </div>
                    </Badge>
                  </td>
                )}
                {!hiddenColumns.includes("tags") && (
                  <td
                    className="transition-opacity duration-200"
                    style={{ opacity: isNavigating ? dimOpacityValue : 1, width: `${columnWidths.tags}px`, wordWrap: 'break-word', whiteSpace: 'normal' }}
                  >
                    <div className="flex flex-wrap gap-1">
                      {project.tags && project.tags.length > 0 ? (
                        project.tags.map((tag, index) => {
                          const isTagLoading = loadingTag === tag;
                          return (
                            <Badge
                              key={index}
                              variant={isTagLoading ? "default" : "outline"}
                              className={`text-xs cursor-pointer hover:bg-accent transition-all ${
                                isTagLoading
                                  ? "bg-primary text-primary-foreground font-medium animate-pulse"
                                  : ""
                              }`}
                              onClick={(e) => handleTagClick(e, tag)}
                            >
                              <div className="flex items-center gap-2">
                                {isTagLoading && (
                                  <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                )}
                                #{tag}
                              </div>
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No tags
                        </span>
                      )}
                    </div>
                  </td>
                )}
                {!hiddenColumns.includes("creator") && (
                  <td
                    className="transition-opacity duration-200"
                    style={{ opacity: isNavigating ? dimOpacityValue : 1, width: `${columnWidths.creator}px`, wordWrap: 'break-word', whiteSpace: 'normal' }}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {project.profile?.profile_image_url ? (
                          <AvatarImage
                            src={project.profile.profile_image_url}
                            alt={getDisplayName(project)}
                          />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {getInitials(getDisplayName(project))}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm">{getDisplayName(project)}</span>
                    </div>
                  </td>
                )}
                {!hiddenColumns.includes("created_at") && (
                  <td
                    className="transition-opacity duration-200"
                    style={{ opacity: isNavigating ? dimOpacityValue : 1, width: `${columnWidths.created_at}px`, wordWrap: 'break-word', whiteSpace: 'normal' }}
                  >
                    {project.created_at ? (
                      <FormattedDate date={project.created_at} />
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                )}
                <td
                  className="transition-opacity duration-200"
                  style={{ opacity: isNavigating ? dimOpacityValue : 1, width: `${columnWidths.actions}px`, wordWrap: 'break-word', whiteSpace: 'normal' }}
                >
                  <div className="flex items-center gap-2">
                    <FavoriteButton
                      isFavorite={!!project.isFavorite}
                      count={Number(project.total_favorites) || 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(project.id, !project.isFavorite);
                      }}
                      ariaLabel={
                        project.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    />
                    {isOwner && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateProject?.(project);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject?.(project.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
