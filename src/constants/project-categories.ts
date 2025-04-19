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
  | "gaming-graphics";

export const PROJECT_CATEGORIES = {
  web: {
    label: "Web Applications",
    description: "Browser-based applications and websites"
  },
  mobile: {
    label: "Mobile Applications",
    description: "iOS, Android, and cross-platform mobile apps"
  },
  desktop: {
    label: "Desktop Applications",
    description: "Desktop software and system utilities"
  },
  backend: {
    label: "Backend Systems",
    description: "Server-side applications and services"
  },
  "cloud-devops": {
    label: "Cloud & DevOps",
    description: "Cloud infrastructure and deployment systems"
  },
  "data-engineering": {
    label: "Data Engineering",
    description: "Data processing and analytics systems"
  },
  "ai-ml": {
    label: "AI & Machine Learning",
    description: "Artificial intelligence and ML applications"
  },
  "dev-tools": {
    label: "Development Tools",
    description: "Tools and utilities for developers"
  },
  integration: {
    label: "Integration & Extensions",
    description: "System integrations and platform extensions"
  },
  "embedded-iot": {
    label: "Embedded & IoT",
    description: "Embedded systems and IoT applications"
  },
  "gaming-graphics": {
    label: "Gaming & Graphics",
    description: "Games and graphics applications"
  }
} as const;