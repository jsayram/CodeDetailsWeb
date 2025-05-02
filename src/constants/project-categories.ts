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
  },
  mobile: {
    label: "Mobile Applications",
    description: "iOS, Android, and cross-platform mobile apps",
  },
  desktop: {
    label: "Desktop Applications",
    description: "Desktop software and system utilities",
  },
  backend: {
    label: "Backend Systems",
    description: "Server-side applications and services",
  },
  "cloud-devops": {
    label: "Cloud & DevOps",
    description: "Cloud infrastructure and deployment systems",
  },
  "data-engineering": {
    label: "Data Engineering",
    description: "Data processing and analytics systems",
  },
  "ai-ml": {
    label: "AI & Machine Learning",
    description: "Artificial intelligence and ML applications",
  },
  "dev-tools": {
    label: "Development Tools",
    description: "Tools and utilities for developers",
  },
  integration: {
    label: "Integration & Extensions",
    description: "System integrations and platform extensions",
  },
  "embedded-iot": {
    label: "Embedded & IoT",
    description: "Embedded systems and Internet of things applications",
  },
  "gaming-graphics": {
    label: "Gaming & Graphics",
    description: "Games and graphics applications",
  },
  security: {
    label: "Cybersecurity",
    description:
      "Security tooling, auditing, pentesting, and DevSecOps projects",
  },
  "blockchain-web3": {
    label: "Blockchain & Web3",
    description:
      "Decentralized applications, smart contracts, and Web3 tooling",
  },
  "ar-vr-xr": {
    label: "AR/VR & XR",
    description: "Augmented, virtual, and extended-reality experiences",
  },
  multimedia: {
    label: "Multimedia & Streaming",
    description: "Audio/video capture, editing, and streaming systems",
  },
  "automation-scripting": {
    label: "Automation & Scripting",
    description: "Automation workflows, RPA, and developer scripts",
  },
  "database-storage": {
    label: "Databases & Storage",
    description: "Database engines, migration tools, and management dashboards",
  },
  "testing-qa": {
    label: "Testing & QA",
    description:
      "Quality-assurance frameworks, test runners, and coverage tools",
  },
  other: {
    label: "Other",
    description: "Miscellaneous projects that don't fit into other categories",
  },
} as const;
