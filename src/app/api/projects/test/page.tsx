"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DebugJwt } from "@/components/debug/page";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { API_ROUTES } from "@/constants/api-routes";
import { Project } from "@/types/models/project";
import { toast } from "sonner";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/constants/project-categories";

export default function ProjectApiTest() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [apiResponse, setApiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useSupabaseToken();

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [tier, setTier] = useState("free");
  const [category, setCategory] = useState<ProjectCategory>("web");

  // Load initial projects
  useEffect(() => {
    fetchProjects();
  }, []);

  // Helper to format responses for display
  const formatResponse = (data: unknown): string => {
    return JSON.stringify(data, null, 2);
  };

  // Fetch projects using the appropriate server action based on category and tier
  const fetchProjects = async (
    filterTier?: string,
    filterCategory?: ProjectCategory
  ) => {
    setIsLoading(true);
    try {
      const url = API_ROUTES.PROJECTS.WITH_FILTERS({
        showAll: true,
        category: filterCategory,
      });

      const response = await fetch(url);
      const data = await response.json();
      setApiResponse(formatResponse(data));

      if (data.success && data.data) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setApiResponse(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // GET - Fetch a single project by slug
  const fetchProjectBySlug = async (slug: string) => {
    if (!slug) {
      setApiResponse("Error: Slug is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ROUTES.PROJECTS.BY_SLUG(slug));
      const data = await response.json();
      setApiResponse(formatResponse(data));
      if (data.success && data.data) {
        setSelectedProject(data.data);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setApiResponse(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // POST - Create a new project
  const createProject = async () => {
    if (!title || !slug) {
      setApiResponse("Error: Title and slug are required");
      return;
    }

    setIsLoading(true);
    try {
      const projectData = {
        title,
        slug,
        description,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        tier,
        category,
      };

      const response = await fetch(API_ROUTES.PROJECTS.BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();
      setApiResponse(formatResponse(data));

      if (data.success) {
        toast.success("Project created successfully!");
        clearForm();
        fetchProjects();
      }
    } catch (error) {
      console.error("Error creating project:", error);
      setApiResponse(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // PUT - Update a project completely
  const updateProject = async () => {
    if (!selectedProject) {
      setApiResponse("Error: No project selected");
      return;
    }

    if (!title || !slug) {
      setApiResponse(
        "Error: Title and slug are required for a complete update"
      );
      return;
    }

    setIsLoading(true);
    try {
      const projectData = {
        title,
        slug,
        description,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        tier,
        category,
      };

      const response = await fetch(
        API_ROUTES.PROJECTS.BY_ID(selectedProject.id),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        }
      );

      const data = await response.json();
      setApiResponse(formatResponse(data));

      if (data.success) {
        toast.success("Project updated successfully!");
        clearForm();
        setSelectedProject(null);
        fetchProjects();
      }
    } catch (error) {
      console.error("Error updating project:", error);
      setApiResponse(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // PATCH - Update a project partially
  const patchProject = async () => {
    if (!selectedProject) {
      setApiResponse("Error: No project selected");
      return;
    }

    // Build an object with only the fields that have values
    const updateData: Partial<Project> = {};
    if (title) updateData.title = title;
    if (slug) updateData.slug = slug;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags.split(",").map((tag) => tag.trim());
    if (category) updateData.category = category;

    if (Object.keys(updateData).length === 0) {
      setApiResponse(
        "Error: At least one field must be provided for a patch update"
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        API_ROUTES.PROJECTS.BY_ID(selectedProject.id),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();
      setApiResponse(formatResponse(data));

      if (data.success) {
        toast.success("Project updated successfully!");
        clearForm();
        setSelectedProject(null);
        fetchProjects();
      }
    } catch (error) {
      console.error("Error patching project:", error);
      setApiResponse(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE - Delete a project
  const deleteProject = async () => {
    if (!selectedProject) {
      setApiResponse("Error: No project selected");
      return;
    }

    if (
      !confirm(`Are you sure you want to delete "${selectedProject.title}"?`)
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        API_ROUTES.PROJECTS.BY_ID(selectedProject.id),
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      setApiResponse(formatResponse(data));

      if (data.success) {
        setSelectedProject(null);
        fetchProjects();
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      setApiResponse(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load a project into the form for editing
  const loadProjectForEdit = (project: Project) => {
    setSelectedProject(project);
    setTitle(project.title);
    setSlug(project.slug);
    setDescription(project.description || "");
    setTags(project.tags ? project.tags.join(", ") : "");
    setCategory(project.category);
  };

  // Clear the form
  const clearForm = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setTags("");
    setTier("free");
    setCategory("web");
  };

  // Generate a slug from title
  const generateSlug = () => {
    if (title) {
      setSlug(
        title
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "")
      );
    }
  };

  return (
    <>
      <HeaderSectionNoSideBar
        showDarkModeButton={true}
        showLogo={true}
        showMobileMenu={true}
        showSignInButton={true}
      />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Projects API Test Page</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Project List and API Response */}
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Projects</CardTitle>
                <CardDescription>
                  Filter projects by tier and category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1">
                    <Select value={tier} onValueChange={setTier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Select 
                      value={category} 
                      onValueChange={(value: ProjectCategory) => setCategory(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROJECT_CATEGORIES).map(([value, { label }]) => (
                          <SelectItem key={value} value={value as ProjectCategory}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={() => fetchProjects(tier, category)}>
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTier("free");
                      setCategory("web");
                      fetchProjects();
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Project List */}
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>Select a project to edit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center p-4">Loading projects...</div>
                  ) : projects.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      No projects found
                    </div>
                  ) : (
                    projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-2 rounded-md cursor-pointer ${
                          selectedProject?.id === project.id
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-accent"
                        }`}
                        onClick={() => loadProjectForEdit(project)}
                      >
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.slug}
                        </div>
                        <div className="flex gap-1 mt-1">
                          <Badge
                            variant={
                              project.category === "web"
                                ? "outline"
                                : project.category === "mobile"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {PROJECT_CATEGORIES[project.category]?.label || project.category}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* API Response */}
            <Card>
              <CardHeader>
                <CardTitle>API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-accent p-4 rounded-md overflow-x-auto whitespace-pre-wrap max-h-80">
                  {apiResponse || "No response yet"}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Forms */}
          <div className="space-y-6">
            {/* Project Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedProject ? "Edit Project" : "Create New Project"}
                </CardTitle>
                <CardDescription>
                  {selectedProject
                    ? `Editing project: ${selectedProject.title}`
                    : "Fill out the form to create a new project"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="font-medium">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Project title"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSlug}
                    >
                      Generate Slug
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="slug" className="font-medium">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="project-slug"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Project description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tags" className="font-medium">
                    Tags (comma-separated)
                  </label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="react, typescript, ui"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="tier" className="font-medium">
                      Access Tier
                    </label>
                    <Select value={tier} onValueChange={setTier}>
                      <SelectTrigger id="tier">
                        <SelectValue placeholder="Select Tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category" className="font-medium">
                      Category
                    </label>
                    <Select 
                      value={category} 
                      onValueChange={(value: ProjectCategory) => setCategory(value)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROJECT_CATEGORIES).map(([value, { label }]) => (
                          <SelectItem key={value} value={value as ProjectCategory}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button
                    onClick={createProject}
                    disabled={isLoading || !!selectedProject}
                  >
                    Create Project
                  </Button>

                  <Button
                    onClick={updateProject}
                    disabled={isLoading || !selectedProject}
                    variant="secondary"
                  >
                    Update (PUT)
                  </Button>

                  <Button
                    onClick={patchProject}
                    disabled={isLoading || !selectedProject}
                    variant="secondary"
                  >
                    Patch (PATCH)
                  </Button>

                  <Button
                    onClick={deleteProject}
                    disabled={isLoading || !selectedProject}
                    variant="destructive"
                  >
                    Delete
                  </Button>

                  <Button
                    onClick={() => {
                      clearForm();
                      setSelectedProject(null);
                    }}
                    disabled={isLoading}
                    variant="outline"
                  >
                    Clear Form
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Get By Slug Form */}
            <Card>
              <CardHeader>
                <CardTitle>Get Project by Slug</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Enter slug"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => fetchProjectBySlug(slug)}
                    disabled={isLoading || !slug}
                  >
                    Fetch
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
