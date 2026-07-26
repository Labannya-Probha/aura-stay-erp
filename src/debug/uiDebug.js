const DEBUG_KEY = '__AEDS_UI_DEBUG__'
const MAX_EVENTS = 80

function toBool(value) {
  if (value == null) return false
  const text = String(value).trim().toLowerCase()
  return text === '1' || text === 'true' || text === 'yes' || text === 'on'
}

export function isUiDebugEnabled() {
  if (typeof window === 'undefined') return false

  const queryValue = new URLSearchParams(window.location.search).get('debug_ui')
  if (queryValue !== null) return toBool(queryValue)

  try {
    return toBool(localStorage.getItem('aeds.debug_ui'))
  } catch {
    return false
  }
}

function createStore() {
  return {
    enabled: isUiDebugEnabled(),
    fetchInstrumented: false,
    events: [],
    visibleModules: [],
    hiddenModules: [],
    counters: {
      networkFailures: 0,
      permissionHidden: 0,
    },
  }
}

export function getUiDebugStore() {
  if (typeof window === 'undefined') return createStore()

  if (!window[DEBUG_KEY]) {
    window[DEBUG_KEY] = createStore()
  }

  return window[DEBUG_KEY]
}

function emitUpdate() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('aeds-ui-debug-update'))
}

function pushEvent(entry) {
  const store = getUiDebugStore()
  const nextEvent = {
    at: new Date().toISOString(),
    ...entry,
  }

  store.events = [nextEvent, ...store.events].slice(0, MAX_EVENTS)

  if (entry.type === 'network-failure') {
    store.counters.networkFailures += 1
  }

  if (entry.type === 'permission-hidden') {
    store.counters.permissionHidden += 1
  }

  emitUpdate()
}

export function installUiDebugInstrumentation() {
  const store = getUiDebugStore()
  if (!store.enabled || store.fetchInstrumented || typeof window === 'undefined') return

  const originalFetch = window.fetch.bind(window)
  window.fetch = async (...args) => {
    const [input] = args
    const url = typeof input === 'string' ? input : input?.url || 'unknown'

    try {
      const response = await originalFetch(...args)
      if (!response.ok) {
        pushEvent({
          type: 'network-failure',
          source: 'fetch',
          status: response.status,
          method: args?.[1]?.method || 'GET',
          url,
          detail: `HTTP ${response.status}`,
        })
      }
      return response
    } catch (error) {
      pushEvent({
        type: 'network-failure',
        source: 'fetch',
        status: null,
        method: args?.[1]?.method || 'GET',
        url,
        detail: error?.message || 'Network request failed',
      })
      throw error
    }
  }

  store.fetchInstrumented = true
  emitUpdate()
}

export function recordPermissionHidden(payload) {
  const store = getUiDebugStore()
  if (!store.enabled) return

  pushEvent({
    type: 'permission-hidden',
    ...payload,
  })
}

export function recordSidebarSnapshot(payload) {
  const store = getUiDebugStore()
  if (!store.enabled) return

  store.visibleModules = payload.visibleModules || []
  store.hiddenModules = payload.hiddenModules || []
  emitUpdate()
}

export function getUiDebugSnapshot() {
  const store = getUiDebugStore()
  return {
    enabled: store.enabled,
    counters: { ...store.counters },
    visibleModules: [...store.visibleModules],
    hiddenModules: [...store.hiddenModules],
    events: [...store.events],
  }
}
