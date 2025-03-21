import React from 'react';
import { useProjects } from '@/providers/projects-provider';

export function AuthenticatedProjectList() {
  const { projects, loading } = useProjects();
  
  if (loading) return <p>Loading projects...</p>;
  if (!projects.length) return <p>No projects found for your tier level</p>;
  
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-black-200">
          <th className="border p-2">Title</th>
          <th className="border p-2">Slug</th>
          <th className="border p-2">Tags</th>
          <th className="border p-2">Description</th>
          <th className="border p-2">Tier</th>
          <th className="border p-2">Difficulty</th>
          <th className="border p-2">Created At</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr key={project.id} className="border">
            <td className="border p-2">{project.title}</td>
            <td className="border p-2">{project.slug}</td>
            <td className="border p-2">{project.tags.join(', ')}</td>
            <td className="border p-2">{project.description}</td>
            <td className="border p-2">
              <span className={`px-2 py-1 rounded text-xs ${
                project.tier === 'free' ? 'bg-green-100 text-green-800' : 
                project.tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                project.tier === 'diamond' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.tier}
              </span>
            </td>
            <td className="border p-2">{project.difficulty}</td>
            <td className="border p-2">
              {new Date(project.created_at).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}