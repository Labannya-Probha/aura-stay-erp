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

function getStorage() {
  return globalThis?.localStorage || null
}

function readStorage(key) {
  const storage = getStorage()
  if (!storage) return []

  try {
    return JSON.parse(storage.getItem(key) || "[]")
  } catch (error) {
    console.warn(`Unable to read navigation storage: ${key}`, error)
    return []
  }
}

function writeStorage(key, value) {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Unable to write navigation storage: ${key}`, error)
  }
}

export function useNavigationEngine({ role = "ADMIN" } = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [commandOpen, setCommandOpen] = useState(false)
  const [favorites, setFavorites] = useState(() => readStorage(FAVORITE_KEY))
  const [recent, setRecent] = useState(() => readStorage(RECENT_KEY))

  const items = useMemo(
    () => NAVIGATION_REGISTRY.filter((item) => canAccess(item, role)),
    [role]
  )

  const flatItems = useMemo(() => flattenNav(items), [items])

  const activeItem = useMemo(
    () =>
      flatItems
        .filter(
          (item) =>
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`)
        )
        .sort((a, b) => b.path.length - a.path.length)[0],
    [flatItems, location.pathname]
  )

  const breadcrumbs = useMemo(() => {
    if (!activeItem) {
      return [{ label: "Dashboard", path: "/dashboard", current: true }]
    }

    if (activeItem.parentLabel) {
      const parent = flatItems.find((item) => item.id === activeItem.parentId)

      return [
        {
          label: parent?.label || activeItem.parentLabel,
          path: parent?.path || "/",
        },
        {
          label: activeItem.label,
          path: activeItem.path,
          current: true,
        },
      ]
    }

    return [
      {
        label: activeItem.label,
        path: activeItem.path,
        current: true,
      },
    ]
  }, [activeItem, flatItems])

  useEffect(() => {
    if (!activeItem) return

    setRecent((current) => {
      const next = [
        {
          id: activeItem.id,
          label: activeItem.label,
          path: activeItem.path,
          visitedAt: new Date().toISOString(),
        },
        ...current.filter((item) => item.path !== activeItem.path),
      ].slice(0, 10)

      writeStorage(RECENT_KEY, next)
      return next
    })
  }, [activeItem])

  useEffect(() => {
    const browserWindow = globalThis?.window
    if (!browserWindow) return undefined

    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setCommandOpen(true)
      }
    }

    browserWindow.addEventListener("keydown", onKeyDown)

    return () => {
      browserWindow.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const go = (path) => {
    navigate(path)
    setCommandOpen(false)
  }

  const toggleFavorite = (item) => {
    setFavorites((current) => {
      const exists = current.some((favorite) => favorite.path === item.path)

      const next = exists
        ? current.filter((favorite) => favorite.path !== item.path)
        : [
            {
              id: item.id,
              label: item.label,
              path: item.path,
            },
            ...current,
          ].slice(0, 12)

      writeStorage(FAVORITE_KEY, next)
      return next
    })
  }

  return {
    items,
    flatItems,
    activeItem,
    breadcrumbs,
    commandOpen,
    setCommandOpen,
    favorites,
    recent,
    go,
    toggleFavorite,
  }
}
