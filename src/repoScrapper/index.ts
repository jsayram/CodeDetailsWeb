/**
 * RepoScrapper Module
 * 
 * Portable repository scraping and documentation generation library
 * 
 * Features:
 * - GitHub repository crawling
 * - File pattern matching (include/exclude)
 * - Smart caching with change detection
 * - Pluggable storage adapters (localStorage, Supabase, etc.)
 * - Documentation generation utilities
 * - RFC 7807 compliant error handling
 * 
 * @example
 * ```ts
 * import { 
 *   githubFileCrawler, 
 *   getDefaultPatterns,
 *   LocalStorageAdapter,
 *   loadRepoCache,
 *   saveRepoCache,
 * } from '@/repoScrapper';
 * 
 * // Get default patterns
 * const { includePatterns, excludePatterns } = getDefaultPatterns();
 * 
 * // Crawl a repository
 * const result = await githubFileCrawler({
 *   repoUrl: 'https://github.com/owner/repo',
 *   includePatterns,
 *   excludePatterns,
 *   maxFileSize: 500 * 1024,
 *   useRelativePaths: true,
 * });
 * 
 * // Cache the results
 * const storage = new LocalStorageAdapter('myapp_');
 * const cache = createRepoCache(repoUrl);
 * updateCacheFiles(cache, Object.entries(result.files).map(([p, c]) => ({ path: p, content: c })));
 * await saveRepoCache(storage, cache);
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Crawler types
  FileStats,
  CrawlerResult,
  CrawlerOptions,
  
  // Pattern types
  PatternCategory,
  
  // Cache types
  CachedFile,
  CachedAbstraction,
  CachedChapter,
  RepoCache,
  RepoIndex,
  FileChangeAnalysis,
  RegenerationMode,
  RegenerationPlan,
  StorageAdapter,
  
  // Generator types
  Abstraction,
  AbstractionRelationship,
  Chapter,
  GeneratedDocumentation,
  NodeSharedState,
  NodeConfig,
  NodeResult,
  DocumentationMode,
  GenerationOptions,
  
  // Error types
  ProblemDetail,
} from './types';

// ============================================================================
// Errors
// ============================================================================

export {
  RepoError,
  createRepoError,
  githubAuthError,
  githubRateLimitError,
  githubNotFoundError,
  githubApiError,
  crawlerError,
  cacheError,
  generationError,
  validationError,
  networkError,
  timeoutError,
  parseGitHubError,
  isRepoErrorType,
  isRetryableError,
  REPO_ERROR_TYPES,
  type RepoErrorType,
} from './errors';

// ============================================================================
// Crawler
// ============================================================================

export {
  githubFileCrawler,
  parseGitHubUrl,
  normalizeRepoUrl,
  repoUrlToFilename,
  calculateTotalSize,
  formatFileSize,
  getCrawlSummary,
  isValidGitHubUrl,
  createCrawlerOptions,
  simulateError,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_API_PATH,
} from './crawler';

// Server-side crawler (for API routes)
export { serverGithubCrawler } from './server-crawler';

// ============================================================================
// Patterns
// ============================================================================

export {
  includedPatternCategories,
  excludedPatternCategories,
  getAllIncludedPatterns,
  getIncludePatternsByCategory,
  getAllExcludedPatterns,
  getRequiredExcludedPatterns,
  getExcludePatternsByCategory,
  buildPatternSet,
  getDefaultPatterns,
  matchesPattern,
  filterFiles,
} from './patterns';

// ============================================================================
// Cache
// ============================================================================

export {
  // Hash utilities
  computeContentHash,
  computeContentHashAsync,
  
  // URL utilities
  repoCacheKey,
  
  // Index operations
  loadRepoIndex,
  saveRepoIndex,
  
  // Cache operations
  loadRepoCache,
  saveRepoCache,
  createRepoCache,
  clearRepoCache,
  clearAllCaches,
  
  // Change analysis
  analyzeFileChanges,
  determineRegenerationPlan,
  findAffectedChapters,
  updateCacheFiles,
  
  // Statistics
  getCacheStats,
  hasCache,
  getCacheAge,
  isCacheStale,
  
  // Storage adapters
  LocalStorageAdapter,
  MemoryStorageAdapter,
  createSupabaseAdapter,
  createStorageAdapter,
  getDefaultStorageAdapter,
  type SupabaseStorageConfig,
  type StorageType,
} from './cache';

// ============================================================================
// Generator
// ============================================================================

export {
  // File processing utilities
  getContentForIndices,
  truncateFileContent,
  getContentForIndicesTruncated,
  extractFileSignatures,
  getFileTypeLabel,
  
  // Filename utilities
  createSafeFilename,
  slugify,
  
  // Context building
  buildFileContext,
  buildFileListing,
  
  // Parsing
  extractYamlBlock,
  extractJsonBlock,
  
  // Prompt builders
  buildAbstractionPrompt,
  buildRelationshipPrompt,
  buildChapterOrderPrompt,
  buildChapterContentPrompt,
  buildMermaidPrompt,
  type AbstractionPromptParams,
  type RelationshipPromptParams,
  type ChapterOrderPromptParams,
  type ChapterContentPromptParams,
  type MermaidPromptParams,
} from './generator';

// ============================================================================
// PocketFlow Nodes & Flow
// ============================================================================

export {
  // Nodes
  FetchRepo,
  IdentifyAbstractions,
  AnalyzeRelationships,
  OrderChapters,
  WriteChapters,
  CombineTutorial,
  
  // Types
  type SharedData,
  type Abstraction as NodeAbstraction,
  type Relationship,
  type RelationshipData,
  type ChapterData,
  type ChapterFilenameInfo,
  type ProgressCallback,
} from './nodes';

export {
  // Flow functions
  createDocumentationFlow,
  runDocumentationFlow,
  runDocumentationFlowWithProgress,
  estimateTokenUsage,
  
  // Types
  type DocGenerationResult,
} from './flow';
