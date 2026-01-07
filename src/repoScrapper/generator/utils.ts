/**
 * Generator Utilities
 * Helper functions for documentation generation
 */

// ============================================================================
// File Processing Utilities
// ============================================================================

/**
 * Get content for specific file indices
 */
export function getContentForIndices(
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
 * Smart file content truncation to reduce token count while preserving key information.
 * Keeps the first N lines (imports, class definitions, function signatures) and last M lines.
 */
export function truncateFileContent(
  content: string,
  maxStartLines: number = 200,
  maxEndLines: number = 50
): string {
  const lines = content.split('\n');
  const totalLines = lines.length;
  const maxTotalLines = maxStartLines + maxEndLines;
  
  if (totalLines <= maxTotalLines) {
    return content;
  }
  
  const startPortion = lines.slice(0, maxStartLines);
  const endPortion = lines.slice(-maxEndLines);
  const omittedCount = totalLines - maxTotalLines;
  
  return [
    ...startPortion,
    `\n// ... [${omittedCount} lines omitted for brevity - file has ${totalLines} total lines] ...\n`,
    ...endPortion
  ].join('\n');
}

/**
 * Gets content for specific file indices with smart truncation applied.
 */
export function getContentForIndicesTruncated(
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
      map[`${i} # ${p}`] = truncateFileContent(c, maxStartLines, maxEndLines);
    }
  }
  return map;
}

/**
 * Extracts high-level signatures from file content for architecture documentation.
 * Captures imports, exports, interfaces, types, function/class signatures without implementation.
 */
export function extractFileSignatures(content: string, filePath: string): string {
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
    
    // Skip empty lines and comments (unless in a block we're capturing)
    if (!inMultiLineImport && !inInterface && !inType) {
      if (trimmed === '' || trimmed.startsWith('//')) continue;
    }
    
    // Capture import statements (single and multi-line)
    if (trimmed.startsWith('import ') || inMultiLineImport) {
      signatures.push(line);
      if (trimmed.includes('{') && !trimmed.includes('}')) {
        inMultiLineImport = true;
      }
      if (trimmed.includes('}') || (trimmed.includes('from ') && trimmed.endsWith(';') || trimmed.endsWith("'") || trimmed.endsWith('"'))) {
        inMultiLineImport = false;
      }
      continue;
    }
    
    // Capture export statements
    if (trimmed.startsWith('export ') && !trimmed.startsWith('export default function') && !trimmed.startsWith('export default class') && !trimmed.startsWith('export class') && !trimmed.startsWith('export function') && !trimmed.startsWith('export async function')) {
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
  const fileType = getFileTypeLabel(extension);
  
  return `// ${fileType}: ${filePath}\n${signatures.join('\n')}`;
}

/**
 * Get a human-readable label for file type
 */
export function getFileTypeLabel(extension: string): string {
  const labels: Record<string, string> = {
    'tsx': 'React Component/Page',
    'ts': 'TypeScript Module',
    'jsx': 'React Component',
    'js': 'JavaScript Module',
    'py': 'Python Module',
    'java': 'Java Class',
    'cs': 'C# Class',
    'go': 'Go Package',
    'rs': 'Rust Module',
    'md': 'Documentation',
    'json': 'Configuration',
    'yaml': 'Configuration',
    'yml': 'Configuration',
  };
  return labels[extension] || 'Source File';
}

// ============================================================================
// Filename Utilities
// ============================================================================

/**
 * Creates a filesystem-safe filename from a name with a numeric prefix
 */
export function createSafeFilename(name: string, prefix: number): string {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  const paddedPrefix = String(prefix).padStart(2, '0');
  return `${paddedPrefix}_${safeName}.md`;
}

/**
 * Slugify a string for use in URLs and filenames
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ============================================================================
// Prompt Building Utilities  
// ============================================================================

/**
 * Build context string from files for LLM prompts
 */
export function buildFileContext(
  filesData: [string, string][],
  mode: 'tutorial' | 'architecture',
  maxLinesPerFile: number = 150,
  maxContextChars?: number
): { context: string; fileInfo: [number, string][]; filesIncluded: number; filesSkipped: number } {
  const maxStartLines = Math.floor(maxLinesPerFile * 0.8);
  const maxEndLines = maxLinesPerFile - maxStartLines;
  
  // Process files
  const processedFiles: { path: string; content: string; index: number; chars: number }[] = [];
  
  filesData.forEach(([path, content], index) => {
    let processedContent: string;
    
    if (mode === 'architecture') {
      processedContent = extractFileSignatures(content, path);
    } else {
      processedContent = truncateFileContent(content, maxStartLines, maxEndLines);
    }
    
    processedFiles.push({
      path,
      content: processedContent,
      index,
      chars: processedContent.length,
    });
  });
  
  // Sort by importance (entry points first)
  const priorityPatterns = [
    /page\.(tsx?|jsx?)$/,
    /index\.(tsx?|jsx?|ts|js|py)$/,
    /main\.(tsx?|jsx?|ts|js|py)$/,
    /app\.(tsx?|jsx?|ts|js|py)$/,
    /route\.(tsx?|jsx?)$/,
    /layout\.(tsx?|jsx?)$/,
    /\/(api|lib|utils|components)\//,
  ];
  
  processedFiles.sort((a, b) => {
    const aScore = priorityPatterns.findIndex(p => p.test(a.path));
    const bScore = priorityPatterns.findIndex(p => p.test(b.path));
    const aPriority = aScore === -1 ? 999 : aScore;
    const bPriority = bScore === -1 ? 999 : bScore;
    return aPriority - bPriority;
  });
  
  // Build context respecting optional token limit
  let context = '';
  const fileInfo: [number, string][] = [];
  let currentChars = 0;
  let filesIncluded = 0;
  let filesSkipped = 0;
  
  for (const file of processedFiles) {
    const fileHeader = `--- File Index ${file.index}: ${file.path} ---\n`;
    const fileEntry = fileHeader + file.content + '\n\n';
    const entryChars = fileEntry.length;
    
    if (!maxContextChars || currentChars + entryChars <= maxContextChars) {
      context += fileEntry;
      fileInfo.push([file.index, file.path]);
      currentChars += entryChars;
      filesIncluded++;
    } else {
      filesSkipped++;
    }
  }
  
  return { context, fileInfo, filesIncluded, filesSkipped };
}

/**
 * Build file listing string for prompts
 */
export function buildFileListing(fileInfo: [number, string][]): string {
  return fileInfo.map(([index, path]) => `- ${index} # ${path}`).join('\n');
}

// ============================================================================
// YAML Parsing Utilities
// ============================================================================

/**
 * Extract YAML content from a fenced code block in LLM response
 */
export function extractYamlBlock(response: string): string | null {
  const yamlMatch = response.trim().match(/```yaml\s*([\s\S]*?)\s*```/);
  return yamlMatch?.[1]?.trim() || null;
}

/**
 * Extract JSON content from a fenced code block in LLM response
 */
export function extractJsonBlock(response: string): string | null {
  const jsonMatch = response.trim().match(/```json\s*([\s\S]*?)\s*```/);
  return jsonMatch?.[1]?.trim() || null;
}
