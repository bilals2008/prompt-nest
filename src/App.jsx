import { ModeToggle } from "./components/mode-toggle.jsx";

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <header className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Prompt Nest</h1>
        <ModeToggle />
      </header>
      <p className="text-muted-foreground text-sm">
        Electron + React 19 + Vite 8 + shadcn/ui
      </p>
    </div>
  );
}

export default App
