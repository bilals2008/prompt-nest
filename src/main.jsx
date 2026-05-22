import React from "react"
import ReactDOM from "react-dom/client"
import { HashRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider.jsx"
import App from "./App.jsx"
import Dashboard from "@/pages/Dashboard.jsx"
import AllPrompts from "@/pages/AllPrompts.jsx"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Dashboard />} />
            <Route path="prompts" element={<AllPrompts />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
)

window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message)
})
