export type ProjectCategory =
  | "web"
  | "mobile"
  | "desktop"
  | "backend"
  | "cloud-devops"
  | "data-engineering"
  | "ai-ml"
  | "dev-tools"
  | "integration"
  | "embedded-iot"
  | "gaming-graphics"
  | "security"
  | "blockchain-web3"
  | "ar-vr-xr"
  | "multimedia"
  | "automation-scripting"
  | "database-storage"
  | "testing-qa"
  | "other";

export const PROJECT_CATEGORIES = {
  web: {
    label: "Web Applications",
    description: "Browser-based applications and websites",
    keywords: "react vue angular svelte nextjs frontend spa pwa html css javascript typescript web app website portal dashboard",
  },
  mobile: {
    label: "Mobile Applications",
    description: "iOS, Android, and cross-platform mobile apps",
    keywords: "ios android react-native flutter swift kotlin java mobile app smartphone tablet cross-platform",
  },
  desktop: {
    label: "Desktop Applications",
    description: "Desktop software and system utilities",
    keywords: "electron tauri windows macos linux desktop gui native application software utility tool",
  },
  backend: {
    label: "Backend Systems",
    description: "Server-side applications and services",
    keywords: "api rest graphql node express fastify nestjs django flask spring microservices server backend service",
  },
  "cloud-devops": {
    label: "Cloud & DevOps",
    description: "Cloud infrastructure and deployment systems",
    keywords: "aws azure gcp kubernetes docker terraform ansible jenkins cicd pipeline deployment infrastructure cloud devops iac container orchestration",
  },
  "data-engineering": {
    label: "Data Engineering",
    description: "Data processing and analytics systems",
    keywords: "etl pipeline spark hadoop kafka airflow databricks snowflake bigquery data warehouse analytics processing batch streaming",
  },
  "ai-ml": {
    label: "AI & Machine Learning",
    description: "Artificial intelligence and ML applications",
    keywords: "machine learning deep learning neural network tensorflow pytorch scikit-learn nlp computer vision ai ml model training inference llm gpt",
  },
  "dev-tools": {
    label: "Development Tools",
    description: "Tools and utilities for developers",
    keywords: "cli tool ide plugin extension vscode intellij debugging profiling linter formatter code-generator sdk library framework",
  },
  integration: {
    label: "Integration & Extensions",
    description: "System integrations and platform extensions",
    keywords: "api integration webhook middleware connector plugin extension addon module adapter bridge gateway third-party",
  },
  "embedded-iot": {
    label: "Embedded & IoT",
    description: "Embedded systems and Internet of things applications",
    keywords: "iot embedded raspberry-pi arduino esp32 sensor actuator firmware hardware microcontroller mqtt zigbee bluetooth wifi smart-home",
  },
  "gaming-graphics": {
    label: "Gaming & Graphics",
    description: "Games and graphics applications",
    keywords: "game unity unreal godot 3d 2d graphics rendering shader opengl vulkan webgl threejs gaming engine simulation physics",
  },
  security: {
    label: "Cybersecurity",
    description: "Security tooling, auditing, pentesting, and DevSecOps projects",
    keywords: "security penetration-testing vulnerability scanner audit encryption authentication authorization owasp devsecops firewall ids ips siem threat-detection malware",
  },
  "blockchain-web3": {
    label: "Blockchain & Web3",
    description: "Decentralized applications, smart contracts, and Web3 tooling",
    keywords: "blockchain ethereum solidity web3 defi nft dapp smart-contract crypto cryptocurrency bitcoin polygon avalanche dao decentralized wallet",
  },
  "ar-vr-xr": {
    label: "AR/VR & XR",
    description: "Augmented, virtual, and extended-reality experiences",
    keywords: "augmented-reality virtual-reality vr ar xr mixed-reality oculus quest hololens spatial metaverse 3d immersive webxr",
  },
  multimedia: {
    label: "Multimedia & Streaming",
    description: "Audio/video capture, editing, and streaming systems",
    keywords: "video audio streaming ffmpeg webrtc hls rtmp transcoding media player editor codec live-stream broadcast podcast recording",
  },
  "automation-scripting": {
    label: "Automation & Scripting",
    description: "Automation workflows, RPA, and developer scripts",
    keywords: "automation script workflow rpa bot selenium puppeteer playwright cron scheduler task workflow-automation python bash shell powershell",
  },
  "database-storage": {
    label: "Databases & Storage",
    description: "Database engines, migration tools, and management dashboards",
    keywords: "database sql nosql postgresql mysql mongodb redis elasticsearch cassandra migration orm prisma sequelize typeorm storage cache",
  },
  "testing-qa": {
    label: "Testing & QA",
    description: "Quality-assurance frameworks, test runners, and coverage tools",
    keywords: "testing jest mocha cypress playwright selenium unit-test integration-test e2e test-automation qa coverage tdd bdd quality-assurance",
  },
  other: {
    label: "Other",
    description: "Miscellaneous projects that don't fit into other categories",
    keywords: "miscellaneous other general experimental prototype proof-of-concept educational learning tutorial",
  },
} as const;
