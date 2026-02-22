import { useState, useCallback, type ReactNode } from "react";
import "./AppShell.css";

interface AppShellProps {
  topBar?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
}

export default function AppShell({
  topBar,
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

        {topBar}
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
