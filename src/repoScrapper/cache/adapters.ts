/**
 * Storage Adapters
 * Implementations of StorageAdapter for different backends
 */

import type { StorageAdapter } from '../types';

// ============================================================================
// LocalStorage Adapter
// ============================================================================

/**
 * LocalStorage adapter for browser-based caching
 * 
 * @example
 * ```ts
 * import { LocalStorageAdapter } from '@/repoScrapper';
 * 
 * const storage = new LocalStorageAdapter('myapp_');
 * await storage.set('key', { data: 'value' });
 * const data = await storage.get('key');
 * ```
 */
export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = 'reposcrapper_') {
    this.prefix = prefix;
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (typeof localStorage === 'undefined') {
      console.warn('[LocalStorageAdapter] localStorage not available');
      return null;
    }

    try {
      const item = localStorage.getItem(this.getFullKey(key));
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`[LocalStorageAdapter] Failed to get ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof localStorage === 'undefined') {
      console.warn('[LocalStorageAdapter] localStorage not available');
      return;
    }

    try {
      localStorage.setItem(this.getFullKey(key), JSON.stringify(value));
    } catch (error) {
      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[LocalStorageAdapter] Storage quota exceeded, clearing old entries');
        await this.clearOldestEntries(5);
        // Retry once
        localStorage.setItem(this.getFullKey(key), JSON.stringify(value));
      } else {
        throw error;
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    if (typeof localStorage === 'undefined') return false;

    const fullKey = this.getFullKey(key);
    const exists = localStorage.getItem(fullKey) !== null;
    localStorage.removeItem(fullKey);
    return exists;
  }

  async keys(prefix?: string): Promise<string[]> {
    if (typeof localStorage === 'undefined') return [];

    const fullPrefix = prefix 
      ? this.getFullKey(prefix) 
      : this.prefix;
    
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(fullPrefix)) {
        // Remove our prefix from the returned key
        keys.push(key.slice(this.prefix.length));
      }
    }
    return keys;
  }

  async clear(prefix?: string): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    const keysToDelete = await this.keys(prefix);
    for (const key of keysToDelete) {
      localStorage.removeItem(this.getFullKey(key));
    }
  }

  /**
   * Clear oldest entries to free up space
   */
  private async clearOldestEntries(count: number): Promise<void> {
    const keys = await this.keys();
    const entries: Array<{ key: string; timestamp: number }> = [];

    for (const key of keys) {
      try {
        const value = await this.get<{ lastCrawlTime?: string; lastAccessed?: string }>(key);
        const timestamp = value?.lastCrawlTime || value?.lastAccessed;
        entries.push({
          key,
          timestamp: timestamp ? new Date(timestamp).getTime() : 0,
        });
      } catch {
        entries.push({ key, timestamp: 0 });
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Delete oldest entries
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      await this.delete(entries[i].key);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getUsage(): Promise<{ used: number; available: number; percent: number }> {
    if (typeof localStorage === 'undefined') {
      return { used: 0, available: 0, percent: 0 };
    }

    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }

    // Most browsers have ~5MB limit
    const available = 5 * 1024 * 1024;
    const percent = (used / available) * 100;

    return { used, available, percent };
  }
}

// ============================================================================
// Memory Adapter
// ============================================================================

/**
 * In-memory storage adapter for testing or server-side use
 * 
 * @example
 * ```ts
 * import { MemoryStorageAdapter } from '@/repoScrapper';
 * 
 * const storage = new MemoryStorageAdapter();
 * await storage.set('key', { data: 'value' });
 * const data = await storage.get('key');
 * ```
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, unknown> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return (value as T) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async keys(prefix?: string): Promise<string[]> {
    const allKeys = Array.from(this.store.keys());
    if (!prefix) return allKeys;
    return allKeys.filter(key => key.startsWith(prefix));
  }

  async clear(prefix?: string): Promise<void> {
    if (!prefix) {
      this.store.clear();
      return;
    }

    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get the number of entries in storage
   */
  size(): number {
    return this.store.size;
  }
}

// ============================================================================
// Supabase Adapter Interface
// ============================================================================

/**
 * Configuration for Supabase storage adapter
 */
export interface SupabaseStorageConfig {
  /** Supabase client instance */
  supabase: {
    from: (table: string) => {
      select: (columns: string) => Promise<{ data: unknown[]; error: unknown }>;
      insert: (data: unknown) => Promise<{ error: unknown }>;
      upsert: (data: unknown) => Promise<{ error: unknown }>;
      delete: () => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    };
  };
  /** Table name for cache storage */
  tableName?: string;
  /** User ID for row-level security */
  userId?: string;
}

/**
 * Supabase storage adapter factory
 * 
 * NOTE: This is a factory function that creates an adapter.
 * You need to implement the actual adapter based on your Supabase setup.
 * 
 * @example
 * ```ts
 * // In your consuming app:
 * import { createSupabaseAdapter } from '@/repoScrapper';
 * import { supabase } from '@/lib/supabase';
 * 
 * const storage = createSupabaseAdapter({
 *   supabase,
 *   tableName: 'repo_cache',
 *   userId: user.id,
 * });
 * ```
 */
export function createSupabaseAdapter(config: SupabaseStorageConfig): StorageAdapter {
  const { supabase, tableName = 'repo_cache', userId } = config;

  return {
    async get<T>(key: string): Promise<T | null> {
      const query = supabase.from(tableName).select('value');
      // Add user filter if RLS is enabled
      const { data, error } = await query;
      
      if (error) {
        console.error('[SupabaseAdapter] Get error:', error);
        return null;
      }

      // Find matching key
      const entry = (data as Array<{ key: string; value: T }>)?.find(
        (d: { key: string }) => d.key === key
      );
      return entry?.value ?? null;
    },

    async set<T>(key: string, value: T): Promise<void> {
      const { error } = await supabase.from(tableName).upsert({
        key,
        value,
        user_id: userId,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(`[SupabaseAdapter] Set error: ${error}`);
      }
    },

    async delete(key: string): Promise<boolean> {
      const { error } = await supabase.from(tableName).delete().eq('key', key);
      return !error;
    },

    async keys(prefix?: string): Promise<string[]> {
      const { data, error } = await supabase.from(tableName).select('key');
      
      if (error) {
        console.error('[SupabaseAdapter] Keys error:', error);
        return [];
      }

      const keys = (data as Array<{ key: string }>)?.map(d => d.key) ?? [];
      if (!prefix) return keys;
      return keys.filter(key => key.startsWith(prefix));
    },

    async clear(prefix?: string): Promise<void> {
      const keys = await this.keys!(prefix);
      for (const key of keys) {
        await this.delete!(key);
      }
    },
  };
}

// ============================================================================
// Adapter Factory
// ============================================================================

export type StorageType = 'localStorage' | 'memory' | 'supabase';

/**
 * Create a storage adapter based on type
 */
export function createStorageAdapter(
  type: StorageType,
  options?: { prefix?: string; supabaseConfig?: SupabaseStorageConfig }
): StorageAdapter {
  switch (type) {
    case 'localStorage':
      return new LocalStorageAdapter(options?.prefix);
    
    case 'memory':
      return new MemoryStorageAdapter();
    
    case 'supabase':
      if (!options?.supabaseConfig) {
        throw new Error('Supabase config required for supabase storage type');
      }
      return createSupabaseAdapter(options.supabaseConfig);
    
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
}

/**
 * Get the default storage adapter (localStorage in browser, memory on server)
 */
export function getDefaultStorageAdapter(prefix?: string): StorageAdapter {
  if (typeof localStorage !== 'undefined') {
    return new LocalStorageAdapter(prefix);
  }
  return new MemoryStorageAdapter();
}
