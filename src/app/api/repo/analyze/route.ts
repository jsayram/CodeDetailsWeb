import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// =============================================================================
// SUPPORTED PLATFORMS
// =============================================================================

type Platform = "github" | "gitlab" | "bitbucket" | "azure" | "codeberg" | "gitea" | "sourcehut";

interface ParsedRepo {
  platform: Platform;
  owner: string;
  repo: string;
  host: string;
  project?: string; // For Azure DevOps
}

interface PlatformConfig {
  name: string;
  icon: string;
  treeEndpoint: (parsed: ParsedRepo) => string;
  rawFileEndpoint: (parsed: ParsedRepo, path: string) => string;
  tokenEnvVar: string;
  parseTree: (data: unknown) => string[];
}

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  github: {
    name: "GitHub",
    icon: "github",
    treeEndpoint: ({ owner, repo }) => 
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    rawFileEndpoint: ({ owner, repo }, path) => 
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`,
    tokenEnvVar: "GITHUB_TOKEN",
    parseTree: (data) => {
      const typed = data as { tree?: { path: string }[] };
      return typed.tree?.map((item) => item.path) ?? [];
    },
  },
  gitlab: {
    name: "GitLab",
    icon: "gitlab",
    treeEndpoint: ({ owner, repo, host }) => {
      const projectId = encodeURIComponent(`${owner}/${repo}`);
      // Use default branch (usually main/master), pagination with 100 items per page
      return `https://${host}/api/v4/projects/${projectId}/repository/tree?recursive=true&per_page=100&ref=HEAD`;
    },
    rawFileEndpoint: ({ owner, repo, host }, path) => {
      const projectId = encodeURIComponent(`${owner}/${repo}`);
      const encodedPath = encodeURIComponent(path);
      return `https://${host}/api/v4/projects/${projectId}/repository/files/${encodedPath}/raw?ref=HEAD`;
    },
    tokenEnvVar: "GITLAB_TOKEN",
    parseTree: (data) => {
      // GitLab returns an array directly
      if (Array.isArray(data)) {
        return data.map((item: { path: string }) => item.path);
      }
      return [];
    },
  },
  bitbucket: {
    name: "Bitbucket",
    icon: "bitbucket",
    treeEndpoint: ({ owner, repo }) => 
      `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/src/HEAD/?pagelen=100`,
    rawFileEndpoint: ({ owner, repo }, path) => 
      `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/src/HEAD/${path}`,
    tokenEnvVar: "BITBUCKET_TOKEN",
    parseTree: (data) => {
      const typed = data as { values?: { path: string }[] };
      return typed.values?.map((item) => item.path) ?? [];
    },
  },
  azure: {
    name: "Azure DevOps",
    icon: "azure",
    treeEndpoint: ({ owner, project, repo }) => 
      `https://dev.azure.com/${owner}/${project}/_apis/git/repositories/${repo}/items?recursionLevel=Full&api-version=7.0`,
    rawFileEndpoint: ({ owner, project, repo }, path) => 
      `https://dev.azure.com/${owner}/${project}/_apis/git/repositories/${repo}/items?path=${encodeURIComponent(path)}&api-version=7.0`,
    tokenEnvVar: "AZURE_DEVOPS_TOKEN",
    parseTree: (data) => {
      const typed = data as { value?: { path: string }[] };
      return typed.value?.map((item) => item.path.replace(/^\//, "")) ?? [];
    },
  },
  codeberg: {
    name: "Codeberg",
    icon: "codeberg",
    treeEndpoint: ({ owner, repo }) => 
      `https://codeberg.org/api/v1/repos/${owner}/${repo}/git/trees/HEAD?recursive=true`,
    rawFileEndpoint: ({ owner, repo }, path) => 
      `https://codeberg.org/${owner}/${repo}/raw/branch/HEAD/${path}`,
    tokenEnvVar: "CODEBERG_TOKEN",
    parseTree: (data) => {
      const typed = data as { tree?: { path: string }[] };
      return typed.tree?.map((item) => item.path) ?? [];
    },
  },
  gitea: {
    name: "Gitea",
    icon: "gitea",
    treeEndpoint: ({ owner, repo, host }) => 
      `https://${host}/api/v1/repos/${owner}/${repo}/git/trees/HEAD?recursive=true`,
    rawFileEndpoint: ({ owner, repo, host }, path) => 
      `https://${host}/${owner}/${repo}/raw/branch/HEAD/${path}`,
    tokenEnvVar: "GITEA_TOKEN",
    parseTree: (data) => {
      const typed = data as { tree?: { path: string }[] };
      return typed.tree?.map((item) => item.path) ?? [];
    },
  },
  sourcehut: {
    name: "SourceHut",
    icon: "sourcehut",
    treeEndpoint: ({ owner, repo }) => 
      `https://git.sr.ht/api/~${owner}/repos/${repo}/tree/HEAD`,
    rawFileEndpoint: ({ owner, repo }, path) => 
      `https://git.sr.ht/~${owner}/${repo}/blob/HEAD/${path}`,
    tokenEnvVar: "SOURCEHUT_TOKEN",
    parseTree: (data) => {
      const typed = data as { entries?: { name: string }[] };
      return typed.entries?.map((item) => item.name) ?? [];
    },
  },
};

// =============================================================================
// URL PARSING
// =============================================================================

/**
 * Try to fix common URL issues like missing protocol
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim();
  
  // Fix common typos: ttps://, ttp://, htp://, htps://
  if (/^t{1,2}ps?:\/\//i.test(normalized)) {
    normalized = "https://" + normalized.replace(/^t{1,2}ps?:\/\//i, "");
  } else if (/^h?t{1,2}ps?:\/\//i.test(normalized) && !normalized.startsWith("http")) {
    normalized = "https://" + normalized.replace(/^h?t{1,2}ps?:\/\//i, "");
  }
  
  // Add https:// if URL starts with known hosts but no protocol
  const knownHosts = ["github.com", "gitlab.com", "bitbucket.org", "codeberg.org", "git.sr.ht", "dev.azure.com"];
  for (const host of knownHosts) {
    if (normalized.startsWith(host) || normalized.startsWith(`www.${host}`)) {
      normalized = `https://${normalized}`;
      break;
    }
  }
  
  return normalized;
}

/**
 * Parse repository URL to extract platform, owner, and repo
 */
function parseRepoUrl(url: string): ParsedRepo | null {
  const normalizedUrl = normalizeUrl(url);
  const trimmedUrl = normalizedUrl.replace(/\.git$/, "").replace(/\/$/, "");
  
  // GitHub patterns
  const githubPatterns = [
    /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/,
    /^git@github\.com:([^\/]+)\/([^\/]+)/,
  ];
  for (const pattern of githubPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { platform: "github", owner: match[1], repo: match[2], host: "github.com" };
    }
  }
  
  // GitLab patterns (including self-hosted)
  const gitlabPatterns = [
    /^https?:\/\/([^\/]*gitlab[^\/]*)\/([^\/]+)\/([^\/]+)/,
    /^git@([^\/]*gitlab[^\/]*):([^\/]+)\/([^\/]+)/,
  ];
  for (const pattern of gitlabPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { platform: "gitlab", host: match[1], owner: match[2], repo: match[3] };
    }
  }
  
  // Bitbucket patterns
  const bitbucketPatterns = [
    /^https?:\/\/(?:www\.)?bitbucket\.org\/([^\/]+)\/([^\/]+)/,
    /^git@bitbucket\.org:([^\/]+)\/([^\/]+)/,
  ];
  for (const pattern of bitbucketPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { platform: "bitbucket", owner: match[1], repo: match[2], host: "bitbucket.org" };
    }
  }
  
  // Azure DevOps patterns
  const azurePatterns = [
    /^https?:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)/,
    /^https?:\/\/([^\.]+)\.visualstudio\.com\/([^\/]+)\/_git\/([^\/]+)/,
  ];
  for (const pattern of azurePatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { 
        platform: "azure", 
        owner: match[1], 
        project: match[2], 
        repo: match[3], 
        host: "dev.azure.com" 
      };
    }
  }
  
  // Codeberg patterns
  const codebergPatterns = [
    /^https?:\/\/(?:www\.)?codeberg\.org\/([^\/]+)\/([^\/]+)/,
    /^git@codeberg\.org:([^\/]+)\/([^\/]+)/,
  ];
  for (const pattern of codebergPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { platform: "codeberg", owner: match[1], repo: match[2], host: "codeberg.org" };
    }
  }
  
  // SourceHut patterns
  const sourcehutPatterns = [
    /^https?:\/\/git\.sr\.ht\/~([^\/]+)\/([^\/]+)/,
    /^git@git\.sr\.ht:~([^\/]+)\/([^\/]+)/,
  ];
  for (const pattern of sourcehutPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { platform: "sourcehut", owner: match[1], repo: match[2], host: "git.sr.ht" };
    }
  }
  
  // Gitea/Forgejo self-hosted (common patterns)
  const giteaPatterns = [
    /^https?:\/\/([^\/]+)\/([^\/]+)\/([^\/]+)/,
  ];
  // Only try Gitea if it looks like a git URL but didn't match others
  if (trimmedUrl.includes("gitea") || trimmedUrl.includes("forgejo")) {
    for (const pattern of giteaPatterns) {
      const match = trimmedUrl.match(pattern);
      if (match) {
        return { platform: "gitea", host: match[1], owner: match[2], repo: match[3] };
      }
    }
  }
  
  return null;
}

// =============================================================================
// FILE EXTENSION TO TECHNOLOGY MAPPING
// =============================================================================

const EXTENSION_TO_TECH: Record<string, string[]> = {
  // JavaScript/TypeScript
  ".js": ["javascript"],
  ".mjs": ["javascript"],
  ".cjs": ["javascript"],
  ".jsx": ["javascript", "react"],
  ".ts": ["typescript"],
  ".tsx": ["typescript", "react"],
  ".mts": ["typescript"],
  ".cts": ["typescript"],
  
  // Python
  ".py": ["python"],
  ".pyw": ["python"],
  ".pyi": ["python"],
  ".ipynb": ["python", "jupyter"],
  
  // Java/JVM
  ".java": ["java"],
  ".kt": ["kotlin"],
  ".kts": ["kotlin"],
  ".scala": ["scala"],
  ".sc": ["scala"],
  ".clj": ["clojure"],
  ".cljs": ["clojure"],
  ".cljc": ["clojure"],
  ".groovy": ["groovy"],
  ".gvy": ["groovy"],
  
  // .NET
  ".cs": ["csharp"],
  ".csx": ["csharp"],
  ".fs": ["fsharp"],
  ".fsx": ["fsharp"],
  ".fsi": ["fsharp"],
  ".vb": ["vb"],
  
  // Systems
  ".go": ["go"],
  ".rs": ["rust"],
  ".c": ["c"],
  ".h": ["c"],
  ".cpp": ["cpp"],
  ".cc": ["cpp"],
  ".cxx": ["cpp"],
  ".hpp": ["cpp"],
  ".hxx": ["cpp"],
  ".zig": ["zig"],
  ".nim": ["nim"],
  ".nims": ["nim"],
  
  // Web/Scripting
  ".rb": ["ruby"],
  ".rake": ["ruby"],
  ".erb": ["ruby", "rails"],
  ".php": ["php"],
  ".phtml": ["php"],
  ".lua": ["lua"],
  ".pl": ["perl"],
  ".pm": ["perl"],
  
  // iOS/macOS
  ".swift": ["swift"],
  ".m": ["objectivec"],
  ".mm": ["objectivec"],
  
  // Flutter/Dart
  ".dart": ["dart", "flutter"],
  
  // Functional
  ".ex": ["elixir"],
  ".exs": ["elixir"],
  ".erl": ["erlang"],
  ".hrl": ["erlang"],
  ".hs": ["haskell"],
  ".lhs": ["haskell"],
  ".ml": ["ocaml"],
  ".mli": ["ocaml"],
  ".jl": ["julia"],
  ".r": ["r"],
  ".R": ["r"],
  ".rmd": ["r"],
  
  // Frontend frameworks (via templates)
  ".vue": ["vue"],
  ".svelte": ["svelte"],
  ".astro": ["astro"],
  ".mdx": ["markdown", "mdx"],
  ".marko": ["marko"],
  
  // Templating
  ".ejs": ["ejs"],
  ".hbs": ["handlebars"],
  ".handlebars": ["handlebars"],
  ".pug": ["pug"],
  ".jade": ["pug"],
  ".njk": ["nunjucks"],
  ".twig": ["twig"],
  ".blade.php": ["laravel"],
  ".jinja": ["jinja"],
  ".jinja2": ["jinja"],
  
  // Blockchain
  ".sol": ["solidity", "ethereum"],
  ".vy": ["vyper", "ethereum"],
  
  // Config/DevOps
  ".tf": ["terraform"],
  ".tfvars": ["terraform"],
  ".hcl": ["terraform"],
  ".dockerfile": ["docker"],
  ".yml": ["yaml"],
  ".yaml": ["yaml"],
  ".toml": ["toml"],
  
  // Data/Query
  ".sql": ["sql"],
  ".prisma": ["prisma"],
  ".graphql": ["graphql"],
  ".gql": ["graphql"],
  ".proto": ["grpc", "protobuf"],
  
  // Styles
  ".css": ["css"],
  ".scss": ["sass"],
  ".sass": ["sass"],
  ".less": ["less"],
  ".styl": ["stylus"],
  
  // Shell
  ".sh": ["bash"],
  ".bash": ["bash"],
  ".zsh": ["zsh"],
  ".fish": ["fish"],
  ".ps1": ["powershell"],
  ".psm1": ["powershell"],
  
  // Mobile
  ".gradle": ["android"],
  ".xcodeproj": ["ios"],
  
  // Other
  ".wasm": ["webassembly"],
  ".wat": ["webassembly"],
  ".asm": ["assembly"],
  ".s": ["assembly"],
};

// =============================================================================
// TECH DETECTION PATTERNS
// =============================================================================

const TECH_DETECTION: Record<string, {
  files?: string[];
  packages?: string[];
  extensions?: string[];
}> = {
  // Programming Languages
  javascript: { extensions: [".js", ".mjs", ".cjs", ".jsx"] },
  typescript: { extensions: [".ts", ".tsx", ".mts", ".cts"], files: ["tsconfig.json", "tsconfig.base.json"] },
  python: { extensions: [".py", ".pyw", ".pyi"], files: ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile", "poetry.lock", "setup.cfg"] },
  java: { extensions: [".java"], files: ["pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle"] },
  csharp: { extensions: [".cs", ".csx"], files: ["*.csproj", "*.sln", "global.json"] },
  cpp: { extensions: [".cpp", ".cc", ".cxx", ".hpp", ".hxx", ".c++", ".h++"] },
  c: { extensions: [".c", ".h"] },
  go: { extensions: [".go"], files: ["go.mod", "go.sum", "go.work"] },
  rust: { extensions: [".rs"], files: ["Cargo.toml", "Cargo.lock"] },
  ruby: { extensions: [".rb", ".rake", ".erb"], files: ["Gemfile", "Gemfile.lock", "*.gemspec", "Rakefile"] },
  php: { extensions: [".php", ".phtml", ".php5", ".php7"], files: ["composer.json", "composer.lock"] },
  swift: { extensions: [".swift"], files: ["Package.swift", "*.xcodeproj", "*.xcworkspace"] },
  kotlin: { extensions: [".kt", ".kts"], files: ["build.gradle.kts"] },
  scala: { extensions: [".scala", ".sc"], files: ["build.sbt", "build.sc"] },
  r: { extensions: [".r", ".R", ".rmd", ".Rmd"], files: ["DESCRIPTION", ".Rproj"] },
  dart: { extensions: [".dart"], files: ["pubspec.yaml", "pubspec.lock"] },
  elixir: { extensions: [".ex", ".exs"], files: ["mix.exs", "mix.lock"] },
  haskell: { extensions: [".hs", ".lhs"], files: ["*.cabal", "stack.yaml", "package.yaml"] },
  lua: { extensions: [".lua"], files: ["*.rockspec"] },
  perl: { extensions: [".pl", ".pm", ".t"], files: ["Makefile.PL", "cpanfile"] },
  clojure: { extensions: [".clj", ".cljs", ".cljc", ".edn"], files: ["project.clj", "deps.edn"] },
  fsharp: { extensions: [".fs", ".fsx", ".fsi"], files: ["*.fsproj"] },
  groovy: { extensions: [".groovy", ".gvy"], files: ["Jenkinsfile"] },
  julia: { extensions: [".jl"], files: ["Project.toml", "Manifest.toml"] },
  nim: { extensions: [".nim", ".nims"], files: ["*.nimble"] },
  crystal: { extensions: [".cr"], files: ["shard.yml"] },
  zig: { extensions: [".zig"], files: ["build.zig", "build.zig.zon"] },
  ocaml: { extensions: [".ml", ".mli"], files: ["dune", "dune-project", "*.opam"] },
  erlang: { extensions: [".erl", ".hrl"], files: ["rebar.config", "erlang.mk"] },
  cobol: { extensions: [".cob", ".cbl", ".cpy"] },
  fortran: { extensions: [".f", ".f90", ".f95", ".for"] },
  assembly: { extensions: [".asm", ".s", ".S"] },
  objectivec: { extensions: [".m", ".mm"], files: ["*.xcodeproj"] },
  solidity: { extensions: [".sol"], files: ["hardhat.config.js", "truffle-config.js", "foundry.toml"] },
  vyper: { extensions: [".vy"] },

  // Frontend Frameworks
  react: { packages: ["react", "react-dom"] },
  nextjs: { packages: ["next"], files: ["next.config.js", "next.config.ts", "next.config.mjs"] },
  vue: { packages: ["vue", "vue-router", "vuex", "pinia"] },
  nuxt: { packages: ["nuxt", "nuxt3"], files: ["nuxt.config.js", "nuxt.config.ts"] },
  angular: { packages: ["@angular/core", "@angular/common"], files: ["angular.json", ".angular-cli.json"] },
  svelte: { packages: ["svelte"] },
  sveltekit: { packages: ["@sveltejs/kit"], files: ["svelte.config.js"] },
  solid: { packages: ["solid-js"] },
  astro: { packages: ["astro"], files: ["astro.config.mjs", "astro.config.ts"] },
  remix: { packages: ["@remix-run/react", "@remix-run/node"] },
  gatsby: { packages: ["gatsby"], files: ["gatsby-config.js", "gatsby-config.ts"] },
  qwik: { packages: ["@builder.io/qwik"] },
  preact: { packages: ["preact"] },
  alpinejs: { packages: ["alpinejs"] },
  lit: { packages: ["lit", "lit-element", "lit-html"] },
  stencil: { packages: ["@stencil/core"], files: ["stencil.config.ts"] },
  ember: { packages: ["ember-source", "ember-cli"], files: ["ember-cli-build.js"] },
  htmx: { packages: ["htmx.org"] },

  // CSS & Styling
  tailwindcss: { packages: ["tailwindcss"], files: ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs", "tailwind.config.cjs"] },
  bootstrap: { packages: ["bootstrap", "react-bootstrap", "bootstrap-vue"] },
  materialui: { packages: ["@mui/material", "@material-ui/core"] },
  chakra: { packages: ["@chakra-ui/react"] },
  antdesign: { packages: ["antd", "@ant-design/icons"] },
  shadcn: { files: ["components.json"] },
  daisyui: { packages: ["daisyui"] },
  bulma: { packages: ["bulma"] },
  sass: { packages: ["sass", "node-sass"], files: ["*.scss", "*.sass"] },
  less: { packages: ["less"] },
  stylus: { packages: ["stylus"] },
  postcss: { packages: ["postcss"], files: ["postcss.config.js", "postcss.config.cjs"] },
  emotion: { packages: ["@emotion/react", "@emotion/styled", "@emotion/css"] },
  styledcomponents: { packages: ["styled-components"] },
  unocss: { packages: ["unocss"], files: ["uno.config.ts", "unocss.config.ts"] },
  windicss: { packages: ["windicss"], files: ["windi.config.ts"] },

  // Backend Frameworks
  express: { packages: ["express"] },
  fastify: { packages: ["fastify"] },
  nestjs: { packages: ["@nestjs/core", "@nestjs/common"] },
  koa: { packages: ["koa"] },
  hono: { packages: ["hono"] },
  elysia: { packages: ["elysia"] },
  hapi: { packages: ["@hapi/hapi"] },
  django: { packages: ["django"] },
  flask: { packages: ["flask"] },
  fastapi: { packages: ["fastapi"] },
  rails: { files: ["Gemfile"], packages: ["rails"] },
  laravel: { files: ["artisan", "composer.json"] },
  symfony: { packages: ["symfony/symfony"] },
  spring: { files: ["pom.xml", "build.gradle"] },
  springboot: { packages: ["spring-boot-starter"] },
  dotnet: { files: ["*.csproj", "*.sln"] },
  aspnet: { files: ["*.csproj"] },
  gin: { packages: ["github.com/gin-gonic/gin"] },
  fiber: { packages: ["github.com/gofiber/fiber"] },
  echo: { packages: ["github.com/labstack/echo"] },
  actix: { packages: ["actix-web"] },
  rocket: { packages: ["rocket"] },
  axum: { packages: ["axum"] },
  phoenix: { files: ["mix.exs"], packages: ["phoenix"] },

  // Databases
  postgresql: { packages: ["pg", "postgres", "psycopg2", "psycopg2-binary", "@prisma/client"] },
  mysql: { packages: ["mysql", "mysql2", "pymysql"] },
  mongodb: { packages: ["mongoose", "mongodb", "pymongo"] },
  redis: { packages: ["redis", "ioredis"] },
  sqlite: { packages: ["better-sqlite3", "sqlite3"], files: ["*.sqlite", "*.db"] },
  prisma: { packages: ["@prisma/client", "prisma"], files: ["schema.prisma", "prisma/"] },
  drizzle: { packages: ["drizzle-orm", "drizzle-kit"] },
  typeorm: { packages: ["typeorm"] },
  sequelize: { packages: ["sequelize"] },
  mongoose: { packages: ["mongoose"] },
  supabase: { packages: ["@supabase/supabase-js", "@supabase/auth-helpers-nextjs"] },
  firebase: { packages: ["firebase", "firebase-admin", "@firebase/app"] },
  planetscale: { packages: ["@planetscale/database"] },
  neon: { packages: ["@neondatabase/serverless"] },
  turso: { packages: ["@libsql/client"] },
  cockroachdb: { packages: ["pg"] },
  dynamodb: { packages: ["@aws-sdk/client-dynamodb", "dynamodb"] },
  elasticsearch: { packages: ["@elastic/elasticsearch", "elasticsearch"] },

  // DevOps & Infrastructure
  docker: { files: ["Dockerfile", "docker-compose.yml", "docker-compose.yaml", ".dockerignore"] },
  kubernetes: { files: ["*.yaml", "*.yml"], packages: ["kubernetes"] },
  terraform: { files: ["*.tf", "*.tfvars"], extensions: [".tf", ".tfvars"] },
  ansible: { files: ["ansible.cfg", "playbook.yml"] },
  github_actions: { files: [".github/workflows/"] },
  gitlab_ci: { files: [".gitlab-ci.yml"] },
  jenkins: { files: ["Jenkinsfile"] },
  circleci: { files: [".circleci/config.yml"] },
  vercel: { files: ["vercel.json"], packages: ["vercel"] },
  netlify: { files: ["netlify.toml"] },
  aws: { packages: ["@aws-sdk/client-s3", "aws-sdk"] },
  gcp: { packages: ["@google-cloud/storage", "google-cloud"] },
  azure: { packages: ["@azure/storage-blob", "@azure/identity"] },

  // Testing
  jest: { packages: ["jest", "@jest/core"], files: ["jest.config.js", "jest.config.ts"] },
  vitest: { packages: ["vitest"], files: ["vitest.config.ts", "vitest.config.js"] },
  cypress: { packages: ["cypress"], files: ["cypress.config.js", "cypress.config.ts", "cypress/"] },
  playwright: { packages: ["@playwright/test", "playwright"], files: ["playwright.config.ts"] },
  puppeteer: { packages: ["puppeteer"] },
  mocha: { packages: ["mocha"] },
  jasmine: { packages: ["jasmine"] },
  testing_library: { packages: ["@testing-library/react", "@testing-library/jest-dom"] },
  pytest: { packages: ["pytest"] },
  rspec: { packages: ["rspec"] },
  phpunit: { packages: ["phpunit/phpunit"] },
  junit: { packages: ["junit"] },

  // API & Communication
  graphql: { packages: ["graphql", "@graphql-tools/schema", "apollo-server"], files: ["*.graphql", "*.gql"] },
  trpc: { packages: ["@trpc/server", "@trpc/client"] },
  grpc: { packages: ["@grpc/grpc-js", "grpcio"], files: ["*.proto"] },
  websocket: { packages: ["ws", "socket.io"] },
  socketio: { packages: ["socket.io", "socket.io-client"] },
  rest: { packages: ["express", "fastify", "koa"] },

  // Build Tools
  webpack: { packages: ["webpack"], files: ["webpack.config.js", "webpack.config.ts"] },
  vite: { packages: ["vite"], files: ["vite.config.js", "vite.config.ts"] },
  rollup: { packages: ["rollup"], files: ["rollup.config.js"] },
  esbuild: { packages: ["esbuild"] },
  parcel: { packages: ["parcel"] },
  swc: { packages: ["@swc/core"], files: [".swcrc"] },
  babel: { packages: ["@babel/core"], files: ["babel.config.js", ".babelrc"] },
  turbopack: { packages: ["turbopack"] },
  turborepo: { packages: ["turbo"], files: ["turbo.json"] },
  nx: { packages: ["nx"], files: ["nx.json"] },
  pnpm: { files: ["pnpm-workspace.yaml", "pnpm-lock.yaml"] },

  // Linting & Formatting
  eslint: { packages: ["eslint"], files: [".eslintrc", ".eslintrc.js", ".eslintrc.json", "eslint.config.js", "eslint.config.mjs"] },
  prettier: { packages: ["prettier"], files: [".prettierrc", ".prettierrc.js", "prettier.config.js"] },
  biome: { packages: ["@biomejs/biome"], files: ["biome.json"] },
  stylelint: { packages: ["stylelint"], files: [".stylelintrc"] },
  ruff: { packages: ["ruff"], files: ["ruff.toml"] },
  black: { packages: ["black"] },
  mypy: { packages: ["mypy"], files: ["mypy.ini"] },

  // Authentication
  clerk: { packages: ["@clerk/nextjs", "@clerk/clerk-react"] },
  nextauth: { packages: ["next-auth", "@auth/core"] },
  auth0: { packages: ["@auth0/nextjs-auth0", "auth0"] },
  passport: { packages: ["passport"] },
  firebase_auth: { packages: ["firebase/auth"] },
  supabase_auth: { packages: ["@supabase/auth-helpers-nextjs"] },
  keycloak: { packages: ["keycloak-js"] },

  // Monitoring & Logging
  sentry: { packages: ["@sentry/nextjs", "@sentry/node", "@sentry/react"] },
  datadog: { packages: ["dd-trace"] },
  newrelic: { packages: ["newrelic"] },
  prometheus: { packages: ["prom-client"] },
  grafana: { packages: ["@grafana/data"] },
  winston: { packages: ["winston"] },
  pino: { packages: ["pino"] },
  opentelemetry: { packages: ["@opentelemetry/api", "@opentelemetry/sdk-node"] },

  // AI & ML
  tensorflow: { packages: ["tensorflow", "@tensorflow/tfjs"] },
  pytorch: { packages: ["torch", "pytorch"] },
  openai: { packages: ["openai"] },
  anthropic: { packages: ["@anthropic-ai/sdk"] },
  langchain: { packages: ["langchain", "@langchain/core"] },
  huggingface: { packages: ["@huggingface/inference", "transformers"] },
  llamaindex: { packages: ["llamaindex"] },
  pandas: { packages: ["pandas"] },
  numpy: { packages: ["numpy"] },
  scipy: { packages: ["scipy"] },
  jupyter: { files: ["*.ipynb"], extensions: [".ipynb"] },

  // Mobile
  reactnative: { packages: ["react-native"] },
  flutter: { files: ["pubspec.yaml"], packages: ["flutter"] },
  expo: { packages: ["expo"] },
  ionic: { packages: ["@ionic/core", "@ionic/react"] },
  capacitor: { packages: ["@capacitor/core"] },
  tauri: { packages: ["@tauri-apps/api"], files: ["tauri.conf.json"] },
  electron: { packages: ["electron"] },

  // CMS & Content
  contentful: { packages: ["contentful"] },
  sanity: { packages: ["@sanity/client", "sanity"] },
  strapi: { packages: ["@strapi/strapi"] },
  wordpress: { files: ["wp-config.php"] },
  ghost: { packages: ["@tryghost/content-api"] },
  prismic: { packages: ["@prismicio/client"] },
  payload: { packages: ["payload"] },
  mdx: { packages: ["@mdx-js/mdx", "@next/mdx"] },

  // Email
  nodemailer: { packages: ["nodemailer"] },
  sendgrid: { packages: ["@sendgrid/mail"] },
  resend: { packages: ["resend"] },
  postmark: { packages: ["postmark"] },
  mailgun: { packages: ["mailgun-js", "mailgun.js"] },
  react_email: { packages: ["@react-email/components", "react-email"] },

  // Search
  algolia: { packages: ["algoliasearch", "@algolia/client-search"] },
  meilisearch: { packages: ["meilisearch"] },
  typesense: { packages: ["typesense"] },
  fuse: { packages: ["fuse.js"] },

  // Analytics
  google_analytics: { packages: ["@google-analytics/data", "react-ga4"] },
  mixpanel: { packages: ["mixpanel", "mixpanel-browser"] },
  amplitude: { packages: ["@amplitude/analytics-browser"] },
  posthog: { packages: ["posthog-js", "posthog-node"] },
  plausible: { packages: ["plausible-tracker"] },
  segment: { packages: ["@segment/analytics-next"] },

  // Blockchain & Web3
  ethers: { packages: ["ethers"] },
  web3js: { packages: ["web3"] },
  wagmi: { packages: ["wagmi", "@wagmi/core"] },
  viem: { packages: ["viem"] },
  hardhat: { packages: ["hardhat"], files: ["hardhat.config.js", "hardhat.config.ts"] },
  foundry: { files: ["foundry.toml", "forge.toml"] },
  truffle: { packages: ["truffle"], files: ["truffle-config.js"] },
  solana: { packages: ["@solana/web3.js"] },

  // Payment
  stripe: { packages: ["stripe", "@stripe/stripe-js"] },
  paypal: { packages: ["@paypal/react-paypal-js"] },
  lemonsqueezy: { packages: ["@lemonsqueezy/lemonsqueezy.js"] },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function analyzeFileExtensions(files: string[], sampleSize = 100): string[] {
  const detected = new Set<string>();
  const extensionCounts: Record<string, number> = {};
  
  const codeFiles = files.filter((file) => {
    const lower = file.toLowerCase();
    if (
      lower.includes("node_modules/") ||
      lower.includes("vendor/") ||
      lower.includes("dist/") ||
      lower.includes("build/") ||
      lower.includes(".git/") ||
      lower.includes("__pycache__/") ||
      lower.includes(".next/") ||
      lower.includes("coverage/") ||
      lower.includes(".cache/")
    ) {
      return false;
    }
    return file.includes(".");
  });
  
  let sampledFiles = codeFiles;
  if (codeFiles.length > sampleSize) {
    const sourceFiles = codeFiles.filter((f) => {
      const lower = f.toLowerCase();
      return (
        lower.includes("/src/") ||
        lower.includes("/lib/") ||
        lower.includes("/app/") ||
        lower.includes("/pages/") ||
        lower.includes("/components/") ||
        lower.includes("/api/") ||
        lower.includes("/services/") ||
        lower.includes("/utils/") ||
        lower.includes("/hooks/") ||
        lower.includes("/models/") ||
        lower.includes("/controllers/")
      );
    });
    
    if (sourceFiles.length >= sampleSize) {
      sampledFiles = shuffleArray(sourceFiles).slice(0, sampleSize);
    } else {
      const otherFiles = codeFiles.filter((f) => !sourceFiles.includes(f));
      const remaining = sampleSize - sourceFiles.length;
      sampledFiles = [
        ...sourceFiles,
        ...shuffleArray(otherFiles).slice(0, remaining),
      ];
    }
  }
  
  for (const file of sampledFiles) {
    let ext = "";
    const filename = file.split("/").pop() ?? "";
    
    if (filename.includes(".blade.php")) {
      ext = ".blade.php";
    } else if (filename.endsWith(".d.ts")) {
      ext = ".d.ts";
    } else if (filename.endsWith(".spec.ts") || filename.endsWith(".spec.js")) {
      ext = filename.endsWith(".spec.ts") ? ".ts" : ".js";
    } else if (filename.endsWith(".test.ts") || filename.endsWith(".test.js")) {
      ext = filename.endsWith(".test.ts") ? ".ts" : ".js";
    } else {
      const lastDot = filename.lastIndexOf(".");
      if (lastDot > 0) {
        ext = filename.slice(lastDot).toLowerCase();
      }
    }
    
    if (ext) {
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    }
  }
  
  for (const [ext, count] of Object.entries(extensionCounts)) {
    if (count >= 1) {
      const techs = EXTENSION_TO_TECH[ext];
      if (techs) {
        for (const tech of techs) {
          detected.add(tech);
        }
      }
    }
  }
  
  return Array.from(detected);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// =============================================================================
// PLATFORM API FUNCTIONS
// =============================================================================

async function fetchRepoTree(parsed: ParsedRepo, userToken?: string): Promise<string[]> {
  const config = PLATFORM_CONFIGS[parsed.platform];
  const endpoint = config.treeEndpoint(parsed);
  // User-provided token takes priority over environment variable
  const token = userToken || process.env[config.tokenEnvVar];
  
  // Debug log in development only (never log actual token value)
  if (process.env.NODE_ENV === "development") {
    console.log(`[Repo Analyzer] Platform: ${parsed.platform}, Token source: ${userToken ? "user-provided" : token ? "env-var" : "none"}`);
  }
  
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  
  if (token) {
    if (parsed.platform === "github") {
      headers.Authorization = `Bearer ${token}`;
    } else if (parsed.platform === "gitlab") {
      headers["PRIVATE-TOKEN"] = token;
    } else if (parsed.platform === "bitbucket") {
      headers.Authorization = `Bearer ${token}`;
    } else if (parsed.platform === "azure") {
      headers.Authorization = `Basic ${Buffer.from(`:${token}`).toString("base64")}`;
    } else {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  const response = await fetch(endpoint, { headers });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository not found or is private. ${config.name} requires authentication for private repos.`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication required for ${config.name}. Add ${config.tokenEnvVar} to your environment.`);
    }
    throw new Error(`${config.name} API error: ${response.status}`);
  }
  
  // Check content type to ensure we got JSON
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error(`${config.name} returned unexpected content type. The repository may require authentication.`);
  }
  
  const data = await response.json();
  return config.parseTree(data);
}

async function fetchRawFile(parsed: ParsedRepo, path: string, userToken?: string): Promise<string | null> {
  const config = PLATFORM_CONFIGS[parsed.platform];
  const endpoint = config.rawFileEndpoint(parsed, path);
  // User-provided token takes priority over environment variable
  const token = userToken || process.env[config.tokenEnvVar];
  
  const headers: Record<string, string> = {};
  
  if (token) {
    if (parsed.platform === "github") {
      headers.Authorization = `Bearer ${token}`;
    } else if (parsed.platform === "gitlab") {
      headers["PRIVATE-TOKEN"] = token;
    } else if (parsed.platform === "bitbucket") {
      headers.Authorization = `Bearer ${token}`;
    } else if (parsed.platform === "azure") {
      headers.Authorization = `Basic ${Buffer.from(`:${token}`).toString("base64")}`;
    } else {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  try {
    const response = await fetch(endpoint, { headers });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function fetchPackageJson(parsed: ParsedRepo, userToken?: string): Promise<Record<string, unknown> | null> {
  const content = await fetchRawFile(parsed, "package.json", userToken);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function fetchRequirementsTxt(parsed: ParsedRepo, userToken?: string): Promise<string[]> {
  const content = await fetchRawFile(parsed, "requirements.txt", userToken);
  if (!content) return [];
  return content
    .split("\n")
    .map((line) => line.trim().split(/[=<>]/)[0].toLowerCase())
    .filter(Boolean);
}

function detectTechStack(
  files: string[],
  packageJson: Record<string, unknown> | null,
  pythonPackages: string[]
): string[] {
  const detected = new Set<string>();
  
  const extensionTechs = analyzeFileExtensions(files, 100);
  for (const tech of extensionTechs) {
    detected.add(tech);
  }
  
  const npmPackages: string[] = [];
  if (packageJson) {
    const deps = packageJson.dependencies as Record<string, string> | undefined;
    const devDeps = packageJson.devDependencies as Record<string, string> | undefined;
    if (deps) npmPackages.push(...Object.keys(deps));
    if (devDeps) npmPackages.push(...Object.keys(devDeps));
  }
  
  for (const [tech, patterns] of Object.entries(TECH_DETECTION)) {
    if (patterns.files) {
      for (const filePattern of patterns.files) {
        if (filePattern.endsWith("/")) {
          if (files.some((f) => f.startsWith(filePattern) || f.includes(`/${filePattern}`))) {
            detected.add(tech);
            break;
          }
        } else if (filePattern.includes("*")) {
          const regex = new RegExp(filePattern.replace(/\*/g, ".*"));
          if (files.some((f) => regex.test(f))) {
            detected.add(tech);
            break;
          }
        } else {
          if (files.some((f) => f === filePattern || f.endsWith(`/${filePattern}`))) {
            detected.add(tech);
            break;
          }
        }
      }
    }
    
    if (patterns.packages) {
      for (const pkg of patterns.packages) {
        if (npmPackages.includes(pkg)) {
          detected.add(tech);
          break;
        }
        if (pythonPackages.includes(pkg.toLowerCase())) {
          detected.add(tech);
          break;
        }
      }
    }
    
    if (patterns.extensions) {
      for (const ext of patterns.extensions) {
        if (files.some((f) => f.endsWith(ext))) {
          detected.add(tech);
          break;
        }
      }
    }
  }
  
  return Array.from(detected);
}

// =============================================================================
// API ROUTE HANDLER
// =============================================================================

/**
 * POST /api/repo/analyze
 * Analyze a Git repository and detect its tech stack
 * Supports: GitHub, GitLab, Bitbucket, Azure DevOps, Codeberg, Gitea, SourceHut
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/401",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication required",
        },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { url, token } = body;
    
    // Validate token is string or undefined (never expose in logs)
    const userToken = typeof token === "string" && token.trim() ? token.trim() : undefined;
    
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/400",
          title: "Bad Request",
          status: 400,
          detail: "Repository URL is required",
        },
        { status: 400 }
      );
    }
    
    const parsed = parseRepoUrl(url);
    if (!parsed) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/400",
          title: "Bad Request",
          status: 400,
          detail: "Invalid repository URL. Supported platforms: GitHub, GitLab, Bitbucket, Azure DevOps, Codeberg, Gitea, SourceHut.",
        },
        { status: 400 }
      );
    }
    
    const platformConfig = PLATFORM_CONFIGS[parsed.platform];
    
    const [files, packageJson, pythonPackages] = await Promise.all([
      fetchRepoTree(parsed, userToken),
      fetchPackageJson(parsed, userToken),
      fetchRequirementsTxt(parsed, userToken),
    ]);
    
    const techStack = detectTechStack(files, packageJson, pythonPackages);
    
    const extensionStats: Record<string, number> = {};
    for (const file of files) {
      const ext = file.split(".").pop()?.toLowerCase();
      if (ext && ext.length <= 10) {
        extensionStats[ext] = (extensionStats[ext] || 0) + 1;
      }
    }
    
    const topExtensions = Object.entries(extensionStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ext, count]) => ({ ext: `.${ext}`, count }));
    
    const repoInfo = {
      platform: parsed.platform,
      platformName: platformConfig.name,
      owner: parsed.owner,
      repo: parsed.repo,
      project: parsed.project,
      host: parsed.host,
      url,
      fileCount: files.length,
      topExtensions,
      hasPackageJson: packageJson !== null,
      hasRequirementsTxt: pythonPackages.length > 0,
    };
    
    return NextResponse.json({
      success: true,
      data: {
        techStack,
        repository: repoInfo,
        detectedCount: techStack.length,
      },
    });
  } catch (error) {
    console.error("Repo analyze error:", error);
    
    const message = error instanceof Error ? error.message : "Failed to analyze repository";
    
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Internal Server Error",
        status: 500,
        detail: message,
      },
      { status: 500 }
    );
  }
}
