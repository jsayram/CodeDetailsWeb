'use client'

import { useEffect, useState } from 'react'
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton, useSession, useUser } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/services/supabase'
import DebugJwt from '@/components/debug/page'

interface Project {
  id: string
  title: string
  slug: string
  tags: string[]
  description: string
  tier: string
  difficulty: string
  created_at: string
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const { user } = useUser()
  const { session } = useSession()

  const [newProject, setNewProject] = useState({
    title: '',
    slug: '',
    tags: '',
    description: '',
    tier: 'free',
    difficulty: 'beginner'
  })

  // ✅ Fetch token only once
  useEffect(() => {
    async function getToken() {
      if (!session) return
      const token = await session.getToken({ template: 'supabase' })
      setToken(token)
    }
    getToken()
  }, [session])

  // ✅ Fetch projects only when the token is ready
  useEffect(() => {
    if (!user || !token) return

    const fetchProjects = async () => {
      try {
        setLoading(true)
        const supabase = createClerkSupabaseClient({ supabaseAccessToken: token })
        const { data, error } = await supabase.from('projects').select('*')

        if (error) {
          console.error('Failed to load projects:', JSON.stringify(error, null, 2));
          throw error;
        }
        setProjects(data || [])
      } catch (error) {
        console.error('Failed to load projects:', error)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [token, user]) // ✅ No unnecessary re-fetches

  // ✅ Keep form state independent to prevent jumping
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setNewProject(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.title || !newProject.slug) {
      alert("Title and Slug are required.")
      return
    }

    try {
      const supabase = createClerkSupabaseClient({ supabaseAccessToken: token })
      const { data, error } = await supabase.from('projects').insert([
        {
          title: newProject.title,
          slug: newProject.slug,
          tags: newProject.tags.split(',').map(tag => tag.trim()), // Convert string to array
          description: newProject.description,
          tier: newProject.tier,
          difficulty: newProject.difficulty
        }
      ]).select().single()

      if (error) throw error
      setProjects(prev => [...prev, data]) // ✅ Instantly update UI
      setNewProject({ title: '', slug: '', tags: '', description: '', tier: 'free', difficulty: 'beginner' }) // ✅ Reset form
    } catch (error) {
      console.error('Failed to add project:', error)
    }
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-4 px-4 py-2">
        <h1 className="text-xl font-bold">My Projects</h1>
        <div className="flex items-center space-x-4 min-w-[150px] justify-end">
          <SignedIn>
        <UserButton />
        <DebugJwt token={token} />
        <SignOutButton />
          </SignedIn>
          <SignedOut>
        <SignInButton />
          </SignedOut>
        </div>
      </header>

      <SignedIn>
        {/* ✅ Prevents re-rendering on input */}
        <form onSubmit={handleAddProject} className="border p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-2">Add New Project</h2>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              name="title" 
              placeholder="Project Title" 
              value={newProject.title} 
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
            />
            <input 
              type="text" 
              name="slug" 
              placeholder="Slug (unique)" 
              value={newProject.slug} 
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
            />
            <input 
              type="text" 
              name="tags" 
              placeholder="Tags (comma-separated)" 
              value={newProject.tags} 
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
            />
            <textarea 
              name="description" 
              placeholder="Project Description" 
              value={newProject.description} 
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
            />
            <select name="tier" value={newProject.tier} onChange={handleInputChange} className="border p-2 rounded w-full">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="diamond">Diamond</option>
            </select>
            <select name="difficulty" value={newProject.difficulty} onChange={handleInputChange} className="border p-2 rounded w-full">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Add Project
          </button>
        </form>

        {/* ✅ Project List */}
        {loading && <p>Loading...</p>}
        {!loading && projects.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
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
                  <td className="border p-2">{project.title}</td>
                  <td className="border p-2">{project.slug}</td>
                  <td className="border p-2">{project.tags.join(', ')}</td>
                  <td className="border p-2">{project.description}</td>
                  <td className="border p-2">{project.tier}</td>
                  <td className="border p-2">{project.difficulty}</td>
                  <td className="border p-2">{new Date(project.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <p>No projects found</p>
        )}
      </SignedIn>
      

      <SignedOut>
        <div className="text-center p-4">
          <h2>Please sign in to view and manage your projects</h2>
        </div>
      </SignedOut>
    </div>
  )
}