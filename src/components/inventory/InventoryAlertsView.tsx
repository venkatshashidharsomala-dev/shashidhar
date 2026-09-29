import React, { useState, useMemo } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book, CopyCondition } from "../../types";
import { generateInventoryAlerts, InventoryAlert, InventoryAlertSeverity } from "../../utils/inventoryAlerts";
import { SmartShelfLocatorModal } from "../common/SmartShelfLocatorModal";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Layers,
  MapPin,
  Bookmark,
  CheckCircle2,
  TrendingUp,
  Flame,
  Search,
  Wrench,
  Archive,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

interface InventoryAlertsViewProps {
  onSelectBook?: (book: Book) => void;
  onNavigate?: (view: string) => void;
}

export const InventoryAlertsView: React.FC<InventoryAlertsViewProps> = ({
  onSelectBook,
  onNavigate,
}) => {
  const { books, transactions, reservations } = useLibrary();
  const [filterSeverity, setFilterSeverity] = useState<"all" | InventoryAlertSeverity>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [locatorBook, setLocatorBook] = useState<Book | null>(null);

  const alerts = useMemo(() => {
    return generateInventoryAlerts(books, transactions, reservations);
  }, [books, transactions, reservations]);

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const infoCount = alerts.filter((a) => a.severity === "info").length;

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== "all" && alert.severity !== filterSeverity) return false;
    if (filterType !== "all" && alert.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        alert.bookTitle.toLowerCase().includes(q) ||
        alert.title.toLowerCase().includes(q) ||
        alert.message.toLowerCase().includes(q) ||
        (alert.copyId && alert.copyId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAction = (alert: InventoryAlert) => {
    const book = books.find((b) => b.id === alert.bookId);
    if (!book) return;

    if (alert.actionType === "view_reservations" && onNavigate) {
      onNavigate("reservations");
    } else if (alert.actionType === "view_book" || alert.actionType === "manage_copies") {
      if (onSelectBook) onSelectBook(book);
    } else {
      setLocatorBook(book);
    }
  };

  const getAlertIcon = (type: InventoryAlert["type"]) => {
    switch (type) {
      case "zero_copies":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "low_copies":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case "lost_book":
        return <Archive className="w-5 h-5 text-red-500" />;
      case "damaged_book":
      case "maintenance":
        return <Wrench className="w-5 h-5 text-amber-600" />;
      case "frequently_reserved":
        return <Bookmark className="w-5 h-5 text-blue-600" />;
      case "frequently_borrowed":
      case "high_demand":
        return <Flame className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getSeverityBadge = (severity: InventoryAlertSeverity) => {
    switch (severity) {
      case "critical":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
            CRITICAL
          </span>
        );
      case "warning":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            WARNING
          </span>
        );
      case "info":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            VELOCITY
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Smart Inventory Alerts & Rack Maintenance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated notifications for zero availability, low shelf stock, high reservation hold queues, and physical copy health
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setFilterSeverity("all");
            setFilterType("all");
          }}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterSeverity === "all" && filterType === "all"
              ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/20"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Alerts
            </span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {alerts.length}
          </p>
          <span className="text-[11px] text-slate-400">All live inventory triggers</span>
        </div>

        <div
          onClick={() => {
            setFilterSeverity("critical");
            setFilterType("all");
          }}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterSeverity === "critical"
              ? "bg-red-50/50 dark:bg-red-950/30 border-red-300 dark:border-red-800 ring-2 ring-red-500/20"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Zero Stock & Lost
            </span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {criticalCount}
          </p>
          <span className="text-[11px] text-red-500 font-medium">Requires immediate restocking</span>
        </div>

        <div
          onClick={() => {
            setFilterSeverity("warning");
            setFilterType("all");
          }}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterSeverity === "warning"
              ? "bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock & High Holds
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {warningCount}
          </p>
          <span className="text-[11px] text-amber-500 font-medium">1 copy left or student queues</span>
        </div>

        <div
          onClick={() => {
            setFilterSeverity("info");
            setFilterType("all");
          }}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterSeverity === "info"
              ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              High Velocity
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {infoCount}
          </p>
          <span className="text-[11px] text-blue-500 font-medium">Frequent circulation & repairs</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setFilterSeverity("all");
                setFilterType("all");
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterSeverity === "all" && filterType === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => {
                setFilterSeverity("critical");
                setFilterType("zero_copies");
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterType === "zero_copies"
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Zero Copies ({alerts.filter((a) => a.type === "zero_copies").length})
            </button>
            <button
              onClick={() => {
                setFilterSeverity("warning");
                setFilterType("low_copies");
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterType === "low_copies"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Low Stock ({alerts.filter((a) => a.type === "low_copies").length})
            </button>
            <button
              onClick={() => {
                setFilterSeverity("warning");
                setFilterType("frequently_reserved");
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterType === "frequently_reserved"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              High Hold Queue ({alerts.filter((a) => a.type === "frequently_reserved").length})
            </button>
            <button
              onClick={() => {
                setFilterSeverity("all");
                setFilterType("frequently_borrowed");
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterType === "frequently_borrowed"
                  ? "bg-orange-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              High Circulation ({alerts.filter((a) => a.type === "frequently_borrowed").length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, rack, or copy ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No Inventory Alerts
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All books in this filter category have healthy shelf availability and no pending maintenance issues.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const book = books.find((b) => b.id === alert.bookId);
            return (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shrink-0">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {alert.title}
                      </h4>
                      {getSeverityBadge(alert.severity)}
                      {alert.copyId && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {alert.copyId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {alert.message}
                    </p>
                    {book && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span>Shelf: <strong>{book.shelfLocation || "Block A • Rack 1"}</strong></span>
                        <span>•</span>
                        <span>Available: <strong className={book.availableCopies === 0 ? "text-red-500 font-bold" : "text-slate-700 dark:text-slate-200"}>{book.availableCopies}/{book.totalCopies} copies</strong></span>
                        {book.category && (
                          <>
                            <span>•</span>
                            <span className="truncate">{book.category}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {book && (
                    <button
                      type="button"
                      onClick={() => setLocatorBook(book)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      Locate Shelf
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAction(alert)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{alert.actionText}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Smart Shelf Locator Modal */}
      {locatorBook && (
        <SmartShelfLocatorModal
          book={locatorBook}
          isOpen={!!locatorBook}
          onClose={() => setLocatorBook(null)}
        />
      )}
    </div>
  );
};
