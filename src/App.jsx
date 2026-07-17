/* ------------------------------------------------------------------ */
/*  APP ENTRY POINT — AEDS v2 Theme Connected                          */
/* ------------------------------------------------------------------ */
import { BrowserRouter } from "react-router-dom"
import { Analytics } from "@vercel/analytics/react"
import AppSession from "./AppSession"
import { ThemeProvider } from "./theme"
import { AedsPlatformProvider } from "./platform"

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AedsPlatformProvider>
          <AppSession />
          <Analytics />
        </AedsPlatformProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
