/**
 * Cache Module
 * Repository caching with pluggable storage backends
 */

// Manager functions
export {
  // Hash utilities
  computeContentHash,
  computeContentHashAsync,
  
  // URL utilities
  normalizeRepoUrl,
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
} from './manager';

// Storage adapters
export {
  LocalStorageAdapter,
  MemoryStorageAdapter,
  createSupabaseAdapter,
  createStorageAdapter,
  getDefaultStorageAdapter,
  type SupabaseStorageConfig,
  type StorageType,
} from './adapters';
