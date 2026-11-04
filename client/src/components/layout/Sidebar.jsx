
import { NavLink } from "react-router-dom";
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ScanSearch,
  Bug,
  FileText,
  Settings,
  Activity,
  X,
} from "lucide-react";

import { useUIStore } from "../../stores/useUIStore";

const navigation = [
  {
    label: "Workspace",
    items: [
      { name: "Overview", path: "/", icon: LayoutDashboard },
      { name: "New Scan", path: "/scans/new", icon: ScanSearch },
      { name: "Vulnerabilities", path: "/history", icon: Bug },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Reports", path: "/reports", icon: FileText },
      { name: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    closeMobileSidebar,
  } = useUIStore();

  return (
    <>
      
      {mobileSidebarOpen && (
        <button
          aria-label="Close navigation menu"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`
          app-sidebar
          ${sidebarCollapsed ? "is-collapsed" : ""}
          fixed left-0 top-0 z-50 flex h-dvh flex-col
          transition-all duration-200 ease-in-out
          w-[270px]
          ${
            mobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
          lg:sticky lg:shrink-0
        `}
      >
        
        <div
          className={`relative flex h-[68px] shrink-0 items-center ${
            sidebarCollapsed
              ? "justify-center gap-1 px-1"
              : "justify-between px-5"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)]">
              <ShieldCheck
                size={21}
                className="text-[var(--primary)]"
              />
            </div>

            {!sidebarCollapsed && (
              <div className="flex min-w-0 flex-col">
                <span className="whitespace-nowrap text-[15px] font-bold tracking-tight text-primary">
                  SecureCode AI
                </span>
                <span className="whitespace-nowrap text-[10px] font-medium tracking-wide text-muted">
                  CODE SECURITY PLATFORM
                </span>
              </div>
            )}
          </div>

          
          <button
            onClick={closeMobileSidebar}
            className="rounded-lg p-2 text-muted hover:bg-[var(--surface-soft)] lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>

          
          <button
            onClick={toggleSidebar}
            className="hidden shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-[var(--surface-soft)] hover:text-primary lg:block"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>

        
        <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pt-5">
          {navigation.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {group.label}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={closeMobileSidebar}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={({ isActive }) =>
                        `nav-link overflow-hidden ${
                          isActive ? "nav-link-active" : ""
                        } ${
                          sidebarCollapsed
                            ? "justify-center px-0"
                            : ""
                        }`
                      }
                    >
                      <Icon size={18} className="shrink-0" />

                      {!sidebarCollapsed && (
                        <span className="min-w-0 flex-1 truncate">
                          {item.name}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        
        <div className="mt-auto border-t border-subtle p-3">
          <div
            className={`flex items-center gap-2 text-muted ${
              sidebarCollapsed ? "justify-center" : "px-2"
            }`}
          >
            <Activity size={15} />

            {!sidebarCollapsed && (
              <span className="text-[10px]">
                Security Rules v2.4
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
