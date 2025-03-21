import React from 'react';
import { useProjects } from '@/providers/projects-provider';

export function FreeProjectList() {
  const { freeProjects, freeLoading } = useProjects();
  
  if (freeLoading) return <p className="text-center">Loading free projects...</p>;
  if (!freeProjects.length) return <p className="text-center">No free projects available at the moment</p>;
  
  return (
    <table className="w-full border-collapse border border-teal-300">
      <thead>
        <tr className="bg-black-200">
          <th className="border p-2">Title</th>
          <th className="border p-2">Description</th>
          <th className="border p-2">Difficulty</th>
          <th className="border p-2">Tags</th>
          <th className="border p-2">Tier</th>
        </tr>
      </thead>
      <tbody>
        {freeProjects.map((project) => (
          <tr key={project.id} className="border hover:bg-white-50 text-teal-300">
            <td className="border p-2 font-medium">{project.title}</td>
            <td className="border p-2">{project.description}</td>
            <td className="border p-2">{project.difficulty}</td>
            <td className="border p-2">{project.tags.join(', ')}</td>
            <td className="border p-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                {project.tier}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}