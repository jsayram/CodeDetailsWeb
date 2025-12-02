/**
 * RepoScrapper Types
 * Core type definitions for the repository scraping and documentation generation module
 */

// ============================================================================
// Crawler Types
// ============================================================================

/** Statistics from a crawl operation */
export interface FileStats {
  downloaded_count: number;
  skipped_count: number;
  skipped_files: [string, number][];
  excluded_count?: number;
  excluded_files?: string[];
  base_path: string | null;
  include_patterns: string[] | null;
  exclude_patterns: string[] | null;
  api_requests?: number;
  method?: string;
}

/** Result of a crawler operation */
export interface CrawlerResult {
  files: Record<string, string>;
  stats: FileStats;
}

/** Options for the crawler */
export interface CrawlerOptions {
  repoUrl: string;
  token?: string;
  useRelativePaths: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  maxFileSize: number;
  /** Custom fetch function for dependency injection */
  fetchFn?: typeof fetch;
  /** Base URL for API calls */
  apiBaseUrl?: string;
}

// ============================================================================
// Pattern Types
// ============================================================================

/** A pattern category with metadata */
export interface PatternCategory {
  label: string;
  pattern: string[];
  description?: string;
  required?: boolean;
  reason?: string;
}

// ============================================================================
// Cache Types
// ============================================================================

/** A cached file with hash for change detection */
export interface CachedFile {
  path: string;
  contentHash: string;
  lastModified: string;
}

/** A cached abstraction (code concept) */
export interface CachedAbstraction {
  name: string;
  description: string;
  files: string[];
}

/** A cached chapter of documentation */
export interface CachedChapter {
  title: string;
  slug: string;
  content: string;
  abstractionsCovered: string[];
  dependencies: string[];
  generatedAt: string;
  promptHash: string;
}

/** Complete cache for a repository */
export interface RepoCache {
  repoUrl: string;
  repoId: string;
  lastCommit?: string;
  lastCrawlTime: string;
  files: CachedFile[];
  abstractions?: CachedAbstraction[];
  relationships?: Record<string, string[]>;
  chapterOrder?: string[];
  chapters: Record<string, CachedChapter>;
  metadata: {
    totalTokensUsed?: number;
    totalCost?: number;
    llmProvider?: string;
    llmModel?: string;
  };
}

/** Index of all cached repositories */
export interface RepoIndex {
  repos: Record<string, {
    cacheFile: string;
    lastAccessed: string;
    repoUrl: string;
  }>;
  version: string;
}

// ============================================================================
// Change Analysis Types
// ============================================================================

/** Analysis of file changes between cache and current state */
export interface FileChangeAnalysis {
  addedFiles: string[];
  removedFiles: string[];
  modifiedFiles: string[];
  unchangedFiles: string[];
  changePercentage: number;
  totalFiles: number;
}

/** Regeneration strategy modes */
export type RegenerationMode = 'full' | 'partial' | 'partial_reidentify' | 'skip';

/** Plan for what to regenerate */
export interface RegenerationPlan {
  mode: RegenerationMode;
  reason: string;
  chaptersToRegenerate: string[];
  rerunAbstractionIdentification: boolean;
  estimatedSavings: number;
}

// ============================================================================
// Storage Adapter Types
// ============================================================================

/**
 * Storage adapter interface for cache persistence
 * Implement this to store caches in different backends (localStorage, Postgres, etc.)
 */
export interface StorageAdapter {
  /** Get a value by key */
  get<T>(key: string): Promise<T | null>;
  /** Set a value by key */
  set<T>(key: string, value: T): Promise<void>;
  /** Delete a value by key */
  delete(key: string): Promise<boolean>;
  /** List all keys with optional prefix filter */
  keys(prefix?: string): Promise<string[]>;
  /** Clear all values (optionally with prefix) */
  clear(prefix?: string): Promise<void>;
}

// ============================================================================
// Generator Types
// ============================================================================

/** Abstraction identified from code */
export interface Abstraction {
  name: string;
  description: string;
  files: string[];
}

/** Relationship between abstractions */
export interface AbstractionRelationship {
  from: string;
  to: string;
  type: 'uses' | 'extends' | 'implements' | 'depends_on';
  description?: string;
}

/** A chapter of generated documentation */
export interface Chapter {
  title: string;
  slug: string;
  summary: string;
  content: string;
  abstractionsCovered: string[];
  order: number;
}

/** Complete generated documentation */
export interface GeneratedDocumentation {
  title: string;
  description: string;
  chapters: Chapter[];
  abstractions: Abstraction[];
  relationships: AbstractionRelationship[];
  mermaidDiagram?: string;
  generatedAt: string;
  metadata: {
    repoUrl: string;
    filesProcessed: number;
    tokensUsed: number;
    costEstimate: number;
    provider: string;
    model: string;
  };
}

// ============================================================================
// PocketFlow Node Types
// ============================================================================

/** Shared state for PocketFlow nodes */
export interface NodeSharedState {
  repoUrl: string;
  files: Map<string, string>;
  abstractions?: Abstraction[];
  relationships?: Record<string, string[]>;
  chapters?: Chapter[];
  chapterOrder?: string[];
  mermaidDiagram?: string;
  error?: string;
  
  // LLM configuration (injected)
  llmConfig: {
    providerId: string;
    modelId: string;
    apiKey: string;
    temperature?: number;
  };
  
  // Progress tracking
  progress?: {
    phase: string;
    current: number;
    total: number;
    message: string;
  };
}

/** Configuration for a generator node */
export interface NodeConfig {
  name: string;
  maxRetries?: number;
  timeout?: number;
}

/** Result from a node execution */
export interface NodeResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
}

// ============================================================================
// Documentation Mode Types
// ============================================================================

/** Type of documentation to generate */
export type DocumentationMode = 'tutorial' | 'architecture';

/** Options for documentation generation */
export interface GenerationOptions {
  mode: DocumentationMode;
  repoUrl: string;
  files: Map<string, string>;
  llmConfig: {
    providerId: string;
    modelId: string;
    apiKey: string;
    temperature?: number;
  };
  /** Optional cache for incremental regeneration */
  existingCache?: RepoCache;
  /** Progress callback */
  onProgress?: (progress: NodeSharedState['progress']) => void;
}

// ============================================================================
// RFC 7807 Problem Detail
// ============================================================================

/** RFC 7807 Problem Detail for errors */
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  [key: string]: unknown;
}
