"use client";

import * as React from "react";
import { useState } from "react";
import { Github, Loader2, Sparkles, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface GitHubTechImportProps {
  /** Current selected tech stack values */
  currentValues: string[];
  /** Callback when tech stack is updated */
  onImport: (newValues: string[]) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Optional className for the trigger button */
  className?: string;
}

interface AnalyzeResult {
  techStack: string[];
  repository: {
    owner: string;
    repo: string;
    url: string;
    fileCount: number;
  };
  detectedCount: number;
}

/**
 * Comprehensive map of tech stack values to their display labels
 * Covers 300+ technologies across all categories
 */
const TECH_LABELS: Record<string, string> = {
  // Programming Languages
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  csharp: "C#",
  cpp: "C++",
  c: "C",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  scala: "Scala",
  r: "R",
  dart: "Dart",
  elixir: "Elixir",
  haskell: "Haskell",
  lua: "Lua",
  perl: "Perl",
  clojure: "Clojure",
  fsharp: "F#",
  groovy: "Groovy",
  julia: "Julia",
  nim: "Nim",
  crystal: "Crystal",
  zig: "Zig",
  ocaml: "OCaml",
  erlang: "Erlang",
  cobol: "COBOL",
  fortran: "Fortran",
  assembly: "Assembly",
  objectivec: "Objective-C",
  solidity: "Solidity",
  vyper: "Vyper",

  // Frontend Frameworks
  react: "React",
  nextjs: "Next.js",
  vue: "Vue.js",
  nuxt: "Nuxt",
  angular: "Angular",
  svelte: "Svelte",
  sveltekit: "SvelteKit",
  solid: "Solid.js",
  astro: "Astro",
  remix: "Remix",
  gatsby: "Gatsby",
  qwik: "Qwik",
  preact: "Preact",
  alpinejs: "Alpine.js",
  lit: "Lit",
  stencil: "Stencil",
  ember: "Ember.js",
  backbone: "Backbone.js",
  mithril: "Mithril",
  marko: "Marko",
  riot: "Riot.js",
  inferno: "Inferno",
  hyperapp: "Hyperapp",
  htmx: "HTMX",
  petite: "Petite Vue",
  million: "Million.js",

  // CSS & Styling
  tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap",
  materialui: "Material UI",
  chakra: "Chakra UI",
  antdesign: "Ant Design",
  shadcn: "shadcn/ui",
  daisyui: "DaisyUI",
  bulma: "Bulma",
  foundation: "Foundation",
  semantic: "Semantic UI",
  unocss: "UnoCSS",
  windicss: "Windi CSS",
  twind: "Twind",
  emotion: "Emotion",
  styledcomponents: "styled-components",
  stitches: "Stitches",
  vanilla: "Vanilla Extract",
  linaria: "Linaria",
  sass: "Sass/SCSS",
  less: "Less",
  stylus: "Stylus",
  postcss: "PostCSS",
  radix: "Radix UI",
  headlessui: "Headless UI",
  ariakit: "Ariakit",
  mantine: "Mantine",
  nextui: "NextUI",
  primereact: "PrimeReact",
  primevue: "PrimeVue",
  vuetify: "Vuetify",
  quasar: "Quasar",
  element: "Element UI",
  naiveui: "Naive UI",

  // Backend Frameworks (Node.js)
  express: "Express.js",
  fastify: "Fastify",
  nestjs: "NestJS",
  hono: "Hono",
  koa: "Koa",
  hapi: "Hapi",
  restify: "Restify",
  polka: "Polka",
  adonis: "AdonisJS",
  sails: "Sails.js",
  loopback: "LoopBack",
  feathers: "Feathers",
  moleculer: "Moleculer",
  nitro: "Nitro",
  elysia: "Elysia",
  bun: "Bun",
  deno: "Deno",

  // Python Backend
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  tornado: "Tornado",
  pyramid: "Pyramid",
  bottle: "Bottle",
  falcon: "Falcon",
  sanic: "Sanic",
  aiohttp: "aiohttp",
  starlette: "Starlette",
  litestar: "Litestar",
  django_rest: "Django REST",
  celery: "Celery",

  // Ruby Backend
  rails: "Ruby on Rails",
  sinatra: "Sinatra",
  hanami: "Hanami",
  roda: "Roda",
  grape: "Grape",

  // PHP Backend
  laravel: "Laravel",
  symfony: "Symfony",
  codeigniter: "CodeIgniter",
  cakephp: "CakePHP",
  slim: "Slim",
  lumen: "Lumen",
  yii: "Yii",

  // Java/Kotlin Backend
  spring: "Spring",
  springboot: "Spring Boot",
  quarkus: "Quarkus",
  micronaut: "Micronaut",
  ktor: "Ktor",
  dropwizard: "Dropwizard",

  // .NET Backend
  dotnet: ".NET",
  aspnet: "ASP.NET",
  blazor: "Blazor",

  // Go Backend
  gin: "Gin",
  fiber: "Fiber",
  echo: "Echo",
  chi: "Chi",
  gorilla: "Gorilla Mux",
  beego: "Beego",
  buffalo: "Buffalo",

  // Rust Backend
  actix: "Actix Web",
  rocket: "Rocket",
  axum: "Axum",
  warp: "Warp",
  tide: "Tide",

  // Elixir Backend
  phoenix: "Phoenix",
  plug: "Plug",

  // Mobile Development
  reactnative: "React Native",
  flutter: "Flutter",
  expo: "Expo",
  ionic: "Ionic",
  capacitor: "Capacitor",
  nativescript: "NativeScript",
  cordova: "Cordova",
  swiftui: "SwiftUI",
  jetpackcompose: "Jetpack Compose",
  xamarin: "Xamarin",
  maui: ".NET MAUI",
  kivy: "Kivy",
  tauri: "Tauri",
  electron: "Electron",

  // Databases & ORMs
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  redis: "Redis",
  sqlite: "SQLite",
  supabase: "Supabase",
  firebase: "Firebase",
  prisma: "Prisma",
  drizzle: "Drizzle ORM",
  typeorm: "TypeORM",
  sequelize: "Sequelize",
  knex: "Knex.js",
  objection: "Objection.js",
  bookshelf: "Bookshelf.js",
  mikro: "MikroORM",
  kysely: "Kysely",
  sqlalchemy: "SQLAlchemy",
  django_orm: "Django ORM",
  peewee: "Peewee",
  tortoise: "Tortoise ORM",
  sqlmodel: "SQLModel",
  activerecord: "ActiveRecord",
  eloquent: "Eloquent",
  doctrine: "Doctrine",
  hibernate: "Hibernate",
  gorm: "GORM",
  ent: "Ent",
  neo4j: "Neo4j",
  cassandra: "Cassandra",
  dynamodb: "DynamoDB",
  elasticsearch: "Elasticsearch",
  clickhouse: "ClickHouse",
  cockroachdb: "CockroachDB",
  planetscale: "PlanetScale",
  neon: "Neon",
  turso: "Turso",
  upstash: "Upstash",
  convex: "Convex",
  fauna: "Fauna",
  couchdb: "CouchDB",
  influxdb: "InfluxDB",
  timescaledb: "TimescaleDB",
  mariadb: "MariaDB",
  oracle: "Oracle DB",
  mssql: "SQL Server",

  // Cloud & Infrastructure
  aws: "AWS",
  gcp: "Google Cloud",
  azure: "Azure",
  vercel: "Vercel",
  netlify: "Netlify",
  cloudflare: "Cloudflare",
  railway: "Railway",
  render: "Render",
  fly: "Fly.io",
  digitalocean: "DigitalOcean",
  heroku: "Heroku",
  docker: "Docker",
  kubernetes: "Kubernetes",
  helm: "Helm",
  terraform: "Terraform",
  pulumi: "Pulumi",
  ansible: "Ansible",
  vagrant: "Vagrant",
  packer: "Packer",

  // CI/CD
  "github-actions": "GitHub Actions",
  gitlab: "GitLab CI",
  circleci: "CircleCI",
  jenkins: "Jenkins",
  travis: "Travis CI",
  bitbucket: "Bitbucket Pipelines",
  azure_devops: "Azure DevOps",
  drone: "Drone CI",
  buildkite: "Buildkite",

  // AI/ML & Data Science
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  "scikit-learn": "Scikit-learn",
  keras: "Keras",
  huggingface: "Hugging Face",
  langchain: "LangChain",
  openai: "OpenAI",
  anthropic: "Anthropic",
  llamaindex: "LlamaIndex",
  pandas: "Pandas",
  numpy: "NumPy",
  scipy: "SciPy",
  matplotlib: "Matplotlib",
  seaborn: "Seaborn",
  plotly: "Plotly",
  jupyter: "Jupyter",
  polars: "Polars",
  dask: "Dask",
  spark: "Apache Spark",
  ray: "Ray",
  mlflow: "MLflow",
  wandb: "Weights & Biases",
  dvc: "DVC",
  airflow: "Apache Airflow",
  dagster: "Dagster",
  prefect: "Prefect",
  dbt: "dbt",
  greatexpectations: "Great Expectations",

  // Testing
  jest: "Jest",
  vitest: "Vitest",
  cypress: "Cypress",
  playwright: "Playwright",
  puppeteer: "Puppeteer",
  selenium: "Selenium",
  mocha: "Mocha",
  jasmine: "Jasmine",
  ava: "AVA",
  tap: "TAP",
  uvu: "uvu",
  testing_library: "Testing Library",
  enzyme: "Enzyme",
  pytest: "pytest",
  unittest: "unittest",
  rspec: "RSpec",
  minitest: "Minitest",
  phpunit: "PHPUnit",
  junit: "JUnit",
  testng: "TestNG",
  xunit: "xUnit",
  nunit: "NUnit",
  gotest: "Go Test",

  // API & Communication
  graphql: "GraphQL",
  trpc: "tRPC",
  rest: "REST API",
  grpc: "gRPC",
  websocket: "WebSocket",
  socketio: "Socket.IO",
  mqtt: "MQTT",
  rabbitmq: "RabbitMQ",
  kafka: "Apache Kafka",
  nats: "NATS",
  zeromq: "ZeroMQ",
  webhooks: "Webhooks",

  // State Management
  redux: "Redux",
  mobx: "MobX",
  zustand: "Zustand",
  recoil: "Recoil",
  jotai: "Jotai",
  valtio: "Valtio",
  xstate: "XState",
  pinia: "Pinia",
  vuex: "Vuex",
  ngrx: "NgRx",
  tanstack_query: "TanStack Query",
  swr: "SWR",
  apollo: "Apollo Client",

  // Build Tools
  webpack: "Webpack",
  vite: "Vite",
  rollup: "Rollup",
  esbuild: "esbuild",
  parcel: "Parcel",
  swc: "SWC",
  babel: "Babel",
  turbopack: "Turbopack",
  turborepo: "Turborepo",
  nx: "Nx",
  lerna: "Lerna",
  pnpm: "pnpm",
  yarn: "Yarn",
  npm: "npm",

  // Linting & Formatting
  eslint: "ESLint",
  prettier: "Prettier",
  biome: "Biome",
  oxlint: "Oxlint",
  stylelint: "Stylelint",
  ruff: "Ruff",
  black: "Black",
  flake8: "Flake8",
  pylint: "Pylint",
  mypy: "mypy",
  rubocop: "RuboCop",
  golangci: "golangci-lint",
  clippy: "Clippy",

  // Authentication
  auth0: "Auth0",
  clerk: "Clerk",
  nextauth: "NextAuth.js",
  passport: "Passport.js",
  firebase_auth: "Firebase Auth",
  supabase_auth: "Supabase Auth",
  keycloak: "Keycloak",
  oauth: "OAuth",
  jwt: "JWT",
  bcrypt: "bcrypt",
  argon2: "Argon2",
  helmet: "Helmet",
  cors: "CORS",

  // Monitoring & Logging
  sentry: "Sentry",
  datadog: "Datadog",
  newrelic: "New Relic",
  prometheus: "Prometheus",
  grafana: "Grafana",
  logstash: "Logstash",
  winston: "Winston",
  pino: "Pino",
  bunyan: "Bunyan",
  morgan: "Morgan",
  opentelemetry: "OpenTelemetry",
  axiom: "Axiom",
  logtail: "Logtail",

  // Payment & E-Commerce
  stripe: "Stripe",
  paypal: "PayPal",
  shopify: "Shopify",
  square: "Square",
  braintree: "Braintree",
  lemonsqueezy: "Lemon Squeezy",
  paddle: "Paddle",

  // CMS & Content
  contentful: "Contentful",
  sanity: "Sanity",
  strapi: "Strapi",
  wordpress: "WordPress",
  ghost: "Ghost",
  directus: "Directus",
  payload: "Payload CMS",
  keystonejs: "Keystone.js",
  prismic: "Prismic",
  storyblok: "Storyblok",
  notion: "Notion API",
  mdx: "MDX",

  // Email
  nodemailer: "Nodemailer",
  sendgrid: "SendGrid",
  mailgun: "Mailgun",
  postmark: "Postmark",
  resend: "Resend",
  ses: "Amazon SES",
  mailchimp: "Mailchimp",
  react_email: "React Email",

  // File Storage
  s3: "Amazon S3",
  cloudinary: "Cloudinary",
  uploadthing: "UploadThing",
  imagekit: "ImageKit",
  imgix: "imgix",
  bunny: "Bunny CDN",

  // Real-time
  pusher: "Pusher",
  ably: "Ably",
  liveblocks: "Liveblocks",
  partykit: "PartyKit",

  // Search
  algolia: "Algolia",
  meilisearch: "Meilisearch",
  typesense: "Typesense",
  elasticsearch_js: "Elasticsearch",
  lunr: "Lunr.js",
  fuse: "Fuse.js",

  // Analytics
  google_analytics: "Google Analytics",
  mixpanel: "Mixpanel",
  amplitude: "Amplitude",
  plausible: "Plausible",
  posthog: "PostHog",
  segment: "Segment",
  heap: "Heap",

  // Blockchain & Web3
  ethers: "Ethers.js",
  web3js: "Web3.js",
  wagmi: "wagmi",
  viem: "Viem",
  rainbowkit: "RainbowKit",
  thirdweb: "thirdweb",
  moralis: "Moralis",
  alchemy: "Alchemy",
  hardhat: "Hardhat",
  foundry: "Foundry",
  truffle: "Truffle",
  anchor: "Anchor",
  solana: "Solana",
  ethereum: "Ethereum",

  // Templating Engines
  ejs: "EJS",
  handlebars: "Handlebars",
  pug: "Pug",
  nunjucks: "Nunjucks",
  twig: "Twig",
  jinja: "Jinja2",

  // Markup & Config Languages
  markdown: "Markdown",
  yaml: "YAML",
  toml: "TOML",
  sql: "SQL",
  css: "CSS",

  // Shell & Scripting
  bash: "Bash",
  zsh: "Zsh",
  fish: "Fish",
  powershell: "PowerShell",

  // Mobile Platforms
  android: "Android",
  ios: "iOS",

  // Protocols & Standards
  protobuf: "Protocol Buffers",
  webassembly: "WebAssembly",

  // VB.NET
  vb: "Visual Basic",
};

function getTechLabel(value: string): string {
  return TECH_LABELS[value] || value;
}

export function GitHubTechImport({
  currentValues,
  onImport,
  disabled,
  className,
}: GitHubTechImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [selectedTech, setSelectedTech] = useState<Set<string>>(new Set());

  const handleAnalyze = async () => {
    if (!githubUrl.trim()) {
      setError("Please enter a GitHub URL");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/github/analyze-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to analyze repository");
      }

      setResult(data.data);
      // Pre-select all detected technologies that aren't already in current values
      const newTech = data.data.techStack.filter(
        (tech: string) => !currentValues.includes(tech)
      );
      setSelectedTech(new Set(newTech));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze repository");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleTech = (tech: string) => {
    setSelectedTech((prev) => {
      const next = new Set(prev);
      if (next.has(tech)) {
        next.delete(tech);
      } else {
        next.add(tech);
      }
      return next;
    });
  };

  const handleImport = () => {
    if (selectedTech.size === 0) return;
    
    // Merge current values with selected new tech
    const merged = [...currentValues, ...Array.from(selectedTech)];
    // Remove duplicates
    const unique = Array.from(new Set(merged));
    onImport(unique);
    
    // Reset and close
    setIsOpen(false);
    setGithubUrl("");
    setResult(null);
    setSelectedTech(new Set());
    setError(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setGithubUrl("");
    setResult(null);
    setSelectedTech(new Set());
    setError(null);
  };

  // Separate new and existing tech
  const newTech = result?.techStack.filter((tech) => !currentValues.includes(tech)) ?? [];
  const existingTech = result?.techStack.filter((tech) => currentValues.includes(tech)) ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("gap-2", className)}
          onClick={() => setIsOpen(true)}
        >
          <Github className="h-4 w-4" />
          Import from GitHub
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Import Tech Stack from GitHub
          </DialogTitle>
          <DialogDescription>
            Enter a GitHub repository URL to automatically detect and import the tech stack.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* URL Input */}
          <div className="flex gap-2">
            <Input
              placeholder="https://github.com/owner/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              disabled={isAnalyzing}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !githubUrl.trim()}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Analyze</span>
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Repository Info */}
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p className="font-medium text-foreground">
                  {result.repository.owner}/{result.repository.repo}
                </p>
                <p className="text-xs mt-1">
                  Analyzed {result.repository.fileCount.toLocaleString()} files • 
                  Detected {result.detectedCount} technologies
                </p>
              </div>

              {/* New Technologies */}
              {newTech.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    New technologies to add ({selectedTech.size} selected):
                  </p>
                  <ScrollArea className="max-h-32">
                    <div className="flex flex-wrap gap-2">
                      {newTech.map((tech) => (
                        <Badge
                          key={tech}
                          variant={selectedTech.has(tech) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-colors",
                            selectedTech.has(tech) && "bg-primary"
                          )}
                          onClick={() => handleToggleTech(tech)}
                        >
                          {selectedTech.has(tech) ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : null}
                          {getTechLabel(tech)}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Already Added Technologies */}
              {existingTech.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Already in your tech stack:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingTech.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="opacity-60"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {getTechLabel(tech)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* No new tech found */}
              {newTech.length === 0 && existingTech.length > 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  All detected technologies are already in your tech stack!
                </p>
              )}

              {/* No tech found at all */}
              {result.techStack.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No technologies detected. The repository might be empty or use unsupported technologies.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={selectedTech.size === 0}
          >
            Import {selectedTech.size > 0 && `(${selectedTech.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
