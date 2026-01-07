/**
 * Project URL Links Types
 * Defines TypeScript interfaces for flexible project links
 */

/**
 * Predefined link types for common use cases
 */
export const LINK_TYPES = {
  REPOSITORY: 'repository',
  DEMO: 'demo',
  DOCUMENTATION: 'documentation',
  VIDEO: 'video',
  FIGMA: 'figma',
  NOTION: 'notion',
  SLIDES: 'slides',
  ARTICLE: 'article',
  CUSTOM: 'custom',
} as const;

export type LinkType = (typeof LINK_TYPES)[keyof typeof LINK_TYPES];

/**
 * Link type metadata for UI display
 */
export interface LinkTypeMetadata {
  label: string;
  icon: string;
  color: string;
  placeholder: string;
}

/**
 * Metadata for each link type
 */
export const LINK_TYPE_METADATA: Record<LinkType, LinkTypeMetadata> = {
  repository: {
    label: 'Repository',
    icon: 'Github',
    color: 'text-gray-700 dark:text-gray-300',
    placeholder: 'https://github.com/username/repo',
  },
  demo: {
    label: 'Live Demo',
    icon: 'ExternalLink',
    color: 'text-blue-600 dark:text-blue-400',
    placeholder: 'https://myapp.com',
  },
  documentation: {
    label: 'Documentation',
    icon: 'FileText',
    color: 'text-green-600 dark:text-green-400',
    placeholder: 'https://docs.myapp.com',
  },
  video: {
    label: 'Video Demo',
    icon: 'Video',
    color: 'text-red-600 dark:text-red-400',
    placeholder: 'https://youtube.com/watch?v=...',
  },
  figma: {
    label: 'Figma Design',
    icon: 'Figma',
    color: 'text-purple-600 dark:text-purple-400',
    placeholder: 'https://figma.com/file/...',
  },
  notion: {
    label: 'Notion Page',
    icon: 'BookOpen',
    color: 'text-gray-700 dark:text-gray-300',
    placeholder: 'https://notion.so/...',
  },
  slides: {
    label: 'Presentation',
    icon: 'Presentation',
    color: 'text-orange-600 dark:text-orange-400',
    placeholder: 'https://docs.google.com/presentation/...',
  },
  article: {
    label: 'Article/Blog',
    icon: 'Newspaper',
    color: 'text-indigo-600 dark:text-indigo-400',
    placeholder: 'https://medium.com/@user/article',
  },
  custom: {
    label: 'Custom Link',
    icon: 'Link',
    color: 'text-gray-600 dark:text-gray-400',
    placeholder: 'https://example.com',
  },
};

/**
 * Individual project link
 */
export interface ProjectLink {
  /** Type of link */
  type: LinkType;
  
  /** The actual URL */
  url: string;
  
  /** Optional custom label (defaults to type label) */
  label?: string;
  
  /** Reachability status (checked asynchronously) */
  reachable?: boolean;
  
  /** HTTP status code from reachability check */
  statusCode?: number;
  
  /** Last time reachability was checked */
  lastChecked?: string;
}

/**
 * Validation result for a link
 */
export interface LinkValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  suggestedFix?: string;
}

/**
 * Reachability check result
 */
export interface LinkReachabilityResult {
  reachable: boolean;
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

/**
 * Helper to get display label for a link
 */
export function getLinkDisplayLabel(link: ProjectLink): string {
  return link.label || LINK_TYPE_METADATA[link.type]?.label || 'Link';
}

/**
 * Helper to get icon for a link type
 */
export function getLinkIcon(type: LinkType): string {
  return LINK_TYPE_METADATA[type]?.icon || 'Link';
}

/**
 * Helper to get color for a link type
 */
export function getLinkColor(type: LinkType): string {
  return LINK_TYPE_METADATA[type]?.color || 'text-gray-600';
}
