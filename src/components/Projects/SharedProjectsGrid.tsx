"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCardView } from "./ProjectComponents/ProjectCardViewComponent";
import { Project } from "@/types/models/project";
import { PaginationControls } from "@/components/navigation/Pagination/PaginationControlComponent";
import { PROJECTS_PER_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjectListLoadingState";
import { API_ROUTES } from "@/constants/api-routes";
import { SortBySelect, CategorySelect, SortByValue } from "@/components/filters";
import { ProjectCategory } from "@/constants/project-categories";

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
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<
    ProjectCategory | "all"
  >("all");
  const [sortBy, setSortBy] = useState<SortByValue>("random");
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
      
      // Check if this is a redirect response (old username was used)
      if (result.redirect && result.currentUsername) {
        router.replace(`/shared-projects/${encodeURIComponent(result.currentUsername)}`);
        return;
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("Invalid response format");
      }

      interface SharedProjectData {
        project: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          category: string | null;
          created_at: string | null;
          updated_at: string | null;
          user_id: string;
          deleted_at: string | null;
          total_favorites: number;
          isFavorite?: boolean;
        };
        profile: {
          username: string | null;
          profile_image_url: string | null;
          full_name: string | null;
        };
        tags: string[] | null;
      }

      setProjects(
        result.data.map((projectData: SharedProjectData) => {
          const category = projectData.project.category || "other";
          return {
            ...projectData.project,
            tags: projectData.tags || [],
            category: category as ProjectCategory,
            isFavorite: projectData.project.isFavorite || false,
            profile: projectData.profile,
          };
        })
      );
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
  }, [username, currentPage, sortBy, selectedCategory, router]);

  useEffect(() => {
    fetchSharedProjects();
  }, [fetchSharedProjects]);

  const handlePageChange = (page: number) => {
    onPageChange?.(page);
  };

  const handleCategoryChange = (category: ProjectCategory | "all") => {
    setSelectedCategory(category);
  };

  const handleSortChange = (value: SortByValue) => {
    setSortBy(value);
  };
  const hasCategoryProjects = (categoryKey: string) => {
    const hasProjects = projects.some(
      (project) => project.category === categoryKey
    );
    return hasProjects;
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
            <CategorySelect
              value={selectedCategory}
              onValueChange={handleCategoryChange}
              triggerClassName="w-[180px]"
              hasCategoryProjects={hasCategoryProjects}
            />

            {/* Sort Filter */}
            <SortBySelect
              value={sortBy}
              onValueChange={handleSortChange}
              triggerClassName="w-[180px]"
            />
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
