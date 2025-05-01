"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ProjectCardView } from "./ProjectComponents/ProjectCardViewComponent";
import { Project } from "@/types/models/project";
import { PaginationControls } from "@/components/navigation/Pagination/PaginationControlComponent";
import { PROJECTS_PER_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjectListLoadingState";
import { API_ROUTES } from "@/constants/api-routes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROJECT_CATEGORIES,
  ProjectCategory,
} from "@/constants/project-categories";

interface SharedProjectsGridProps {
  username: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function SharedProjectsGrid({
  username,
  currentPage = 1,
  onPageChange,
}: SharedProjectsGridProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<
    ProjectCategory | "all"
  >("all");
  const [sortBy, setSortBy] = useState("newest");
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
  });

  const fetchSharedProjects = useCallback(async () => {
    try {
      setLoading(true);
      const url = API_ROUTES.PROJECTS.SHARED(username, {
        page: currentPage,
        limit: PROJECTS_PER_PAGE,
        showAll: true,
        sortBy,
        category: selectedCategory === "all" ? undefined : selectedCategory,
      });

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const result = await response.json();

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("Invalid response format");
      }

      // Ensure tags are always an array, handling null/undefined cases
      setProjects(result.data.map((projectData: Project) => ({
        ...projectData,
        tags: projectData.tags || [],
        category: projectData.category as ProjectCategory,
        isFavorite: projectData.isFavorite || false,
      })));

      setPagination({
        total: result.pagination?.total ?? 0,
        totalPages: result.pagination?.totalPages ?? 1,
        currentPage: result.pagination?.page ?? currentPage,
      });
    } catch (error) {
      console.error("❌ Error in fetchSharedProjects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [username, currentPage, sortBy, selectedCategory]);

  useEffect(() => {
    fetchSharedProjects();
  }, [fetchSharedProjects]);

  const handlePageChange = (page: number) => {
    onPageChange?.(page);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category as ProjectCategory | "all");
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  if (loading) {
    return <ProjectListLoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Left side filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(PROJECT_CATEGORIES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {projects.length > 0 ? (
        <>
          <ProjectCardView
            projects={projects}
            onViewDetails={() => {}}
            onToggleFavorite={() => {}}
            onDeleteProject={() => {}}
            onUpdateProject={() => {}}
          />
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl font-semibold mb-2">No Projects Found</p>
          <p className="text-muted-foreground">
            {selectedCategory === "all"
              ? `${username} hasn't shared any projects yet.`
              : `${username} hasn't shared any projects in this category.`}
          </p>
        </div>
      )}
    </div>
  );
}
