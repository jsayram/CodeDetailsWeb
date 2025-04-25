"use client";

import React, { useEffect, useState } from "react";
import { Project } from "@/types/models/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Settings2, ChevronUp, Star, Heart } from "lucide-react";
import { FormattedDate } from "@/lib/FormattedDate";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/constants/project-categories";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/utils/stringUtils";

interface ProjectTableViewProps {
  projects: Project[];
  onViewDetails?: (id: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onDeleteProject?: (id: string, isPermanent?: boolean) => void;
  onUpdateProject?: (project: Project) => void;
}

interface SortConfig {
  key: keyof Project;
  direction: 'asc' | 'desc';
}

export function ProjectTableView({
  projects,
  onViewDetails,
  onToggleFavorite,
  onDeleteProject,
  onUpdateProject,
}: ProjectTableViewProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  
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
    return project.profile?.username?.split('@')[0] ||
           project.profile?.email_address?.split('@')[0] ||
           "Unknown user";
  };

  const initResizableDescription = (cell: HTMLElement) => {
    const content = cell.querySelector('.table-description-content') as HTMLElement;
    const handle = cell.querySelector('.resize-handle') as HTMLElement;
    
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
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = '';
      handle.classList.remove('resizing');
      
      // Add transition back after resizing is done
      content.style.transition = 'height 0.15s ease-out';
    };

    const startResize = (e: MouseEvent) => {
      // Prevent click event from bubbling to parent elements
      e.preventDefault();
      e.stopPropagation();
      
      isResizing = true;
      startY = e.pageY;
      startHeight = content.offsetHeight;
      
      // Remove transition during resize for better performance
      content.style.transition = 'none';
      
      // Change cursor for entire document during resize
      document.body.style.cursor = 'ns-resize';
      handle.classList.add('resizing');
      
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
    };

    // Set initial height if not already set
    if (!content.style.height) {
      content.style.height = '80px';
    }

    // Clean up old event listener before adding new one
    handle.removeEventListener('mousedown', startResize);
    handle.addEventListener('mousedown', startResize);

    // Return cleanup function
    return () => {
      handle.removeEventListener('mousedown', startResize);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
  };

  useEffect(() => {
    const cells = document.querySelectorAll('.table-description-cell');
    const cleanupFunctions: Array<() => void> = [];

    cells.forEach(cell => {
      const cleanup = initResizableDescription(cell as HTMLElement);
      if (cleanup) cleanupFunctions.push(cleanup);
    });

    // Cleanup on unmount or when projects change
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [projects]);

  const handleSort = (key: keyof Project) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedProjects = [...projects].sort((a, b) => {
    switch (sortConfig.key) {
      case 'created_at':
        const dateA = new Date(a[sortConfig.key] || '').getTime();
        const dateB = new Date(b[sortConfig.key] || '').getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;

      case 'tags':
        const tagsA = (a.tags || []).join(', ').toLowerCase();
        const tagsB = (b.tags || []).join(', ').toLowerCase();
        return sortConfig.direction === 'asc' 
          ? tagsA.localeCompare(tagsB)
          : tagsB.localeCompare(tagsA);
      
      case 'profile':  // Use profile instead of creator
        const creatorA = getDisplayName(a).toLowerCase();
        const creatorB = getDisplayName(b).toLowerCase();
        return sortConfig.direction === 'asc' 
          ? creatorA.localeCompare(creatorB)
          : creatorB.localeCompare(creatorA);

      default:
        const valueA = String(a[sortConfig.key] || '');
        const valueB = String(b[sortConfig.key] || '');
        return sortConfig.direction === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
    }
  });

  const toggleColumnVisibility = (columnName: string) => {
    setHiddenColumns(current => 
      current.includes(columnName) 
        ? current.filter(col => col !== columnName)
        : [...current, columnName]
    );
  };

  const columns = [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', required: false },
    { key: 'category', label: 'Category', required: false },
    { key: 'tags', label: 'Tags', required: false },
    { key: 'creator', label: 'Creator', required: false },
    { key: 'created_at', label: 'Created', required: false }
  ];

  return (
    <div className="w-full overflow-auto">
      <div className="mb-4 flex justify-end">
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setShowColumnSettings(s => !s)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Columns
          </Button>
          {showColumnSettings && (
            <div className="absolute right-0 mt-2 p-2 bg-card rounded-md shadow-lg border z-50">
              {columns.filter(col => !col.required).map(column => (
                <div key={column.key} className="flex items-center space-x-2 p-2">
                  <Checkbox
                    id={`col-${column.key}`}
                    checked={!hiddenColumns.includes(column.key)}
                    onCheckedChange={() => toggleColumnVisibility(column.key)}
                  />
                  <label htmlFor={`col-${column.key}`} className="text-sm">
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <table className="responsive-table w-full">
        <thead>
          <tr>
            {columns.map(column => !hiddenColumns.includes(column.key) && (
              <th 
                key={column.key}
                onClick={() => handleSort(column.key === 'creator' ? 'profile' : column.key as keyof Project)}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {sortConfig.key === (column.key === 'creator' ? 'profile' : column.key) && (
                    <ChevronUp 
                      className={`h-4 w-4 transition-transform ${
                        sortConfig.direction === 'desc' ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedProjects.map((project) => (
            <tr 
              key={project.id} 
              onClick={() => onViewDetails?.(project.id)}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
            >
              {!hiddenColumns.includes('title') && (
                <td>
                  <div className="font-medium">{project.title}</div>
                </td>
              )}
              {!hiddenColumns.includes('description') && (
                <td className="table-description-cell">
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
              {!hiddenColumns.includes('category') && (
                <td>
                  <Badge variant="secondary" className="capitalize">
                    {PROJECT_CATEGORIES[project.category as ProjectCategory]?.label || project.category}
                  </Badge>
                </td>
              )}
              {!hiddenColumns.includes('tags') && (
                <td>
                  <div className="flex flex-wrap gap-1">
                    {project.tags && project.tags.length > 0 ? (
                      project.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs"
                        >
                          #{tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">No tags</span>
                    )}
                  </div>
                </td>
              )}
              {!hiddenColumns.includes('creator') && (
                <td>
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
              {!hiddenColumns.includes('created_at') && (
                <td>
                  {project.created_at ? (
                    <FormattedDate date={project.created_at} />
                  ) : (
                    <span>—</span>
                  )}
                </td>
              )}
              <td>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(project.id, !project.isFavorite);
                    }}
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        project.isFavorite 
                          ? "fill-red-400 text-red-400" 
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}