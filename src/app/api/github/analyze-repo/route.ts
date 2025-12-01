import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * File extension to technology mapping
 * Used to detect tech stack from file extensions
 */
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

/**
 * Analyze file extensions from a pool of files to detect technologies
 * @param files - List of file paths from the repository
 * @param sampleSize - Maximum number of files to sample (default 100)
 */
function analyzeFileExtensions(files: string[], sampleSize = 100): string[] {
  const detected = new Set<string>();
  const extensionCounts: Record<string, number> = {};
  
  // Filter out common non-code files and directories
  const codeFiles = files.filter((file) => {
    const lower = file.toLowerCase();
    // Skip common non-code paths
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
    // Must have an extension
    return file.includes(".");
  });
  
  // Sample files if we have more than the limit
  let sampledFiles = codeFiles;
  if (codeFiles.length > sampleSize) {
    // Prioritize source files over config files
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
    
    // Take source files first, then fill with random others
    if (sourceFiles.length >= sampleSize) {
      // Randomly sample from source files
      sampledFiles = shuffleArray(sourceFiles).slice(0, sampleSize);
    } else {
      // Take all source files and fill remaining from others
      const otherFiles = codeFiles.filter((f) => !sourceFiles.includes(f));
      const remaining = sampleSize - sourceFiles.length;
      sampledFiles = [
        ...sourceFiles,
        ...shuffleArray(otherFiles).slice(0, remaining),
      ];
    }
  }
  
  // Count extensions
  for (const file of sampledFiles) {
    // Handle multi-part extensions like .blade.php, .d.ts
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
  
  // Map extensions to technologies
  for (const [ext, count] of Object.entries(extensionCounts)) {
    // Only consider extensions that appear at least twice (reduce noise)
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

/**
 * Fisher-Yates shuffle for random sampling
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Tech stack detection patterns
 * Maps file patterns and package names to tech stack values
 * Comprehensive detection for 150+ technologies
 */
const TECH_DETECTION: Record<string, {
  files?: string[];
  packages?: string[];
  extensions?: string[];
}> = {
  // ==========================================================================
  // PROGRAMMING LANGUAGES
  // ==========================================================================
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
  
  // ==========================================================================
  // FRONTEND FRAMEWORKS & LIBRARIES
  // ==========================================================================
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
  backbone: { packages: ["backbone"] },
  mithril: { packages: ["mithril"] },
  marko: { packages: ["marko"] },
  riot: { packages: ["riot"] },
  inferno: { packages: ["inferno"] },
  hyperapp: { packages: ["hyperapp"] },
  htmx: { packages: ["htmx.org"] },
  petite: { packages: ["petite-vue"] },
  million: { packages: ["million"] },
  
  // ==========================================================================
  // CSS FRAMEWORKS & STYLING
  // ==========================================================================
  tailwindcss: { packages: ["tailwindcss"], files: ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs", "tailwind.config.cjs"] },
  bootstrap: { packages: ["bootstrap", "react-bootstrap", "bootstrap-vue"] },
  materialui: { packages: ["@mui/material", "@material-ui/core"] },
  chakra: { packages: ["@chakra-ui/react"] },
  antdesign: { packages: ["antd", "@ant-design/icons"] },
  shadcn: { files: ["components.json"] },
  daisyui: { packages: ["daisyui"] },
  bulma: { packages: ["bulma"] },
  foundation: { packages: ["foundation-sites"] },
  semantic: { packages: ["semantic-ui", "semantic-ui-react", "fomantic-ui"] },
  unocss: { packages: ["unocss"], files: ["uno.config.ts", "unocss.config.ts"] },
  windicss: { packages: ["windicss"], files: ["windi.config.ts"] },
  twind: { packages: ["twind"] },
  emotion: { packages: ["@emotion/react", "@emotion/styled", "@emotion/css"] },
  styledcomponents: { packages: ["styled-components"] },
  stitches: { packages: ["@stitches/react"] },
  vanilla: { packages: ["@vanilla-extract/css"] },
  linaria: { packages: ["linaria"] },
  sass: { packages: ["sass", "node-sass"], extensions: [".scss", ".sass"] },
  less: { packages: ["less"], extensions: [".less"] },
  stylus: { packages: ["stylus"], extensions: [".styl", ".stylus"] },
  postcss: { packages: ["postcss", "postcss-cli"], files: ["postcss.config.js", "postcss.config.cjs"] },
  radix: { packages: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/themes"] },
  headlessui: { packages: ["@headlessui/react", "@headlessui/vue"] },
  ariakit: { packages: ["ariakit", "@ariakit/react"] },
  mantine: { packages: ["@mantine/core"] },
  nextui: { packages: ["@nextui-org/react"] },
  primereact: { packages: ["primereact"] },
  primevue: { packages: ["primevue"] },
  vuetify: { packages: ["vuetify"] },
  quasar: { packages: ["quasar", "@quasar/cli"] },
  element: { packages: ["element-ui", "element-plus"] },
  naiveui: { packages: ["naive-ui"] },
  
  // ==========================================================================
  // BACKEND FRAMEWORKS
  // ==========================================================================
  express: { packages: ["express"] },
  fastify: { packages: ["fastify"] },
  nestjs: { packages: ["@nestjs/core", "@nestjs/common"] },
  hono: { packages: ["hono"] },
  koa: { packages: ["koa"] },
  hapi: { packages: ["@hapi/hapi", "hapi"] },
  restify: { packages: ["restify"] },
  polka: { packages: ["polka"] },
  adonis: { packages: ["@adonisjs/core"], files: ["ace", ".adonisrc.json"] },
  sails: { packages: ["sails"] },
  loopback: { packages: ["@loopback/core"] },
  feathers: { packages: ["@feathersjs/feathers"] },
  moleculer: { packages: ["moleculer"] },
  nitro: { packages: ["nitropack"] },
  elysia: { packages: ["elysia"] },
  bun: { files: ["bun.lockb", "bunfig.toml"] },
  deno: { files: ["deno.json", "deno.jsonc", "deno.lock", "import_map.json"] },
  
  // Python Backend
  django: { packages: ["django", "Django"], files: ["manage.py", "settings.py"] },
  flask: { packages: ["flask", "Flask"] },
  fastapi: { packages: ["fastapi", "FastAPI"] },
  tornado: { packages: ["tornado"] },
  pyramid: { packages: ["pyramid"] },
  bottle: { packages: ["bottle"] },
  falcon: { packages: ["falcon"] },
  sanic: { packages: ["sanic"] },
  aiohttp: { packages: ["aiohttp"] },
  starlette: { packages: ["starlette"] },
  litestar: { packages: ["litestar"] },
  django_rest: { packages: ["djangorestframework"] },
  celery: { packages: ["celery"] },
  
  // Ruby Backend
  rails: { packages: ["rails"], files: ["Gemfile", "config/routes.rb", "bin/rails"] },
  sinatra: { packages: ["sinatra"] },
  hanami: { packages: ["hanami"] },
  roda: { packages: ["roda"] },
  grape: { packages: ["grape"] },
  
  // PHP Backend
  laravel: { packages: ["laravel/framework"], files: ["artisan", "composer.json", "app/Http/Kernel.php"] },
  symfony: { packages: ["symfony/framework-bundle"], files: ["symfony.lock"] },
  codeigniter: { files: ["system/core/CodeIgniter.php"] },
  cakephp: { packages: ["cakephp/cakephp"] },
  slim: { packages: ["slim/slim"] },
  lumen: { packages: ["laravel/lumen-framework"] },
  yii: { packages: ["yiisoft/yii2"] },
  
  // Java/Kotlin Backend
  spring: { packages: ["org.springframework.boot"], files: ["pom.xml", "build.gradle"], extensions: [".java"] },
  springboot: { files: ["src/main/resources/application.properties", "src/main/resources/application.yml"] },
  quarkus: { files: ["src/main/resources/application.properties"], packages: ["io.quarkus"] },
  micronaut: { packages: ["io.micronaut"] },
  ktor: { packages: ["io.ktor"] },
  dropwizard: { packages: ["io.dropwizard"] },
  
  // .NET Backend
  dotnet: { files: ["*.csproj", "appsettings.json", "Program.cs", "Startup.cs"], extensions: [".cs"] },
  aspnet: { packages: ["Microsoft.AspNetCore"], files: ["*.csproj"] },
  blazor: { files: ["*.razor"], packages: ["Microsoft.AspNetCore.Components"] },
  
  // Go Backend
  gin: { packages: ["github.com/gin-gonic/gin"] },
  fiber: { packages: ["github.com/gofiber/fiber"] },
  echo: { packages: ["github.com/labstack/echo"] },
  chi: { packages: ["github.com/go-chi/chi"] },
  gorilla: { packages: ["github.com/gorilla/mux"] },
  beego: { packages: ["github.com/beego/beego"] },
  buffalo: { packages: ["github.com/gobuffalo/buffalo"] },
  
  // Rust Backend
  actix: { packages: ["actix-web"] },
  rocket: { packages: ["rocket"] },
  axum: { packages: ["axum"] },
  warp: { packages: ["warp"] },
  tide: { packages: ["tide"] },
  
  // Elixir Backend
  phoenix: { packages: ["phoenix"], files: ["mix.exs", "lib/*_web"] },
  plug: { packages: ["plug"] },
  
  // ==========================================================================
  // MOBILE DEVELOPMENT
  // ==========================================================================
  reactnative: { packages: ["react-native"] },
  flutter: { files: ["pubspec.yaml", "lib/main.dart"], extensions: [".dart"] },
  expo: { packages: ["expo", "expo-cli"], files: ["app.json", "app.config.js"] },
  ionic: { packages: ["@ionic/core", "@ionic/angular", "@ionic/react", "@ionic/vue"] },
  capacitor: { packages: ["@capacitor/core", "@capacitor/cli"] },
  nativescript: { packages: ["@nativescript/core"] },
  cordova: { packages: ["cordova"], files: ["config.xml"] },
  swiftui: { extensions: [".swift"], files: ["*.xcodeproj", "Package.swift"] },
  jetpackcompose: { extensions: [".kt"], files: ["build.gradle.kts"] },
  xamarin: { files: ["*.sln"], packages: ["Xamarin.Forms"] },
  maui: { packages: ["Microsoft.Maui"] },
  kivy: { packages: ["kivy"] },
  tauri: { packages: ["@tauri-apps/api", "tauri"], files: ["tauri.conf.json", "src-tauri/"] },
  electron: { packages: ["electron"] },
  
  // ==========================================================================
  // DATABASES & ORMs
  // ==========================================================================
  postgresql: { packages: ["pg", "postgres", "psycopg2", "asyncpg", "psycopg", "node-postgres"] },
  mysql: { packages: ["mysql", "mysql2", "pymysql", "mysqlclient", "mysql-connector-python"] },
  mongodb: { packages: ["mongodb", "mongoose", "pymongo", "motor", "mongoid"] },
  redis: { packages: ["redis", "ioredis", "redis-py", "aioredis", "bull", "bullmq"] },
  sqlite: { packages: ["sqlite3", "better-sqlite3", "sql.js"] },
  supabase: { packages: ["@supabase/supabase-js", "supabase"] },
  firebase: { packages: ["firebase", "firebase-admin", "@firebase/app"] },
  prisma: { packages: ["prisma", "@prisma/client"], files: ["prisma/schema.prisma"] },
  drizzle: { packages: ["drizzle-orm", "drizzle-kit"] },
  typeorm: { packages: ["typeorm"] },
  sequelize: { packages: ["sequelize"] },
  knex: { packages: ["knex"] },
  objection: { packages: ["objection"] },
  bookshelf: { packages: ["bookshelf"] },
  mikro: { packages: ["@mikro-orm/core"] },
  kysely: { packages: ["kysely"] },
  sqlalchemy: { packages: ["sqlalchemy", "SQLAlchemy"] },
  django_orm: { packages: ["django"] },
  peewee: { packages: ["peewee"] },
  tortoise: { packages: ["tortoise-orm"] },
  sqlmodel: { packages: ["sqlmodel"] },
  activerecord: { packages: ["activerecord"] },
  eloquent: { packages: ["illuminate/database"] },
  doctrine: { packages: ["doctrine/orm"] },
  hibernate: { packages: ["org.hibernate"] },
  gorm: { packages: ["gorm.io/gorm"] },
  ent: { packages: ["entgo.io/ent"] },
  neo4j: { packages: ["neo4j", "neo4j-driver", "py2neo"] },
  cassandra: { packages: ["cassandra-driver", "datastax"] },
  dynamodb: { packages: ["@aws-sdk/client-dynamodb", "dynamodb"] },
  elasticsearch: { packages: ["elasticsearch", "@elastic/elasticsearch", "elasticsearch-py"] },
  clickhouse: { packages: ["clickhouse", "@clickhouse/client"] },
  cockroachdb: { packages: ["pg"] },
  planetscale: { packages: ["@planetscale/database"] },
  neon: { packages: ["@neondatabase/serverless"] },
  turso: { packages: ["@libsql/client"] },
  upstash: { packages: ["@upstash/redis", "@upstash/kafka"] },
  convex: { packages: ["convex"] },
  fauna: { packages: ["faunadb"] },
  couchdb: { packages: ["nano", "pouchdb"] },
  influxdb: { packages: ["influxdb-client", "@influxdata/influxdb-client"] },
  timescaledb: { packages: ["pg"] },
  mariadb: { packages: ["mariadb"] },
  oracle: { packages: ["oracledb"] },
  mssql: { packages: ["mssql", "tedious"] },
  
  // ==========================================================================
  // CLOUD & INFRASTRUCTURE
  // ==========================================================================
  aws: { packages: ["aws-sdk", "@aws-sdk/client-s3", "boto3", "aws-cdk"], files: ["serverless.yml", "sam.yaml", "template.yaml"] },
  gcp: { packages: ["@google-cloud/storage", "google-cloud-storage", "firebase-admin"] },
  azure: { packages: ["@azure/storage-blob", "azure-storage", "azure-functions"] },
  vercel: { packages: ["vercel", "@vercel/node"], files: ["vercel.json", ".vercel/"] },
  netlify: { packages: ["netlify-cli"], files: ["netlify.toml"] },
  cloudflare: { packages: ["wrangler", "@cloudflare/workers-types"], files: ["wrangler.toml"] },
  railway: { files: ["railway.json", "railway.toml"] },
  render: { files: ["render.yaml"] },
  fly: { files: ["fly.toml"] },
  digitalocean: { packages: ["do-spaces"], files: [".do/app.yaml"] },
  heroku: { files: ["Procfile", "app.json", "heroku.yml"] },
  docker: { files: ["Dockerfile", "docker-compose.yml", "docker-compose.yaml", ".dockerignore", "compose.yml", "compose.yaml"] },
  kubernetes: { files: ["k8s/", "kubernetes/", "*.yaml", "kustomization.yaml", "Chart.yaml"], packages: ["@kubernetes/client-node"] },
  helm: { files: ["Chart.yaml", "values.yaml", "charts/"] },
  terraform: { files: ["*.tf", "terraform/", ".terraform/", "terraform.tfstate"], extensions: [".tf", ".tfvars"] },
  pulumi: { packages: ["@pulumi/pulumi", "pulumi"], files: ["Pulumi.yaml"] },
  ansible: { files: ["ansible.cfg", "playbook.yml", "inventory/"], extensions: [".yml", ".yaml"] },
  vagrant: { files: ["Vagrantfile"] },
  packer: { files: ["*.pkr.hcl"], extensions: [".pkr.hcl"] },
  
  // ==========================================================================
  // CI/CD & DevOps
  // ==========================================================================
  "github-actions": { files: [".github/workflows/"] },
  gitlab: { files: [".gitlab-ci.yml"] },
  circleci: { files: [".circleci/config.yml"] },
  jenkins: { files: ["Jenkinsfile", "jenkins/"] },
  travis: { files: [".travis.yml"] },
  bitbucket: { files: ["bitbucket-pipelines.yml"] },
  azure_devops: { files: ["azure-pipelines.yml"] },
  drone: { files: [".drone.yml"] },
  buildkite: { files: [".buildkite/pipeline.yml"] },
  
  // ==========================================================================
  // AI/ML & DATA SCIENCE
  // ==========================================================================
  tensorflow: { packages: ["tensorflow", "@tensorflow/tfjs", "tensorflow-gpu", "tf-nightly"] },
  pytorch: { packages: ["torch", "pytorch", "torchvision", "torchaudio"] },
  "scikit-learn": { packages: ["scikit-learn", "sklearn"] },
  keras: { packages: ["keras", "tf-keras"] },
  huggingface: { packages: ["transformers", "huggingface_hub", "datasets", "tokenizers", "accelerate"] },
  langchain: { packages: ["langchain", "langchain-core", "langchain-community"] },
  openai: { packages: ["openai"] },
  anthropic: { packages: ["anthropic", "@anthropic-ai/sdk"] },
  llamaindex: { packages: ["llama-index", "llama_index"] },
  pandas: { packages: ["pandas"] },
  numpy: { packages: ["numpy"] },
  scipy: { packages: ["scipy"] },
  matplotlib: { packages: ["matplotlib"] },
  seaborn: { packages: ["seaborn"] },
  plotly: { packages: ["plotly", "plotly.js", "react-plotly.js"] },
  jupyter: { files: ["*.ipynb"], extensions: [".ipynb"] },
  polars: { packages: ["polars"] },
  dask: { packages: ["dask"] },
  spark: { packages: ["pyspark", "spark"] },
  ray: { packages: ["ray"] },
  mlflow: { packages: ["mlflow"] },
  wandb: { packages: ["wandb"] },
  dvc: { files: [".dvc/", "dvc.yaml"] },
  airflow: { packages: ["apache-airflow", "airflow"] },
  dagster: { packages: ["dagster"] },
  prefect: { packages: ["prefect"] },
  dbt: { packages: ["dbt-core", "dbt"], files: ["dbt_project.yml"] },
  greatexpectations: { packages: ["great-expectations", "great_expectations"] },
  
  // ==========================================================================
  // TESTING
  // ==========================================================================
  jest: { packages: ["jest", "@jest/core"], files: ["jest.config.js", "jest.config.ts", "jest.config.mjs"] },
  vitest: { packages: ["vitest"], files: ["vitest.config.ts", "vitest.config.js"] },
  cypress: { packages: ["cypress"], files: ["cypress.config.js", "cypress.config.ts", "cypress/"] },
  playwright: { packages: ["@playwright/test", "playwright"], files: ["playwright.config.ts", "playwright.config.js"] },
  puppeteer: { packages: ["puppeteer", "puppeteer-core"] },
  selenium: { packages: ["selenium-webdriver", "selenium"] },
  mocha: { packages: ["mocha"], files: [".mocharc.js", ".mocharc.json"] },
  jasmine: { packages: ["jasmine"], files: ["jasmine.json"] },
  ava: { packages: ["ava"] },
  tap: { packages: ["tap"] },
  uvu: { packages: ["uvu"] },
  testing_library: { packages: ["@testing-library/react", "@testing-library/jest-dom", "@testing-library/vue"] },
  enzyme: { packages: ["enzyme"] },
  pytest: { packages: ["pytest", "pytest-cov", "pytest-asyncio"] },
  unittest: { files: ["test_*.py", "*_test.py"] },
  rspec: { packages: ["rspec"], files: [".rspec", "spec/"] },
  minitest: { packages: ["minitest"] },
  phpunit: { packages: ["phpunit/phpunit"], files: ["phpunit.xml"] },
  junit: { packages: ["junit", "org.junit"] },
  testng: { packages: ["org.testng"] },
  xunit: { packages: ["xunit"] },
  nunit: { packages: ["NUnit"] },
  gotest: { files: ["*_test.go"] },
  
  // ==========================================================================
  // API & COMMUNICATION
  // ==========================================================================
  graphql: { packages: ["graphql", "@apollo/client", "apollo-server", "@graphql-tools/schema", "graphql-yoga", "urql", "graphql-request"] },
  trpc: { packages: ["@trpc/server", "@trpc/client", "@trpc/react-query"] },
  rest: { files: ["openapi.yaml", "openapi.json", "swagger.yaml", "swagger.json"] },
  grpc: { packages: ["@grpc/grpc-js", "grpcio", "grpc"], extensions: [".proto"] },
  websocket: { packages: ["ws", "socket.io", "socket.io-client", "websockets", "sockjs"] },
  socketio: { packages: ["socket.io", "socket.io-client", "python-socketio"] },
  mqtt: { packages: ["mqtt", "paho-mqtt"] },
  rabbitmq: { packages: ["amqplib", "pika", "bunny"] },
  kafka: { packages: ["kafkajs", "kafka-python", "confluent-kafka"] },
  nats: { packages: ["nats", "nats.py"] },
  zeromq: { packages: ["zeromq", "pyzmq"] },
  webhooks: { files: ["webhooks/"] },
  
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  redux: { packages: ["redux", "@reduxjs/toolkit", "react-redux"] },
  mobx: { packages: ["mobx", "mobx-react"] },
  zustand: { packages: ["zustand"] },
  recoil: { packages: ["recoil"] },
  jotai: { packages: ["jotai"] },
  valtio: { packages: ["valtio"] },
  xstate: { packages: ["xstate", "@xstate/react"] },
  pinia: { packages: ["pinia"] },
  vuex: { packages: ["vuex"] },
  ngrx: { packages: ["@ngrx/store"] },
  tanstack_query: { packages: ["@tanstack/react-query", "@tanstack/vue-query", "react-query"] },
  swr: { packages: ["swr"] },
  apollo: { packages: ["@apollo/client", "apollo-client"] },
  
  // ==========================================================================
  // BUILD TOOLS & BUNDLERS
  // ==========================================================================
  webpack: { packages: ["webpack", "webpack-cli"], files: ["webpack.config.js", "webpack.config.ts"] },
  vite: { packages: ["vite"], files: ["vite.config.js", "vite.config.ts", "vite.config.mjs"] },
  rollup: { packages: ["rollup"], files: ["rollup.config.js", "rollup.config.ts"] },
  esbuild: { packages: ["esbuild"] },
  parcel: { packages: ["parcel", "@parcel/core"] },
  swc: { packages: ["@swc/core", "@swc/cli"], files: [".swcrc"] },
  babel: { packages: ["@babel/core", "@babel/preset-env"], files: ["babel.config.js", ".babelrc"] },
  turbopack: { packages: ["turbo"] },
  turborepo: { packages: ["turbo"], files: ["turbo.json"] },
  nx: { packages: ["nx", "@nrwl/workspace"], files: ["nx.json"] },
  lerna: { packages: ["lerna"], files: ["lerna.json"] },
  pnpm: { files: ["pnpm-workspace.yaml", "pnpm-lock.yaml"] },
  yarn: { files: ["yarn.lock", ".yarnrc.yml"] },
  npm: { files: ["package-lock.json"] },
  
  // ==========================================================================
  // LINTING & FORMATTING
  // ==========================================================================
  eslint: { packages: ["eslint"], files: [".eslintrc", ".eslintrc.js", ".eslintrc.json", "eslint.config.js", "eslint.config.mjs"] },
  prettier: { packages: ["prettier"], files: [".prettierrc", ".prettierrc.js", ".prettierrc.json", "prettier.config.js"] },
  biome: { packages: ["@biomejs/biome"], files: ["biome.json"] },
  oxlint: { packages: ["oxlint"] },
  stylelint: { packages: ["stylelint"], files: [".stylelintrc", ".stylelintrc.js"] },
  ruff: { packages: ["ruff"], files: ["ruff.toml", "pyproject.toml"] },
  black: { packages: ["black"] },
  flake8: { packages: ["flake8"], files: [".flake8"] },
  pylint: { packages: ["pylint"], files: [".pylintrc"] },
  mypy: { packages: ["mypy"], files: ["mypy.ini"] },
  rubocop: { packages: ["rubocop"], files: [".rubocop.yml"] },
  golangci: { files: [".golangci.yml", ".golangci.yaml"] },
  clippy: { files: ["clippy.toml"] },
  
  // ==========================================================================
  // AUTHENTICATION & SECURITY
  // ==========================================================================
  auth0: { packages: ["@auth0/auth0-react", "auth0", "nextjs-auth0"] },
  clerk: { packages: ["@clerk/nextjs", "@clerk/clerk-react", "@clerk/backend"] },
  nextauth: { packages: ["next-auth", "@auth/core"] },
  passport: { packages: ["passport", "passport-local", "passport-jwt"] },
  firebase_auth: { packages: ["firebase", "@firebase/auth"] },
  supabase_auth: { packages: ["@supabase/supabase-js", "@supabase/auth-helpers-nextjs"] },
  keycloak: { packages: ["keycloak-js", "@react-keycloak/web"] },
  oauth: { packages: ["simple-oauth2", "oauth"] },
  jwt: { packages: ["jsonwebtoken", "jose", "pyjwt"] },
  bcrypt: { packages: ["bcrypt", "bcryptjs"] },
  argon2: { packages: ["argon2"] },
  helmet: { packages: ["helmet"] },
  cors: { packages: ["cors"] },
  
  // ==========================================================================
  // MONITORING & LOGGING
  // ==========================================================================
  sentry: { packages: ["@sentry/node", "@sentry/react", "@sentry/nextjs", "sentry-sdk"] },
  datadog: { packages: ["dd-trace", "datadog-metrics"] },
  newrelic: { packages: ["newrelic"] },
  prometheus: { packages: ["prom-client"] },
  grafana: { files: ["grafana/"] },
  logstash: { files: ["logstash/"] },
  winston: { packages: ["winston"] },
  pino: { packages: ["pino"] },
  bunyan: { packages: ["bunyan"] },
  morgan: { packages: ["morgan"] },
  opentelemetry: { packages: ["@opentelemetry/api", "@opentelemetry/sdk-node"] },
  axiom: { packages: ["@axiomhq/js"] },
  logtail: { packages: ["@logtail/node"] },
  
  // ==========================================================================
  // PAYMENT & E-COMMERCE
  // ==========================================================================
  stripe: { packages: ["stripe", "@stripe/stripe-js", "@stripe/react-stripe-js"] },
  paypal: { packages: ["@paypal/react-paypal-js", "paypal-rest-sdk"] },
  shopify: { packages: ["@shopify/shopify-api", "shopify-buy"] },
  square: { packages: ["square"] },
  braintree: { packages: ["braintree"] },
  lemonsqueezy: { packages: ["@lemonsqueezy/lemonsqueezy.js"] },
  paddle: { packages: ["@paddle/paddle-js"] },
  
  // ==========================================================================
  // CMS & CONTENT
  // ==========================================================================
  contentful: { packages: ["contentful"] },
  sanity: { packages: ["@sanity/client", "sanity"], files: ["sanity.config.ts", "sanity.config.js"] },
  strapi: { packages: ["@strapi/strapi"], files: ["config/database.js"] },
  wordpress: { files: ["wp-config.php", "wp-content/"] },
  ghost: { packages: ["@tryghost/content-api"] },
  directus: { packages: ["@directus/sdk"] },
  payload: { packages: ["payload"], files: ["payload.config.ts"] },
  keystonejs: { packages: ["@keystone-6/core"] },
  prismic: { packages: ["@prismicio/client", "@prismicio/react"] },
  storyblok: { packages: ["storyblok-js-client", "@storyblok/react"] },
  notion: { packages: ["@notionhq/client"] },
  mdx: { packages: ["@mdx-js/mdx", "@mdx-js/react"], extensions: [".mdx"] },
  
  // ==========================================================================
  // EMAIL
  // ==========================================================================
  nodemailer: { packages: ["nodemailer"] },
  sendgrid: { packages: ["@sendgrid/mail"] },
  mailgun: { packages: ["mailgun-js", "mailgun.js"] },
  postmark: { packages: ["postmark"] },
  resend: { packages: ["resend"] },
  ses: { packages: ["@aws-sdk/client-ses", "aws-sdk"] },
  mailchimp: { packages: ["@mailchimp/mailchimp_marketing"] },
  react_email: { packages: ["@react-email/components", "react-email"] },
  
  // ==========================================================================
  // FILE STORAGE & CDN
  // ==========================================================================
  s3: { packages: ["@aws-sdk/client-s3", "aws-sdk"] },
  cloudinary: { packages: ["cloudinary"] },
  uploadthing: { packages: ["uploadthing", "@uploadthing/react"] },
  imagekit: { packages: ["imagekit"] },
  imgix: { packages: ["@imgix/js-core"] },
  bunny: { packages: ["bunny-sdk"] },
  
  // ==========================================================================
  // REAL-TIME & PUSH
  // ==========================================================================
  pusher: { packages: ["pusher", "pusher-js"] },
  ably: { packages: ["ably"] },
  liveblocks: { packages: ["@liveblocks/client", "@liveblocks/react"] },
  partykit: { packages: ["partykit", "partysocket"] },
  
  // ==========================================================================
  // SEARCH
  // ==========================================================================
  algolia: { packages: ["algoliasearch", "@algolia/client-search", "react-instantsearch"] },
  meilisearch: { packages: ["meilisearch"] },
  typesense: { packages: ["typesense"] },
  elasticsearch_js: { packages: ["@elastic/elasticsearch"] },
  lunr: { packages: ["lunr"] },
  fuse: { packages: ["fuse.js"] },
  
  // ==========================================================================
  // ANALYTICS
  // ==========================================================================
  google_analytics: { packages: ["@google-analytics/data", "react-ga4"] },
  mixpanel: { packages: ["mixpanel", "mixpanel-browser"] },
  amplitude: { packages: ["@amplitude/analytics-browser", "amplitude-js"] },
  plausible: { packages: ["plausible-tracker"] },
  posthog: { packages: ["posthog-js", "posthog-node"] },
  segment: { packages: ["@segment/analytics-next", "analytics-node"] },
  heap: { packages: ["heap-api"] },
  
  // ==========================================================================
  // BLOCKCHAIN & WEB3
  // ==========================================================================
  ethers: { packages: ["ethers"] },
  web3js: { packages: ["web3"] },
  wagmi: { packages: ["wagmi", "@wagmi/core"] },
  viem: { packages: ["viem"] },
  rainbowkit: { packages: ["@rainbow-me/rainbowkit"] },
  thirdweb: { packages: ["@thirdweb-dev/sdk", "@thirdweb-dev/react"] },
  moralis: { packages: ["moralis"] },
  alchemy: { packages: ["alchemy-sdk"] },
  hardhat: { packages: ["hardhat"], files: ["hardhat.config.js", "hardhat.config.ts"] },
  foundry: { files: ["foundry.toml", "forge.toml"] },
  truffle: { packages: ["truffle"], files: ["truffle-config.js"] },
  anchor: { packages: ["@project-serum/anchor", "@coral-xyz/anchor"] },
  solana: { packages: ["@solana/web3.js"] },
};

/**
 * Parse GitHub URL to extract owner and repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /github\.com:([^\/]+)\/([^\/]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ""),
      };
    }
  }
  return null;
}

/**
 * Fetch repository file tree from GitHub API
 */
async function fetchRepoTree(owner: string, repo: string): Promise<string[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // Add GitHub token if available for higher rate limits
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Repository not found or is private");
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.tree?.map((item: { path: string }) => item.path) ?? [];
}

/**
 * Fetch package.json from repository
 */
async function fetchPackageJson(owner: string, repo: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/package.json`,
      {
        headers: {
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );
    
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch requirements.txt from repository
 */
async function fetchRequirementsTxt(owner: string, repo: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/requirements.txt`,
      {
        headers: {
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );
    
    if (!response.ok) return [];
    const text = await response.text();
    return text
      .split("\n")
      .map((line) => line.trim().split(/[=<>]/)[0].toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Detect tech stack from repository data
 * Combines multiple detection strategies:
 * 1. File extension analysis from sampled files
 * 2. Config file detection (package.json, requirements.txt, etc.)
 * 3. Package dependency analysis (npm, pip, etc.)
 */
function detectTechStack(
  files: string[],
  packageJson: Record<string, unknown> | null,
  pythonPackages: string[]
): string[] {
  const detected = new Set<string>();
  
  // STRATEGY 1: Analyze file extensions from a sample of 100 files
  const extensionTechs = analyzeFileExtensions(files, 100);
  for (const tech of extensionTechs) {
    detected.add(tech);
  }
  
  // STRATEGY 2 & 3: Check config files and package dependencies
  // Get all npm packages
  const npmPackages: string[] = [];
  if (packageJson) {
    const deps = packageJson.dependencies as Record<string, string> | undefined;
    const devDeps = packageJson.devDependencies as Record<string, string> | undefined;
    if (deps) npmPackages.push(...Object.keys(deps));
    if (devDeps) npmPackages.push(...Object.keys(devDeps));
  }
  
  // Check each tech against files and packages
  for (const [tech, patterns] of Object.entries(TECH_DETECTION)) {
    // Check file patterns
    if (patterns.files) {
      for (const filePattern of patterns.files) {
        if (filePattern.endsWith("/")) {
          // Directory pattern
          if (files.some((f) => f.startsWith(filePattern) || f.includes(`/${filePattern}`))) {
            detected.add(tech);
            break;
          }
        } else if (filePattern.includes("*")) {
          // Glob pattern (simplified)
          const regex = new RegExp(filePattern.replace(/\*/g, ".*"));
          if (files.some((f) => regex.test(f))) {
            detected.add(tech);
            break;
          }
        } else {
          // Exact match
          if (files.some((f) => f === filePattern || f.endsWith(`/${filePattern}`))) {
            detected.add(tech);
            break;
          }
        }
      }
    }
    
    // Check npm packages
    if (patterns.packages) {
      for (const pkg of patterns.packages) {
        if (npmPackages.includes(pkg)) {
          detected.add(tech);
          break;
        }
        // Also check Python packages
        if (pythonPackages.includes(pkg.toLowerCase())) {
          detected.add(tech);
          break;
        }
      }
    }
    
    // Check file extensions (from TECH_DETECTION patterns)
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

/**
 * POST /api/github/analyze-repo
 * Analyze a GitHub repository and detect its tech stack
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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
    const { url } = body;
    
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/400",
          title: "Bad Request",
          status: 400,
          detail: "GitHub URL is required",
        },
        { status: 400 }
      );
    }
    
    // Parse GitHub URL
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/400",
          title: "Bad Request",
          status: 400,
          detail: "Invalid GitHub URL. Please provide a valid GitHub repository URL.",
        },
        { status: 400 }
      );
    }
    
    const { owner, repo } = parsed;
    
    // Fetch repository data in parallel
    const [files, packageJson, pythonPackages] = await Promise.all([
      fetchRepoTree(owner, repo),
      fetchPackageJson(owner, repo),
      fetchRequirementsTxt(owner, repo),
    ]);
    
    // Detect tech stack using multi-strategy approach
    const techStack = detectTechStack(files, packageJson, pythonPackages);
    
    // Count file types for metadata
    const extensionStats: Record<string, number> = {};
    for (const file of files) {
      const ext = file.split(".").pop()?.toLowerCase();
      if (ext && ext.length <= 10) {
        extensionStats[ext] = (extensionStats[ext] || 0) + 1;
      }
    }
    
    // Get top 10 extensions
    const topExtensions = Object.entries(extensionStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ext, count]) => ({ ext: `.${ext}`, count }));
    
    // Get repository info for additional context
    const repoInfo = {
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}`,
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
    console.error("GitHub analyze error:", error);
    
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
