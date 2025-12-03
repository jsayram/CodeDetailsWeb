/**
 * Generator Module
 * Documentation generation utilities and prompts
 * 
 * PROMPTS ARE THE SINGLE SOURCE OF TRUTH:
 * - All LLM prompts are defined in ./prompts.ts
 * - Prompts are synced with Python (src/lib/portable_tutorial_gen/nodes.py)
 */

// Utilities
export {
  // File processing
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
} from './utils';

// Prompts - SINGLE SOURCE OF TRUTH for all LLM prompts
export {
  // New Python-synced prompt builders
  buildIdentifyAbstractionsPrompt,
  buildAnalyzeRelationshipsPrompt,
  buildOrderChaptersPrompt,
  buildWriteChapterPrompt,
  
  // Mermaid diagram prompt
  buildMermaidPrompt,
  
  // Legacy aliases (for backward compatibility)
  buildAbstractionPrompt,
  buildRelationshipPrompt,
  buildChapterOrderPrompt,
  buildChapterContentPrompt,
  
  // Legacy type interfaces (for backward compatibility)
  type AbstractionPromptParams,
  type RelationshipPromptParams,
  type ChapterOrderPromptParams,
  type ChapterContentPromptParams,
  type MermaidPromptParams,
} from './prompts';
