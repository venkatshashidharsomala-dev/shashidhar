import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { FineRecord } from "../../types";
import { ReceiptModal } from "../common/ReceiptModal";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  CreditCard,
  Banknote,
  Receipt,
  FileText,
  ShieldAlert,
  HelpCircle,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";

export const FinesView: React.FC = () => {
  const { fines, payFine, waiveFine, settings, currentUser } = useLibrary();

  const [activeTab, setActiveTab] = useState<"pending" | "paid" | "waived" | "all">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<FineRecord | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [paymentModeModal, setPaymentModeModal] = useState<FineRecord | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<"Cash" | "UPI" | "Online">("UPI");
  const [waiveModalFine, setWaiveModalFine] = useState<FineRecord | null>(null);
  const [waiverReason, setWaiverReason] = useState("Medical Exemption");
  const [waiverNotes, setWaiverNotes] = useState("");

  const canManage = currentUser.role === "admin" || currentUser.role === "librarian";

  const visibleFines = currentUser.role === "student" && currentUser.studentId
    ? fines.filter((f) => f.studentId === currentUser.studentId)
    : fines;

  const totalCollected = visibleFines
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + f.amount, 0);

  const totalPending = visibleFines
    .filter((f) => f.status === "pending")
    .reduce((sum, f) => sum + f.amount, 0);

  const totalWaived = visibleFines
    .filter((f) => f.status === "waived")
    .reduce((sum, f) => sum + f.amount, 0);

  const filteredFines = visibleFines.filter((fine) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      fine.studentName.toLowerCase().includes(q) ||
      fine.studentId.toLowerCase().includes(q) ||
      fine.bookTitle.toLowerCase().includes(q) ||
      fine.id.toLowerCase().includes(q);

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && fine.status === "pending") ||
      (activeTab === "paid" && fine.status === "paid") ||
      (activeTab === "waived" && fine.status === "waived");

    return matchesSearch && matchesTab;
  });

  const handlePayClick = (fine: FineRecord) => {
    setPaymentModeModal(fine);
  };

  const handleConfirmPayment = () => {
    if (paymentModeModal) {
      const updatedFine = payFine(paymentModeModal.id, selectedPaymentMode);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setPaymentModeModal(null);
      if (updatedFine) {
        setSelectedReceipt(updatedFine);
        setIsReceiptOpen(true);
      }
    }
  };

  const handleConfirmWaive = () => {
    if (waiveModalFine) {
      const fullReason = waiverNotes ? `${waiverReason} - ${waiverNotes}` : waiverReason;
      const res = waiveFine(waiveModalFine.id, fullReason, currentUser.name || "Library Admin");
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      setWaiveModalFine(null);
      setWaiverNotes("");
    }
  };

  const handleViewReceipt = (fine: FineRecord) => {
    setSelectedReceipt(fine);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {currentUser.role === "student" ? "My Fine Dues & Receipts" : "Fine Management & Settlement Desk"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Overdue assessments at {settings.currency}{settings.finePerDay}/day with automated clearance vouchers
          </p>
        </div>
      </div>

      {/* Summary Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Dues
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
            {settings.currency}{totalPending}.00
          </p>
          <span className="text-[11px] text-slate-400">
            {visibleFines.filter((f) => f.status === "pending").length} unpaid fine notices
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Cleared / Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {settings.currency}{totalCollected}.00
          </p>
          <span className="text-[11px] text-slate-400">
            {visibleFines.filter((f) => f.status === "paid").length} receipts generated
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Policy Fine Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {settings.currency}{settings.finePerDay} <span className="text-xs font-normal text-slate-500">/ overdue day</span>
          </p>
          <span className="text-[11px] text-slate-400">Standard BCA library ordinance</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "pending"
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Pending ({visibleFines.filter((f) => f.status === "pending").length})
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "paid"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Paid ({visibleFines.filter((f) => f.status === "paid").length})
            </button>
            <button
              onClick={() => setActiveTab("waived")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "waived"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Waived ({visibleFines.filter((f) => f.status === "waived").length})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              All Records ({visibleFines.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student, book, or Roll No..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Fines Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Fine ID</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Book Title</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 font-semibold">Days Overdue</th>
                <th className="px-4 py-3 font-semibold">Fine Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredFines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No fine records found in this category.
                  </td>
                </tr>
              ) : (
                filteredFines.map((fine) => {
                  const isPaid = fine.status === "paid";
                  const isWaived = fine.status === "waived";
                  return (
                    <tr
                      key={fine.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-mono text-slate-400">{fine.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {fine.studentName}
                        </p>
                        <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                          {fine.studentId}
                        </p>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate font-medium text-slate-800 dark:text-slate-200">
                        {fine.bookTitle}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{fine.dueDate}</td>
                      <td className="px-4 py-3 text-red-500 font-semibold">
                        {fine.daysOverdue} days
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {settings.currency}{fine.amount}.00
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                              : isWaived
                              ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                              : "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {isPaid ? "PAID" : isWaived ? "WAIVED" : "PENDING"}
                        </span>
                        {isWaived && fine.waiverReason && (
                          <span className="block text-[9px] text-slate-400 truncate max-w-[120px] mt-0.5" title={fine.waiverReason}>
                            {fine.waiverReason}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid ? (
                            <button
                              type="button"
                              onClick={() => handleViewReceipt(fine)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-medium transition flex items-center gap-1"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Receipt
                            </button>
                          ) : isWaived ? (
                            <span className="text-[11px] text-slate-400 italic">
                              Waived by {fine.processedBy || "Staff"}
                            </span>
                          ) : canManage ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePayClick(fine)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Collect
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setWaiveModalFine(fine);
                                  setWaiverReason("Medical Exemption");
                                  setWaiverNotes("");
                                }}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-950/50 dark:hover:text-amber-300 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-medium transition flex items-center gap-1"
                                title="Waive this fine with justification"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Waive
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-amber-600 font-medium">
                              Pay at Desk / UPI
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waive Fine Modal */}
      {waiveModalFine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Waive Overdue Fine
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWaiveModalFine(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <p className="text-slate-600 dark:text-slate-300">
                Student: <strong>{waiveModalFine.studentName}</strong> ({waiveModalFine.studentId})
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Book: <strong>{waiveModalFine.bookTitle}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Overdue Amount: <strong className="text-red-600">{settings.currency}{waiveModalFine.amount}.00</strong> ({waiveModalFine.daysOverdue} days late)
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Waiver Reason / Category
                </label>
                <select
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Medical Exemption">Medical Exemption (Medical Certificate Verified)</option>
                  <option value="Department/Dean Approval">Department / Dean Special Approval</option>
                  <option value="Semester Project Extension">Semester Project / Lab Extension</option>
                  <option value="First-Time Grace Period">First-Time Grace Waiver (Warning Given)</option>
                  <option value="System/Inventory Reconciliation">System / Inventory Reconciliation</option>
                  <option value="Other Official Reason">Other Official Exemption</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Administrative Remarks / Voucher Notes
                </label>
                <textarea
                  rows={2}
                  value={waiverNotes}
                  onChange={(e) => setWaiverNotes(e.target.value)}
                  placeholder="Optional authorization note (e.g., Dean approval letter #2024-81)..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWaiveModalFine(null)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWaive}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Authorize Waiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Fine Settlement Modal */}
      {paymentModeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Settle Overdue Fine
            </h3>
            <p className="text-xs text-slate-500">
              Clear fine of <strong>{settings.currency}{paymentModeModal.amount}</strong> for {paymentModeModal.studentName} ({paymentModeModal.studentId})
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["UPI", "Cash", "Online"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedPaymentMode(mode)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      selectedPaymentMode === mode
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModeModal(null)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Fine Receipt Voucher Modal */}
      <ReceiptModal
        fine={selectedReceipt}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
