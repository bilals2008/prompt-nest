import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"

function App() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AppSidebar />
      <main className="ml-18 flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default App
