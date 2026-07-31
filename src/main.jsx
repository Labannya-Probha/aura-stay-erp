import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { SUPABASE_CONFIGURED } from './lib/supabase.js'
import { installUiDebugInstrumentation } from './debug/uiDebug'
import { ToastProvider } from './components/Toast'
import { PopoverProvider } from './contexts/PopoverContext'
import { AedsDialogProvider } from './components/dialog-engine'

function renderFallback(message = 'The app could not start.') {
  const rootElement = document.getElementById('root')
  if (!rootElement) return

  rootElement.innerHTML = `
    <div style="display:flex;min-height:100vh;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;background:#F7F5F2;">
      <div style="text-align:center;color:#1B4D2E;max-width:440px;padding:40px;">
        <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:10px;">Unable to load the app</h2>
        <p style="color:#5F5A55;font-size:14px;line-height:1.6;">${message}</p>
      </div>
    </div>
  `
}

installUiDebugInstrumentation()

// Catch any React render-tree error and show a helpful message rather than a
// blank page.  Module-level failures (e.g. missing env vars) are handled below
// before React mounts, so this boundary covers all in-tree runtime errors.
class ErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'IBM Plex Sans',sans-serif",
            background: '#F7F5F2',
          }}
        >
          <div style={{ textAlign: 'center', color: '#1B4D2E', maxWidth: 420, padding: 40 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10 }}>
              Something went wrong
            </h2>
            <p style={{ color: '#5F5A55', fontSize: 14, lineHeight: 1.6 }}>
              An unexpected error occurred. Please reload the page or contact your administrator.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 20,
                padding: '8px 20px',
                background: '#1F6F78',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

if (!SUPABASE_CONFIGURED) {
  renderFallback(
    'Supabase environment variables are not set. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY) and reload the app.',
  )
} else {
  try {
    const rootElement = document.getElementById('root')
    if (!rootElement) {
      renderFallback('The root container was not found.')
    } else {
      ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
          <PopoverProvider>
            <ToastProvider>
              <AedsDialogProvider>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
              </AedsDialogProvider>
            </ToastProvider>
          </PopoverProvider>
        </React.StrictMode>,
      )
    }
  } catch (error) {
    console.error('Failed to mount app:', error)
    renderFallback(error?.message || 'Unexpected startup error.')
  }
}
