"use client";

import React, { useState, useMemo } from "react";
import { Project } from "@/types/models/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Settings2, ChevronUp } from "lucide-react";
import { FormattedDate } from "@/lib/FormattedDate";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/constants/project-categories";
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
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onDeleteProject?: (id: string, isPermanent?: boolean) => void;
  onUpdateProject?: (project: Project) => void;
}

interface SortConfig {
  key: keyof Project;
  direction: "asc" | "desc";
}

const DEFAULT_COLUMN_WIDTHS = {
  title: 250,
  description: 300,
  category: 150,
  tags: 200,
  creator: 180,
  created_at: 150,
  actions: 180,
};

const COLUMNS = [
  { key: "title", label: "Title", required: true },
  { key: "description", label: "Description", required: false },
  { key: "category", label: "Category", required: false },
  { key: "tags", label: "Tags", required: false },
  { key: "creator", label: "Creator", required: false },
  { key: "created_at", label: "Created", required: false },
];

const ROW_HEIGHT = "h-30";
const DIM_OPACITY = 0.2;

export function ProjectTableView({
  projects,
  onToggleFavorite,
  onDeleteProject,
  onUpdateProject,
}: ProjectTableViewProps) {
  const { userId } = useAuth();
  const router = useRouter();
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "created_at", direction: "desc" });
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("projectTableHiddenColumns");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("projectTableColumnWidths");
      return saved ? JSON.parse(saved) : DEFAULT_COLUMN_WIDTHS;
    }
    return DEFAULT_COLUMN_WIDTHS;
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [navigatingProjectId, setNavigatingProjectId] = useState<string | null>(null);
  const [loadingTag, setLoadingTag] = useState<string | null>(null);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  const getDisplayName = (project: Project): string => {
    if (project.profile?.full_name) return project.profile.full_name;
    if (project.profile?.first_name || project.profile?.last_name) {
      return [project.profile.first_name, project.profile.last_name].filter(Boolean).join(" ").trim();
    }
    return project.profile?.username?.split("@")[0] || project.profile?.email_address?.split("@")[0] || "Unknown user";
  };

  const handleSort = (key: keyof Project) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const showSignInToast = () => {
    toast.info(
      <div className="relative flex flex-row items-center gap-2">
        <Image src="/images/mascot.png" alt="Code Minion" width={50} height={50} className="relative rounded-md" />
        <p>You have to sign in to browse projects by categories silly</p>
      </div>
    );
  };

  const handleTagClick = async (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) { showSignInToast(); return; }

    const tagPath = `/tags/${encodeURIComponent(tag)}`;
    if (window.location.pathname === tagPath) {
      toast.dismiss();
      toast.info(
        <div className="relative flex flex-row items-center gap-2">
          <Image src="/images/mascot.png" alt="Code Minion" width={50} height={50} className="relative rounded-md" />
          <p>You are already on the <Badge>#{tag}</Badge> tag page silly</p>
        </div>
      );
      return;
    }

    setLoadingTag(tag);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await router.push(tagPath);
    } finally {
      setLoadingTag(null);
    }
  };

  const handleCategoryClick = async (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) { showSignInToast(); return; }

    const categoryPath = `/categories/${encodeURIComponent(category)}`;
    if (window.location.pathname === categoryPath) {
      toast.dismiss();
      toast.info(
        <div className="relative flex flex-row items-center gap-2">
          <Image src="/images/mascot.png" alt="Code Minion" width={50} height={50} className="relative rounded-md" />
          <p>You are already on this category silly</p>
        </div>
      );
      return;
    }

    setLoadingCategory(category);
    try {
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
    return [...projects].sort((a, b) => {
      if (sortConfig.key === "created_at" || sortConfig.key === "updated_at") {
        const dateA = new Date(a[sortConfig.key] || 0).getTime();
        const dateB = new Date(b[sortConfig.key] || 0).getTime();
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];

      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueB == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [projects, sortConfig]);

  const toggleColumnVisibility = (columnName: string) => {
    setHiddenColumns((current) => {
      const updated = current.includes(columnName)
        ? current.filter((col) => col !== columnName)
        : [...current, columnName];
      if (typeof window !== "undefined") {
        localStorage.setItem("projectTableHiddenColumns", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const startColumnResize = (e: React.PointerEvent<HTMLDivElement>, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey] ?? 150;
    let currentWidth = startWidth;

    target.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      ev.preventDefault();
      currentWidth = Math.min(Math.max(startWidth + ev.clientX - startX, 80), 800);
      setColumnWidths((prev) => ({ ...prev, [columnKey]: currentWidth }));
    };

    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      setColumnWidths((prev) => {
        const final = { ...prev, [columnKey]: currentWidth };
        if (typeof window !== "undefined") {
          localStorage.setItem("projectTableColumnWidths", JSON.stringify(final));
        }
        return final;
      });
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const isColumnVisible = (key: string) => !hiddenColumns.includes(key);

  const ResizeHandle = ({ columnKey }: { columnKey: string }) => (
    <div
      className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize bg-transparent hover:bg-primary/50 transition-colors"
      style={{ transform: "translateX(50%)", touchAction: "none" }}
      onPointerDown={(e) => startColumnResize(e, columnKey)}
      onClick={(e) => e.stopPropagation()}
    />
  );

  return (
    <div className="hidden md:block w-full">
      <div className="w-full px-4 mb-8">
        <div className="mb-4 flex justify-end">
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowColumnSettings((s) => !s)} className="cursor-pointer">
              <Settings2 className="h-4 w-4 mr-2" />
              Columns
            </Button>
            {showColumnSettings && (
              <div className="absolute right-0 mt-2 p-2 bg-card rounded-md shadow-lg border z-50">
                {COLUMNS.filter((col) => !col.required).map((column) => (
                  <div key={column.key} className="flex items-center space-x-2 p-2">
                    <Checkbox
                      id={`col-${column.key}`}
                      checked={isColumnVisible(column.key)}
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

        <div className="overflow-y-auto overflow-x-hidden w-full">
          <table className="responsive-table border-separate border-spacing-y-2 w-full" style={{ tableLayout: "fixed" }}>
            <colgroup>
              {COLUMNS.map((col) => isColumnVisible(col.key) && <col key={col.key} style={{ width: columnWidths[col.key] }} />)}
              <col style={{ width: columnWidths.actions }} />
            </colgroup>
            <thead className="sticky top-0 bg-background z-20">
              <tr>
                {COLUMNS.map(
                  (column) =>
                    isColumnVisible(column.key) && (
                      <th
                        key={column.key}
                        onClick={() => handleSort(column.key === "creator" ? "profile" : (column.key as keyof Project))}
                        className="cursor-pointer hover:bg-muted/50 transition-colors relative"
                      >
                        <div className="flex items-center space-x-1">
                          <span className="truncate">{column.label}</span>
                          {sortConfig.key === (column.key === "creator" ? "profile" : column.key) && (
                            <ChevronUp className={`h-4 w-4 transition-transform flex-shrink-0 ${sortConfig.direction === "desc" ? "rotate-180" : ""}`} />
                          )}
                        </div>
                        <ResizeHandle columnKey={column.key} />
                      </th>
                    )
                )}
                <th className="relative">
                  <span>Actions</span>
                  <ResizeHandle columnKey="actions" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((project) => {
                const isOwner = project.user_id === userId;
                const isNavigating = navigatingProjectId === project.id;
                const cellOpacity = isNavigating ? DIM_OPACITY : 1;

                return (
                  <tr
                    key={project.id}
                    onClick={() => handleRowClick(project)}
                    className={`cursor-pointer relative hover:shadow-lg hover:shadow-primary/15 hover:bg-muted/30 hover:ring-1 hover:ring-primary/30 group border border-transparent ${ROW_HEIGHT}`}
                  >
                    {isColumnVisible("title") && (
                      <td className={`relative ${ROW_HEIGHT} align-middle p-0`} style={{ opacity: cellOpacity }}>
                        {isNavigating && (
                          <span className="absolute z-50 bg-background/60 flex items-center justify-center inset-0">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </span>
                        )}
                        <div className="font-medium h-full max-h-20 overflow-y-auto p-2">{project.title}</div>
                      </td>
                    )}

                    {isColumnVisible("description") && (
                      <td className={`${ROW_HEIGHT} align-middle p-0`} style={{ opacity: cellOpacity }}>
                        <div className="h-full max-h-20 overflow-y-auto p-2 text-sm text-muted-foreground">
                          {project.description || "No description provided"}
                        </div>
                      </td>
                    )}

                    {isColumnVisible("category") && (
                      <td className={`${ROW_HEIGHT} align-middle overflow-hidden`} style={{ opacity: cellOpacity }}>
                        <Badge
                          variant={loadingCategory === project.category ? "default" : "secondary"}
                          className={`capitalize cursor-pointer hover:bg-accent ${loadingCategory === project.category ? "bg-primary text-primary-foreground animate-pulse" : ""}`}
                          onClick={(e) => handleCategoryClick(e, project.category)}
                        >
                          {loadingCategory === project.category && (
                            <div className="w-3 h-3 mr-1 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          )}
                          {PROJECT_CATEGORIES[project.category as ProjectCategory]?.label || project.category}
                        </Badge>
                      </td>
                    )}

                    {isColumnVisible("tags") && (
                      <td className={`${ROW_HEIGHT} align-middle p-0`} style={{ opacity: cellOpacity }}>
                        <div className="flex flex-wrap gap-1 h-full max-h-20 overflow-y-auto p-2">
                          {project.tags?.length ? (
                            project.tags.map((tag, i) => (
                              <Badge
                                key={i}
                                variant={loadingTag === tag ? "default" : "outline"}
                                className={`text-xs cursor-pointer hover:bg-accent ${loadingTag === tag ? "bg-primary text-primary-foreground animate-pulse" : ""}`}
                                onClick={(e) => handleTagClick(e, tag)}
                              >
                                {loadingTag === tag && <div className="w-3 h-3 mr-1 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />}
                                #{tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No tags</span>
                          )}
                        </div>
                      </td>
                    )}

                    {isColumnVisible("creator") && (
                      <td className={`${ROW_HEIGHT} align-middle overflow-hidden`} style={{ opacity: cellOpacity }}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {project.profile?.profile_image_url ? (
                              <AvatarImage src={project.profile.profile_image_url} alt={getDisplayName(project)} />
                            ) : (
                              <AvatarFallback className="text-xs">{getInitials(getDisplayName(project))}</AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-sm truncate">{getDisplayName(project)}</span>
                        </div>
                      </td>
                    )}

                    {isColumnVisible("created_at") && (
                      <td className={`${ROW_HEIGHT} align-middle overflow-hidden`} style={{ opacity: cellOpacity }}>
                        {project.created_at ? <FormattedDate date={project.created_at} /> : <span>—</span>}
                      </td>
                    )}

                    <td className={`${ROW_HEIGHT} align-middle overflow-hidden`} style={{ opacity: cellOpacity }}>
                      <div className="flex items-center gap-2">
                        <FavoriteButton
                          isFavorite={!!project.isFavorite}
                          count={Number(project.total_favorites) || 0}
                          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(project.id, !project.isFavorite); }}
                          ariaLabel={project.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        />
                        {isOwner && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onUpdateProject?.(project); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteProject?.(project.id); }}>
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
    </div>
  );
}
