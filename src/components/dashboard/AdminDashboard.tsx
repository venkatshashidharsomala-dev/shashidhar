import React from "react";
import { useLibrary } from "../../context/LibraryContext";
import { initialMonthlyStats } from "../../data/mockData";
import { Book } from "../../types";
import {
  BookOpen,
  ArrowLeftRight,
  AlertTriangle,
  RotateCcw,
  QrCode,
  Barcode as BarcodeIcon,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
  onOpenQRScanner: (mode: "general" | "issue" | "return") => void;
  onSelectBook: (book: Book) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onOpenQRScanner,
  onSelectBook,
}) => {
  const { books, transactions, fines, settings, categories } = useLibrary();
  const monthlyStats = initialMonthlyStats;

  const totalBooksCount = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const availableBooksCount = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const issuedBooksCount = transactions.filter((t) => t.status === "issued").length;
  const overdueLoansCount = transactions.filter(
    (t) => t.status === "overdue" || (t.status === "issued" && new Date(t.dueDate) < new Date())
  ).length;

  const pendingFines = fines
    .filter((f) => f.status === "pending")
    .reduce((sum, f) => sum + f.amount, 0);

  const recentTransactions = transactions.slice(0, 6);

  // Top categories with counts
  const categoryCounts = categories.map((cat) => {
    const count = books.filter((b) => b.categoryId === cat.id).length;
    return { name: cat.name, count };
  }).sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 4 High-Density KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Books */}
        <div
          onClick={() => onNavigate("books")}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Books
          </p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalBooksCount.toLocaleString()}
            </h3>
            <span className="text-[10px] text-green-700 dark:text-green-400 font-medium py-0.5 px-1.5 bg-green-50 dark:bg-green-950/50 rounded">
              +{availableBooksCount} avail
            </span>
          </div>
        </div>

        {/* Currently Issued */}
        <div
          onClick={() => onNavigate("transactions")}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Currently Issued
          </p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {issuedBooksCount}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              {totalBooksCount > 0 ? ((issuedBooksCount / totalBooksCount) * 100).toFixed(1) : 0}% cap.
            </span>
          </div>
        </div>

        {/* Overdue Books */}
        <div
          onClick={() => onNavigate("transactions")}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Overdue Books
          </p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overdueLoansCount}
            </h3>
            <span className="text-[10px] text-red-700 dark:text-red-400 font-medium py-0.5 px-1.5 bg-red-50 dark:bg-red-950/50 rounded">
              Crit: {overdueLoansCount}
            </span>
          </div>
        </div>

        {/* Pending Fines */}
        <div
          onClick={() => onNavigate("fines")}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Fines
          </p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {settings.currency}{pendingFines}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              {settings.currency}{settings.finePerDay}/day
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Borrowing Statistics (8 cols) + Rapid Action / Popular Categories (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Borrowing Statistics Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Borrowing Statistics
              </h4>
              <p className="text-xs text-slate-500">
                Semester circulation lending and return velocity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate("reports")}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                Detailed Analytics <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    color: "#ffffff",
                    borderRadius: "6px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="issued" name="Issued" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returned" name="Returned" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between mt-3 px-2 text-[10px] text-slate-400 font-medium uppercase border-t border-slate-100 dark:border-slate-800 pt-2">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
          </div>
        </div>

        {/* Right Column: Barcode Rapid Action & Popular Categories */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Barcode Rapid Action Card (High-Density Gradient) */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-5 text-white shadow-xs">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
              <BarcodeIcon className="w-4 h-4" /> Barcode Rapid Action
            </h4>
            <div className="flex items-center gap-4 bg-white/10 rounded-lg p-3 backdrop-blur-xs">
              <div className="w-16 h-16 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center">
                <BarcodeIcon className="w-10 h-10 text-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-tight opacity-90">
                  Quick scan for physical book issue, return, or inventory check.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenQRScanner("general")}
                  className="mt-2 px-3.5 py-1.5 bg-white text-indigo-700 text-xs font-bold rounded-lg shadow-xs hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <BarcodeIcon className="w-3.5 h-3.5" />
                  Scan Book Barcode
                </button>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Popular Categories
            </h4>
            <div className="space-y-3">
              {categoryCounts.map((cat, idx) => {
                const percentage = totalBooksCount > 0 ? Math.min(100, Math.round((cat.count / books.length) * 100 * 2)) : 50;
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {cat.name}
                      </span>
                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {cat.count} titles
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${idx === 0 ? "bg-blue-600" : idx === 1 ? "bg-indigo-500" : "bg-cyan-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table (High Density) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h4>
            <p className="text-xs text-slate-500">
              Live ledger of checkouts and returns across all library desks
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("transactions")}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            View All History
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase text-slate-500 font-bold sticky top-0">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Book Title</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((tx, idx) => {
                const isOverdue =
                  tx.status === "overdue" ||
                  (tx.status === "issued" && new Date(tx.dueDate) < new Date());
                const initials = tx.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const avatarColors = [
                  "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
                  "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
                  "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
                  "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
                ];
                const avatarColor = avatarColors[idx % avatarColors.length];

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${avatarColor}`}
                        >
                          {initials}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {tx.studentName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {tx.bookTitle}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{tx.issueDate}</td>
                    <td className={`px-4 py-3 ${isOverdue ? "text-red-500 font-semibold" : "text-slate-500"}`}>
                      {tx.dueDate}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === "returned"
                            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            : isOverdue
                            ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                            : "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                        }`}
                      >
                        {tx.status === "returned" ? "RETURNED" : isOverdue ? "OVERDUE" : "ACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tx.status !== "returned" ? (
                        <button
                          type="button"
                          onClick={() => onNavigate("return-book")}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold"
                        >
                          Return
                        </button>
                      ) : (
                        <span className="text-slate-400 font-bold cursor-not-allowed">Closed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
