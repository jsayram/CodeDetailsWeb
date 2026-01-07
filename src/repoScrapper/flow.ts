/**
 * ================================================================================
 * POCKETFLOW DOCUMENTATION GENERATION FLOW
 * ================================================================================
 * 
 * Creates and runs the documentation generation pipeline:
 * FetchRepo → IdentifyAbstractions → AnalyzeRelationships → OrderChapters → WriteChapters → CombineTutorial
 * 
 * ARCHITECTURE:
 * - Nodes are imported from ./nodes.ts (which imports prompts from ./generator/prompts.ts)
 * - Prompts are centralized in generator/prompts.ts (SINGLE SOURCE OF TRUTH)
 * - This file only handles flow orchestration
 * 
 * SYNC WITH PYTHON:
 * - Flow structure matches src/lib/portable_tutorial_gen/flow.py
 * - Keep both in sync when making changes!
 * 
 * ================================================================================
 */

import { Flow } from 'pocketflow';
import {
  FetchRepo,
  IdentifyAbstractions,
  AnalyzeRelationships,
  OrderChapters,
  WriteChapters,
  CombineTutorial,
  type SharedData,
  type ProgressCallback,
  type ChapterData,
} from './nodes';

export type { SharedData, ProgressCallback, ChapterData };

export interface DocGenerationResult {
  projectName: string;
  generatedChapters: ChapterData[];
  generatedIndex: string;
}

/**
 * Creates the documentation generation flow
 * @param skipFetchRepo - If true, starts from IdentifyAbstractions (when files are already provided)
 */
export function createDocumentationFlow(skipFetchRepo = false): Flow {
  const fetchRepo = new FetchRepo(5, 20);
  const identifyAbstractions = new IdentifyAbstractions(5, 20);
  const analyzeRelationships = new AnalyzeRelationships(5, 20);
  const orderChapters = new OrderChapters(5, 20);
  const writeChapters = new WriteChapters(5, 20);
  const combineTutorial = new CombineTutorial(3, 20);

  if (skipFetchRepo) {
    identifyAbstractions
      .next(analyzeRelationships)
      .next(orderChapters)
      .next(writeChapters)
      .next(combineTutorial);
    
    return new Flow(identifyAbstractions);
  } else {
    fetchRepo
      .next(identifyAbstractions)
      .next(analyzeRelationships)
      .next(orderChapters)
      .next(writeChapters)
      .next(combineTutorial);
    
    return new Flow(fetchRepo);
  }
}

/**
 * Runs the documentation generation flow
 * @param shared - Shared data containing repo URL, LLM config, etc.
 */
export async function runDocumentationFlow(shared: SharedData): Promise<DocGenerationResult> {
  console.log('[DocFlow] Creating documentation flow instance');
  
  // If files are already provided, skip the fetch step
  const skipFetchRepo = Array.isArray(shared.files) && shared.files.length > 0;
  
  if (skipFetchRepo) {
    console.log('[DocFlow] Skipping FetchRepo - files already provided');
  }
  
  console.log(`[DocFlow] Running flow with project: ${shared.project_name || 'unknown'}`);
  console.log(`[DocFlow] LLM Provider: ${shared.llm_provider || 'default'}`);
  console.log(`[DocFlow] LLM Model: ${shared.llm_model || 'default'}`);
  
  try {
    const flow = createDocumentationFlow(skipFetchRepo);
    await flow.run(shared);
    
    console.log('[DocFlow] Flow execution completed successfully');
    
    return {
      projectName: shared.project_name || 'Unknown Project',
      generatedChapters: shared.generated_chapters || [],
      generatedIndex: shared.generated_index || '',
    };
  } catch (error) {
    console.error('[DocFlow] Flow execution failed:', error);
    throw error;
  }
}

/**
 * Runs the documentation generation flow with progress callbacks
 * @param shared - Shared data containing repo URL, LLM config, etc.
 * @param onProgress - Callback for progress updates
 */
export async function runDocumentationFlowWithProgress(
  shared: SharedData,
  onProgress: ProgressCallback
): Promise<DocGenerationResult> {
  console.log('[DocFlow] Creating documentation flow with progress tracking');
  
  const skipFetchRepo = Array.isArray(shared.files) && shared.files.length > 0;
  
  // Add progress callback to shared data
  shared._onProgress = onProgress;
  
  // Initial progress
  await onProgress({
    stage: 'initializing',
    message: skipFetchRepo ? 'Starting documentation generation...' : 'Fetching repository...',
    progress: 5,
  });
  
  try {
    const flow = createDocumentationFlow(skipFetchRepo);
    await flow.run(shared);
    
    // Final progress
    await onProgress({
      stage: 'complete',
      message: 'Documentation generation complete!',
      progress: 100,
    });
    
    return {
      projectName: shared.project_name || 'Unknown Project',
      generatedChapters: shared.generated_chapters || [],
      generatedIndex: shared.generated_index || '',
    };
  } catch (error) {
    console.error('[DocFlow] Flow execution failed:', error);
    throw error;
  }
}

/**
 * Quick estimation of token usage for a repository
 * Returns an estimate of how many tokens will be used
 */
export function estimateTokenUsage(filesData: [string, string][]): {
  totalChars: number;
  estimatedTokens: number;
  fileCount: number;
} {
  const totalChars = filesData.reduce((sum, [, content]) => sum + content.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 3.5); // Rough estimate
  
  return {
    totalChars,
    estimatedTokens,
    fileCount: filesData.length,
  };
}
