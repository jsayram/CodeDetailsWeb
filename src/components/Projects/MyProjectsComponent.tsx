"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "./ProjectComponents/ProjectFormComponent";
import { ProjectList } from "./ProjectComponents/ProjectListComponent";
import { Project } from "@/types/models/project";
import {
  CURRENT_PAGE,
} from "@/components/navigation/Pagination/paginationConstants";

interface MyProjectsComponentProps {
  userId: string;
}

export function MyProjectsComponent({ userId }: MyProjectsComponentProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleProjectAdded = (project: Project) => {
    setShowAddForm(false);
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Projects</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1"
        >
          <Plus size={16} />
          {showAddForm ? "Cancel" : "New Project"}
        </Button>
      </div>

      {/* Project creation form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm onProjectAdded={handleProjectAdded} />
          </CardContent>
        </Card>
      )}

      {/* Display user's projects using ProjectList with filter */}
      <ProjectList
        filter={{ userId }}
        currentPage={CURRENT_PAGE}
        onPageChange={() => {}}
        onFilteredItemsChange={() => {}}
      />
    </div>
  );
}
