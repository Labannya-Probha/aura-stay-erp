import { AEDS_MODULE_REGISTRY } from "./moduleRegistry"
import { AEDS_PAGE_REGISTRY } from "./pageRegistry"

export function getModuleDefinition(moduleId) {
  return AEDS_MODULE_REGISTRY.find((module) => module.id === moduleId) || null
}

export function getPageDefinition(pageId) {
  return AEDS_PAGE_REGISTRY.find((page) => page.id === pageId) || null
}

export function getModulePages(moduleId) {
  return AEDS_PAGE_REGISTRY.filter((page) => page.moduleId === moduleId)
}
