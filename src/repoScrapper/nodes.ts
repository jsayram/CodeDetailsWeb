/**
 * ================================================================================
 * POCKETFLOW NODES FOR TUTORIAL/ARCHITECTURE DOCUMENTATION GENERATION
 * ================================================================================
 * 
 * This module provides nodes for generating documentation from repositories.
 * Uses the llm/client.ts for LLM calls and supports multiple providers.
 * 
 * ARCHITECTURE:
 * - Prompts are imported from ./generator/prompts.ts (SINGLE SOURCE OF TRUTH)
 * - This file contains only node logic (prep → exec → post lifecycle)
 * - Keeps concerns separated: prompts vs processing logic
 * 
 * FLOW:
 * FetchRepo → IdentifyAbstractions → AnalyzeRelationships → OrderChapters → WriteChapters → CombineTutorial
 * 
 * SYNC WITH PYTHON:
 * - Prompts match src/lib/portable_tutorial_gen/nodes.py
 * - Keep both in sync when making changes!
 * 
 * ================================================================================
 */

import * as yaml from 'js-yaml';
import { Node, BatchNode } from 'pocketflow';
import { callLLM } from '@/llm/client';
import type { LLMCallOptions } from '@/llm/types';
import { serverGithubCrawler } from './server-crawler';
import type { CrawlerOptions, CrawlerResult } from './types';

// Import prompts from centralized prompts file (SINGLE SOURCE OF TRUTH)
import {
  buildIdentifyAbstractionsPrompt,
  buildAnalyzeRelationshipsPrompt,
  buildOrderChaptersPrompt,
  buildWriteChapterPrompt,
} from './generator/prompts';

// ============================================================================
// Types
// ============================================================================

export interface SharedData {
  // Repository info
  repo_url?: string;
  project_name?: string;
  github_token?: string;
  
  // Crawling options
  include_patterns?: string[];
  exclude_patterns?: string[];
  max_file_size?: number;
  max_lines_per_file?: number;
  
  // Files data
  files?: [string, string][];
  
  // LLM options
  llm_provider?: string;
  llm_model?: string;
  llm_api_key?: string;
  llm_base_url?: string;
  model_context_window?: number;
  temperature?: number;
  use_cache?: boolean;
  
  // Documentation settings
  language?: string;
  max_abstraction_num?: number;
  
  // Generated data
  abstractions?: Abstraction[];
  relationships?: RelationshipData;
  chapter_order?: number[];
  chapters?: string[];
  
  // Output
  output_dir?: string;
  final_output_dir?: string;
  generated_chapters?: ChapterData[];
  generated_index?: string;
  
  // Progress callback
  _onProgress?: ProgressCallback;
}

export interface Abstraction {
  name: string;
  description: string;
  files: number[];
}

export interface Relationship {
  from: number;
  to: number;
  label: string;
}

export interface RelationshipData {
  summary: string;
  details: Relationship[];
}

export interface ChapterData {
  filename: string;
  title: string;
  content: string;
}

export interface ChapterFilenameInfo {
  num: number;
  name: string;
  filename: string;
}

export type ProgressCallback = (update: {
  stage: string;
  message: string;
  progress: number;
  currentChapter?: number;
  totalChapters?: number;
  chapterName?: string;
}) => Promise<void> | void;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a safe filename from a chapter title
 * Format: 00_title-slug.md (matches output-utils.ts createChapterFilename)
 * 
 * IMPORTANT: This must match the format used by saveChapter() in output-utils.ts
 * so that index links work correctly!
 * 
 * @param order - 0-based chapter order (0, 1, 2, ...)
 * @param title - Full chapter title e.g. "Chapter 1: File Upload"
 */
function createChapterFilename(order: number, title: string): string {
  const paddedOrder = String(order).padStart(2, '0');
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  
  return `${paddedOrder}_${safeTitle}.md`;
}

/**
 * Get content for specific file indices
 */
function getContentForIndices(
  filesData: [string, string][],
  indices: number[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const i of indices) {
    if (i >= 0 && i < filesData.length) {
      const [p, c] = filesData[i];
      map[`${i} # ${p}`] = c;
    }
  }
  return map;
}

/**
 * Get content for indices with truncation
 */
function getContentForIndicesTruncated(
  filesData: [string, string][],
  indices: number[],
  maxLinesPerFile: number = 150
): Record<string, string> {
  const map: Record<string, string> = {};
  const maxStartLines = Math.floor(maxLinesPerFile * 0.8);
  const maxEndLines = maxLinesPerFile - maxStartLines;
  
  for (const i of indices) {
    if (i >= 0 && i < filesData.length) {
      const [p, c] = filesData[i];
      const lines = c.split('\n');
      const totalLines = lines.length;
      
      if (totalLines <= maxLinesPerFile) {
        map[`${i} # ${p}`] = c;
      } else {
        const startPortion = lines.slice(0, maxStartLines);
        const endPortion = lines.slice(-maxEndLines);
        const omittedCount = totalLines - maxStartLines - maxEndLines;
        map[`${i} # ${p}`] = [
          ...startPortion,
          `\n// ... [${omittedCount} lines omitted] ...\n`,
          ...endPortion
        ].join('\n');
      }
    }
  }
  return map;
}

// ============================================================================
// Nodes
// ============================================================================

/**
 * FetchRepo Node - Crawls a GitHub repository
 */
export class FetchRepo extends Node<SharedData> {
  async prep(shared: SharedData) {
    let { repo_url: repoUrl, project_name: projectName } = shared;
    
    if (!projectName && repoUrl) {
      projectName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'unknown';
      shared.project_name = projectName;
    }
    
    const {
      include_patterns: includePatterns,
      exclude_patterns: excludePatterns,
      max_file_size: maxFileSize,
      github_token: token,
    } = shared;
    
    if (!repoUrl) {
      throw new Error('repo_url is required');
    }
    
    return { repoUrl, token, includePatterns, excludePatterns, maxFileSize };
  }
  
  async exec(prepRes: Awaited<ReturnType<this['prep']>>): Promise<[string, string][]> {
    const { repoUrl, token, includePatterns, excludePatterns, maxFileSize } = prepRes;
    
    console.log(`[FetchRepo] Crawling repository: ${repoUrl}...`);
    
    const result: CrawlerResult = await serverGithubCrawler({
      repoUrl: repoUrl,
      token: token || undefined,
      includePatterns: includePatterns || ['**/*'],
      excludePatterns: excludePatterns || [],
      maxFileSize: maxFileSize || 100000,
      useRelativePaths: true,
    });
    
    const filesList = Object.entries(result.files || {});
    
    if (filesList.length === 0) {
      throw new Error('No files matched the criteria.');
    }
    
    console.log(`[FetchRepo] Fetched ${filesList.length} files.`);
    return filesList as [string, string][];
  }
  
  async post(shared: SharedData, _prepRes: unknown, execRes: [string, string][]): Promise<string | undefined> {
    shared.files = execRes;
    return undefined;
  }
}

/**
 * IdentifyAbstractions Node - Identifies key abstractions using LLM
 * 
 * Uses buildIdentifyAbstractionsPrompt from centralized prompts.
 */
export class IdentifyAbstractions extends Node<SharedData> {
  private _shared?: SharedData;
  
  async prep(shared: SharedData) {
    this._shared = shared;
    
    const filesData = shared.files;
    const projectName = shared.project_name;
    const language = shared.language ?? 'english';
    const maxAbs = shared.max_abstraction_num ?? 8;
    const llmProvider = shared.llm_provider;
    const llmModel = shared.llm_model;
    const llmApiKey = shared.llm_api_key;
    const llmBaseUrl = shared.llm_base_url;
    const modelContextWindow = shared.model_context_window ?? 128000;
    
    if (!filesData || filesData.length === 0) {
      throw new Error('No files data found for IdentifyAbstractions.');
    }
    
    // Build context - include full file contents for tutorial mode
    const CONTEXT_USAGE_RATIO = 0.70;
    const MAX_CONTEXT_TOKENS = Math.floor(modelContextWindow * CONTEXT_USAGE_RATIO);
    const CHARS_PER_TOKEN = 3.5;
    const MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN;
    
    // Build context with file contents
    let context = '';
    const fileInfo: [number, string][] = [];
    let currentChars = 0;
    
    for (let i = 0; i < filesData.length; i++) {
      const [path, content] = filesData[i];
      const fileEntry = `--- File Index ${i}: ${path} ---\n${content}\n\n`;
      
      if (currentChars + fileEntry.length <= MAX_CONTEXT_CHARS) {
        context += fileEntry;
        fileInfo.push([i, path]);
        currentChars += fileEntry.length;
      }
    }
    
    const fileListing = fileInfo.map(([index, path]) => `- ${index} # ${path}`).join('\n');
    
    return {
      context,
      fileListing,
      fileCount: filesData.length,
      projectName,
      language,
      maxAbs,
      llmProvider,
      llmModel,
      llmApiKey,
      llmBaseUrl,
    };
  }
  
  async exec(prepRes: Awaited<ReturnType<this['prep']>>): Promise<Abstraction[]> {
    const { context, fileListing, fileCount, projectName, language, maxAbs, llmProvider, llmModel, llmApiKey, llmBaseUrl } = prepRes;
    
    const onProgress = this._shared?._onProgress;
    if (onProgress) {
      await onProgress({
        stage: 'abstractions',
        message: 'Analyzing codebase and identifying core abstractions...',
        progress: 15
      });
    }
    
    console.log('[IdentifyAbstractions] Identifying abstractions using LLM...');
    
    // Use centralized prompt builder
    const prompt = buildIdentifyAbstractionsPrompt({
      projectName: projectName || 'Unknown',
      context,
      fileListing,
      maxAbstractions: maxAbs,
      language,
    });

    const llmOptions: LLMCallOptions = {
      prompt,
      provider: llmProvider,
      model: llmModel,
      customApiKey: llmApiKey,
      customBaseUrl: llmBaseUrl,
    };
    
    const response = await callLLM(llmOptions);
    
    // Extract YAML
    const yamlMatch = response.trim().match(/```yaml\s*([\s\S]*?)\s*```/);
    const yamlStr = yamlMatch?.[1]?.trim();
    
    if (!yamlStr) {
      console.error('LLM Response:', response);
      throw new Error('LLM did not return a valid YAML block for abstractions.');
    }
    
    const parsedAbstractions = yaml.load(yamlStr) as any[];
    
    if (!Array.isArray(parsedAbstractions)) {
      throw new Error('Parsed YAML is not an array.');
    }
    
    const validated = parsedAbstractions.map((item, index) => {
      if (!item?.name || !item?.description || !Array.isArray(item.file_indices)) {
        throw new Error(`Malformed abstraction at index ${index}`);
      }
      
      const files = [...new Set<number>(
        item.file_indices.map((entry: unknown) => {
          let idx: number;
          if (typeof entry === 'number') {
            idx = entry;
          } else if (typeof entry === 'string') {
            const match = entry.match(/^\s*(\d+)/);
            if (match) idx = parseInt(match[1], 10);
            else throw new Error(`Could not parse index: "${entry}"`);
          } else {
            idx = parseInt(String(entry), 10);
          }
          
          if (isNaN(idx) || idx < 0 || idx >= fileCount) {
            throw new Error(`Invalid file index ${idx} in item "${item.name}"`);
          }
          return idx;
        })
      )].sort((a, b) => a - b);
      
      return {
        name: item.name.trim(),
        description: item.description.trim(),
        files,
      };
    });
    
    console.log(`[IdentifyAbstractions] Identified ${validated.length} abstractions.`);
    return validated;
  }
  
  async post(shared: SharedData, _prepRes: unknown, execRes: Abstraction[]): Promise<string | undefined> {
    shared.abstractions = execRes;
    return undefined;
  }
}

/**
 * AnalyzeRelationships Node - Analyzes relationships between abstractions
 * 
 * Uses buildAnalyzeRelationshipsPrompt from centralized prompts.
 */
export class AnalyzeRelationships extends Node<SharedData> {
  private _shared?: SharedData;
  
  async prep(shared: SharedData) {
    this._shared = shared;
    
    const abstractions = shared.abstractions;
    const filesData = shared.files;
    const projectName = shared.project_name;
    const language = shared.language ?? 'english';
    const maxLinesPerFile = shared.max_lines_per_file ?? 150;
    const llmProvider = shared.llm_provider;
    const llmModel = shared.llm_model;
    const llmApiKey = shared.llm_api_key;
    const llmBaseUrl = shared.llm_base_url;
    
    if (!abstractions?.length) {
      throw new Error('No abstractions found for AnalyzeRelationships.');
    }
    if (!filesData) {
      throw new Error('No files data found.');
    }
    
    let context = 'Identified Abstractions:\n';
    const abstractionPromptInfo: string[] = [];
    const allRelevantIndices = new Set<number>();
    
    abstractions.forEach((abs, index) => {
      const fileIndicesStr = abs.files.join(', ');
      context += `- Index ${index}: ${abs.name} (Relevant file indices: [${fileIndicesStr}])\n  Description: ${abs.description}\n`;
      abstractionPromptInfo.push(`${index} # ${abs.name}`);
      abs.files.forEach(idx => allRelevantIndices.add(idx));
    });
    
    context += '\nRelevant File Snippets:\n';
    const relevantFilesContentMap = getContentForIndicesTruncated(
      filesData,
      [...allRelevantIndices].sort((a, b) => a - b),
      maxLinesPerFile
    );
    
    context += Object.entries(relevantFilesContentMap)
      .map(([idxPath, content]) => `--- File: ${idxPath} ---\n${content}`)
      .join('\n\n');
    
    return {
      context,
      abstractionListing: abstractionPromptInfo.join('\n'),
      numAbstractions: abstractions.length,
      projectName,
      language,
      llmProvider,
      llmModel,
      llmApiKey,
      llmBaseUrl,
    };
  }
  
  async exec(prepRes: Awaited<ReturnType<this['prep']>>): Promise<RelationshipData> {
    const { context, abstractionListing, numAbstractions, projectName, language, llmProvider, llmModel, llmApiKey, llmBaseUrl } = prepRes;
    
    const onProgress = this._shared?._onProgress;
    if (onProgress) {
      await onProgress({
        stage: 'relationships',
        message: 'Analyzing relationships between concepts...',
        progress: 22
      });
    }
    
    console.log('[AnalyzeRelationships] Analyzing relationships using LLM...');
    
    // Use centralized prompt builder
    const prompt = buildAnalyzeRelationshipsPrompt({
      projectName: projectName || 'Unknown',
      context,
      abstractionListing,
      language,
    });

    const response = await callLLM({
      prompt,
      provider: llmProvider,
      model: llmModel,
      customApiKey: llmApiKey,
      customBaseUrl: llmBaseUrl,
    });
    
    const yamlMatch = response.trim().match(/```yaml\s*([\s\S]*?)\s*```/);
    const yamlStr = yamlMatch?.[1]?.trim();
    
    if (!yamlStr) {
      throw new Error('LLM did not return a valid YAML block for relationships.');
    }
    
    const parsedData = yaml.load(yamlStr) as any;
    
    if (!parsedData?.summary || !Array.isArray(parsedData.relationships)) {
      throw new Error('Bad YAML structure for relationships.');
    }
    
    const validatedRelationships: Relationship[] = parsedData.relationships.map((rel: any, index: number) => {
      if (!rel || typeof rel.from_abstraction === 'undefined' || typeof rel.to_abstraction === 'undefined' || typeof rel.label !== 'string') {
        throw new Error(`Malformed relationship at index ${index}`);
      }
      
      const fromStr = String(rel.from_abstraction);
      const fromMatch = fromStr.match(/^\s*(\d+)/);
      const fromIdx = fromMatch ? parseInt(fromMatch[1], 10) : NaN;
      
      const toStr = String(rel.to_abstraction);
      const toMatch = toStr.match(/^\s*(\d+)/);
      const toIdx = toMatch ? parseInt(toMatch[1], 10) : NaN;
      
      if (isNaN(fromIdx) || isNaN(toIdx) || fromIdx < 0 || toIdx < 0 || fromIdx >= numAbstractions || toIdx >= numAbstractions) {
        throw new Error(`Invalid indices in relationship at ${index}: from=${fromIdx}, to=${toIdx}`);
      }
      
      return { from: fromIdx, to: toIdx, label: rel.label.trim() };
    });
    
    console.log('[AnalyzeRelationships] Generated project summary and relationships.');
    return {
      summary: parsedData.summary.trim(),
      details: validatedRelationships,
    };
  }
  
  async post(shared: SharedData, _prepRes: unknown, execRes: RelationshipData): Promise<string | undefined> {
    shared.relationships = execRes;
    return undefined;
  }
}

/**
 * OrderChapters Node - Determines the order of chapters
 * 
 * Uses buildOrderChaptersPrompt from centralized prompts.
 */
export class OrderChapters extends Node<SharedData> {
  private _shared?: SharedData;
  
  async prep(shared: SharedData) {
    this._shared = shared;
    
    const abstractions = shared.abstractions;
    const relationships = shared.relationships;
    const projectName = shared.project_name;
    const language = shared.language ?? 'english';
    const llmProvider = shared.llm_provider;
    const llmModel = shared.llm_model;
    const llmApiKey = shared.llm_api_key;
    const llmBaseUrl = shared.llm_base_url;
    
    if (!abstractions?.length) throw new Error('No abstractions found for OrderChapters.');
    if (!relationships) throw new Error('No relationships found.');
    
    const abstractionListing = abstractions.map((abs, index) => `- ${index} # ${abs.name}`).join('\n');
    
    let context = `Project Summary:\n${relationships.summary}\n\n`;
    context += 'Relationships:\n';
    relationships.details.forEach(rel => {
      if (rel.from >= 0 && rel.from < abstractions.length && rel.to >= 0 && rel.to < abstractions.length) {
        context += `- From ${rel.from} (${abstractions[rel.from].name}) to ${rel.to} (${abstractions[rel.to].name}): ${rel.label}\n`;
      }
    });
    
    return {
      abstractionListing,
      context,
      numAbstractions: abstractions.length,
      projectName,
      language,
      llmProvider,
      llmModel,
      llmApiKey,
      llmBaseUrl,
    };
  }
  
  async exec(prepRes: Awaited<ReturnType<this['prep']>>): Promise<number[]> {
    const { abstractionListing, context, numAbstractions, projectName, language, llmProvider, llmModel, llmApiKey, llmBaseUrl } = prepRes;
    
    const onProgress = this._shared?._onProgress;
    if (onProgress) {
      await onProgress({
        stage: 'ordering',
        message: 'Determining optimal chapter order...',
        progress: 28
      });
    }
    
    console.log('[OrderChapters] Determining chapter order using LLM...');
    
    // Use centralized prompt builder
    const prompt = buildOrderChaptersPrompt({
      projectName: projectName || 'Unknown',
      abstractionListing,
      context,
      language,
    });

    const response = await callLLM({
      prompt,
      provider: llmProvider,
      model: llmModel,
      customApiKey: llmApiKey,
      customBaseUrl: llmBaseUrl,
    });
    
    const yamlMatch = response.trim().match(/```yaml\s*([\s\S]*?)\s*```/);
    const yamlStr = yamlMatch?.[1]?.trim();
    
    if (!yamlStr) {
      throw new Error('LLM did not return a valid YAML block for chapter order.');
    }
    
    const parsedOrder = yaml.load(yamlStr) as any[];
    
    if (!Array.isArray(parsedOrder)) {
      throw new Error('Parsed chapter order is not an array.');
    }
    
    const orderedIndices: number[] = [];
    const seenIndices = new Set<number>();
    
    parsedOrder.forEach((entry, listIndex) => {
      let idx: number;
      if (typeof entry === 'number') {
        idx = entry;
      } else if (typeof entry === 'string') {
        const match = entry.match(/^\s*(\d+)/);
        if (match) idx = parseInt(match[1], 10);
        else throw new Error(`Could not parse index from: "${entry}"`);
      } else {
        idx = parseInt(String(entry), 10);
      }
      
      if (isNaN(idx) || idx < 0 || idx >= numAbstractions) {
        throw new Error(`Invalid index ${idx} at position ${listIndex}`);
      }
      if (seenIndices.has(idx)) {
        throw new Error(`Duplicate index ${idx} in ordered list.`);
      }
      
      orderedIndices.push(idx);
      seenIndices.add(idx);
    });
    
    if (orderedIndices.length !== numAbstractions) {
      const missing = [...Array(numAbstractions).keys()].filter(i => !seenIndices.has(i));
      throw new Error(`Missing indices: ${missing.join(', ')}`);
    }
    
    console.log(`[OrderChapters] Determined order: ${orderedIndices.join(', ')}`);
    return orderedIndices;
  }
  
  async post(shared: SharedData, _prepRes: unknown, execRes: number[]): Promise<string | undefined> {
    shared.chapter_order = execRes;
    return undefined;
  }
}

/**
 * WriteChapters BatchNode - Writes chapter content using LLM
 * 
 * Uses buildWriteChapterPrompt from centralized prompts.
 * This is the most detailed prompt - synced with Python's WriteChapters node.
 */
interface WriteChapterItem {
  chapterNum: number;
  abstractionIndex: number;
  abstractionDetails: Abstraction;
  relatedFilesContentMap: Record<string, string>;
  projectName: string;
  fullChapterListing: string;
  chapterFilenames: Record<number, ChapterFilenameInfo>;
  prevChapter: ChapterFilenameInfo | null;
  nextChapter: ChapterFilenameInfo | null;
  language: string;
  llmProvider?: string;
  llmModel?: string;
  llmApiKey?: string;
  llmBaseUrl?: string;
  [key: string]: unknown;
}

export class WriteChapters extends BatchNode<SharedData, WriteChapterItem> {
  private chaptersWrittenSoFar: string[] = [];
  private totalChapters: number = 0;
  private onProgress?: ProgressCallback;
  
  async prep(shared: SharedData): Promise<WriteChapterItem[]> {
    const chapterOrder = shared.chapter_order;
    const abstractions = shared.abstractions;
    const filesData = shared.files;
    const projectName = shared.project_name;
    const language = shared.language ?? 'english';
    const maxLinesPerFile = shared.max_lines_per_file ?? 150;
    const llmProvider = shared.llm_provider;
    const llmModel = shared.llm_model;
    const llmApiKey = shared.llm_api_key;
    const llmBaseUrl = shared.llm_base_url;
    
    this.onProgress = shared._onProgress;
    
    if (!chapterOrder) throw new Error('Chapter order not found.');
    if (!abstractions) throw new Error('Abstractions not found.');
    if (!filesData) throw new Error('Files data not found.');
    
    this.chaptersWrittenSoFar = [];
    
    const allChaptersList: string[] = [];
    const chapterFilenamesMap: Record<number, ChapterFilenameInfo> = {};
    
    // First pass: Generate filenames
    // IMPORTANT: Use 0-based index to match saveChapter() in output-utils.ts
    chapterOrder.forEach((abstractionIndex, i) => {
      if (abstractionIndex < 0 || abstractionIndex >= abstractions.length) return;
      
      const chapterNum = i + 1;
      const chapterName = abstractions[abstractionIndex].name;
      const chapterTitle = `Chapter ${chapterNum}: ${chapterName}`;
      const filename = createChapterFilename(i, chapterTitle); // 0-based order!
      
      chapterFilenamesMap[abstractionIndex] = { num: chapterNum, name: chapterName, filename };
      allChaptersList.push(`${chapterNum}. [${chapterName}](${filename})`);
    });
    
    const fullChapterListing = allChaptersList.join('\n');
    const itemsToProcess: WriteChapterItem[] = [];
    
    // Second pass: Prepare items
    chapterOrder.forEach((abstractionIndex, i) => {
      if (!(abstractionIndex in chapterFilenamesMap)) return;
      
      const abstractionDetails = abstractions[abstractionIndex];
      const relatedFilesContentMap = getContentForIndicesTruncated(
        filesData,
        abstractionDetails.files,
        maxLinesPerFile
      );
      
      const prevChapterIndex = i > 0 ? chapterOrder[i - 1] : -1;
      const nextChapterIndex = i < chapterOrder.length - 1 ? chapterOrder[i + 1] : -1;
      
      itemsToProcess.push({
        chapterNum: i + 1,
        abstractionIndex,
        abstractionDetails,
        relatedFilesContentMap,
        projectName: projectName || 'Unknown Project',
        fullChapterListing,
        chapterFilenames: chapterFilenamesMap,
        prevChapter: prevChapterIndex !== -1 ? chapterFilenamesMap[prevChapterIndex] : null,
        nextChapter: nextChapterIndex !== -1 ? chapterFilenamesMap[nextChapterIndex] : null,
        language,
        llmProvider,
        llmModel,
        llmApiKey,
        llmBaseUrl,
      });
    });
    
    this.totalChapters = itemsToProcess.length;
    
    if (this.onProgress) {
      await this.onProgress({
        stage: 'writing_chapters',
        message: `Writing ${itemsToProcess.length} chapters...`,
        progress: 30,
        currentChapter: 0,
        totalChapters: itemsToProcess.length,
      });
    }
    
    return itemsToProcess;
  }
  
  async exec(item: WriteChapterItem): Promise<string> {
    const { chapterNum, abstractionDetails, relatedFilesContentMap, projectName, fullChapterListing, language, llmProvider, llmModel, llmApiKey, llmBaseUrl } = item;
    
    const abstractionName = abstractionDetails.name;
    const abstractionDescription = abstractionDetails.description;
    
    console.log(`[WriteChapters] Writing chapter ${chapterNum}: ${abstractionName}...`);
    
    if (this.onProgress) {
      const progress = 30 + Math.round(((chapterNum - 1) / this.totalChapters) * 60);
      await this.onProgress({
        stage: 'writing_chapters',
        message: `Writing chapter ${chapterNum}/${this.totalChapters}: ${abstractionName}...`,
        progress,
        currentChapter: chapterNum,
        totalChapters: this.totalChapters,
        chapterName: abstractionName,
      });
    }
    
    // Prepare file context
    const fileContextStr = Object.entries(relatedFilesContentMap)
      .map(([idxPath, content]) => `--- File: ${idxPath.split('# ')[1] ?? idxPath} ---\n${content}`)
      .join('\n\n');
    
    // Get previous chapters for context (full content like Python does)
    const previousChaptersSummary = this.chaptersWrittenSoFar.join('\n---\n');
    
    // Use centralized prompt builder (matches Python's WriteChapters exactly)
    const prompt = buildWriteChapterPrompt({
      projectName,
      chapterNum,
      abstractionName,
      abstractionDescription,
      fullChapterListing,
      previousChaptersSummary,
      fileContextStr,
      language,
    });

    const response = await callLLM({
      prompt,
      provider: llmProvider,
      model: llmModel,
      customApiKey: llmApiKey,
      customBaseUrl: llmBaseUrl,
      maxTokens: 4000,
    });
    
    let chapterContent = response.trim();
    
    // Ensure heading is present (like Python does)
    const expectedHeading = `# Chapter ${chapterNum}: ${abstractionName}`;
    if (!chapterContent.match(new RegExp(`^#+\\s*Chapter\\s+${chapterNum}:`, 'i'))) {
      chapterContent = `${expectedHeading}\n\n${chapterContent}`;
    }
    
    // Add to context for next chapter (like Python's self.chapters_written_so_far)
    this.chaptersWrittenSoFar.push(chapterContent);
    
    if (this.onProgress) {
      const progress = 30 + Math.round((chapterNum / this.totalChapters) * 60);
      await this.onProgress({
        stage: 'writing_chapters',
        message: `Completed chapter ${chapterNum}/${this.totalChapters}: ${abstractionName}`,
        progress,
        currentChapter: chapterNum,
        totalChapters: this.totalChapters,
        chapterName: abstractionName,
      });
    }
    
    return chapterContent;
  }
  
  async post(shared: SharedData, _prepRes: unknown, execRes: unknown): Promise<string | undefined> {
    shared.chapters = execRes as string[];
    this.chaptersWrittenSoFar = [];
    console.log(`[WriteChapters] Finished writing ${(execRes as string[]).length} chapters.`);
    return undefined;
  }
}

/**
 * CombineTutorial Node - Combines chapters into final output
 */
export class CombineTutorial extends Node<SharedData> {
  private _shared?: SharedData;
  
  async prep(shared: SharedData) {
    this._shared = shared;
    
    const onProgress = shared._onProgress;
    if (onProgress) {
      await onProgress({
        stage: 'combining',
        message: 'Combining chapters into final documentation...',
        progress: 92
      });
    }
    
    const projectName = shared.project_name;
    const repoUrl = shared.repo_url;
    const relationshipsData = shared.relationships;
    const chapterOrder = shared.chapter_order;
    const abstractions = shared.abstractions;
    const chaptersContent = shared.chapters;
    
    if (!projectName) throw new Error('Project name not found.');
    if (!relationshipsData) throw new Error('Relationships data not found.');
    if (!chapterOrder) throw new Error('Chapter order not found.');
    if (!abstractions) throw new Error('Abstractions not found.');
    if (!chaptersContent) throw new Error('Chapters content not found.');
    
    // Generate Mermaid diagram
    const mermaidLines: string[] = ['flowchart TD'];
    const nodeMap: Record<number, string> = {};
    
    abstractions.forEach((abs, index) => {
      const nodeId = `A${index}`;
      nodeMap[index] = nodeId;
      const sanitizedName = abs.name.replace(/"/g, '');
      mermaidLines.push(`    ${nodeId}["${sanitizedName}"]`);
    });
    
    relationshipsData.details.forEach(rel => {
      const fromNodeId = nodeMap[rel.from];
      const toNodeId = nodeMap[rel.to];
      if (!fromNodeId || !toNodeId) return;
      
      let edgeLabel = rel.label.replace(/"/g, '').replace(/\n/g, ' ');
      if (edgeLabel.length > 30) edgeLabel = edgeLabel.substring(0, 27) + '...';
      mermaidLines.push(`    ${fromNodeId} -- "${edgeLabel}" --> ${toNodeId}`);
    });
    
    const mermaidDiagram = mermaidLines.join('\n');
    
    // Build index content
    let indexContent = `# Tutorial: ${projectName}\n\n`;
    indexContent += `${relationshipsData.summary}\n\n`;
    
    if (repoUrl) {
      indexContent += `**Source Repository:** [${repoUrl}](${repoUrl})\n\n`;
    }
    
    indexContent += '```mermaid\n';
    indexContent += mermaidDiagram + '\n';
    indexContent += '```\n\n';
    
    indexContent += `## Chapters\n\n`;
    
    const chapterFilesData: ChapterData[] = [];
    const numChaptersToProcess = Math.min(chapterOrder.length, chaptersContent.length);
    
    for (let i = 0; i < numChaptersToProcess; i++) {
      const abstractionIndex = chapterOrder[i];
      if (abstractionIndex < 0 || abstractionIndex >= abstractions.length) continue;
      
      const abstractionName = abstractions[abstractionIndex].name;
      const chapterNum = i + 1;
      const chapterTitle = `Chapter ${chapterNum}: ${abstractionName}`;
      const filename = createChapterFilename(i, chapterTitle); // 0-based order!
      
      indexContent += `${chapterNum}. [${abstractionName}](${filename})\n`;
      
      let chapterContent = chaptersContent[i];
      if (!chapterContent.endsWith('\n\n')) chapterContent += '\n\n';
      chapterContent += `---\n\nGenerated by [AI Codebase Knowledge Builder](https://github.com/The-Pocket/Tutorial-Codebase-Knowledge)`;
      
      chapterFilesData.push({
        filename,
        title: `Chapter ${chapterNum}: ${abstractionName}`,
        content: chapterContent,
      });
    }
    
    indexContent += `\n\n---\n\nGenerated by [AI Codebase Knowledge Builder](https://github.com/The-Pocket/Tutorial-Codebase-Knowledge)`;
    
    return {
      indexContent,
      chapterFiles: chapterFilesData,
      projectName,
    };
  }
  
  async exec(prepRes: Awaited<ReturnType<this['prep']>>): Promise<{ chapters: ChapterData[]; indexContent: string; projectName: string }> {
    const { indexContent, chapterFiles, projectName } = prepRes;
    
    console.log(`[CombineTutorial] Combined ${chapterFiles.length} chapters.`);
    
    return {
      chapters: chapterFiles,
      indexContent,
      projectName,
    };
  }
  
  async post(shared: SharedData, _prepRes: unknown, execRes: unknown): Promise<string | undefined> {
    const result = execRes as { chapters: ChapterData[]; indexContent: string; projectName: string };
    
    shared.generated_chapters = result.chapters;
    shared.generated_index = result.indexContent;
    
    console.log(`[CombineTutorial] Documentation generation complete!`);
    return undefined;
  }
}
