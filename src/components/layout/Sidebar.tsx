import React, { useMemo } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { generateInventoryAlerts } from "../../utils/inventoryAlerts";
import {
  LayoutDashboard,
  BookOpen,
  ArrowRightLeft,
  RotateCcw,
  Receipt,
  Bookmark,
  QrCode,
  Barcode as BarcodeIcon,
  Users,
  Award,
  BarChart3,
  Sparkles,
  Settings,
  ChevronLeft,
  GraduationCap,
  Sun,
  Moon,
  AlertTriangle,
  Megaphone,
  FileText,
  Flame,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenQRScanner: (mode: "general" | "issue" | "return") => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: number | string;
  badgeColor?: string;
  special?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onToggle,
  onOpenQRScanner,
}) => {
  const { currentUser, logoutUser, books, fines, reservations, transactions, announcements, darkMode, toggleDarkMode } = useLibrary();

  const role = currentUser.role;

  const pendingFinesCount = fines.filter((f) => f.status === "pending").length;
  const activeResCount = reservations.filter((r) => r.status === "active").length;

  const alertsCount = useMemo(() => {
    return generateInventoryAlerts(books, transactions, reservations).filter(
      (a) => a.severity === "critical" || a.severity === "warning"
    ).length;
  }, [books, transactions, reservations]);

  const managementItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "librarian", "student"],
    },
    {
      id: "books",
      label: "Books Catalog",
      icon: BookOpen,
      roles: ["admin", "librarian", "student"],
      badge: books.length,
    },
    {
      id: "scan-barcode",
      label: "Scan Barcode",
      icon: BarcodeIcon,
      roles: ["admin", "librarian", "student"],
    },
    {
      id: "issue-book",
      label: "Issue Book",
      icon: ArrowRightLeft,
      roles: ["admin", "librarian"],
    },
    {
      id: "return-book",
      label: "Return Book",
      icon: RotateCcw,
      roles: ["admin", "librarian"],
    },
    {
      id: "transactions",
      label: role === "student" ? "My Borrowed Books" : "Transactions",
      icon: ArrowRightLeft,
      roles: ["admin", "librarian", "student"],
    },
  ];

  const adminItems: NavItem[] = [
    {
      id: "fines",
      label: role === "student" ? "My Fines" : "Fines & Penalties",
      icon: Receipt,
      roles: ["admin", "librarian", "student"],
      badge: pendingFinesCount > 0 ? pendingFinesCount : undefined,
      badgeColor: "bg-red-500 text-white",
    },
    {
      id: "reservations",
      label: role === "student" ? "My Reservations" : "Reservations",
      icon: Bookmark,
      roles: ["admin", "librarian", "student"],
      badge: activeResCount > 0 ? activeResCount : undefined,
      badgeColor: "bg-blue-500 text-white",
    },
    {
      id: "inventory-alerts",
      label: "Inventory Alerts",
      icon: AlertTriangle,
      roles: ["admin", "librarian"],
      badge: alertsCount > 0 ? alertsCount : undefined,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      id: "reading-analytics",
      label: "Reading & Honors",
      icon: Flame,
      roles: ["student"],
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: Megaphone,
      roles: ["admin", "librarian", "student"],
      badge: announcements.length > 0 ? announcements.length : undefined,
      badgeColor: "bg-indigo-500 text-white",
    },
    {
      id: "students",
      label: "Students",
      icon: GraduationCap,
      roles: ["admin", "librarian"],
    },
    {
      id: "librarians",
      label: "Librarians",
      icon: Award,
      roles: ["admin"],
    },
    {
      id: "reports",
      label: "Analytics",
      icon: BarChart3,
      roles: ["admin", "librarian"],
    },
    {
      id: "audit-logs",
      label: "Audit Logs",
      icon: FileText,
      roles: ["admin", "librarian"],
    },
  ];

  const systemItems: NavItem[] = [
    {
      id: "smart-recommendations",
      label: "AI Advisor & Chat",
      icon: Sparkles,
      roles: ["admin", "librarian", "student"],
      special: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => {
    const visible = items.filter((item) => item.roles.includes(role));
    if (visible.length === 0) return null;

    return (
      <div className="space-y-1">
        <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </div>
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "scan-barcode" || item.id === "qr-scanner") {
                  onNavigate("scan-barcode");
                } else {
                  onNavigate(item.id);
                }
                if (window.innerWidth < 1024) onToggle();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : item.special ? "text-blue-400" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.badgeColor || "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container - High Density Slate 900 */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-200 ease-in-out bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 ${
          isOpen ? "w-60 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-60"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top Brand */}
          <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div
              onClick={() => onNavigate("dashboard")}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-xs">
                <div className="w-4 h-4 border-2 border-white rounded-xs"></div>
              </div>
              <h1 className="text-white font-bold text-lg tracking-tight">LibSmart</h1>
            </div>

            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Scanner Action */}
          <div className="px-3 pt-3">
            <button
              type="button"
              onClick={() => onOpenQRScanner("general")}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold rounded-md transition flex items-center justify-center gap-2"
            >
              <BarcodeIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Scan Barcode</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {renderNavGroup("Management", managementItems)}
            {renderNavGroup("Administration", adminItems)}
            {renderNavGroup("Intelligence", systemItems)}
          </nav>
        </div>

        {/* Bottom Current User - High Density Profile & Theme Toggle */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-900">
          <div className="flex items-center justify-between gap-2 px-1 py-1">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold shrink-0">
                {currentUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white leading-tight truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight truncate capitalize mt-0.5">
                  {currentUser.role}
                </p>
              </div>
            </div>

            {/* Quick Dark/Light Mode Switcher in Sidebar */}
            <button
              id="sidebar-theme-toggle"
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition shrink-0 cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Sign Out Button */}
            <button
              id="sidebar-logout-btn"
              type="button"
              onClick={() => logoutUser()}
              aria-label="Sign Out"
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/40 transition shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
