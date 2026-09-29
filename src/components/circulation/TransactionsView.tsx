import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Transaction } from "../../types";
import {
  ArrowLeftRight,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Download,
  Filter,
} from "lucide-react";

interface TransactionsViewProps {
  onQuickReturn?: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onQuickReturn }) => {
  const { transactions, settings, currentUser } = useLibrary();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const canManage = currentUser.role === "admin" || currentUser.role === "librarian";

  // Filter for student vs admin/librarian
  const visibleTransactions = currentUser.role === "student" && currentUser.studentId
    ? transactions.filter((t) => t.studentId === currentUser.studentId)
    : transactions;

  const filteredTransactions = visibleTransactions.filter((tx) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      tx.bookTitle.toLowerCase().includes(q) ||
      tx.studentName.toLowerCase().includes(q) ||
      tx.studentId.toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q) ||
      tx.bookIsbn.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" ||
      tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = "Transaction ID,Book Title,ISBN,Student ID,Student Name,Issue Date,Due Date,Return Date,Status,Fine Amount\n";
    const rows = filteredTransactions.map((t) =>
      `"${t.id}","${t.bookTitle}","${t.bookIsbn}","${t.studentId}","${t.studentName}","${t.issueDate}","${t.dueDate}","${t.returnDate || "N/A"}","${t.status}","${t.fineAmount}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `libsmart-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {currentUser.role === "student" ? "My Borrowing History & Active Loans" : "Circulation Transactions"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentUser.role === "student"
              ? "Track your checked out books, return due dates, and past borrowings"
              : `Comprehensive ledger of all book issues, returns, and overdue borrowings (${transactions.length} records)`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition hover:bg-slate-50 flex items-center gap-2 shadow-xs shrink-0"
        >
          <Download className="w-4 h-4" />
          Export Ledger (CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Transaction ID, student, book title, or Roll No..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="issued">Currently Issued</option>
              <option value="overdue">Overdue Loans</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Displaying <strong>{filteredTransactions.length}</strong> transactions
          </span>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="text-indigo-600 dark:text-indigo-400 font-medium"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">TX ID</th>
                <th className="px-4 py-3 font-semibold">Book Title</th>
                <th className="px-4 py-3 font-semibold">Student Borrower</th>
                <th className="px-4 py-3 font-semibold">Issue Date</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 font-semibold">Return Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Fine</th>
                {canManage && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isOverdue = tx.status === "overdue" || (tx.status === "issued" && new Date(tx.dueDate) < new Date());
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">
                        {tx.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={tx.coverImage}
                            alt=""
                            className="w-7 h-10 object-cover rounded shadow-xs shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white line-clamp-1 max-w-[200px]">
                              {tx.bookTitle}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ISBN: {tx.bookIsbn}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {tx.studentName}
                          </p>
                          <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                            {tx.studentId}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {tx.issueDate}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className={isOverdue ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}>
                          {tx.dueDate}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {tx.returnDate || <span className="text-amber-500">Pending</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === "returned"
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              : isOverdue
                              ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                              : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {tx.status === "returned" ? "RETURNED" : isOverdue ? "OVERDUE" : "ISSUED"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {tx.fineAmount > 0 ? (
                          <span
                            className={`font-semibold ${
                              tx.fineStatus === "paid"
                                ? "text-emerald-600 line-through"
                                : "text-red-600"
                            }`}
                          >
                            {settings.currency}{tx.fineAmount} {tx.fineStatus === "paid" ? "(Paid)" : "(Pending)"}
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          {tx.status !== "returned" && onQuickReturn && (
                            <button
                              type="button"
                              onClick={() => onQuickReturn(tx)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-[11px] font-medium rounded-lg transition"
                            >
                              Process Return
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
