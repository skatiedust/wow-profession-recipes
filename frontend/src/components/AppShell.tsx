import { useState, useCallback, type ReactNode } from "react";
import "./AppShell.css";

interface AppShellProps {
  topBarLeft?: ReactNode;
  topBarSearch?: ReactNode;
  topBarRight?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
}

export default function AppShell({
  topBarLeft,
  topBarSearch,
  topBarRight,
  sidebar,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          className="app-topbar__hamburger"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? "\u2715" : "\u2630"}
        </button>

        {topBarLeft ?? <h1 className="app-topbar__title">Guild Recipes</h1>}

        <div className="app-topbar__search">
          {topBarSearch}
        </div>

        <div className="app-topbar__actions">
          {topBarRight}
        </div>
      </header>

      <aside className={`app-sidebar${sidebarOpen ? " open" : ""}`}>
        {sidebar ?? (
          <p className="app-sidebar__placeholder">Select a profession</p>
        )}
      </aside>

      <div
        className={`app-sidebar-overlay${sidebarOpen ? " visible" : ""}`}
        onClick={closeSidebar}
      />

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
