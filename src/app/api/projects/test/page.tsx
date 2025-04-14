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
import {
  getAllFreeProjects,
  getAllProProjects,
  getAllDiamondProjects,
  getProjectsByTier,
} from "@/app/actions/projects";
import { Project } from "@/types/models/project";
import { canAccessTier } from "@/services/tierServiceServer";
import { toast } from "sonner";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";

export default function ProjectApiTest() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [apiResponse, setApiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useSupabaseToken();

  // User tier state
  const [userTier, setUserTier] = useState<string>("free");

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [tier, setTier] = useState("free");
  const [difficulty, setDifficulty] = useState("beginner");

  // Load initial projects and fetch user tier
  useEffect(() => {
    fetchProjects();
    fetchUserTier();
  }, []);

  // Helper to format responses for display
  const formatResponse = (data: unknown): string => {
    return JSON.stringify(data, null, 2);
  };

  // Fetch the user's current tier
  const fetchUserTier = async () => {
    try {
      // In a real application, you would get this from your authentication system
      // Here we're making a call to the API to get the user's tier
      const response = await fetch("/api/tiers/user-tier");
      const data = await response.json();

      if (data.success && data.tier) {
        console.log(`User tier fetched: ${data.tier}`);
        setUserTier(data.tier);
      } else {
        // Default to 'free' if there's an issue
        console.log("Using default free tier");
        setUserTier("free");
      }
    } catch (error) {
      console.error("Error fetching user tier:", error);
      setUserTier("free"); // Default to free tier on error
    }
  };

  // Helper to check if user has access to a specific tier
  const checkTierAccess = (contentTier: string): boolean => {
    // Use the canAccessTier function to determine if the user can access this tier
    const hasAccess = canAccessTier(userTier, contentTier);

    if (!hasAccess) {
      setApiResponse(
        formatResponse({
          success: false,
          error: `Access denied: Your tier (${userTier}) doesn't have access to ${contentTier} tier projects`,
        })
      );
    }

    return hasAccess;
  };

  // Fetch projects using the appropriate server action based on tier and difficulty
  const fetchProjects = async (
    filterTier?: string,
    filterDifficulty?: string
  ) => {
    setIsLoading(true);
    try {
      let fetchedProjects: Project[] = [];

      // If we have a tier filter, use the appropriate tier-specific server action
      if (filterTier) {
        console.log(`Fetching projects with tier: ${filterTier}`);

        // Use the tier-specific server actions for better performance
        switch (filterTier) {
          case "free":
            fetchedProjects = await getAllFreeProjects();
            break;
          case "pro":
            fetchedProjects = await getAllProProjects();
            break;
          case "diamond":
            fetchedProjects = await getAllDiamondProjects();
            break;
          default:
            // Use the generic function for any other tier
            fetchedProjects = await getProjectsByTier(filterTier);
        }

        // Format the response for the API response display
        setApiResponse(
          formatResponse({
            success: true,
            data: fetchedProjects,
            message: `Projects fetched with tier: ${filterTier}`,
          })
        );
      } else {
        // If no tier filter, fetch all projects through the API
        console.log("Fetching all projects");
        const response = await fetch("/api/projects");
        const data = await response.json();
        setApiResponse(formatResponse(data));

        if (data.success && data.data) {
          fetchedProjects = data.data;
        }
      }

      // Apply difficulty filter if specified (client-side filtering)
      if (filterDifficulty && fetchedProjects.length > 0) {
        console.log(`Filtering by difficulty: ${filterDifficulty}`);
        fetchedProjects = fetchedProjects.filter(
          (p) => p.difficulty === filterDifficulty
        );

        setApiResponse(
          formatResponse({
            success: true,
            data: fetchedProjects,
            message: `Projects filtered by tier: ${
              filterTier || "all"
            } and difficulty: ${filterDifficulty}`,
          })
        );
      }

      setProjects(fetchedProjects);
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
      const response = await fetch(
        `/api/projects?slug=${encodeURIComponent(slug)}`
      );
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

    // Check if user has access to create a project with this tier
    if (!checkTierAccess(tier)) {
      toast.error(`You don't have permission to create ${tier} tier projects`);
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
        difficulty,
      };

      const response = await fetch("/api/projects", {
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
        // Clear form and refresh projects
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

    // Check if user has access to the tier they're trying to set
    if (!checkTierAccess(tier)) {
      toast.error(`You don't have permission to set projects to ${tier} tier`);
      return;
    }

    // Check if user has access to the selected project's tier
    if (!checkTierAccess(selectedProject.tier)) {
      toast.error(
        `You don't have permission to modify ${selectedProject.tier} tier projects`
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
        difficulty,
      };

      const response = await fetch(`/api/projects?id=${selectedProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

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

    // Check if user has access to the selected project's tier
    if (!checkTierAccess(selectedProject.tier)) {
      toast.error(
        `You don't have permission to modify ${selectedProject.tier} tier projects`
      );
      return;
    }

    // Build an object with only the fields that have values
    const updateData: Partial<Project> = {};
    if (title) updateData.title = title;
    if (slug) updateData.slug = slug;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags.split(",").map((tag) => tag.trim());

    // Check tier access if trying to change tier
    if (tier && tier !== selectedProject.tier) {
      if (!checkTierAccess(tier)) {
        toast.error(
          `You don't have permission to set projects to ${tier} tier`
        );
        return;
      }
      updateData.tier = tier;
    }

    if (difficulty) updateData.difficulty = difficulty;

    if (Object.keys(updateData).length === 0) {
      setApiResponse(
        "Error: At least one field must be provided for a patch update"
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects?id=${selectedProject.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

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

    // Check if user has access to the selected project's tier
    if (!checkTierAccess(selectedProject.tier)) {
      toast.error(
        `You don't have permission to delete ${selectedProject.tier} tier projects`
      );
      return;
    }

    if (
      !confirm(`Are you sure you want to delete "${selectedProject.title}"?`)
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects?id=${selectedProject.id}`, {
        method: "DELETE",
      });

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
    setTier(project.tier);
    setDifficulty(project.difficulty);
  };

  // Clear the form
  const clearForm = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setTags("");
    setTier("free");
    setDifficulty("beginner");
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
                  Filter projects by tier and difficulty
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
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={() => fetchProjects(tier, difficulty)}>
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTier("free");
                      setDifficulty("beginner");
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
                              project.tier === "free"
                                ? "outline"
                                : project.tier === "pro"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {project.tier}
                          </Badge>
                          <Badge variant="outline">{project.difficulty}</Badge>
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
                    <label htmlFor="difficulty" className="font-medium">
                      Difficulty Level
                    </label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Select Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
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
