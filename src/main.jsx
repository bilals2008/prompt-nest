// File: src/main.jsx
import React from "react"
import ReactDOM from "react-dom/client"
import { HashRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider.jsx"
import App from "./App.jsx"
import Dashboard from "@/pages/Dashboard.jsx"
import AllPrompts from "@/pages/AllPrompts.jsx"
import PromptEditor from "@/pages/PromptEditor.jsx"
import Collections from "@/pages/Collections.jsx"
import Favorites from "@/pages/Favorites.jsx"
import Search from "@/pages/Search.jsx"
import RecentActivity from "@/pages/RecentActivity.jsx"
import Templates from "@/pages/Templates.jsx"
import ExportImport from "@/pages/ExportImport.jsx"
import Settings from "@/pages/Settings.jsx"
import Changelog from "@/pages/Changelog.jsx"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Dashboard />} />
            <Route path="prompts" element={<AllPrompts />} />
            <Route path="prompts/new" element={<PromptEditor />} />
            <Route path="prompts/:id/edit" element={<PromptEditor />} />
            <Route path="collections" element={<Collections />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="search" element={<Search />} />
            <Route path="activity" element={<RecentActivity />} />
            <Route path="templates" element={<Templates />} />
            <Route path="export" element={<ExportImport />} />
            <Route path="settings" element={<Settings />} />
            <Route path="changelog" element={<Changelog />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
)


