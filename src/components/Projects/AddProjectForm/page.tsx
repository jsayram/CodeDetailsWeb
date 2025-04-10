'use client';

import React, { useState } from "react";
import { getAuthenticatedClient } from "@/services/supabase";
import { Project } from "@/types/models/project";

/**
 * A separate component for adding new projects.
 * - Holds its own local state, so the parent does NOT re-render on each keystroke.
 */
export const AddProjectForm = function AddProjectForm({
  token,
  onProjectAdded,
}: {
  token: string | null;
  onProjectAdded: (newProject: Project) => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    tags: "",
    description: "",
    tier: "free",
    difficulty: "beginner",
  });

  // Handle changes only within this component
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      alert("Title and Slug are required.");
      return;
    }
    try {
      const supabase = getAuthenticatedClient(token);

      if (!supabase) {
        throw new Error("Authentication required");
      }

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            title: formData.title,
            slug: formData.slug,
            tags: formData.tags.split(",").map((tag) => tag.trim()),
            description: formData.description,
            tier: formData.tier,
            difficulty: formData.difficulty,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Notify parent about the new project
      onProjectAdded(data);

      // Reset form
      setFormData({
        title: "",
        slug: "",
        tags: "",
        description: "",
        tier: "free",
        difficulty: "beginner",
      });
    } catch (error) {
      console.error("Failed to add project:", error);
    }
  };

  return (
    <form
      onSubmit={handleAddProject}
      className="border p-4 rounded-lg shadow-md mb-6"
    >
      <h2 className="text-lg font-semibold mb-2">Add New Project</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="title"
          placeholder="Project Title"
          value={formData.title}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          name="slug"
          placeholder="Slug (unique)"
          value={formData.slug}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          name="tags"
          placeholder="Tags (comma-separated)"
          value={formData.tags}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
        />
        <textarea
          name="description"
          placeholder="Project Description"
          value={formData.description}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
        />
        <select
          name="tier"
          value={formData.tier}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="diamond">Diamond</option>
        </select>
        <select
          name="difficulty"
          value={formData.difficulty}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Add Project
      </button>
    </form>
  );
};
