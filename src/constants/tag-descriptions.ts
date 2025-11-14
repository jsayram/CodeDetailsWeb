/**
 * Tag descriptions and keywords for improved search relevance
 * Maps tag names to their descriptions and related search terms
 */
export const TAG_DESCRIPTIONS: Record<string, { description: string; keywords: string }> = {
  // Programming Languages
  javascript: {
    description: "JavaScript programming language",
    keywords: "js ecmascript node browser frontend backend",
  },
  typescript: {
    description: "TypeScript - JavaScript with static typing",
    keywords: "ts types static-typing microsoft superset",
  },
  python: {
    description: "Python programming language",
    keywords: "py django flask fastapi data-science ml ai scripting",
  },
  java: {
    description: "Java programming language",
    keywords: "jvm spring android enterprise oop",
  },
  csharp: {
    description: "C# programming language",
    keywords: "dotnet .net microsoft unity asp.net",
  },
  cpp: {
    description: "C++ programming language",
    keywords: "c++ systems-programming game-engine performance",
  },
  go: {
    description: "Go programming language",
    keywords: "golang google concurrent backend microservices",
  },
  rust: {
    description: "Rust programming language",
    keywords: "systems-programming memory-safe concurrent performance",
  },
  php: {
    description: "PHP programming language",
    keywords: "laravel wordpress symfony web-server backend",
  },
  ruby: {
    description: "Ruby programming language",
    keywords: "rails web scripting oop dynamic",
  },
  swift: {
    description: "Swift programming language for iOS/macOS",
    keywords: "apple ios macos swiftui mobile native",
  },
  kotlin: {
    description: "Kotlin programming language for JVM and Android",
    keywords: "android jvm jetbrains java-alternative multiplatform",
  },

  // Frontend Frameworks
  react: {
    description: "React - JavaScript library for building user interfaces",
    keywords: "jsx tsx component hooks facebook meta frontend ui",
  },
  vue: {
    description: "Vue.js - Progressive JavaScript framework",
    keywords: "vuejs composition-api single-file-component frontend spa",
  },
  angular: {
    description: "Angular - TypeScript-based web framework",
    keywords: "google typescript spa frontend rxjs",
  },
  svelte: {
    description: "Svelte - Compile-time JavaScript framework",
    keywords: "sveltekit reactive compiler frontend ui",
  },
  nextjs: {
    description: "Next.js - React framework with SSR",
    keywords: "react ssr ssg vercel full-stack routing",
  },

  // Backend Frameworks
  nodejs: {
    description: "Node.js - JavaScript runtime for server-side",
    keywords: "node javascript v8 backend server runtime",
  },
  express: {
    description: "Express.js - Minimal Node.js web framework",
    keywords: "node middleware routing backend api",
  },
  django: {
    description: "Django - Python web framework",
    keywords: "python orm mvc admin web-framework backend",
  },
  flask: {
    description: "Flask - Lightweight Python web framework",
    keywords: "python micro-framework api backend wsgi",
  },
  springboot: {
    description: "Spring Boot - Java application framework",
    keywords: "java spring enterprise microservices backend",
  },
  nestjs: {
    description: "NestJS - Progressive Node.js framework",
    keywords: "node typescript angular-inspired backend api",
  },

  // Databases
  postgresql: {
    description: "PostgreSQL - Advanced relational database",
    keywords: "postgres sql rdbms acid transactions",
  },
  mysql: {
    description: "MySQL - Popular relational database",
    keywords: "sql rdbms mariadb oracle database",
  },
  mongodb: {
    description: "MongoDB - NoSQL document database",
    keywords: "nosql document-db json bson atlas",
  },
  redis: {
    description: "Redis - In-memory data store and cache",
    keywords: "cache key-value memory nosql pub-sub",
  },
  sqlite: {
    description: "SQLite - Lightweight embedded database",
    keywords: "sql embedded local file-based database",
  },
  firebase: {
    description: "Firebase - Google's mobile and web platform",
    keywords: "google realtime-database firestore auth hosting",
  },

  // Cloud Platforms
  aws: {
    description: "Amazon Web Services - Cloud computing platform",
    keywords: "amazon ec2 s3 lambda cloud infrastructure",
  },
  azure: {
    description: "Microsoft Azure - Cloud computing platform",
    keywords: "microsoft cloud infrastructure devops",
  },
  gcp: {
    description: "Google Cloud Platform",
    keywords: "google cloud kubernetes app-engine infrastructure",
  },
  vercel: {
    description: "Vercel - Deployment platform for frontend",
    keywords: "hosting deployment nextjs frontend edge",
  },
  netlify: {
    description: "Netlify - Platform for web deployment",
    keywords: "hosting jamstack deployment frontend cdn",
  },

  // DevOps & Tools
  docker: {
    description: "Docker - Container platform",
    keywords: "containerization devops deployment image orchestration",
  },
  kubernetes: {
    description: "Kubernetes - Container orchestration",
    keywords: "k8s orchestration cluster devops deployment",
  },
  terraform: {
    description: "Terraform - Infrastructure as Code",
    keywords: "iac infrastructure cloud automation devops",
  },
  jenkins: {
    description: "Jenkins - Automation server for CI/CD",
    keywords: "cicd automation build deployment pipeline",
  },
  github: {
    description: "GitHub - Version control and collaboration",
    keywords: "git repository collaboration microsoft actions",
  },
  gitlab: {
    description: "GitLab - DevOps platform",
    keywords: "git cicd repository devops collaboration",
  },

  // Testing
  jest: {
    description: "Jest - JavaScript testing framework",
    keywords: "testing unit-test javascript facebook snapshot",
  },
  cypress: {
    description: "Cypress - End-to-end testing framework",
    keywords: "e2e testing frontend browser automation",
  },
  selenium: {
    description: "Selenium - Browser automation",
    keywords: "testing e2e browser automation webdriver",
  },
  pytest: {
    description: "Pytest - Python testing framework",
    keywords: "python testing unit-test fixture tdd",
  },

  // Mobile Development
  "react-native": {
    description: "React Native - Cross-platform mobile framework",
    keywords: "react mobile ios android cross-platform native",
  },
  flutter: {
    description: "Flutter - Google's UI toolkit for mobile",
    keywords: "dart mobile cross-platform ios android google",
  },
  ionic: {
    description: "Ionic - Hybrid mobile framework",
    keywords: "mobile hybrid cordova capacitor web-components",
  },

  // AI/ML
  tensorflow: {
    description: "TensorFlow - Machine learning framework",
    keywords: "ml ai neural-network deep-learning google",
  },
  pytorch: {
    description: "PyTorch - Deep learning framework",
    keywords: "ml ai neural-network deep-learning facebook",
  },
  "machine-learning": {
    description: "Machine learning and AI techniques",
    keywords: "ml ai model training prediction algorithm",
  },
  nlp: {
    description: "Natural Language Processing",
    keywords: "text-processing language ai ml sentiment tokenization",
  },

  // UI/Design
  tailwindcss: {
    description: "Tailwind CSS - Utility-first CSS framework",
    keywords: "css styling frontend utility responsive design",
  },
  bootstrap: {
    description: "Bootstrap - CSS framework",
    keywords: "css framework responsive ui components",
  },
  "material-ui": {
    description: "Material UI - React component library",
    keywords: "react components material-design google ui",
  },
  sass: {
    description: "Sass - CSS preprocessor",
    keywords: "css styling preprocessor scss variables mixins",
  },

  // API & Communication
  graphql: {
    description: "GraphQL - Query language for APIs",
    keywords: "api query-language apollo facebook schema",
  },
  rest: {
    description: "REST - Architectural style for APIs",
    keywords: "api http restful web-service json",
  },
  grpc: {
    description: "gRPC - High-performance RPC framework",
    keywords: "rpc protocol-buffers google microservices api",
  },
  websocket: {
    description: "WebSocket - Real-time communication protocol",
    keywords: "realtime bidirectional communication socket protocol",
  },

  // Build Tools
  webpack: {
    description: "Webpack - Module bundler",
    keywords: "bundler build javascript frontend tooling",
  },
  vite: {
    description: "Vite - Fast build tool",
    keywords: "bundler build frontend fast esm development",
  },
  rollup: {
    description: "Rollup - JavaScript module bundler",
    keywords: "bundler build library esm treeshaking",
  },

  // Others
  api: {
    description: "API development and integration",
    keywords: "rest graphql endpoint service integration",
  },
  authentication: {
    description: "User authentication and authorization",
    keywords: "auth login security jwt oauth session",
  },
  dashboard: {
    description: "Dashboard and admin panels",
    keywords: "admin panel ui analytics visualization",
  },
  ecommerce: {
    description: "E-commerce and online shopping",
    keywords: "shopping cart payment store online retail",
  },
  "real-time": {
    description: "Real-time applications and features",
    keywords: "websocket live updates streaming synchronization",
  },
  security: {
    description: "Security and encryption",
    keywords: "encryption auth vulnerability penetration-testing",
  },
  performance: {
    description: "Performance optimization",
    keywords: "optimization speed cache efficiency metrics",
  },
  responsive: {
    description: "Responsive web design",
    keywords: "mobile-first adaptive layout breakpoints",
  },
};

/**
 * Get description and keywords for a tag
 */
export function getTagInfo(tagName: string): { description: string; keywords: string } | null {
  const normalizedTag = tagName.toLowerCase().trim();
  return TAG_DESCRIPTIONS[normalizedTag] || null;
}

/**
 * Search tags by query - checks name, description, and keywords
 */
export function searchTags(query: string, tags: string[]): string[] {
  const searchLower = query.toLowerCase().trim();
  
  return tags.filter((tag) => {
    const tagLower = tag.toLowerCase();
    
    // Check tag name
    if (tagLower.includes(searchLower)) return true;
    
    // Check description and keywords
    const info = getTagInfo(tag);
    if (info) {
      return (
        info.description.toLowerCase().includes(searchLower) ||
        info.keywords.toLowerCase().includes(searchLower)
      );
    }
    
    return false;
  });
}
