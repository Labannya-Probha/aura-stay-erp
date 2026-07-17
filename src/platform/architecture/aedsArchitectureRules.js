export const AEDS_ARCHITECTURE_RULES = Object.freeze({
  folders: {
    platform: "Cross-module architecture and metadata contracts",
    modules: "Domain modules and page orchestration",
    components: "Reusable UI components",
    enterprise: "Enterprise extension engines",
    lib: "Pure utilities and domain-agnostic helpers",
    services: "External IO and Supabase access",
    hooks: "Reusable stateful behavior",
    pages: "Legacy compatibility only; migrate into modules",
  },
  importRules: [
    "modules may import platform, components, enterprise, hooks, lib, services",
    "components must not import domain pages",
    "platform must not import domain modules",
    "services must not render UI",
    "metadata files must be serializable where possible",
    "tenant_id filtering is mandatory in service-level data access",
  ],
  naming: {
    components: "PascalCase",
    hooks: "useCamelCase",
    services: "camelCase.service.js",
    metadata: "camelCase.metadata.js",
    database: "snake_case",
    routes: "kebab-case",
  },
})
