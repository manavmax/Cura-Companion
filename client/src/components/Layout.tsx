import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"

export function Layout() {
  return (
    <div className="min-h-screen gradient-bg dark:gradient-bg-dark">
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 pb-24 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}