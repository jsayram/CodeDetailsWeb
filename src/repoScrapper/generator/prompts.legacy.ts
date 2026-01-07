/**
 * Generator Prompts
 * LLM prompt templates for documentation generation
 */

import type { Abstraction, AbstractionRelationship } from '../types';

// ============================================================================
// Abstraction Identification Prompts
// ============================================================================

export interface AbstractionPromptParams {
  projectName: string;
  context: string;
  fileListing: string;
  maxAbstractions: number;
  language: string;
  mode: 'tutorial' | 'architecture';
}

/**
 * Generate prompt for identifying abstractions
 */
export function buildAbstractionPrompt(params: AbstractionPromptParams): string {
  const { projectName, context, fileListing, maxAbstractions, language, mode } = params;
  
  const langCap = language.toLowerCase() !== 'english'
    ? language.charAt(0).toUpperCase() + language.slice(1)
    : '';
  const languageInstruction = langCap
    ? `IMPORTANT: Generate the \`name\` and \`description\` for each abstraction in **${langCap}** language. Do NOT use English for these fields.\n\n`
    : '';
  const nameLangHint = langCap ? ` (value in ${langCap})` : '';
  const descLangHint = langCap ? ` (value in ${langCap})` : '';

  if (mode === 'architecture') {
    return `
For the project \`${projectName}\`:

Codebase Structure (signatures and interfaces):
${context}

${languageInstruction}Analyze this codebase to understand its **architecture and purpose**.

Identify the top 3-${maxAbstractions} major **subsystems or architectural components** that define what this project does.

For each subsystem, provide:
1. A concise \`name\` that describes the subsystem${nameLangHint}.
2. A high-level \`description\` explaining:
   - What this subsystem's PURPOSE is (what problem it solves)
   - How it fits into the overall architecture
   - Key responsibilities (in around 80-100 words)${descLangHint}
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
    User Interface Layer${nameLangHint}
  description: |
    Handles user interactions through React pages and components.
    This is the entry point for users, rendering forms and displaying data.${descLangHint}
  file_indices:
    - 0 # src/app/page.tsx
    - 3 # src/components/Form.tsx
- name: |
    Data Processing Pipeline${nameLangHint}
  description: |
    Core business logic that transforms and processes data.
    Acts as the brain of the application, orchestrating workflows.${descLangHint}
  file_indices:
    - 5 # src/lib/processor.ts
# ... up to ${maxAbstractions} subsystems
\`\`\``;
  }

  // Tutorial mode
  return `
For the project \`${projectName}\`:

Codebase Context:
${context}

${languageInstruction}Analyze the codebase context.
Identify the top 5-${maxAbstractions} core most important abstractions to help those new to the codebase.

For each abstraction, provide:
1. A concise \`name\`${nameLangHint}.
2. A beginner-friendly \`description\` explaining what it is with a simple analogy, in around 100 words${descLangHint}.
3. A list of relevant \`file_indices\` (integers) using the format \`idx # path/comment\`.

List of file indices and paths present in the context:
${fileListing}

Format the output as a YAML list of dictionaries:

\`\`\`yaml
- name: |
    Query Processing${nameLangHint}
  description: |
    Explains what the abstraction does.
    It's like a central dispatcher routing requests.${descLangHint}
  file_indices:
    - 0 # path/to/file1.py
    - 3 # path/to/related.py
- name: |
    Query Optimization${nameLangHint}
  description: |
    Another core concept, similar to a blueprint for objects.${descLangHint}
  file_indices:
    - 5 # path/to/another.js
# ... up to ${maxAbstractions} abstractions
\`\`\``;
}

// ============================================================================
// Relationship Analysis Prompts
// ============================================================================

export interface RelationshipPromptParams {
  projectName: string;
  context: string;
  abstractionListing: string;
  language: string;
}

/**
 * Generate prompt for analyzing relationships between abstractions
 */
export function buildRelationshipPrompt(params: RelationshipPromptParams): string {
  const { projectName, context, abstractionListing, language } = params;
  
  const langCap = language.toLowerCase() !== 'english'
    ? language.charAt(0).toUpperCase() + language.slice(1)
    : '';
  const langInstr = langCap
    ? `IMPORTANT: Generate the \`summary\` and relationship \`label\` fields in **${langCap}** language. Do NOT use English for these fields.\n\n`
    : '';
  const langHint = langCap ? ` (in ${langCap})` : '';
  const listLangNote = langCap ? ` (Names might be in ${langCap})` : '';

  return `
Based on the following abstractions and relevant code snippets from the project \`${projectName}\`:

List of Abstraction Indices and Names${listLangNote}:
${abstractionListing}

Context (Abstractions, Descriptions, Code):
${context}

${langInstr}Please provide:
1. A high-level \`summary\` of the project's main purpose and functionality in a few beginner-friendly sentences${langHint}. Use markdown formatting with **bold** and *italic* text to highlight important concepts.
2. A list (\`relationships\`) describing the key interactions between these abstractions. For each relationship, specify:
    - \`from_abstraction\`: Index of the source abstraction (e.g., \`0 # AbstractionName1\`)
    - \`to_abstraction\`: Index of the target abstraction (e.g., \`1 # AbstractionName2\`)
    - \`label\`: A brief label for the interaction **in just a few words**${langHint} (e.g., "Manages", "Inherits", "Uses").

IMPORTANT: Make sure EVERY abstraction is involved in at least ONE relationship.

Format the output as YAML:

\`\`\`yaml
summary: |
  A brief, simple explanation of the project${langHint}.
  Can span multiple lines with **bold** and *italic* for emphasis.
relationships:
  - from_abstraction: 0 # AbstractionName1
    to_abstraction: 1 # AbstractionName2
    label: "Manages"${langHint}
  - from_abstraction: 2 # AbstractionName3
    to_abstraction: 0 # AbstractionName1
    label: "Provides config"${langHint}
\`\`\``;
}

// ============================================================================
// Chapter Ordering Prompts
// ============================================================================

export interface ChapterOrderPromptParams {
  projectName: string;
  abstractionListing: string;
  relationshipsSummary: string;
  language: string;
}

/**
 * Generate prompt for ordering chapters
 */
export function buildChapterOrderPrompt(params: ChapterOrderPromptParams): string {
  const { projectName, abstractionListing, relationshipsSummary, language } = params;
  
  const langCap = language.toLowerCase() !== 'english'
    ? language.charAt(0).toUpperCase() + language.slice(1)
    : '';
  const langHint = langCap ? ` (Name is in ${langCap})` : '';

  return `
For the project \`${projectName}\`, determine the optimal learning order for the following abstractions (each will become a chapter):

Abstractions${langHint}:
${abstractionListing}

Relationships Summary:
${relationshipsSummary}

Consider:
1. Start with foundational concepts that others depend on
2. Progress from simpler to more complex topics
3. Group related concepts together
4. End with integration/advanced topics

Return the abstraction indices in optimal learning order as a JSON array:

\`\`\`json
[0, 2, 1, 3, 4]
\`\`\``;
}

// ============================================================================
// Chapter Content Prompts
// ============================================================================

export interface ChapterContentPromptParams {
  projectName: string;
  chapterTitle: string;
  chapterDescription: string;
  relevantCode: string;
  chapterNumber: number;
  totalChapters: number;
  previousChapters: string[];
  language: string;
  mode: 'tutorial' | 'architecture';
}

/**
 * Generate prompt for writing chapter content
 */
export function buildChapterContentPrompt(params: ChapterContentPromptParams): string {
  const {
    projectName,
    chapterTitle,
    chapterDescription,
    relevantCode,
    chapterNumber,
    totalChapters,
    previousChapters,
    language,
    mode,
  } = params;
  
  const langCap = language.toLowerCase() !== 'english'
    ? language.charAt(0).toUpperCase() + language.slice(1)
    : '';
  const langInstr = langCap
    ? `IMPORTANT: Write ALL content in **${langCap}** language.\n\n`
    : '';

  const previousChaptersSection = previousChapters.length > 0
    ? `Previous chapters covered: ${previousChapters.join(', ')}\n`
    : '';

  if (mode === 'architecture') {
    return `
${langInstr}Write Chapter ${chapterNumber} of ${totalChapters} for the "${projectName}" architecture documentation.

Chapter Title: ${chapterTitle}
Description: ${chapterDescription}

${previousChaptersSection}

Relevant Code:
${relevantCode}

Write a concise architecture chapter that:
1. Explains the PURPOSE of this subsystem (what problem it solves)
2. Shows KEY CODE SNIPPETS with explanations
3. Describes how it CONNECTS to other parts of the system
4. Uses a MERMAID DIAGRAM to visualize the architecture

Format:
- Use markdown with proper headings (##, ###)
- Include code blocks with syntax highlighting
- Keep explanations brief but informative
- Include one mermaid diagram showing the component's architecture`;
  }

  // Tutorial mode
  return `
${langInstr}Write Chapter ${chapterNumber} of ${totalChapters} for the "${projectName}" tutorial.

Chapter Title: ${chapterTitle}
Description: ${chapterDescription}

${previousChaptersSection}

Relevant Code:
${relevantCode}

Write a beginner-friendly tutorial chapter that:
1. Starts with a simple explanation of WHAT this concept is
2. Uses ANALOGIES to make it relatable
3. Shows CODE EXAMPLES with step-by-step explanations
4. Includes a MERMAID DIAGRAM to visualize relationships
5. Ends with a brief SUMMARY

Format:
- Use markdown with proper headings (##, ###)
- Include code blocks with syntax highlighting
- Explain complex concepts simply
- Include one mermaid diagram`;
}

// ============================================================================
// Mermaid Diagram Prompts
// ============================================================================

export interface MermaidPromptParams {
  projectName: string;
  abstractions: Abstraction[];
  relationships: Array<{ from: number; to: number; label: string }>;
}

/**
 * Generate prompt for creating a Mermaid diagram
 */
export function buildMermaidPrompt(params: MermaidPromptParams): string {
  const { projectName, abstractions, relationships } = params;
  
  const abstractionList = abstractions
    .map((a, i) => `${i}: ${a.name}`)
    .join('\n');
  
  const relationshipList = relationships
    .map(r => `${abstractions[r.from].name} --"${r.label}"--> ${abstractions[r.to].name}`)
    .join('\n');

  return `
Create a Mermaid flowchart diagram for the "${projectName}" architecture.

Abstractions:
${abstractionList}

Relationships:
${relationshipList}

Generate a clean Mermaid flowchart diagram that:
1. Shows all abstractions as nodes
2. Connects them with labeled edges
3. Uses proper Mermaid syntax
4. Is visually organized (top-to-bottom or left-to-right)

Return ONLY the Mermaid code:

\`\`\`mermaid
flowchart TD
  A[Component A] -->|uses| B[Component B]
  ...
\`\`\``;
}
