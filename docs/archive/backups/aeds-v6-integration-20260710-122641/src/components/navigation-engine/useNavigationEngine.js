import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { NAVIGATION_REGISTRY } from "./navigationRegistry"

const RECENT_KEY = "aeds.navigation.recent"
const FAVORITE_KEY = "aeds.navigation.favorites"

function canAccess(item, role) {
  return !item.roles || item.roles.includes(role) || role === "SUPERUSER"
}

function flattenNav(items) {
  return items.flatMap((item) => [
    item,
    ...(item.children || []).map((child) => ({
      ...child,
      parentId: item.id,
      parentLabel: item.label,
      icon: item.icon,
      group: item.group,
    })),
  ])
}

function readStorage(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]") } catch { return [] }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function useNavigationEngine({ role = "ADMIN" } = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [commandOpen, setCommandOpen] = useState(false)
  const [favorites, setFavorites] = useState(() => readStorage(FAVORITE_KEY))
  const [recent, setRecent] = useState(() => readStorage(RECENT_KEY))

  const items = useMemo(() => NAVIGATION_REGISTRY.filter((item) => canAccess(item, role)), [role])
  const flatItems = useMemo(() => flattenNav(items), [items])

  const activeItem = useMemo(() => (
    flatItems
      .filter((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0]
  ), [flatItems, location.pathname])

  const breadcrumbs = useMemo(() => {
    if (!activeItem) return [{ label: "Dashboard", path: "/dashboard", current: true }]
    if (activeItem.parentLabel) {
      const parent = flatItems.find((item) => item.id === activeItem.parentId)
      return [
        { label: parent?.label || activeItem.parentLabel, path: parent?.path || "/" },
        { label: activeItem.label, path: activeItem.path, current: true },
      ]
    }
    return [{ label: activeItem.label, path: activeItem.path, current: true }]
  }, [activeItem, flatItems])

  useEffect(() => {
    if (!activeItem) return
    const next = [
      { id: activeItem.id, label: activeItem.label, path: activeItem.path, visitedAt: new Date().toISOString() },
      ...recent.filter((item) => item.path !== activeItem.path),
    ].slice(0, 10)
    setRecent(next)
    writeStorage(RECENT_KEY, next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.path])

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setCommandOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const go = (path) => { navigate(path); setCommandOpen(false) }

  const toggleFavorite = (item) => {
    const exists = favorites.some((favorite) => favorite.path === item.path)
    const next = exists
      ? favorites.filter((favorite) => favorite.path !== item.path)
      : [{ id: item.id, label: item.label, path: item.path }, ...favorites].slice(0, 12)
    setFavorites(next)
    writeStorage(FAVORITE_KEY, next)
  }

  return { items, flatItems, activeItem, breadcrumbs, commandOpen, setCommandOpen, favorites, recent, go, toggleFavorite }
}
