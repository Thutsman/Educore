import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from '@/components/common/Sidebar'
import { Topbar } from '@/components/common/Topbar'
import { SidebarContext, useSidebarState } from '@/hooks/useSidebar'

export function AppLayout() {
  const sidebarState = useSidebarState()
  const location = useLocation()

  // Close mobile sidebar on every route change
  useEffect(() => {
    sidebarState.closeMobile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <SidebarContext.Provider value={sidebarState}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
            <div className="mx-auto max-w-screen-2xl p-4 sm:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
