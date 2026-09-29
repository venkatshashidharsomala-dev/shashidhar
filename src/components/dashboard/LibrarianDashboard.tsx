import React from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book } from "../../types";
import {
  BookOpen,
  RotateCcw,
  Barcode as BarcodeIcon,
  AlertTriangle,
  ArrowRight,
  Clock,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";

interface LibrarianDashboardProps {
  onNavigate: (view: string) => void;
  onOpenQRScanner: (mode: "general" | "issue" | "return") => void;
  onSelectBook: (book: Book) => void;
}

export const LibrarianDashboard: React.FC<LibrarianDashboardProps> = ({
  onNavigate,
  onOpenQRScanner,
}) => {
  const { currentUser, transactions, books } = useLibrary();

  const activeIssuedCount = transactions.filter((t) => t.status === "issued").length;
  const overdueCount = transactions.filter(
    (t) => t.status === "overdue" || (t.status === "issued" && new Date(t.dueDate) < new Date())
  ).length;
  const returnedCount = transactions.filter((t) => t.status === "returned").length;

  const overdueList = transactions
    .filter((t) => t.status === "overdue" || (t.status === "issued" && new Date(t.dueDate) < new Date()))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Librarian Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Circulation Officer Terminal
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            Welcome, {currentUser.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Station: Main Circulation Desk • Fast checkouts, returns, and barcode lookups
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate("issue-book")}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-200 dark:shadow-none transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Issue Book
          </button>
          <button
            type="button"
            onClick={() => onNavigate("return-book")}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Process Return
          </button>
          <button
            type="button"
            onClick={() => onOpenQRScanner("general")}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-300/40 dark:shadow-none transition flex items-center gap-2 transform hover:-translate-y-0.5"
            title="Scan Book Barcode"
          >
            <BarcodeIcon className="w-4 h-4 text-white" />
            <span>Scan Book Barcode</span>
          </button>
        </div>
      </div>

      {/* KPI Counters - High Density */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Circulations
          </span>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {activeIssuedCount}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">In possession</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Overdue Borrowings
          </span>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overdueCount}
            </h3>
            <span className="text-[10px] text-red-700 dark:text-red-400 font-medium py-0.5 px-1.5 bg-red-50 dark:bg-red-950/50 rounded">
              Crit: {overdueCount}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Returned This Term
          </span>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {returnedCount}
            </h3>
            <span className="text-[10px] text-green-700 dark:text-green-400 font-medium py-0.5 px-1.5 bg-green-50 dark:bg-green-950/50 rounded">
              Restocked
            </span>
          </div>
        </div>
      </div>

      {/* Overdue Borrowings Action Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Overdue Follow-up Priority List
            </h3>
          </div>
          <button
            onClick={() => onNavigate("transactions")}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
          >
            All Overdues <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {overdueList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No overdue items currently requiring collection action.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueList.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-lg border border-red-200 dark:border-red-950/60 bg-red-50/30 dark:bg-red-950/10 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {tx.bookTitle}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Student: <span className="font-medium text-slate-800 dark:text-slate-200">{tx.studentName}</span> ({tx.studentId})
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-red-600 font-medium">
                    <Clock className="w-3 h-3" /> Due Date: {tx.dueDate}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate("return-book")}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition shrink-0"
                >
                  Return
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigate("books")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-blue-400 cursor-pointer transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Inventory & Catalog Lookup
            </h4>
            <p className="text-[11px] text-slate-500">
              Browse {books.length} academic textbooks, shelf locations, and print barcode tags
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate("smart-recommendations")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-blue-400 cursor-pointer transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              AI Academic Reference Assistant
            </h4>
            <p className="text-[11px] text-slate-500">
              Assisting students with project bibliography and curriculum syllabus books
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
