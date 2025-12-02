/**
 * Generator Module
 * Documentation generation utilities and prompts
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

// Prompts
export {
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
} from './prompts';
