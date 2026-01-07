/**
 * File Patterns
 * Include and exclude patterns for repository crawling
 * 
 * Organized into categories for better maintenance and user customization
 */

import type { PatternCategory } from './types';

// ============================================================================
// Include Patterns
// ============================================================================

export const includedPatternCategories: PatternCategory[] = [
  {
    label: 'Web Development',
    pattern: [
      '**/*.html',
      '**/*.css',
      '**/*.scss',
      '**/*.sass',
      '**/*.less',
      '**/*.js',
      '**/*.jsx',
      '**/*.ts',
      '**/*.tsx'
    ],
    description: 'Common web development files including HTML, CSS, and JavaScript/TypeScript files'
  },
  {
    label: 'Backend',
    pattern: [
      '**/*.py',
      '**/*.java',
      '**/*.go',
      '**/*.rb',
      '**/*.php',
      '**/*.c',
      '**/*.cpp',
      '**/*.cs',
      '**/*.rs'
    ],
    description: 'Backend development languages including Python, Java, Go, Ruby, PHP, C/C++, C#, and Rust'
  },
  {
    label: 'Data & Configuration',
    pattern: [
      '**/*.json',
      '**/*.yaml',
      '**/*.yml',
      '**/*.xml',
      '**/*.toml',
      '**/*.ini',
      '**/*.env.example'
    ],
    description: 'Data and configuration files in various formats'
  },
  {
    label: 'Documentation',
    pattern: [
      '**/*.md',
      '**/*.mdx',
      '**/*.markdown',
      '**/*.txt',
      '**/*.rst',
      '**/*.adoc'
    ],
    description: 'Markdown and plain text documentation files'
  },
  {
    label: 'Mobile Development',
    pattern: [
      '**/*.swift',
      '**/*.kt',
      '**/*.m',
      '**/*.mm',
      '**/*.dart'
    ],
    description: 'Mobile app development files for iOS, Android, and Flutter'
  },
  {
    label: 'Infrastructure',
    pattern: [
      '**/*.tf',
      '**/*.hcl',
      '**/Dockerfile',
      '**/docker-compose.yml',
      '**/docker-compose.yaml'
    ],
    description: 'Infrastructure as code and container configuration files'
  },
  {
    label: 'Database',
    pattern: [
      '**/*.sql',
      '**/*.prisma',
      '**/*.mongodb',
      '**/*.graphql',
      '**/*.gql'
    ],
    description: 'Database schema and query files'
  },
  {
    label: 'Shell Scripts',
    pattern: [
      '**/*.sh',
      '**/*.bash',
      '**/*.zsh',
      '**/*.bat',
      '**/*.cmd',
      '**/*.ps1'
    ],
    description: 'Shell and batch script files for automation'
  },
  {
    label: 'Machine Learning',
    pattern: [
      '**/models/*.py',
      '**/nn/*.py',
      '**/torch/*.py',
      '**/tensorflow/*.py',
      '**/keras/*.py',
      '**/*.ipynb'
    ],
    description: 'Machine learning and data science related files'
  },
  {
    label: 'Smart Contracts',
    pattern: ['**/*.sol', '**/*.vy'],
    description: 'Blockchain smart contract files'
  },
  {
    label: 'System Programming',
    pattern: ['**/*.cu', '**/*.cuh', '**/*.asm', '**/*.s'],
    description: 'CUDA, assembly and other system programming files'
  },
  {
    label: 'Web Assembly',
    pattern: ['**/*.wat', '**/*.wasm'],
    description: 'WebAssembly text and binary format files'
  },
  {
    label: 'Serialization & RPC',
    pattern: ['**/*.proto', '**/*.avro', '**/*.thrift'],
    description: 'Protocol buffer, Avro, and Thrift schema files'
  }
];

// ============================================================================
// Exclude Patterns
// ============================================================================

export const excludedPatternCategories: PatternCategory[] = [
  {
    label: 'Test Files',
    pattern: [
      'test/*',
      'tests/*',
      '**/test/**',
      '**/tests/**',
      '**/__tests__/**',
      '**/*test.js',
      '**/*spec.js',
      '**/*test.ts',
      '**/*spec.ts'
    ],
    required: true,
    reason: 'Test files often duplicate source code logic and can double API usage without adding value to code understanding'
  },
  {
    label: 'Large Media Files',
    pattern: [
      // Video formats
      '**/*.mp4', '**/*.mov', '**/*.avi', '**/*.mkv', '**/*.webm',
      '**/*.flv', '**/*.wmv', '**/*.m4v', '**/*.mpeg', '**/*.mpg',
      '**/*.mpe', '**/*.vob', '**/*.qt', '**/*.swf',
      // Audio formats
      '**/*.mp3', '**/*.wav', '**/*.flac', '**/*.aac', '**/*.ogg',
      '**/*.mp2', '**/*.m4a',
      // Image formats
      '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp',
      '**/*.svg', '**/*.ico', '**/*.tiff', '**/*.bmp', '**/*.raw',
      '**/*.heic', '**/*.heif', '**/*.cr2', '**/*.nef', '**/*.tga',
      '**/*.dicom', '**/*.eps', '**/*.jfif', '**/*.exif', '**/*.pcx',
      '**/*.jp2', '**/*.apng', '**/*.avif',
      // Design files
      '**/*.psd', '**/*.ai', '**/*.xd', '**/*.sketch', '**/*.fig', '**/*.xcf',
      // Document formats
      '**/*.pdf',
      // 3D formats
      '**/*.blend', '**/*.fbx', '**/*.obj', '**/*.stl', '**/*.3ds',
      '**/*.dae', '**/*.glb', '**/*.gltf', '**/*.3dm', '**/*.ply', '**/*.max',
      // Archive formats
      '**/*.iso', '**/*.zip', '**/*.tar', '**/*.gz', '**/*.rar', '**/*.7z',
      '**/*.bz2', '**/*.xz', '**/*.tgz'
    ],
    required: true,
    reason: "Binary files that don't contain readable code and would use up API quota"
  },
  {
    label: 'Binary Datasets',
    pattern: ['**/*.bin', '**/*.dat', '**/*.pkl', '**/*.h5', '**/*.hdf5'],
    required: true,
    reason: "Large data files that don't contain readable code"
  },
  {
    label: 'Node Modules',
    pattern: ['**/node_modules/**', '**/node_module/**'],
    required: true,
    reason: 'Contains 100,000+ files that would exceed API rate limits'
  },
  {
    label: 'Package Files',
    pattern: ['**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml'],
    required: true,
    reason: 'Auto-generated files that can be 10,000+ lines long'
  },
  {
    label: 'Minified Files',
    pattern: ['**/*.min.js', '**/*.min.css'],
    required: true,
    reason: 'Single-line files that are hard to analyze and have unminified counterparts'
  },
  {
    label: 'Build Output',
    pattern: [
      '**/dist/**', '**/build/**', '**/.next/**', '**/out/**',
      '**/output/**', '**/target/**', '**/.output/**', '**/_build/**'
    ],
    required: true,
    reason: "Contains generated files that aren't part of the source code"
  },
  {
    label: 'Git Files',
    pattern: [
      '**/.git/**', '**/.gitignore', '**/.gitattributes',
      '**/.gitmodules', '**/.github/**'
    ],
    required: true,
    reason: 'Contains repository history which would dramatically increase download size'
  },
  {
    label: 'Dependency Dirs',
    pattern: ['**/bower_components/**', '**/.pnp/**', '**/jspm_packages/**'],
    required: true,
    reason: 'Contains thousands of third-party dependencies, not project source code'
  },
  {
    label: 'Python Environments and Cache',
    pattern: [
      '**/.venv/**', '**/venv/**', '**/.env/**', '**/env/**',
      '**/.virtualenv/**', '**/virtualenv/**', '**/__pycache__/**',
      '**/*.py[cod]', '**/*.so', '**/*.egg', '**/*.egg-info/**',
      '**/.pytest_cache/**'
    ],
    required: true,
    reason: 'Contains binary compilation artifacts, not source code'
  },
  {
    label: 'Editor Config',
    pattern: [
      '**/.vscode/**', '**/.idea/**', '**/.eclipse/**',
      '**/.nbproject/**', '**/.sublime-*'
    ],
    required: true,
    reason: "IDE configuration files that don't contain actual project code"
  },
  {
    label: 'Coverage Reports',
    pattern: ['**/coverage/**', '**/.coverage', '**/.nyc_output/**', '**/htmlcov/**'],
    required: true,
    reason: "Generated test coverage reports that don't contain original code"
  },
  {
    label: 'Logs',
    pattern: ['**/logs/**', '**/log/**', '**/*.log', '**/*.log.*'],
    required: true,
    reason: 'Runtime logs that contain execution data but not meaningful code'
  },
  {
    label: 'Temp Files',
    pattern: [
      '**/tmp/**', '**/temp/**', '**/.tmp/**', '**/.temp/**',
      '**/*.tmp', '**/*.temp', '**/.cache/**', '**/cache/**'
    ],
    required: true,
    reason: "Temporary files that aren't part of the source code"
  },
  {
    label: 'CI Files',
    pattern: [
      '**/.travis.yml', '**/.gitlab-ci.yml', '**/.circleci/**',
      '**/.github/workflows/**'
    ],
    required: true,
    reason: "CI/CD configuration that doesn't contain application logic"
  },
  {
    label: 'TypeScript Maps',
    pattern: ['**/*.js.map', '**/*.d.ts.map'],
    required: true,
    reason: 'Debug files not needed for code analysis'
  },
  {
    label: 'Frontend Build Caches',
    pattern: [
      '**/node_modules/.cache/**', '**/.sass-cache/**', '**/.parcel-cache/**',
      '**/webpack-stats.json', '**/.turbo/**', '**/storybook-static/**'
    ],
    required: true,
    reason: "Build tool cache files and generated artifacts that don't contain source code"
  },
  {
    label: 'Backend Build Files',
    pattern: [
      '**/.gradle/**', '**/.m2/**', '**/vendor/**', '**/__snapshots__/**',
      '**/Pods/**', '**/.serverless/**', '**/venv.bak/**', '**/.rts2_cache_*/**'
    ],
    required: true,
    reason: "Build artifacts and framework-specific files that aren't actual source code"
  },
  {
    label: 'Env & Config Files',
    pattern: [
      '**/.env.local', '**/.env.development', '**/.env.production',
      '**/.direnv/**', '**/terraform.tfstate*', '**/cdk.out/**', '**/.terraform/**'
    ],
    required: true,
    reason: "Environment configuration files that often contain sensitive data and aren't source code"
  },
  {
    label: 'Editor & OS Files',
    pattern: [
      '**/.settings/**', '**/.project', '**/.classpath', '**/*.swp',
      '**/*~', '**/*.bak', '**/.DS_Store', '.DS_Store', '**/Thumbs.db'
    ],
    required: true,
    reason: "Editor and operating system metadata files that don't contain project code"
  },
  {
    label: 'Compiled Binaries',
    pattern: [
      '**/*.class', '**/*.o', '**/*.dll', '**/*.exe',
      '**/*.obj', '**/*.apk', '**/*.ipa'
    ],
    required: true,
    reason: 'Compiled binary files that are generated from source code'
  }
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all included patterns as a flat array
 */
export function getAllIncludedPatterns(): string[] {
  return includedPatternCategories.flatMap(category => category.pattern);
}

/**
 * Get patterns by specific include category
 */
export function getIncludePatternsByCategory(categoryLabel: string): string[] {
  const category = includedPatternCategories.find(cat => cat.label === categoryLabel);
  return category ? category.pattern : [];
}

/**
 * Get all excluded patterns as a flat array
 */
export function getAllExcludedPatterns(): string[] {
  return excludedPatternCategories.flatMap(category => category.pattern);
}

/**
 * Get only required excluded patterns
 */
export function getRequiredExcludedPatterns(): string[] {
  return excludedPatternCategories
    .filter(category => category.required)
    .flatMap(category => category.pattern);
}

/**
 * Get exclude patterns by category
 */
export function getExcludePatternsByCategory(categoryLabel: string): string[] {
  const category = excludedPatternCategories.find(cat => cat.label === categoryLabel);
  return category ? category.pattern : [];
}

/**
 * Build a custom pattern set from selected categories
 */
export function buildPatternSet(
  includeCategories: string[],
  excludeCategories: string[],
  additionalIncludes: string[] = [],
  additionalExcludes: string[] = []
): { includePatterns: string[]; excludePatterns: string[] } {
  const includePatterns = [
    ...includeCategories.flatMap(getIncludePatternsByCategory),
    ...additionalIncludes
  ];

  const excludePatterns = [
    ...excludeCategories.flatMap(getExcludePatternsByCategory),
    ...additionalExcludes
  ];

  return { includePatterns, excludePatterns };
}

/**
 * Get default patterns for a quick start
 */
export function getDefaultPatterns(): { includePatterns: string[]; excludePatterns: string[] } {
  return {
    includePatterns: getAllIncludedPatterns(),
    excludePatterns: getRequiredExcludedPatterns()
  };
}

/**
 * Check if a file path matches any pattern in the list
 * Uses minimatch-style glob matching
 */
export function matchesPattern(filePath: string, patterns: string[]): boolean {
  // Simple glob matching implementation
  for (const pattern of patterns) {
    if (simpleGlobMatch(filePath, pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Simple glob pattern matching
 * Supports *, **, and ? wildcards
 */
function simpleGlobMatch(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  let regexPattern = pattern
    .replace(/\./g, '\\.')           // Escape dots
    .replace(/\*\*/g, '{{DOUBLE}}')  // Temp placeholder for **
    .replace(/\*/g, '[^/]*')         // * matches anything except /
    .replace(/{{DOUBLE}}/g, '.*')    // ** matches anything including /
    .replace(/\?/g, '.');            // ? matches single character

  // Handle patterns that should match from start
  if (!pattern.startsWith('**/') && !pattern.startsWith('*')) {
    regexPattern = '^' + regexPattern;
  }

  // Handle patterns that should match to end
  if (!pattern.endsWith('/**') && !pattern.endsWith('*')) {
    regexPattern = regexPattern + '$';
  }

  try {
    const regex = new RegExp(regexPattern);
    return regex.test(path);
  } catch {
    return false;
  }
}

/**
 * Filter files based on include/exclude patterns
 */
export function filterFiles(
  files: string[],
  includePatterns: string[],
  excludePatterns: string[]
): { included: string[]; excluded: string[] } {
  const included: string[] = [];
  const excluded: string[] = [];

  for (const file of files) {
    const shouldInclude = matchesPattern(file, includePatterns);
    const shouldExclude = matchesPattern(file, excludePatterns);

    if (shouldInclude && !shouldExclude) {
      included.push(file);
    } else {
      excluded.push(file);
    }
  }

  return { included, excluded };
}
