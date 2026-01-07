/**
 * Output Utilities
 * Functions for saving and managing generated documentation
 */

import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface ChapterFrontmatter {
  title: string;
  order: number;
  generatedAt: string;
  abstractionsCovered: string[];
}

export interface ChapterInfo {
  filename: string;
  title: string;
  order: number;
  abstractionsCovered: string[];
}

export interface ProjectMeta {
  projectSlug: string;
  userId: string;
  repoUrl: string;
  repoOwner: string;
  repoName: string;
  branch?: string;
  createdAt: string;
  chapters: ChapterInfo[];
  llmProvider: string;
  llmModel: string;
  totalTokensUsed?: number;
  totalCost?: number;
  // Linked CodeDetails project fields
  linkedProjectId?: string;
  linkedProjectSlug?: string;
  linkedProjectTitle?: string;
}

// ============================================================================
// Constants
// ============================================================================

const OUTPUT_DIR = path.join(process.cwd(), 'src', 'app', 'output');

// ============================================================================
// Slug Generation
// ============================================================================

/**
 * Generate a unique project slug from owner/repo
 * Format: owner-repo-YYYYMMDD-random
 */
export function generateProjectSlug(owner: string, repo: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = `${owner}-${repo}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  
  return `${safeName}-${date}-${random}`;
}

/**
 * Create a safe filename from a chapter title
 * Format: 00_title-slug.md
 */
export function createChapterFilename(order: number, title: string): string {
  const paddedOrder = String(order).padStart(2, '0');
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  
  return `${paddedOrder}_${safeTitle}.md`;
}

// ============================================================================
// YAML Frontmatter
// ============================================================================

/**
 * Create YAML frontmatter string
 */
export function createFrontmatter(frontmatter: ChapterFrontmatter): string {
  const yaml = [
    '---',
    `title: "${frontmatter.title.replace(/"/g, '\\"')}"`,
    `order: ${frontmatter.order}`,
    `generatedAt: "${frontmatter.generatedAt}"`,
    `abstractionsCovered:`,
    ...frontmatter.abstractionsCovered.map(a => `  - "${a.replace(/"/g, '\\"')}"`),
    '---',
    '',
  ].join('\n');
  
  return yaml;
}

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseFrontmatter(content: string): { frontmatter: ChapterFrontmatter | null; content: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!match) {
    return { frontmatter: null, content };
  }
  
  const yamlContent = match[1];
  const markdownContent = match[2];
  
  // Simple YAML parsing for our specific format
  const titleMatch = yamlContent.match(/title:\s*"([^"]+)"/);
  const orderMatch = yamlContent.match(/order:\s*(\d+)/);
  const generatedAtMatch = yamlContent.match(/generatedAt:\s*"([^"]+)"/);
  const abstractionsMatch = yamlContent.match(/abstractionsCovered:\n((?:\s+-\s*"[^"]+"\n?)*)/);
  
  const abstractions: string[] = [];
  if (abstractionsMatch) {
    const lines = abstractionsMatch[1].split('\n');
    for (const line of lines) {
      const absMatch = line.match(/^\s+-\s*"([^"]+)"$/);
      if (absMatch) {
        abstractions.push(absMatch[1]);
      }
    }
  }
  
  const frontmatter: ChapterFrontmatter = {
    title: titleMatch?.[1] || '',
    order: parseInt(orderMatch?.[1] || '0', 10),
    generatedAt: generatedAtMatch?.[1] || '',
    abstractionsCovered: abstractions,
  };
  
  return { frontmatter, content: markdownContent };
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Ensure output directory exists
 */
export async function ensureOutputDir(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

/**
 * Ensure project directory exists
 */
export async function ensureProjectDir(projectSlug: string): Promise<string> {
  const projectDir = path.join(OUTPUT_DIR, projectSlug);
  await fs.mkdir(projectDir, { recursive: true });
  return projectDir;
}

/**
 * Save a chapter file with frontmatter
 */
export async function saveChapter(
  projectSlug: string,
  order: number,
  title: string,
  content: string,
  abstractionsCovered: string[]
): Promise<string> {
  const projectDir = await ensureProjectDir(projectSlug);
  const filename = createChapterFilename(order, title);
  const filepath = path.join(projectDir, filename);
  
  const frontmatter = createFrontmatter({
    title,
    order,
    generatedAt: new Date().toISOString(),
    abstractionsCovered,
  });
  
  const fullContent = frontmatter + content;
  await fs.writeFile(filepath, fullContent, 'utf-8');
  
  return filename;
}

/**
 * Save project metadata
 */
export async function saveProjectMeta(
  projectSlug: string,
  meta: Omit<ProjectMeta, 'projectSlug'>
): Promise<void> {
  const projectDir = await ensureProjectDir(projectSlug);
  const metaPath = path.join(projectDir, '_meta.json');
  
  const fullMeta: ProjectMeta = {
    projectSlug,
    ...meta,
  };
  
  await fs.writeFile(metaPath, JSON.stringify(fullMeta, null, 2), 'utf-8');
}

/**
 * Get project metadata
 */
export async function getProjectMeta(projectSlug: string): Promise<ProjectMeta | null> {
  try {
    const metaPath = path.join(OUTPUT_DIR, projectSlug, '_meta.json');
    const content = await fs.readFile(metaPath, 'utf-8');
    return JSON.parse(content) as ProjectMeta;
  } catch {
    return null;
  }
}

/**
 * Get a chapter's content
 */
export async function getChapter(projectSlug: string, filename: string): Promise<string | null> {
  try {
    const filepath = path.join(OUTPUT_DIR, projectSlug, filename);
    return await fs.readFile(filepath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * List all projects
 */
export async function listProjects(): Promise<ProjectMeta[]> {
  try {
    await ensureOutputDir();
    const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
    const projects: ProjectMeta[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const meta = await getProjectMeta(entry.name);
        if (meta) {
          projects.push(meta);
        }
      }
    }
    
    // Sort by creation date (newest first)
    projects.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return projects;
  } catch {
    return [];
  }
}

/**
 * Check if a project exists
 */
export async function projectExists(projectSlug: string): Promise<boolean> {
  try {
    const metaPath = path.join(OUTPUT_DIR, projectSlug, '_meta.json');
    await fs.access(metaPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectSlug: string): Promise<boolean> {
  try {
    const projectDir = path.join(OUTPUT_DIR, projectSlug);
    await fs.rm(projectDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all chapter files for a project
 */
export async function getProjectChapters(projectSlug: string): Promise<Array<{
  filename: string;
  frontmatter: ChapterFrontmatter | null;
  content: string;
}>> {
  try {
    const projectDir = path.join(OUTPUT_DIR, projectSlug);
    const files = await fs.readdir(projectDir);
    const chapters: Array<{
      filename: string;
      frontmatter: ChapterFrontmatter | null;
      content: string;
    }> = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filepath = path.join(projectDir, file);
        const rawContent = await fs.readFile(filepath, 'utf-8');
        const { frontmatter, content } = parseFrontmatter(rawContent);
        chapters.push({ filename: file, frontmatter, content });
      }
    }
    
    // Sort by order
    chapters.sort((a, b) => (a.frontmatter?.order || 0) - (b.frontmatter?.order || 0));
    
    return chapters;
  } catch {
    return [];
  }
}

/**
 * Update project metadata (partial update)
 */
export async function updateProjectMeta(
  projectSlug: string,
  updates: Partial<ProjectMeta>
): Promise<ProjectMeta | null> {
  try {
    const currentMeta = await getProjectMeta(projectSlug);
    if (!currentMeta) {
      return null;
    }
    
    const updatedMeta: ProjectMeta = {
      ...currentMeta,
      ...updates,
      projectSlug, // Ensure slug is not changed
    };
    
    const metaPath = path.join(OUTPUT_DIR, projectSlug, '_meta.json');
    await fs.writeFile(metaPath, JSON.stringify(updatedMeta, null, 2), 'utf-8');
    
    return updatedMeta;
  } catch {
    return null;
  }
}

/**
 * Find a doc linked to a specific project
 */
export async function findDocLinkedToProject(
  projectSlug: string
): Promise<ProjectMeta | null> {
  try {
    const allProjects = await listProjects();
    return allProjects.find(p => p.linkedProjectSlug === projectSlug) || null;
  } catch {
    return null;
  }
}
