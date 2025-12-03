/**
 * PocketFlow Nodes for Architecture Documentation Generation
 * 
 * This module provides nodes for generating architecture documentation from repositories.
 * Uses the llm/client.ts for LLM calls and supports multiple providers.
 * 
 * Flow: FetchRepo -> IdentifyAbstractions -> AnalyzeRelationships -> OrderChapters -> WriteChapters -> CombineTutorial
 */

import yaml from 'js-yaml';
import { Node, BatchNode } from 'pocketflow';
import { callLLM } from '@/llm/client';
import type { LLMCallOptions } from '@/llm/types';
import { serverGithubCrawler } from './server-crawler';
import type { CrawlerOptions, CrawlerResult } from './types';

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
 * Create a safe filename from a chapter name
 */
function createSafeFilename(name: string, prefix: number): string {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  const paddedPrefix = String(prefix).padStart(2, '0');
  return `${paddedPrefix}_${safeName}.md`;
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
 * Extract high-level signatures from file content for architecture documentation.
 * Captures imports, exports, interfaces, types, function/class signatures without implementation.
 */
function extractFileSignatures(content: string, filePath: string): string {
  const lines = content.split('\n');
  const signatures: string[] = [];
  let inMultiLineImport = false;
  let inInterface = false;
  let inType = false;
  let braceDepth = 0;
  let currentBlock: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and comments (unless in a block)
    if (!inMultiLineImport && !inInterface && !inType) {
      if (trimmed === '' || trimmed.startsWith('//')) continue;
    }
    
    // Capture import statements
    if (trimmed.startsWith('import ') || inMultiLineImport) {
      signatures.push(line);
      if (trimmed.includes('{') && !trimmed.includes('}')) {
        inMultiLineImport = true;
      }
      if (trimmed.includes('}') || (trimmed.includes('from ') && (trimmed.endsWith(';') || trimmed.endsWith("'") || trimmed.endsWith('"')))) {
        inMultiLineImport = false;
      }
      continue;
    }
    
    // Capture export statements
    if (trimmed.startsWith('export ') && 
        !trimmed.startsWith('export default function') && 
        !trimmed.startsWith('export default class') && 
        !trimmed.startsWith('export class') && 
        !trimmed.startsWith('export function') && 
        !trimmed.startsWith('export async function')) {
      if (!trimmed.startsWith('export type ') && !trimmed.startsWith('export interface ')) {
        signatures.push(line);
        continue;
      }
    }
    
    // Capture interface definitions
    if (trimmed.startsWith('interface ') || trimmed.startsWith('export interface ')) {
      inInterface = true;
      braceDepth = 0;
      currentBlock = [line];
      if (trimmed.includes('{')) braceDepth++;
      if (trimmed.includes('}')) braceDepth--;
      if (braceDepth === 0 && trimmed.includes('}')) {
        signatures.push(currentBlock.join('\n'));
        inInterface = false;
        currentBlock = [];
      }
      continue;
    }
    
    if (inInterface) {
      currentBlock.push(line);
      if (trimmed.includes('{')) braceDepth++;
      if (trimmed.includes('}')) braceDepth--;
      if (braceDepth === 0) {
        signatures.push(currentBlock.join('\n'));
        inInterface = false;
        currentBlock = [];
      }
      continue;
    }
    
    // Capture type definitions
    if (trimmed.startsWith('type ') || trimmed.startsWith('export type ')) {
      if (trimmed.includes('=') && (trimmed.endsWith(';') || trimmed.endsWith("'") || trimmed.endsWith('"') || trimmed.endsWith('>'))) {
        signatures.push(line);
      } else {
        inType = true;
        braceDepth = 0;
        currentBlock = [line];
        if (trimmed.includes('{') || trimmed.includes('(')) braceDepth++;
        if (trimmed.includes('}') || trimmed.includes(')')) braceDepth--;
      }
      continue;
    }
    
    if (inType) {
      currentBlock.push(line);
      if (trimmed.includes('{') || trimmed.includes('(')) braceDepth++;
      if (trimmed.includes('}') || trimmed.includes(')')) braceDepth--;
      if (braceDepth === 0 && (trimmed.endsWith(';') || trimmed.endsWith('}') || trimmed.endsWith(')'))) {
        signatures.push(currentBlock.join('\n'));
        inType = false;
        currentBlock = [];
      }
      continue;
    }
    
    // Capture function signatures
    if (trimmed.match(/^(export\s+)?(async\s+)?function\s+\w+/) || 
        trimmed.match(/^(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/) ||
        trimmed.match(/^(export\s+)?const\s+\w+\s*=\s*(async\s+)?function/)) {
      const funcMatch = trimmed.match(/^(.+?)\s*[{=]/);
      if (funcMatch) {
        signatures.push(`${funcMatch[1]} { /* ... */ }`);
      } else {
        signatures.push(`${trimmed.split('{')[0].trim()} { /* ... */ }`);
      }
      continue;
    }
    
    // Capture class declarations
    if (trimmed.match(/^(export\s+)?(default\s+)?class\s+\w+/)) {
      signatures.push(`${trimmed.split('{')[0].trim()} {`);
      let classDepth = 1;
      for (let j = i + 1; j < lines.length && classDepth > 0; j++) {
        const classLine = lines[j].trim();
        if (classLine.includes('{')) classDepth++;
        if (classLine.includes('}')) classDepth--;
        
        if (classLine.match(/^(async\s+)?(private\s+|public\s+|protected\s+)?\w+\s*\(/) ||
            classLine.match(/^constructor\s*\(/)) {
          const methodSig = classLine.split('{')[0].trim();
          signatures.push(`  ${methodSig} { /* ... */ }`);
        }
      }
      signatures.push('}');
      continue;
    }
    
    // Capture React component declarations
    if (trimmed.match(/^(export\s+)?(default\s+)?function\s+[A-Z]\w*/) ||
        trimmed.match(/^(export\s+)?const\s+[A-Z]\w+\s*[=:]/)) {
      const compMatch = trimmed.match(/^(.+?)\s*[{=(\n]/);
      if (compMatch) {
        signatures.push(`${compMatch[1]} { /* React Component */ }`);
      }
      continue;
    }
  }
  
  const extension = filePath.split('.').pop() || '';
  const fileTypeLabels: Record<string, string> = {
    'tsx': 'React Component/Page',
    'ts': 'TypeScript Module',
    'jsx': 'React Component',
    'js': 'JavaScript Module',
    'py': 'Python Module',
    'md': 'Documentation',
    'json': 'Configuration',
  };
  const fileType = fileTypeLabels[extension] || 'Source File';
  
  return `// ${fileType}: ${filePath}\n${signatures.join('\n')}`;
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
    
    // Build context using signature extraction (architecture mode)
    const CONTEXT_USAGE_RATIO = 0.70;
    const MAX_CONTEXT_TOKENS = Math.floor(modelContextWindow * CONTEXT_USAGE_RATIO);
    const CHARS_PER_TOKEN = 3.5;
    const MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN;
    
    // Process files with signature extraction
    const processedFiles: { path: string; content: string; index: number; chars: number }[] = [];
    
    filesData.forEach(([path, content], index) => {
      const processedContent = extractFileSignatures(content, path);
      processedFiles.push({
        path,
        content: processedContent,
        index,
        chars: processedContent.length,
      });
    });
    
    // Sort by priority
    const priorityPatterns = [
      /page\.(tsx?|jsx?)$/,
      /index\.(tsx?|jsx?|ts|js|py)$/,
      /main\.(tsx?|jsx?|ts|js|py)$/,
      /app\.(tsx?|jsx?|ts|js|py)$/,
      /route\.(tsx?|jsx?)$/,
      /layout\.(tsx?|jsx?)$/,
    ];
    
    processedFiles.sort((a, b) => {
      const aScore = priorityPatterns.findIndex(p => p.test(a.path));
      const bScore = priorityPatterns.findIndex(p => p.test(b.path));
      return (aScore === -1 ? 999 : aScore) - (bScore === -1 ? 999 : bScore);
    });
    
    // Build context with limit
    let context = '';
    const fileInfo: [number, string][] = [];
    let currentChars = 0;
    
    for (const file of processedFiles) {
      const fileHeader = `--- File Index ${file.index}: ${file.path} ---\n`;
      const fileEntry = fileHeader + file.content + '\n\n';
      
      if (currentChars + fileEntry.length <= MAX_CONTEXT_CHARS) {
        context += fileEntry;
        fileInfo.push([file.index, file.path]);
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
        message: 'Analyzing architecture and identifying major subsystems...',
        progress: 15
      });
    }
    
    console.log('[IdentifyAbstractions] Identifying abstractions using LLM...');
    
    const prompt = `
For the project \`${projectName}\`:

Codebase Structure (signatures and interfaces):
${context}

Analyze this codebase to understand its **architecture and purpose**.

Identify the top 3-${maxAbs} major **subsystems or architectural components** that define what this project does.

For each subsystem, provide:
1. A concise \`name\` that describes the subsystem.
2. A high-level \`description\` explaining:
   - What this subsystem's PURPOSE is (what problem it solves)
   - How it fits into the overall architecture
   - Key responsibilities (in around 80-100 words)
3. A list of relevant \`file_indices\` (integers) using the format \`idx # path/comment\`.

Focus on:
- Entry points (pages, routes, main files)
- Core business logic flows
- Data models and state management
- External integrations (APIs, databases)

List of file indices and paths present in the context:
${fileListing}

Format the output as a YAML list of dictionaries:

\`\`\`yaml
- name: |
    User Interface Layer
  description: |
    Handles user interactions through React pages and components.
    This is the entry point for users, rendering forms and displaying data.
  file_indices:
    - 0 # src/app/page.tsx
    - 3 # src/components/Form.tsx
- name: |
    Data Processing Pipeline
  description: |
    Core business logic that transforms and processes data.
    Acts as the brain of the application, orchestrating workflows.
  file_indices:
    - 5 # src/lib/processor.ts
# ... up to ${maxAbs} subsystems
\`\`\``;

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
 */
export class AnalyzeRelationships extends Node<SharedData> {
  private _shared?: SharedData;
  
  async prep(shared: SharedData) {
    this._shared = shared;
    
    const abstractions = shared.abstractions;
    const filesData = shared.files;
    const projectName = shared.project_name;
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
      llmProvider,
      llmModel,
      llmApiKey,
      llmBaseUrl,
    };
  }
  
  async exec(prepRes: Awaited<ReturnType<this['prep']>>): Promise<RelationshipData> {
    const { context, abstractionListing, numAbstractions, projectName, llmProvider, llmModel, llmApiKey, llmBaseUrl } = prepRes;
    
    const onProgress = this._shared?._onProgress;
    if (onProgress) {
      await onProgress({
        stage: 'relationships',
        message: 'Analyzing relationships between concepts...',
        progress: 22
      });
    }
    
    console.log('[AnalyzeRelationships] Analyzing relationships using LLM...');
    
    const prompt = `
Based on the following abstractions and code from the project \`${projectName}\`:

List of Abstraction Indices and Names:
${abstractionListing}

Context (Abstractions, Descriptions, Code):
${context}

Please provide:
1. A high-level \`summary\` of the project's main purpose and functionality in a few beginner-friendly sentences. Use markdown formatting with **bold** and *italic* text.
2. A list (\`relationships\`) describing the key interactions between these abstractions. For each relationship, specify:
    - \`from_abstraction\`: Index of the source abstraction (e.g., \`0 # AbstractionName1\`)
    - \`to_abstraction\`: Index of the target abstraction (e.g., \`1 # AbstractionName2\`)
    - \`label\`: A brief label for the interaction **in just a few words** (e.g., "Manages", "Inherits", "Uses").

IMPORTANT: Make sure EVERY abstraction is involved in at least ONE relationship.

Format the output as YAML:

\`\`\`yaml
summary: |
  A brief, simple explanation of the project.
  Can span multiple lines with **bold** and *italic* for emphasis.
relationships:
  - from_abstraction: 0 # AbstractionName1
    to_abstraction: 1 # AbstractionName2
    label: "Manages"
  - from_abstraction: 2 # AbstractionName3
    to_abstraction: 0 # AbstractionName1
    label: "Provides config"
\`\`\``;

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
 */
export class OrderChapters extends Node<SharedData> {
  private _shared?: SharedData;
  
  async prep(shared: SharedData) {
    this._shared = shared;
    
    const abstractions = shared.abstractions;
    const relationships = shared.relationships;
    const projectName = shared.project_name;
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
      llmProvider,
      llmModel,
      llmApiKey,
      llmBaseUrl,
    };
  }
  
  async exec(prepRes: Awaited<ReturnType<this['prep']>>): Promise<number[]> {
    const { abstractionListing, context, numAbstractions, projectName, llmProvider, llmModel, llmApiKey, llmBaseUrl } = prepRes;
    
    const onProgress = this._shared?._onProgress;
    if (onProgress) {
      await onProgress({
        stage: 'ordering',
        message: 'Determining optimal chapter order...',
        progress: 28
      });
    }
    
    console.log('[OrderChapters] Determining chapter order using LLM...');
    
    const prompt = `
Given the following project abstractions and their relationships for the project \`${projectName}\`:

Abstractions (Index # Name):
${abstractionListing}

Context about relationships and project summary:
${context}

What is the best order to explain these abstractions for architecture documentation?
Start with the most important or foundational concepts (user-facing, entry points), then move to implementation details.

Output the ordered list of abstraction indices with names as comments:

\`\`\`yaml
- 2 # FoundationalConcept
- 0 # CoreClassA
- 1 # CoreClassB
\`\`\``;

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
    chapterOrder.forEach((abstractionIndex, i) => {
      if (abstractionIndex < 0 || abstractionIndex >= abstractions.length) return;
      
      const chapterNum = i + 1;
      const chapterName = abstractions[abstractionIndex].name;
      const filename = createSafeFilename(chapterName, chapterNum);
      
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
    const { chapterNum, abstractionDetails, relatedFilesContentMap, projectName, fullChapterListing, prevChapter, nextChapter, llmProvider, llmModel, llmApiKey, llmBaseUrl } = item;
    
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
    
    const fileContextStr = Object.entries(relatedFilesContentMap)
      .map(([idxPath, content]) => `--- File: ${idxPath.split('# ')[1] ?? idxPath} ---\n${content}`)
      .join('\n\n') || 'No specific code snippets provided.';
    
    const previousChaptersSummary = this.chaptersWrittenSoFar.join('\n---\n') || 'This is the first chapter.';
    
    const prompt = `
Write an architecture documentation chapter (in Markdown format) for the project \`${projectName}\` about: "${abstractionName}". This is Chapter ${chapterNum}.

Concept Details:
- Name: ${abstractionName}
- Description:
${abstractionDescription}

Complete Chapter Structure:
${fullChapterListing}

Context from previous chapters:
${previousChaptersSummary}

Relevant Code Snippets:
${fileContextStr}

Instructions:
- Start with a clear heading: \`# Chapter ${chapterNum}: ${abstractionName}\`
${prevChapter ? `- Begin with a brief transition from the previous chapter, referencing [${prevChapter.name}](${prevChapter.filename}).\n` : ''}
- Explain what problem this component/subsystem solves.
- Include a **Component Overview** section with a flowchart showing how this fits into the system. Use \`\`\`mermaid flowchart TD\`\`\` format.
- Break down key concepts and explain them clearly.
- Provide example code blocks (BELOW 10 lines each). Use comments to skip non-important details.
- Use a simple sequenceDiagram to show internal flow (max 5 participants).
- When referring to other chapters, use Markdown links like [Chapter Title](filename.md).
- Use analogies and examples to help understanding.
${nextChapter ? `- End with a transition to the next chapter: [${nextChapter.name}](${nextChapter.filename}).\n` : '- End with a brief conclusion summarizing what was learned.\n'}
- Keep a welcoming, educational tone.

Output *only* the Markdown content for this chapter (no \`\`\`markdown\`\`\` tags):`;

    const response = await callLLM({
      prompt,
      provider: llmProvider,
      model: llmModel,
      customApiKey: llmApiKey,
      customBaseUrl: llmBaseUrl,
      maxTokens: 4000,
    });
    
    let chapterContent = response.trim();
    
    // Ensure heading is present
    const expectedHeading = `# Chapter ${chapterNum}: ${abstractionName}`;
    if (!chapterContent.match(new RegExp(`^#+\\s*Chapter\\s+${chapterNum}:`, 'i'))) {
      chapterContent = `${expectedHeading}\n\n${chapterContent}`;
    }
    
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
    let indexContent = `# ${projectName} - Architecture Overview\n\n`;
    indexContent += `> High-level documentation of the project's architecture and design.\n\n`;
    
    if (repoUrl) {
      indexContent += `**📦 Repository:** [${repoUrl}](${repoUrl})\n\n`;
    }
    
    indexContent += `## 🎯 Project Purpose\n\n`;
    indexContent += `${relationshipsData.summary}\n\n`;
    
    indexContent += `## 🏗️ System Architecture\n\n`;
    indexContent += `The following diagram shows the major components and their interactions:\n\n`;
    indexContent += '```mermaid\n';
    indexContent += mermaidDiagram + '\n';
    indexContent += '```\n\n';
    
    indexContent += `## 📚 Subsystem Details\n\n`;
    indexContent += `Click on each subsystem below for detailed documentation:\n\n`;
    
    const chapterFilesData: ChapterData[] = [];
    const numChaptersToProcess = Math.min(chapterOrder.length, chaptersContent.length);
    
    for (let i = 0; i < numChaptersToProcess; i++) {
      const abstractionIndex = chapterOrder[i];
      if (abstractionIndex < 0 || abstractionIndex >= abstractions.length) continue;
      
      const abstractionName = abstractions[abstractionIndex].name;
      const chapterNum = i + 1;
      const filename = createSafeFilename(abstractionName, chapterNum);
      
      indexContent += `${chapterNum}. [${abstractionName}](${filename})\n`;
      
      let chapterContent = chaptersContent[i];
      if (!chapterContent.endsWith('\n\n')) chapterContent += '\n\n';
      chapterContent += `\n\n---\n\nGenerated by [Code Details AI Documentation](https://codedetails.io)\n\n---\n\n`;
      
      chapterFilesData.push({
        filename,
        title: `Chapter ${chapterNum}: ${abstractionName}`,
        content: chapterContent,
      });
    }
    
    indexContent += `\n\n---\n\nGenerated by [Code Details AI Documentation](https://codedetails.io)\n\n---\n\n`;
    
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
