/**
 * ================================================================================
 * CENTRALIZED LLM PROMPTS - SINGLE SOURCE OF TRUTH
 * ================================================================================
 * 
 * THIS FILE IS THE BRAIN OF ALL LLM PROMPTS IN CODEDETAILSWEB.
 * 
 * All prompts used by LLMs throughout the application should be defined here.
 * This ensures:
 *   1. Consistency across all LLM interactions
 *   2. Easy maintenance and updates to prompts
 *   3. Single place to tune prompt engineering
 *   4. Prompts can be reused across different features
 * 
 * ARCHITECTURE:
 * - Prompts are exported as builder functions that take parameters
 * - Each function returns a complete prompt string ready for LLM
 * - Language support is built-in (multi-language output)
 * 
 * SYNC WITH PYTHON:
 * - These prompts are synced with src/lib/portable_tutorial_gen/nodes.py
 * - The Python version is the reference implementation
 * - Keep both in sync when making changes!
 * 
 * SECTIONS:
 * - Tutorial Generation Prompts (IdentifyAbstractions, AnalyzeRelationships, etc.)
 * - Future: Add other feature prompts here
 * 
 * ================================================================================
 */

// ============================================================================
// TUTORIAL GENERATION PROMPTS
// ============================================================================

/**
 * Build the prompt for identifying core abstractions in a codebase.
 * 
 * This prompt asks the LLM to analyze code and identify the most important
 * concepts/abstractions that a newcomer should understand.
 * 
 * @param params - Loose params object (keep flexible for now)
 * @returns Complete prompt string for LLM
 */
export function buildIdentifyAbstractionsPrompt(params: {
  projectName: string;
  context: string;
  fileListing: string;
  maxAbstractions: number;
  language: string;
}): string {
  const { projectName, context, fileListing, maxAbstractions, language } = params;

  // Add language instruction only if not English
  let languageInstruction = '';
  let nameLangHint = '';
  let descLangHint = '';
  
  if (language.toLowerCase() !== 'english') {
    const langCap = language.charAt(0).toUpperCase() + language.slice(1);
    languageInstruction = `IMPORTANT: Generate the \`name\` and \`description\` for each abstraction in **${langCap}** language. Do NOT use English for these fields.\n\n`;
    nameLangHint = ` (value in ${langCap})`;
    descLangHint = ` (value in ${langCap})`;
  }

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


/**
 * Build the prompt for analyzing relationships between abstractions.
 * 
 * This prompt asks the LLM to identify how the core abstractions
 * interact with each other and provide a project summary.
 * 
 * @param params - Loose params object
 * @returns Complete prompt string for LLM
 */
export function buildAnalyzeRelationshipsPrompt(params: {
  projectName: string;
  context: string;
  abstractionListing: string;
  language: string;
}): string {
  const { projectName, context, abstractionListing, language } = params;

  // Language-specific instructions
  let languageInstruction = '';
  let langHint = '';
  let listLangNote = '';
  
  if (language.toLowerCase() !== 'english') {
    const langCap = language.charAt(0).toUpperCase() + language.slice(1);
    languageInstruction = `IMPORTANT: Generate the \`summary\` and relationship \`label\` fields in **${langCap}** language. Do NOT use English for these fields.\n\n`;
    langHint = ` (in ${langCap})`;
    listLangNote = ` (Names might be in ${langCap})`;
  }

  return `
Based on the following abstractions and relevant code snippets from the project \`${projectName}\`:

List of Abstraction Indices and Names${listLangNote}:
${abstractionListing}

Context (Abstractions, Descriptions, Code):
${context}

${languageInstruction}Please provide:
1. A high-level \`summary\` of the project's main purpose and functionality in a few beginner-friendly sentences${langHint}. Use markdown formatting with **bold** and *italic* text to highlight important concepts.
2. A list (\`relationships\`) describing the key interactions between these abstractions. For each relationship, specify:
    - \`from_abstraction\`: Index of the source abstraction (e.g., \`0 # AbstractionName1\`)
    - \`to_abstraction\`: Index of the target abstraction (e.g., \`1 # AbstractionName2\`)
    - \`label\`: A brief label for the interaction **in just a few words**${langHint} (e.g., "Manages", "Inherits", "Uses").
    Ideally the relationship should be backed by one abstraction calling or passing parameters to another.
    Simplify the relationship and exclude those non-important ones.

IMPORTANT: Make sure EVERY abstraction is involved in at least ONE relationship (either as source or target). Each abstraction index must appear at least once across all relationships.

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
  # ... other relationships
\`\`\`

Now, provide the YAML output:
`;
}


/**
 * Build the prompt for determining optimal chapter order.
 * 
 * This prompt asks the LLM to order the abstractions in a way that
 * makes sense for teaching (foundational concepts first).
 * 
 * @param params - Loose params object
 * @returns Complete prompt string for LLM
 */
export function buildOrderChaptersPrompt(params: {
  projectName: string;
  abstractionListing: string;
  context: string;
  language: string;
}): string {
  const { projectName, abstractionListing, context, language } = params;

  // Language note for listing
  let listLangNote = '';
  if (language.toLowerCase() !== 'english') {
    const langCap = language.charAt(0).toUpperCase() + language.slice(1);
    listLangNote = ` (Names might be in ${langCap})`;
  }

  return `
Given the following project abstractions and their relationships for the project \`${projectName}\`:

Abstractions (Index # Name)${listLangNote}:
${abstractionListing}

Context about relationships and project summary:
${context}

If you are going to make a tutorial for \`${projectName}\`, what is the best order to explain these abstractions, from first to last?
Ideally, first explain those that are the most important or foundational, perhaps user-facing concepts or entry points. Then move to more detailed, lower-level implementation details or supporting concepts.

Output the ordered list of abstraction indices, including the name in a comment for clarity. Use the format \`idx # AbstractionName\`.

\`\`\`yaml
- 2 # FoundationalConcept
- 0 # CoreClassA
- 1 # CoreClassB (uses CoreClassA)
- ...
\`\`\`

Now, provide the YAML output:
`;
}


/**
 * Build the prompt for writing a tutorial chapter.
 * 
 * This is the most detailed prompt - it instructs the LLM to write
 * a complete, beginner-friendly tutorial chapter about one abstraction.
 * 
 * KEY FEATURES (synced with Python):
 * - Code blocks BELOW 10 lines
 * - sequenceDiagram with max 5 participants
 * - Cross-chapter linking with proper Markdown
 * - Full previous chapter content for context
 * - Multi-language support with detailed hints
 * 
 * @param params - Loose params object
 * @returns Complete prompt string for LLM
 */
export function buildWriteChapterPrompt(params: {
  projectName: string;
  chapterNum: number;
  abstractionName: string;
  abstractionDescription: string;
  fullChapterListing: string;
  previousChaptersSummary: string;
  fileContextStr: string;
  language: string;
}): string {
  const {
    projectName,
    chapterNum,
    abstractionName,
    abstractionDescription,
    fullChapterListing,
    previousChaptersSummary,
    fileContextStr,
    language,
  } = params;

  // Language-specific instructions (9 different hint variables like Python)
  let languageInstruction = '';
  let conceptDetailsNote = '';
  let structureNote = '';
  let prevSummaryNote = '';
  let instructionLangNote = '';
  let mermaidLangNote = '';
  let codeCommentNote = '';
  let linkLangNote = '';
  let toneNote = '';

  if (language.toLowerCase() !== 'english') {
    const langCap = language.charAt(0).toUpperCase() + language.slice(1);
    languageInstruction = `IMPORTANT: Write this ENTIRE tutorial chapter in **${langCap}**. Some input context (like concept name, description, chapter list, previous summary) might already be in ${langCap}, but you MUST translate ALL other generated content including explanations, examples, technical terms, and potentially code comments into ${langCap}. DO NOT use English anywhere except in code syntax, required proper nouns, or when specified. The entire output MUST be in ${langCap}.\n\n`;
    conceptDetailsNote = ` (Note: Provided in ${langCap})`;
    structureNote = ` (Note: Chapter names might be in ${langCap})`;
    prevSummaryNote = ` (Note: This summary might be in ${langCap})`;
    instructionLangNote = ` (in ${langCap})`;
    mermaidLangNote = ` (Use ${langCap} for labels/text if appropriate)`;
    codeCommentNote = ` (Translate to ${langCap} if possible, otherwise keep minimal English for clarity)`;
    linkLangNote = ` (Use the ${langCap} chapter title from the structure above)`;
    toneNote = ` (appropriate for ${langCap} readers)`;
  }

  const prevChaptersContent = previousChaptersSummary || 'This is the first chapter.';
  const fileContent = fileContextStr || 'No specific code snippets provided for this abstraction.';

  return `
${languageInstruction}Write a very beginner-friendly tutorial chapter (in Markdown format) for the project \`${projectName}\` about the concept: "${abstractionName}". This is Chapter ${chapterNum}.

Concept Details${conceptDetailsNote}:
- Name: ${abstractionName}
- Description:
${abstractionDescription}

Complete Tutorial Structure${structureNote}:
${fullChapterListing}

Context from previous chapters${prevSummaryNote}:
${prevChaptersContent}

Relevant Code Snippets (Code itself remains unchanged):
${fileContent}

Instructions for the chapter (Generate content in ${language.charAt(0).toUpperCase() + language.slice(1)} unless specified otherwise):
- Start with a clear heading (e.g., \`# Chapter ${chapterNum}: ${abstractionName}\`). Use the provided concept name.

- If this is not the first chapter, begin with a brief transition from the previous chapter${instructionLangNote}, referencing it with a proper Markdown link using its name${linkLangNote}.

- Begin with a high-level motivation explaining what problem this abstraction solves${instructionLangNote}. Start with a central use case as a concrete example. The whole chapter should guide the reader to understand how to solve this use case. Make it very minimal and friendly to beginners.

- If the abstraction is complex, break it down into key concepts. Explain each concept one-by-one in a very beginner-friendly way${instructionLangNote}.

- Explain how to use this abstraction to solve the use case${instructionLangNote}. Give example inputs and outputs for code snippets (if the output isn't values, describe at a high level what will happen${instructionLangNote}).

- Each code block should be BELOW 10 lines! If longer code blocks are needed, break them down into smaller pieces and walk through them one-by-one. Aggresively simplify the code to make it minimal. Use comments${codeCommentNote} to skip non-important implementation details. Each code block should have a beginner friendly explanation right after it${instructionLangNote}.

- Describe the internal implementation to help understand what's under the hood${instructionLangNote}. First provide a non-code or code-light walkthrough on what happens step-by-step when the abstraction is called${instructionLangNote}. It's recommended to use a simple sequenceDiagram with a dummy example - keep it minimal with at most 5 participants to ensure clarity. If participant name has space, use: \`participant QP as Query Processing\`. ${mermaidLangNote}.

- Then dive deeper into code for the internal implementation with references to files. Provide example code blocks, but make them similarly simple and beginner-friendly. Explain${instructionLangNote}.

- IMPORTANT: When you need to refer to other core abstractions covered in other chapters, ALWAYS use proper Markdown links like this: [Chapter Title](filename.md). Use the Complete Tutorial Structure above to find the correct filename and the chapter title${linkLangNote}. Translate the surrounding text.

- Use mermaid diagrams to illustrate complex concepts (\`\`\`mermaid\`\`\` format). ${mermaidLangNote}.

- Heavily use analogies and examples throughout${instructionLangNote} to help beginners understand.

- End the chapter with a brief conclusion that summarizes what was learned${instructionLangNote} and provides a transition to the next chapter${instructionLangNote}. If there is a next chapter, use a proper Markdown link: [Next Chapter Title](next_chapter_filename)${linkLangNote}.

- Ensure the tone is welcoming and easy for a newcomer to understand${toneNote}.

- Output *only* the Markdown content for this chapter.

Now, directly provide a super beginner-friendly Markdown output (DON'T need \`\`\`markdown\`\`\` tags):
`;
}


// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================
// These match the old prompts.ts function names for backward compatibility.
// New code should use the buildXxx names directly.
// @deprecated - Use the new names: buildIdentifyAbstractionsPrompt, etc.

export { buildIdentifyAbstractionsPrompt as buildAbstractionPrompt };
export { buildAnalyzeRelationshipsPrompt as buildRelationshipPrompt };
export { buildOrderChaptersPrompt as buildChapterOrderPrompt };
export { buildWriteChapterPrompt as buildChapterContentPrompt };

// ============================================================================
// LEGACY TYPE INTERFACES (Backward Compatibility)
// ============================================================================
// These interfaces match the old prompts.ts for backward compatibility.
// The new prompt functions use inline object types for flexibility.

/** @deprecated Use inline params object instead */
export interface AbstractionPromptParams {
  projectName: string;
  context: string;
  fileListing: string;
  maxAbstractions: number;
  language: string;
  mode?: 'tutorial' | 'architecture';
}

/** @deprecated Use inline params object instead */
export interface RelationshipPromptParams {
  projectName: string;
  context: string;
  abstractionListing: string;
  language: string;
}

/** @deprecated Use inline params object instead */
export interface ChapterOrderPromptParams {
  projectName: string;
  abstractionListing: string;
  relationshipsSummary: string;
  language: string;
}

/** @deprecated Use inline params object instead */
export interface ChapterContentPromptParams {
  projectName: string;
  chapterTitle: string;
  chapterDescription: string;
  relevantCode: string;
  chapterNumber: number;
  totalChapters: number;
  previousChapters: string[];
  language: string;
  mode?: 'tutorial' | 'architecture';
}

/** @deprecated Use inline params object instead */
export interface MermaidPromptParams {
  projectName: string;
  abstractions: Array<{ name: string; description: string; files: number[] }>;
  relationships: Array<{ from: number; to: number; label: string }>;
}

// ============================================================================
// MERMAID DIAGRAM PROMPT
// ============================================================================
// Used to generate Mermaid flowchart diagrams for architecture visualization.

/**
 * Build the prompt for creating a Mermaid diagram of the architecture.
 * 
 * @param params - Mermaid prompt parameters
 * @returns Complete prompt string for LLM
 */
export function buildMermaidPrompt(params: MermaidPromptParams): string {
  const { projectName, abstractions, relationships } = params;
  
  const abstractionList = abstractions
    .map((a, i) => `${i}: ${a.name}`)
    .join('\n');
  
  const relationshipList = relationships
    .map(r => `${abstractions[r.from]?.name || 'Unknown'} --"${r.label}"--> ${abstractions[r.to]?.name || 'Unknown'}`)
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

// ============================================================================
// FUTURE: OTHER FEATURE PROMPTS
// ============================================================================
// Add prompts for other CodeDetailsWeb features here.
// Examples:
// - Code explanation prompts
// - Documentation generation prompts
// - Code review prompts
// - etc.
