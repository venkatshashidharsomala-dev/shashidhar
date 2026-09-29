import React, { useState, useRef, useEffect } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book } from "../../types";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  Database,
  LogOut,
} from "lucide-react";

interface TopNavProps {
  onToggleSidebar: () => void;
  onSelectBook: (book: Book) => void;
  onNavigate: (view: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleSidebar,
  onSelectBook,
  onNavigate,
}) => {
  const {
    currentUser,
    switchRole,
    logoutUser,
    databaseStatus,
    darkMode,
    toggleDarkMode,
    notifications,
    markNotificationRead,
    books,
  } = useLibrary();

  const [globalSearch, setGlobalSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter books for quick search
  const searchMatches = globalSearch.trim()
    ? books
        .filter(
          (b) =>
            b.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
            b.author.toLowerCase().includes(globalSearch.toLowerCase()) ||
            b.isbn.toLowerCase().includes(globalSearch.toLowerCase()) ||
            b.shelfLocation.toLowerCase().includes(globalSearch.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 sticky top-0">
      {/* Left: Mobile Toggle & High-Density Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Quick Search - High Density Pill */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search books, ISBN, or students..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchResults && globalSearch.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden z-50">
              {searchMatches.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No matching books found for "{globalSearch}"
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-3 py-1 bg-slate-50 dark:bg-slate-800/60 text-[10px] uppercase font-bold text-slate-400">
                    Quick Results ({searchMatches.length})
                  </div>
                  {searchMatches.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => {
                        onSelectBook(book);
                        setShowSearchResults(false);
                        setGlobalSearch("");
                      }}
                      className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer transition flex items-center gap-2.5"
                    >
                      <img
                        src={book.coverImage}
                        alt=""
                        className="w-7 h-10 object-cover rounded shadow-2xs shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {book.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {book.author} • {book.shelfLocation}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          book.availableCopies > 0
                            ? "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                        }`}
                      >
                        {book.availableCopies > 0 ? "IN STOCK" : "LOANED"}
                      </span>
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      onNavigate("books");
                      setShowSearchResults(false);
                    }}
                    className="p-2 text-center text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    View All in Catalog →
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Role Switcher + Action Button + Notifs + Theme */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher Pill */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => switchRole("admin")}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              currentUser.role === "admin"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => switchRole("librarian")}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              currentUser.role === "librarian"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Librarian
          </button>
          <button
            type="button"
            onClick={() => switchRole("student")}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              currentUser.role === "student"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Student
          </button>
        </div>

        {/* Notifications Bell with Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Notifications
                </h4>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  {unreadNotifCount} unread
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-xs space-y-0.5 cursor-pointer transition ${
                        !n.isRead
                          ? "bg-blue-50/40 dark:bg-blue-950/20 font-medium"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{n.createdAt}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Database Status Indicator */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50"
          title={`Database: ${databaseStatus.engine} (${databaseStatus.status.toUpperCase()})\nStorage: ${databaseStatus.storageType}\nVersion: ${databaseStatus.schemaVersion}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">DB Live</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          id="theme-toggle-btn"
          type="button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="relative flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 transition cursor-pointer group"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300 transition-transform group-hover:-rotate-12" />
          )}
        </button>

        {/* Sign Out Button */}
        <button
          id="topnav-logout-btn"
          type="button"
          onClick={() => logoutUser()}
          aria-label="Sign Out"
          title="Sign Out of LibSmart"
          className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Primary Action Button: + New Issue */}
        {(currentUser.role === "admin" || currentUser.role === "librarian") ? (
          <button
            type="button"
            onClick={() => onNavigate("issue-book")}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-200 dark:shadow-none transition flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Issue</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate("books")}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-200 dark:shadow-none transition flex items-center gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Browse Books</span>
          </button>
        )}
      </div>
    </header>
  );
};
