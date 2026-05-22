// File: src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@/components/theme-provider.jsx'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
