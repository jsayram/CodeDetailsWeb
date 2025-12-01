import { ProjectCategory } from "./project-categories";

/**
 * Extensible field type enum for category-specific fields
 * Future types (date, file, rich-text) can be added without breaking changes
 */
export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "multi-select"
  | "url"
  | "number"
  // Future extensible types (placeholders)
  | "date"
  | "file"
  | "rich-text";

/**
 * Definition for a single category field
 */
export interface CategoryFieldDefinition {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  maxLength?: number;
  isCommon: boolean; // If true, field migrates between categories
  options?: { value: string; label: string }[]; // For select/multi-select types
  description?: string; // Help text shown below field
}

/**
 * Maximum recommended fields before showing UX warning
 */
export const MAX_RECOMMENDED_FIELDS = 15;

/**
 * Common fields that exist across all categories and migrate when category changes
 */
export const COMMON_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "techStack",
    label: "Tech Stack",
    type: "multi-select",
    placeholder: "Select technologies used...",
    isCommon: true,
    description: "Languages, frameworks, libraries, and tools used in this project",
    options: [
      // Languages
      { value: "javascript", label: "JavaScript" },
      { value: "typescript", label: "TypeScript" },
      { value: "python", label: "Python" },
      { value: "java", label: "Java" },
      { value: "csharp", label: "C#" },
      { value: "cpp", label: "C++" },
      { value: "c", label: "C" },
      { value: "go", label: "Go" },
      { value: "rust", label: "Rust" },
      { value: "ruby", label: "Ruby" },
      { value: "php", label: "PHP" },
      { value: "swift", label: "Swift" },
      { value: "kotlin", label: "Kotlin" },
      { value: "scala", label: "Scala" },
      { value: "r", label: "R" },
      { value: "dart", label: "Dart" },
      { value: "elixir", label: "Elixir" },
      { value: "haskell", label: "Haskell" },
      { value: "lua", label: "Lua" },
      { value: "perl", label: "Perl" },
      // Frontend Frameworks
      { value: "react", label: "React" },
      { value: "nextjs", label: "Next.js" },
      { value: "vue", label: "Vue.js" },
      { value: "nuxt", label: "Nuxt" },
      { value: "angular", label: "Angular" },
      { value: "svelte", label: "Svelte" },
      { value: "sveltekit", label: "SvelteKit" },
      { value: "solid", label: "Solid.js" },
      { value: "astro", label: "Astro" },
      { value: "remix", label: "Remix" },
      { value: "gatsby", label: "Gatsby" },
      { value: "qwik", label: "Qwik" },
      // Backend Frameworks
      { value: "express", label: "Express.js" },
      { value: "fastify", label: "Fastify" },
      { value: "nestjs", label: "NestJS" },
      { value: "hono", label: "Hono" },
      { value: "django", label: "Django" },
      { value: "flask", label: "Flask" },
      { value: "fastapi", label: "FastAPI" },
      { value: "spring", label: "Spring Boot" },
      { value: "dotnet", label: ".NET" },
      { value: "rails", label: "Ruby on Rails" },
      { value: "laravel", label: "Laravel" },
      { value: "phoenix", label: "Phoenix" },
      { value: "gin", label: "Gin" },
      { value: "fiber", label: "Fiber" },
      { value: "actix", label: "Actix" },
      // Mobile
      { value: "reactnative", label: "React Native" },
      { value: "flutter", label: "Flutter" },
      { value: "swiftui", label: "SwiftUI" },
      { value: "jetpackcompose", label: "Jetpack Compose" },
      { value: "ionic", label: "Ionic" },
      { value: "capacitor", label: "Capacitor" },
      { value: "expo", label: "Expo" },
      // Databases
      { value: "postgresql", label: "PostgreSQL" },
      { value: "mysql", label: "MySQL" },
      { value: "mongodb", label: "MongoDB" },
      { value: "redis", label: "Redis" },
      { value: "sqlite", label: "SQLite" },
      { value: "supabase", label: "Supabase" },
      { value: "firebase", label: "Firebase" },
      { value: "prisma", label: "Prisma" },
      { value: "drizzle", label: "Drizzle ORM" },
      { value: "dynamodb", label: "DynamoDB" },
      { value: "cassandra", label: "Cassandra" },
      { value: "elasticsearch", label: "Elasticsearch" },
      { value: "neo4j", label: "Neo4j" },
      // Cloud & DevOps
      { value: "aws", label: "AWS" },
      { value: "gcp", label: "Google Cloud" },
      { value: "azure", label: "Azure" },
      { value: "vercel", label: "Vercel" },
      { value: "netlify", label: "Netlify" },
      { value: "cloudflare", label: "Cloudflare" },
      { value: "docker", label: "Docker" },
      { value: "kubernetes", label: "Kubernetes" },
      { value: "terraform", label: "Terraform" },
      { value: "github-actions", label: "GitHub Actions" },
      { value: "jenkins", label: "Jenkins" },
      { value: "circleci", label: "CircleCI" },
      // AI/ML
      { value: "tensorflow", label: "TensorFlow" },
      { value: "pytorch", label: "PyTorch" },
      { value: "scikit-learn", label: "Scikit-learn" },
      { value: "keras", label: "Keras" },
      { value: "huggingface", label: "Hugging Face" },
      { value: "langchain", label: "LangChain" },
      { value: "openai", label: "OpenAI API" },
      { value: "anthropic", label: "Anthropic API" },
      // Testing
      { value: "jest", label: "Jest" },
      { value: "vitest", label: "Vitest" },
      { value: "cypress", label: "Cypress" },
      { value: "playwright", label: "Playwright" },
      { value: "pytest", label: "Pytest" },
      { value: "junit", label: "JUnit" },
      // Other
      { value: "graphql", label: "GraphQL" },
      { value: "trpc", label: "tRPC" },
      { value: "websocket", label: "WebSocket" },
      { value: "grpc", label: "gRPC" },
      { value: "rabbitmq", label: "RabbitMQ" },
      { value: "kafka", label: "Kafka" },
      { value: "tailwindcss", label: "Tailwind CSS" },
      { value: "shadcn", label: "shadcn/ui" },
      { value: "materialui", label: "Material UI" },
      { value: "chakra", label: "Chakra UI" },
    ],
  },
  {
    id: "features",
    label: "Key Features",
    type: "textarea",
    placeholder: "List the main features of your project (one per line)...",
    maxLength: 2000,
    isCommon: true,
    description: "Highlight the core functionality and capabilities",
  },
  {
    id: "challenges",
    label: "Challenges & Solutions",
    type: "textarea",
    placeholder: "Describe technical challenges you faced and how you solved them...",
    maxLength: 3000,
    isCommon: true,
    description: "Showcase your problem-solving skills and engineering decisions",
  },
  {
    id: "targetAudience",
    label: "Target Audience",
    type: "text",
    placeholder: "Who is this project built for?",
    maxLength: 200,
    isCommon: true,
    description: "Describe the intended users or use cases",
  },
];

/**
 * IDs of common fields for quick-add buttons in empty state
 */
export const COMMON_QUICK_ADD_FIELDS = ["techStack", "features", "challenges", "targetAudience"];

/**
 * Category-specific field definitions
 * Each category has its own set of specialized fields
 */
const WEB_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "browserSupport",
    label: "Browser Support",
    type: "multi-select",
    isCommon: false,
    description: "Which browsers are supported",
    options: [
      { value: "chrome", label: "Chrome" },
      { value: "firefox", label: "Firefox" },
      { value: "safari", label: "Safari" },
      { value: "edge", label: "Edge" },
      { value: "opera", label: "Opera" },
      { value: "ie11", label: "IE 11" },
    ],
  },
  {
    id: "performanceMetrics",
    label: "Performance Metrics",
    type: "textarea",
    placeholder: "Lighthouse scores, load times, bundle size...",
    maxLength: 1000,
    isCommon: false,
    description: "Key performance indicators and optimizations",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    type: "text",
    placeholder: "WCAG compliance level, a11y features...",
    maxLength: 500,
    isCommon: false,
    description: "Accessibility standards and features implemented",
  },
  {
    id: "seoFeatures",
    label: "SEO Features",
    type: "textarea",
    placeholder: "SSR, meta tags, structured data...",
    maxLength: 1000,
    isCommon: false,
    description: "Search engine optimization implementations",
  },
];

const MOBILE_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "platforms",
    label: "Platforms",
    type: "multi-select",
    isCommon: false,
    description: "Target mobile platforms",
    options: [
      { value: "ios", label: "iOS" },
      { value: "android", label: "Android" },
      { value: "web", label: "Web (PWA)" },
    ],
  },
  {
    id: "minOsVersion",
    label: "Minimum OS Version",
    type: "text",
    placeholder: "iOS 14+, Android 8+...",
    maxLength: 100,
    isCommon: false,
    description: "Minimum supported OS versions",
  },
  {
    id: "appStoreUrl",
    label: "App Store URL",
    type: "url",
    placeholder: "https://apps.apple.com/...",
    isCommon: false,
    description: "Link to App Store listing",
  },
  {
    id: "playStoreUrl",
    label: "Play Store URL",
    type: "url",
    placeholder: "https://play.google.com/...",
    isCommon: false,
    description: "Link to Google Play listing",
  },
  {
    id: "appPermissions",
    label: "App Permissions",
    type: "textarea",
    placeholder: "Camera, location, notifications...",
    maxLength: 500,
    isCommon: false,
    description: "Required device permissions and why",
  },
];

const DESKTOP_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "operatingSystems",
    label: "Operating Systems",
    type: "multi-select",
    isCommon: false,
    description: "Supported desktop operating systems",
    options: [
      { value: "windows", label: "Windows" },
      { value: "macos", label: "macOS" },
      { value: "linux", label: "Linux" },
    ],
  },
  {
    id: "systemRequirements",
    label: "System Requirements",
    type: "textarea",
    placeholder: "RAM, CPU, disk space...",
    maxLength: 1000,
    isCommon: false,
    description: "Minimum and recommended system specs",
  },
  {
    id: "installerType",
    label: "Installer Type",
    type: "select",
    isCommon: false,
    description: "How the application is distributed",
    options: [
      { value: "msi", label: "MSI (Windows)" },
      { value: "exe", label: "EXE (Windows)" },
      { value: "dmg", label: "DMG (macOS)" },
      { value: "pkg", label: "PKG (macOS)" },
      { value: "appimage", label: "AppImage (Linux)" },
      { value: "deb", label: "DEB (Debian/Ubuntu)" },
      { value: "rpm", label: "RPM (Fedora/RHEL)" },
      { value: "snap", label: "Snap" },
      { value: "flatpak", label: "Flatpak" },
      { value: "portable", label: "Portable" },
    ],
  },
];

const BACKEND_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "apiType",
    label: "API Type",
    type: "select",
    isCommon: false,
    description: "Primary API architecture",
    options: [
      { value: "rest", label: "REST" },
      { value: "graphql", label: "GraphQL" },
      { value: "grpc", label: "gRPC" },
      { value: "websocket", label: "WebSocket" },
      { value: "trpc", label: "tRPC" },
      { value: "soap", label: "SOAP" },
    ],
  },
  {
    id: "authentication",
    label: "Authentication",
    type: "multi-select",
    isCommon: false,
    description: "Authentication methods implemented",
    options: [
      { value: "jwt", label: "JWT" },
      { value: "oauth2", label: "OAuth 2.0" },
      { value: "session", label: "Session-based" },
      { value: "apikey", label: "API Key" },
      { value: "basic", label: "Basic Auth" },
      { value: "saml", label: "SAML" },
      { value: "oidc", label: "OpenID Connect" },
    ],
  },
  {
    id: "scalability",
    label: "Scalability",
    type: "textarea",
    placeholder: "Load balancing, caching, horizontal scaling...",
    maxLength: 1000,
    isCommon: false,
    description: "How the system handles scale",
  },
  {
    id: "apiDocumentation",
    label: "API Documentation URL",
    type: "url",
    placeholder: "https://docs.example.com/api",
    isCommon: false,
    description: "Link to API docs (Swagger, Postman, etc.)",
  },
];

const CLOUD_DEVOPS_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "cloudProvider",
    label: "Cloud Provider",
    type: "multi-select",
    isCommon: false,
    description: "Cloud platforms used",
    options: [
      { value: "aws", label: "AWS" },
      { value: "gcp", label: "Google Cloud" },
      { value: "azure", label: "Azure" },
      { value: "digitalocean", label: "DigitalOcean" },
      { value: "linode", label: "Linode" },
      { value: "vultr", label: "Vultr" },
      { value: "heroku", label: "Heroku" },
      { value: "vercel", label: "Vercel" },
      { value: "netlify", label: "Netlify" },
      { value: "cloudflare", label: "Cloudflare" },
    ],
  },
  {
    id: "infrastructureAsCode",
    label: "Infrastructure as Code",
    type: "multi-select",
    isCommon: false,
    description: "IaC tools used",
    options: [
      { value: "terraform", label: "Terraform" },
      { value: "pulumi", label: "Pulumi" },
      { value: "cloudformation", label: "CloudFormation" },
      { value: "cdk", label: "AWS CDK" },
      { value: "ansible", label: "Ansible" },
      { value: "chef", label: "Chef" },
      { value: "puppet", label: "Puppet" },
    ],
  },
  {
    id: "cicdPipeline",
    label: "CI/CD Pipeline",
    type: "textarea",
    placeholder: "Describe your build, test, and deploy workflow...",
    maxLength: 1500,
    isCommon: false,
    description: "Continuous integration and deployment setup",
  },
  {
    id: "monitoring",
    label: "Monitoring & Observability",
    type: "multi-select",
    isCommon: false,
    description: "Monitoring tools and practices",
    options: [
      { value: "prometheus", label: "Prometheus" },
      { value: "grafana", label: "Grafana" },
      { value: "datadog", label: "Datadog" },
      { value: "newrelic", label: "New Relic" },
      { value: "cloudwatch", label: "CloudWatch" },
      { value: "elk", label: "ELK Stack" },
      { value: "sentry", label: "Sentry" },
      { value: "pagerduty", label: "PagerDuty" },
    ],
  },
];

const DATA_ENGINEERING_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "dataVolume",
    label: "Data Volume",
    type: "text",
    placeholder: "10TB daily, 1M records/hour...",
    maxLength: 200,
    isCommon: false,
    description: "Scale of data processed",
  },
  {
    id: "pipelineType",
    label: "Pipeline Type",
    type: "select",
    isCommon: false,
    description: "Data processing paradigm",
    options: [
      { value: "batch", label: "Batch Processing" },
      { value: "streaming", label: "Stream Processing" },
      { value: "hybrid", label: "Lambda Architecture" },
      { value: "kappa", label: "Kappa Architecture" },
    ],
  },
  {
    id: "dataWarehouse",
    label: "Data Warehouse",
    type: "select",
    isCommon: false,
    description: "Primary data warehouse solution",
    options: [
      { value: "snowflake", label: "Snowflake" },
      { value: "bigquery", label: "BigQuery" },
      { value: "redshift", label: "Redshift" },
      { value: "databricks", label: "Databricks" },
      { value: "synapse", label: "Azure Synapse" },
      { value: "duckdb", label: "DuckDB" },
    ],
  },
  {
    id: "orchestration",
    label: "Orchestration",
    type: "select",
    isCommon: false,
    description: "Workflow orchestration tool",
    options: [
      { value: "airflow", label: "Apache Airflow" },
      { value: "dagster", label: "Dagster" },
      { value: "prefect", label: "Prefect" },
      { value: "luigi", label: "Luigi" },
      { value: "mage", label: "Mage" },
      { value: "temporal", label: "Temporal" },
    ],
  },
];

const AI_ML_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "modelType",
    label: "Model Type",
    type: "select",
    isCommon: false,
    description: "Type of ML model",
    options: [
      { value: "classification", label: "Classification" },
      { value: "regression", label: "Regression" },
      { value: "clustering", label: "Clustering" },
      { value: "nlp", label: "NLP" },
      { value: "computer-vision", label: "Computer Vision" },
      { value: "reinforcement", label: "Reinforcement Learning" },
      { value: "generative", label: "Generative AI" },
      { value: "recommendation", label: "Recommendation System" },
      { value: "time-series", label: "Time Series" },
    ],
  },
  {
    id: "modelArchitecture",
    label: "Model Architecture",
    type: "text",
    placeholder: "Transformer, CNN, LSTM, GPT-4...",
    maxLength: 200,
    isCommon: false,
    description: "Neural network or algorithm architecture",
  },
  {
    id: "trainingDataSize",
    label: "Training Data Size",
    type: "text",
    placeholder: "100K samples, 5GB images...",
    maxLength: 100,
    isCommon: false,
    description: "Scale of training dataset",
  },
  {
    id: "accuracy",
    label: "Accuracy / Metrics",
    type: "text",
    placeholder: "95% accuracy, F1: 0.92, BLEU: 45...",
    maxLength: 200,
    isCommon: false,
    description: "Key performance metrics achieved",
  },
  {
    id: "inferenceLatency",
    label: "Inference Latency",
    type: "text",
    placeholder: "50ms average, <100ms p99...",
    maxLength: 100,
    isCommon: false,
    description: "Model response time in production",
  },
  {
    id: "deployment",
    label: "Deployment Strategy",
    type: "select",
    isCommon: false,
    description: "How the model is deployed",
    options: [
      { value: "api", label: "REST API" },
      { value: "serverless", label: "Serverless Function" },
      { value: "edge", label: "Edge Deployment" },
      { value: "batch", label: "Batch Inference" },
      { value: "streaming", label: "Streaming Inference" },
      { value: "embedded", label: "Embedded/On-device" },
    ],
  },
];

const DEV_TOOLS_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "toolType",
    label: "Tool Type",
    type: "select",
    isCommon: false,
    description: "Category of developer tool",
    options: [
      { value: "cli", label: "CLI Tool" },
      { value: "library", label: "Library/SDK" },
      { value: "plugin", label: "IDE Plugin/Extension" },
      { value: "linter", label: "Linter/Formatter" },
      { value: "bundler", label: "Bundler/Build Tool" },
      { value: "debugger", label: "Debugger/Profiler" },
      { value: "generator", label: "Code Generator" },
      { value: "documentation", label: "Documentation Tool" },
    ],
  },
  {
    id: "packageManager",
    label: "Package Registry",
    type: "select",
    isCommon: false,
    description: "Where the tool is published",
    options: [
      { value: "npm", label: "npm" },
      { value: "pypi", label: "PyPI" },
      { value: "crates", label: "crates.io" },
      { value: "maven", label: "Maven Central" },
      { value: "nuget", label: "NuGet" },
      { value: "rubygems", label: "RubyGems" },
      { value: "homebrew", label: "Homebrew" },
      { value: "apt", label: "APT" },
    ],
  },
  {
    id: "installCommand",
    label: "Install Command",
    type: "text",
    placeholder: "npm install -g your-tool",
    maxLength: 200,
    isCommon: false,
    description: "Quick install command for users",
  },
  {
    id: "weeklyDownloads",
    label: "Weekly Downloads",
    type: "number",
    placeholder: "10000",
    isCommon: false,
    description: "Approximate weekly download count",
  },
];

const INTEGRATION_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "integrationType",
    label: "Integration Type",
    type: "select",
    isCommon: false,
    description: "Type of integration",
    options: [
      { value: "api", label: "API Integration" },
      { value: "webhook", label: "Webhook" },
      { value: "plugin", label: "Platform Plugin" },
      { value: "middleware", label: "Middleware" },
      { value: "connector", label: "Data Connector" },
      { value: "bridge", label: "Service Bridge" },
    ],
  },
  {
    id: "connectedServices",
    label: "Connected Services",
    type: "textarea",
    placeholder: "Slack, GitHub, Jira, Salesforce...",
    maxLength: 500,
    isCommon: false,
    description: "Third-party services this integrates with",
  },
  {
    id: "dataFlow",
    label: "Data Flow",
    type: "select",
    isCommon: false,
    description: "Direction of data transfer",
    options: [
      { value: "unidirectional", label: "Unidirectional" },
      { value: "bidirectional", label: "Bidirectional" },
      { value: "realtime", label: "Real-time Sync" },
      { value: "scheduled", label: "Scheduled Sync" },
    ],
  },
];

const EMBEDDED_IOT_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "hardware",
    label: "Hardware Platform",
    type: "multi-select",
    isCommon: false,
    description: "Target hardware platforms",
    options: [
      { value: "raspberrypi", label: "Raspberry Pi" },
      { value: "arduino", label: "Arduino" },
      { value: "esp32", label: "ESP32" },
      { value: "esp8266", label: "ESP8266" },
      { value: "stm32", label: "STM32" },
      { value: "nrf52", label: "nRF52" },
      { value: "jetson", label: "NVIDIA Jetson" },
      { value: "beaglebone", label: "BeagleBone" },
    ],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    type: "multi-select",
    isCommon: false,
    description: "Communication protocols used",
    options: [
      { value: "wifi", label: "WiFi" },
      { value: "bluetooth", label: "Bluetooth" },
      { value: "ble", label: "BLE" },
      { value: "zigbee", label: "Zigbee" },
      { value: "zwave", label: "Z-Wave" },
      { value: "lora", label: "LoRa" },
      { value: "mqtt", label: "MQTT" },
      { value: "cellular", label: "Cellular (LTE/5G)" },
      { value: "thread", label: "Thread" },
      { value: "matter", label: "Matter" },
    ],
  },
  {
    id: "sensors",
    label: "Sensors/Actuators",
    type: "textarea",
    placeholder: "Temperature, motion, relay, motor...",
    maxLength: 500,
    isCommon: false,
    description: "Physical components used",
  },
  {
    id: "powerConsumption",
    label: "Power Consumption",
    type: "text",
    placeholder: "Battery life, mA usage...",
    maxLength: 200,
    isCommon: false,
    description: "Power requirements and efficiency",
  },
];

const GAMING_GRAPHICS_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "engine",
    label: "Game Engine",
    type: "select",
    isCommon: false,
    description: "Game engine or graphics framework",
    options: [
      { value: "unity", label: "Unity" },
      { value: "unreal", label: "Unreal Engine" },
      { value: "godot", label: "Godot" },
      { value: "phaser", label: "Phaser" },
      { value: "threejs", label: "Three.js" },
      { value: "babylonjs", label: "Babylon.js" },
      { value: "pixi", label: "PixiJS" },
      { value: "raylib", label: "raylib" },
      { value: "sdl", label: "SDL" },
      { value: "custom", label: "Custom Engine" },
    ],
  },
  {
    id: "gamePlatforms",
    label: "Target Platforms",
    type: "multi-select",
    isCommon: false,
    description: "Platforms the game runs on",
    options: [
      { value: "pc", label: "PC (Windows)" },
      { value: "mac", label: "Mac" },
      { value: "linux", label: "Linux" },
      { value: "ps5", label: "PlayStation 5" },
      { value: "xbox", label: "Xbox" },
      { value: "switch", label: "Nintendo Switch" },
      { value: "ios", label: "iOS" },
      { value: "android", label: "Android" },
      { value: "web", label: "Web Browser" },
      { value: "vr", label: "VR Headsets" },
    ],
  },
  {
    id: "genre",
    label: "Genre",
    type: "select",
    isCommon: false,
    description: "Game genre",
    options: [
      { value: "action", label: "Action" },
      { value: "adventure", label: "Adventure" },
      { value: "rpg", label: "RPG" },
      { value: "strategy", label: "Strategy" },
      { value: "puzzle", label: "Puzzle" },
      { value: "simulation", label: "Simulation" },
      { value: "sports", label: "Sports" },
      { value: "racing", label: "Racing" },
      { value: "fps", label: "FPS" },
      { value: "platformer", label: "Platformer" },
      { value: "roguelike", label: "Roguelike" },
      { value: "sandbox", label: "Sandbox" },
    ],
  },
  {
    id: "graphicsApi",
    label: "Graphics API",
    type: "multi-select",
    isCommon: false,
    description: "Low-level graphics APIs used",
    options: [
      { value: "opengl", label: "OpenGL" },
      { value: "vulkan", label: "Vulkan" },
      { value: "directx", label: "DirectX" },
      { value: "metal", label: "Metal" },
      { value: "webgl", label: "WebGL" },
      { value: "webgpu", label: "WebGPU" },
    ],
  },
];

const SECURITY_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "securityType",
    label: "Security Focus",
    type: "select",
    isCommon: false,
    description: "Primary security domain",
    options: [
      { value: "appsec", label: "Application Security" },
      { value: "pentest", label: "Penetration Testing" },
      { value: "forensics", label: "Digital Forensics" },
      { value: "cryptography", label: "Cryptography" },
      { value: "network", label: "Network Security" },
      { value: "cloud", label: "Cloud Security" },
      { value: "devsecops", label: "DevSecOps" },
      { value: "iam", label: "Identity & Access" },
      { value: "siem", label: "SIEM/Monitoring" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance Standards",
    type: "multi-select",
    isCommon: false,
    description: "Security standards addressed",
    options: [
      { value: "owasp", label: "OWASP Top 10" },
      { value: "pci", label: "PCI DSS" },
      { value: "hipaa", label: "HIPAA" },
      { value: "gdpr", label: "GDPR" },
      { value: "soc2", label: "SOC 2" },
      { value: "iso27001", label: "ISO 27001" },
      { value: "nist", label: "NIST" },
      { value: "cis", label: "CIS Benchmarks" },
    ],
  },
  {
    id: "vulnerabilityTypes",
    label: "Vulnerability Types",
    type: "textarea",
    placeholder: "SQLi, XSS, CSRF, RCE...",
    maxLength: 500,
    isCommon: false,
    description: "Types of vulnerabilities detected/prevented",
  },
];

const BLOCKCHAIN_WEB3_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "blockchain",
    label: "Blockchain Network",
    type: "multi-select",
    isCommon: false,
    description: "Target blockchain networks",
    options: [
      { value: "ethereum", label: "Ethereum" },
      { value: "polygon", label: "Polygon" },
      { value: "solana", label: "Solana" },
      { value: "avalanche", label: "Avalanche" },
      { value: "arbitrum", label: "Arbitrum" },
      { value: "optimism", label: "Optimism" },
      { value: "base", label: "Base" },
      { value: "bnb", label: "BNB Chain" },
      { value: "bitcoin", label: "Bitcoin" },
      { value: "cosmos", label: "Cosmos" },
      { value: "near", label: "NEAR" },
      { value: "sui", label: "Sui" },
    ],
  },
  {
    id: "contractLanguage",
    label: "Smart Contract Language",
    type: "select",
    isCommon: false,
    description: "Language used for smart contracts",
    options: [
      { value: "solidity", label: "Solidity" },
      { value: "vyper", label: "Vyper" },
      { value: "rust", label: "Rust (Solana/Near)" },
      { value: "move", label: "Move (Sui/Aptos)" },
      { value: "cairo", label: "Cairo (StarkNet)" },
    ],
  },
  {
    id: "web3Type",
    label: "Project Type",
    type: "select",
    isCommon: false,
    description: "Type of Web3 project",
    options: [
      { value: "defi", label: "DeFi" },
      { value: "nft", label: "NFT" },
      { value: "dao", label: "DAO" },
      { value: "dex", label: "DEX" },
      { value: "bridge", label: "Bridge" },
      { value: "wallet", label: "Wallet" },
      { value: "oracle", label: "Oracle" },
      { value: "gaming", label: "GameFi" },
      { value: "social", label: "SocialFi" },
    ],
  },
  {
    id: "auditStatus",
    label: "Audit Status",
    type: "select",
    isCommon: false,
    description: "Smart contract audit status",
    options: [
      { value: "audited", label: "Audited" },
      { value: "pending", label: "Pending Audit" },
      { value: "unaudited", label: "Not Audited" },
      { value: "internal", label: "Internal Review Only" },
    ],
  },
];

const AR_VR_XR_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "xrType",
    label: "XR Type",
    type: "select",
    isCommon: false,
    description: "Type of extended reality",
    options: [
      { value: "ar", label: "Augmented Reality (AR)" },
      { value: "vr", label: "Virtual Reality (VR)" },
      { value: "mr", label: "Mixed Reality (MR)" },
      { value: "xr", label: "Cross-Reality (XR)" },
    ],
  },
  {
    id: "xrPlatform",
    label: "XR Platform",
    type: "multi-select",
    isCommon: false,
    description: "Target XR devices/platforms",
    options: [
      { value: "quest", label: "Meta Quest" },
      { value: "vision-pro", label: "Apple Vision Pro" },
      { value: "pico", label: "Pico" },
      { value: "vive", label: "HTC Vive" },
      { value: "index", label: "Valve Index" },
      { value: "hololens", label: "HoloLens" },
      { value: "arkit", label: "ARKit (iOS)" },
      { value: "arcore", label: "ARCore (Android)" },
      { value: "webxr", label: "WebXR" },
    ],
  },
  {
    id: "trackingType",
    label: "Tracking",
    type: "multi-select",
    isCommon: false,
    description: "Tracking technologies used",
    options: [
      { value: "hand", label: "Hand Tracking" },
      { value: "eye", label: "Eye Tracking" },
      { value: "body", label: "Full Body" },
      { value: "face", label: "Face Tracking" },
      { value: "spatial", label: "Spatial Anchors" },
      { value: "marker", label: "Marker-based" },
      { value: "markerless", label: "Markerless" },
    ],
  },
];

const MULTIMEDIA_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "mediaType",
    label: "Media Type",
    type: "multi-select",
    isCommon: false,
    description: "Types of media handled",
    options: [
      { value: "video", label: "Video" },
      { value: "audio", label: "Audio" },
      { value: "image", label: "Image" },
      { value: "live", label: "Live Streaming" },
      { value: "podcast", label: "Podcast" },
    ],
  },
  {
    id: "codecs",
    label: "Codecs/Formats",
    type: "text",
    placeholder: "H.264, VP9, AAC, MP3...",
    maxLength: 200,
    isCommon: false,
    description: "Supported codecs and formats",
  },
  {
    id: "streamingProtocol",
    label: "Streaming Protocol",
    type: "multi-select",
    isCommon: false,
    description: "Streaming protocols used",
    options: [
      { value: "hls", label: "HLS" },
      { value: "dash", label: "DASH" },
      { value: "rtmp", label: "RTMP" },
      { value: "webrtc", label: "WebRTC" },
      { value: "srt", label: "SRT" },
      { value: "rtp", label: "RTP" },
    ],
  },
  {
    id: "maxResolution",
    label: "Max Resolution",
    type: "select",
    isCommon: false,
    description: "Maximum supported resolution",
    options: [
      { value: "480p", label: "480p (SD)" },
      { value: "720p", label: "720p (HD)" },
      { value: "1080p", label: "1080p (Full HD)" },
      { value: "4k", label: "4K (UHD)" },
      { value: "8k", label: "8K" },
    ],
  },
];

const AUTOMATION_SCRIPTING_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "automationType",
    label: "Automation Type",
    type: "select",
    isCommon: false,
    description: "Type of automation",
    options: [
      { value: "workflow", label: "Workflow Automation" },
      { value: "rpa", label: "RPA (Robotic Process)" },
      { value: "web-scraping", label: "Web Scraping" },
      { value: "task", label: "Task Scheduling" },
      { value: "ci-cd", label: "CI/CD Automation" },
      { value: "testing", label: "Test Automation" },
      { value: "deployment", label: "Deployment Automation" },
    ],
  },
  {
    id: "triggerType",
    label: "Trigger Type",
    type: "multi-select",
    isCommon: false,
    description: "What triggers the automation",
    options: [
      { value: "scheduled", label: "Scheduled (Cron)" },
      { value: "event", label: "Event-driven" },
      { value: "webhook", label: "Webhook" },
      { value: "manual", label: "Manual Trigger" },
      { value: "file", label: "File Change" },
      { value: "api", label: "API Call" },
    ],
  },
  {
    id: "executionTime",
    label: "Typical Execution Time",
    type: "text",
    placeholder: "30 seconds, 5 minutes...",
    maxLength: 100,
    isCommon: false,
    description: "Average time to complete",
  },
];

const DATABASE_STORAGE_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "databaseType",
    label: "Database Type",
    type: "select",
    isCommon: false,
    description: "Type of database system",
    options: [
      { value: "relational", label: "Relational (SQL)" },
      { value: "document", label: "Document Store" },
      { value: "keyvalue", label: "Key-Value" },
      { value: "graph", label: "Graph Database" },
      { value: "timeseries", label: "Time Series" },
      { value: "vector", label: "Vector Database" },
      { value: "search", label: "Search Engine" },
      { value: "columnar", label: "Columnar" },
    ],
  },
  {
    id: "storageCapacity",
    label: "Storage Capacity",
    type: "text",
    placeholder: "10TB, unlimited...",
    maxLength: 100,
    isCommon: false,
    description: "Maximum storage capacity",
  },
  {
    id: "replication",
    label: "Replication",
    type: "select",
    isCommon: false,
    description: "Data replication strategy",
    options: [
      { value: "none", label: "None" },
      { value: "master-slave", label: "Primary-Replica" },
      { value: "multi-master", label: "Multi-Primary" },
      { value: "sharded", label: "Sharded" },
      { value: "distributed", label: "Distributed" },
    ],
  },
  {
    id: "backupStrategy",
    label: "Backup Strategy",
    type: "textarea",
    placeholder: "Daily snapshots, point-in-time recovery...",
    maxLength: 500,
    isCommon: false,
    description: "Backup and recovery approach",
  },
];

const TESTING_QA_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "testingType",
    label: "Testing Type",
    type: "multi-select",
    isCommon: false,
    description: "Types of testing implemented",
    options: [
      { value: "unit", label: "Unit Testing" },
      { value: "integration", label: "Integration Testing" },
      { value: "e2e", label: "End-to-End Testing" },
      { value: "visual", label: "Visual Regression" },
      { value: "performance", label: "Performance Testing" },
      { value: "security", label: "Security Testing" },
      { value: "accessibility", label: "Accessibility Testing" },
      { value: "api", label: "API Testing" },
      { value: "mobile", label: "Mobile Testing" },
    ],
  },
  {
    id: "testCoverage",
    label: "Test Coverage",
    type: "text",
    placeholder: "85% line coverage...",
    maxLength: 100,
    isCommon: false,
    description: "Code coverage percentage",
  },
  {
    id: "testFramework",
    label: "Test Framework",
    type: "multi-select",
    isCommon: false,
    description: "Testing frameworks used",
    options: [
      { value: "jest", label: "Jest" },
      { value: "vitest", label: "Vitest" },
      { value: "cypress", label: "Cypress" },
      { value: "playwright", label: "Playwright" },
      { value: "selenium", label: "Selenium" },
      { value: "pytest", label: "Pytest" },
      { value: "junit", label: "JUnit" },
      { value: "testng", label: "TestNG" },
      { value: "mocha", label: "Mocha" },
      { value: "rspec", label: "RSpec" },
    ],
  },
  {
    id: "ciIntegration",
    label: "CI Integration",
    type: "textarea",
    placeholder: "Runs on every PR, nightly builds...",
    maxLength: 500,
    isCommon: false,
    description: "How tests integrate with CI/CD",
  },
];

const OTHER_FIELDS: CategoryFieldDefinition[] = [
  {
    id: "projectPurpose",
    label: "Project Purpose",
    type: "textarea",
    placeholder: "Describe what this project is for...",
    maxLength: 1000,
    isCommon: false,
    description: "Main purpose and goals of this project",
  },
  {
    id: "learningOutcomes",
    label: "Learning Outcomes",
    type: "textarea",
    placeholder: "What skills or knowledge does this demonstrate?",
    maxLength: 1000,
    isCommon: false,
    description: "Skills and concepts learned/demonstrated",
  },
];

/**
 * Complete mapping of categories to their available fields
 * Each category gets common fields + category-specific fields
 */
export const CATEGORY_FIELDS: Record<ProjectCategory, CategoryFieldDefinition[]> = {
  web: [...COMMON_FIELDS, ...WEB_FIELDS],
  mobile: [...COMMON_FIELDS, ...MOBILE_FIELDS],
  desktop: [...COMMON_FIELDS, ...DESKTOP_FIELDS],
  backend: [...COMMON_FIELDS, ...BACKEND_FIELDS],
  "cloud-devops": [...COMMON_FIELDS, ...CLOUD_DEVOPS_FIELDS],
  "data-engineering": [...COMMON_FIELDS, ...DATA_ENGINEERING_FIELDS],
  "ai-ml": [...COMMON_FIELDS, ...AI_ML_FIELDS],
  "dev-tools": [...COMMON_FIELDS, ...DEV_TOOLS_FIELDS],
  integration: [...COMMON_FIELDS, ...INTEGRATION_FIELDS],
  "embedded-iot": [...COMMON_FIELDS, ...EMBEDDED_IOT_FIELDS],
  "gaming-graphics": [...COMMON_FIELDS, ...GAMING_GRAPHICS_FIELDS],
  security: [...COMMON_FIELDS, ...SECURITY_FIELDS],
  "blockchain-web3": [...COMMON_FIELDS, ...BLOCKCHAIN_WEB3_FIELDS],
  "ar-vr-xr": [...COMMON_FIELDS, ...AR_VR_XR_FIELDS],
  multimedia: [...COMMON_FIELDS, ...MULTIMEDIA_FIELDS],
  "automation-scripting": [...COMMON_FIELDS, ...AUTOMATION_SCRIPTING_FIELDS],
  "database-storage": [...COMMON_FIELDS, ...DATABASE_STORAGE_FIELDS],
  "testing-qa": [...COMMON_FIELDS, ...TESTING_QA_FIELDS],
  other: [...COMMON_FIELDS, ...OTHER_FIELDS],
};

/**
 * Get fields for a specific category
 */
export function getCategoryFields(category: ProjectCategory): CategoryFieldDefinition[] {
  return CATEGORY_FIELDS[category] || CATEGORY_FIELDS.other;
}

/**
 * Get only common fields
 */
export function getCommonFields(): CategoryFieldDefinition[] {
  return COMMON_FIELDS;
}

/**
 * Get category-specific fields (excludes common fields)
 */
export function getCategorySpecificFields(category: ProjectCategory): CategoryFieldDefinition[] {
  const allFields = CATEGORY_FIELDS[category] || CATEGORY_FIELDS.other;
  return allFields.filter((field) => !field.isCommon);
}

/**
 * Check if a field is common across categories
 */
export function isCommonField(fieldId: string): boolean {
  return COMMON_FIELDS.some((field) => field.id === fieldId);
}

/**
 * Get field definition by ID within a category
 */
export function getFieldById(
  category: ProjectCategory,
  fieldId: string
): CategoryFieldDefinition | undefined {
  const fields = getCategoryFields(category);
  return fields.find((field) => field.id === fieldId);
}
