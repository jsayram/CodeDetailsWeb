/**
 * Cache Manager
 * Repository-level cache system with storage adapter abstraction
 * 
 * Pure functions that work with any storage backend implementing StorageAdapter
 */

import type {
  StorageAdapter,
  RepoCache,
  RepoIndex,
  CachedFile,
  FileChangeAnalysis,
  RegenerationPlan,
  RegenerationMode,
} from '../types';
import { cacheError } from '../errors';

// ============================================================================
// Constants
// ============================================================================

const REPO_INDEX_KEY = 'repo_index';
const CACHE_PREFIX = 'repo_cache_';
const CACHE_VERSION = '1.0';

// ============================================================================
// Hash Utilities
// ============================================================================

/**
 * Compute hash of file content for change detection
 * Uses a simple hash for browser compatibility
 */
export function computeContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Compute hash using SubtleCrypto if available (async, more secure)
 */
export async function computeContentHashAsync(content: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return computeContentHash(content);
}

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * Normalize a repo URL to a consistent identifier
 */
export function normalizeRepoUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

/**
 * Generate a cache key from repo URL
 */
export function repoCacheKey(url: string): string {
  const normalized = normalizeRepoUrl(url);
  const safe = normalized
    .replace(/\//g, '_')
    .replace(/[^a-z0-9_-]/g, '');
  return `${CACHE_PREFIX}${safe}`;
}

// ============================================================================
// Index Operations
// ============================================================================

/**
 * Load the repo index from storage
 */
export async function loadRepoIndex(storage: StorageAdapter): Promise<RepoIndex> {
  try {
    const index = await storage.get<RepoIndex>(REPO_INDEX_KEY);
    return index || { repos: {}, version: CACHE_VERSION };
  } catch (error) {
    console.warn('Failed to load repo index, creating new one:', error);
    return { repos: {}, version: CACHE_VERSION };
  }
}

/**
 * Save the repo index to storage
 */
export async function saveRepoIndex(
  storage: StorageAdapter,
  index: RepoIndex
): Promise<void> {
  await storage.set(REPO_INDEX_KEY, index);
}

// ============================================================================
// Cache Operations
// ============================================================================

/**
 * Load cache for a specific repository
 */
export async function loadRepoCache(
  storage: StorageAdapter,
  repoUrl: string
): Promise<RepoCache | null> {
  const repoId = normalizeRepoUrl(repoUrl);
  const cacheKey = repoCacheKey(repoUrl);

  try {
    const cache = await storage.get<RepoCache>(cacheKey);
    
    if (!cache) {
      console.log(`[Cache] No cache found for repo: ${repoId}`);
      return null;
    }

    // Update last accessed time in index
    const index = await loadRepoIndex(storage);
    if (index.repos[repoId]) {
      index.repos[repoId].lastAccessed = new Date().toISOString();
      await saveRepoIndex(storage, index);
    }

    console.log(`[Cache] Loaded cache for ${repoId}: ${cache.files.length} files, ${Object.keys(cache.chapters).length} chapters`);
    return cache;
  } catch (error) {
    console.error(`[Cache] Failed to load cache for ${repoId}:`, error);
    return null;
  }
}

/**
 * Save cache for a specific repository
 */
export async function saveRepoCache(
  storage: StorageAdapter,
  cache: RepoCache
): Promise<void> {
  const repoId = normalizeRepoUrl(cache.repoUrl);
  const cacheKey = repoCacheKey(cache.repoUrl);

  try {
    // Update repo index
    const index = await loadRepoIndex(storage);
    index.repos[repoId] = {
      cacheFile: cacheKey,
      lastAccessed: new Date().toISOString(),
      repoUrl: cache.repoUrl,
    };
    await saveRepoIndex(storage, index);

    // Save cache
    cache.repoId = repoId;
    await storage.set(cacheKey, cache);

    console.log(`[Cache] Saved cache for ${repoId}: ${cache.files.length} files, ${Object.keys(cache.chapters).length} chapters`);
  } catch (error) {
    throw cacheError(`Failed to save cache for ${repoId}: ${error}`, 'save');
  }
}

/**
 * Create a new empty cache for a repository
 */
export function createRepoCache(repoUrl: string): RepoCache {
  return {
    repoUrl,
    repoId: normalizeRepoUrl(repoUrl),
    lastCrawlTime: new Date().toISOString(),
    files: [],
    chapters: {},
    metadata: {},
  };
}

/**
 * Clear cache for a specific repository
 */
export async function clearRepoCache(
  storage: StorageAdapter,
  repoUrl: string
): Promise<boolean> {
  const repoId = normalizeRepoUrl(repoUrl);
  const cacheKey = repoCacheKey(repoUrl);

  try {
    // Remove from index
    const index = await loadRepoIndex(storage);
    if (!index.repos[repoId]) {
      return false;
    }
    delete index.repos[repoId];
    await saveRepoIndex(storage, index);

    // Delete cache
    await storage.delete(cacheKey);
    console.log(`[Cache] Cleared cache for ${repoId}`);
    return true;
  } catch (error) {
    console.error(`[Cache] Failed to clear cache for ${repoId}:`, error);
    return false;
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(storage: StorageAdapter): Promise<void> {
  try {
    await storage.clear(CACHE_PREFIX);
    await storage.delete(REPO_INDEX_KEY);
    console.log('[Cache] Cleared all caches');
  } catch (error) {
    throw cacheError(`Failed to clear all caches: ${error}`, 'clear');
  }
}

// ============================================================================
// Change Analysis
// ============================================================================

/**
 * Analyze changes between cached files and new files
 */
export function analyzeFileChanges(
  cachedFiles: CachedFile[],
  newFiles: Array<{ path: string; content: string }>
): FileChangeAnalysis {
  const cachedMap = new Map(cachedFiles.map(f => [f.path, f.contentHash]));
  const newMap = new Map(
    newFiles.map(f => [f.path, computeContentHash(f.content)])
  );

  const addedFiles: string[] = [];
  const removedFiles: string[] = [];
  const modifiedFiles: string[] = [];
  const unchangedFiles: string[] = [];

  // Check for added and modified files
  for (const [path, newHash] of newMap) {
    const cachedHash = cachedMap.get(path);
    if (!cachedHash) {
      addedFiles.push(path);
    } else if (cachedHash !== newHash) {
      modifiedFiles.push(path);
    } else {
      unchangedFiles.push(path);
    }
  }

  // Check for removed files
  for (const path of cachedMap.keys()) {
    if (!newMap.has(path)) {
      removedFiles.push(path);
    }
  }

  const totalFiles = newMap.size;
  const changedCount = addedFiles.length + removedFiles.length + modifiedFiles.length;
  const changePercentage = totalFiles > 0 ? (changedCount / totalFiles) * 100 : 0;

  console.log(`[Cache] File changes: +${addedFiles.length} -${removedFiles.length} ~${modifiedFiles.length} (${changePercentage.toFixed(1)}%)`);

  return {
    addedFiles,
    removedFiles,
    modifiedFiles,
    unchangedFiles,
    changePercentage,
    totalFiles,
  };
}

/**
 * Determine regeneration strategy based on file changes
 */
export function determineRegenerationPlan(
  cache: RepoCache,
  changeAnalysis: FileChangeAnalysis
): RegenerationPlan {
  const { changePercentage, addedFiles, modifiedFiles, removedFiles } = changeAnalysis;

  // No changes - skip regeneration
  if (changePercentage === 0) {
    return {
      mode: 'skip',
      reason: 'No file changes detected since last generation',
      chaptersToRegenerate: [],
      rerunAbstractionIdentification: false,
      estimatedSavings: 100,
    };
  }

  // Minor changes (<30%) - partial regeneration
  if (changePercentage < 30) {
    const affectedChapters = findAffectedChapters(
      cache,
      [...addedFiles, ...modifiedFiles, ...removedFiles]
    );

    return {
      mode: 'partial',
      reason: `${changePercentage.toFixed(1)}% of files changed - regenerating affected chapters only`,
      chaptersToRegenerate: affectedChapters,
      rerunAbstractionIdentification: false,
      estimatedSavings: Math.round(
        100 - (affectedChapters.length / Math.max(Object.keys(cache.chapters).length, 1)) * 100
      ),
    };
  }

  // Moderate changes (30-60%) - partial with re-identification
  if (changePercentage < 60) {
    return {
      mode: 'partial_reidentify',
      reason: `${changePercentage.toFixed(1)}% of files changed - re-identifying abstractions and regenerating affected chapters`,
      chaptersToRegenerate: [],
      rerunAbstractionIdentification: true,
      estimatedSavings: 30,
    };
  }

  // Major changes (>60%) - full regeneration
  return {
    mode: 'full',
    reason: `${changePercentage.toFixed(1)}% of files changed - full regeneration recommended`,
    chaptersToRegenerate: Object.keys(cache.chapters),
    rerunAbstractionIdentification: true,
    estimatedSavings: 0,
  };
}

/**
 * Find chapters affected by file changes
 */
export function findAffectedChapters(
  cache: RepoCache,
  changedFiles: string[]
): string[] {
  if (!cache.abstractions || Object.keys(cache.chapters).length === 0) {
    return [];
  }

  const changedSet = new Set(changedFiles);
  const affectedAbstractions = new Set<string>();

  // Find abstractions that include changed files
  for (const abstraction of cache.abstractions) {
    for (const file of abstraction.files) {
      if (changedSet.has(file)) {
        affectedAbstractions.add(abstraction.name);
        break;
      }
    }
  }

  // Find chapters that cover affected abstractions
  const affectedChapters = new Set<string>();

  for (const [slug, chapter] of Object.entries(cache.chapters)) {
    for (const abstractionName of chapter.abstractionsCovered) {
      if (affectedAbstractions.has(abstractionName)) {
        affectedChapters.add(slug);
        break;
      }
    }
  }

  // Include dependent chapters (cascading)
  const addDependentChapters = (chapterSlug: string) => {
    for (const [slug, chapter] of Object.entries(cache.chapters)) {
      if (chapter.dependencies.includes(chapterSlug) && !affectedChapters.has(slug)) {
        affectedChapters.add(slug);
        addDependentChapters(slug);
      }
    }
  };

  for (const slug of [...affectedChapters]) {
    addDependentChapters(slug);
  }

  return [...affectedChapters];
}

/**
 * Update files in cache
 */
export function updateCacheFiles(
  cache: RepoCache,
  newFiles: Array<{ path: string; content: string }>
): void {
  cache.files = newFiles.map(f => ({
    path: f.path,
    contentHash: computeContentHash(f.content),
    lastModified: new Date().toISOString(),
  }));
  cache.lastCrawlTime = new Date().toISOString();
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get cache statistics
 */
export async function getCacheStats(storage: StorageAdapter): Promise<{
  totalRepos: number;
  repos: Array<{
    repoId: string;
    repoUrl: string;
    lastAccessed: string;
    chaptersCount: number;
    filesCount: number;
  }>;
}> {
  const index = await loadRepoIndex(storage);
  const repos: Array<{
    repoId: string;
    repoUrl: string;
    lastAccessed: string;
    chaptersCount: number;
    filesCount: number;
  }> = [];

  for (const [repoId, entry] of Object.entries(index.repos)) {
    const cache = await storage.get<RepoCache>(entry.cacheFile);
    
    repos.push({
      repoId,
      repoUrl: entry.repoUrl,
      lastAccessed: entry.lastAccessed,
      chaptersCount: cache ? Object.keys(cache.chapters).length : 0,
      filesCount: cache ? cache.files.length : 0,
    });
  }

  return {
    totalRepos: repos.length,
    repos,
  };
}

/**
 * Check if cache exists for a repository
 */
export async function hasCache(
  storage: StorageAdapter,
  repoUrl: string
): Promise<boolean> {
  const cacheKey = repoCacheKey(repoUrl);
  const cache = await storage.get(cacheKey);
  return cache !== null;
}

/**
 * Get cache age in milliseconds
 */
export async function getCacheAge(
  storage: StorageAdapter,
  repoUrl: string
): Promise<number | null> {
  const cache = await loadRepoCache(storage, repoUrl);
  if (!cache) return null;
  
  const lastCrawl = new Date(cache.lastCrawlTime);
  return Date.now() - lastCrawl.getTime();
}

/**
 * Check if cache is stale (older than maxAge)
 */
export async function isCacheStale(
  storage: StorageAdapter,
  repoUrl: string,
  maxAgeMs: number
): Promise<boolean> {
  const age = await getCacheAge(storage, repoUrl);
  if (age === null) return true;
  return age > maxAgeMs;
}
