import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Transaction, FineRecord, CopyCondition, DigitalReceiptData } from "../../types";
import { UniversalReceiptModal } from "../common/UniversalReceiptModal";
import { ShelfLocatorBadge } from "../common/ShelfLocatorBadge";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Barcode as BarcodeIcon,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Tag,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

interface ReturnBookViewProps {
  onOpenQRScanner?: (mode: "return") => void;
  preselectedTransactionId?: string;
}

export const ReturnBookView: React.FC<ReturnBookViewProps> = ({
  onOpenQRScanner,
  preselectedTransactionId,
}) => {
  const { transactions, returnBook, settings, fines, payFine, books } = useLibrary();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(() => {
    if (preselectedTransactionId) {
      return transactions.find((t) => t.id === preselectedTransactionId) || null;
    }
    return null;
  });
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [returnCondition, setReturnCondition] = useState<CopyCondition>("good");
  const [returnNote, setReturnNote] = useState("");
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error";
    text: string;
    fineAmount?: number;
  } | null>(null);

  // Digital Receipt popup state
  const [receiptData, setReceiptData] = useState<DigitalReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Active borrow transactions (issued or overdue)
  const activeTransactions = transactions.filter(
    (t) => t.status === "issued" || t.status === "overdue"
  );

  const filteredTransactions = activeTransactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.bookTitle.toLowerCase().includes(q) ||
      t.studentName.toLowerCase().includes(q) ||
      t.studentId.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.bookId.toLowerCase().includes(q) ||
      (t.copyId && t.copyId.toLowerCase().includes(q)) ||
      t.bookIsbn.toLowerCase().includes(q)
    );
  });

  // Calculate live overdue days and fine for the selected transaction
  const getLiveFineCalculation = (tx: Transaction) => {
    const due = new Date(tx.dueDate);
    const ret = new Date(returnDate);
    let overdueDays = 0;
    if (ret > due) {
      const diff = Math.abs(ret.getTime() - due.getTime());
      overdueDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    const fine = overdueDays * settings.finePerDay;
    return { overdueDays, fine };
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) {
      setResultMessage({ type: "error", text: "Please select an active transaction to return." });
      return;
    }

    const res = returnBook(selectedTx.id, returnDate, returnNote, returnCondition);

    if (res.success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setResultMessage({
        type: "success",
        text: res.message,
        fineAmount: res.fineAmount,
      });
      if (res.receipt) {
        setReceiptData(res.receipt);
        setIsReceiptOpen(true);
      }
      setSelectedTx(null);
      setReturnNote("");
    } else {
      setResultMessage({ type: "error", text: res.message });
    }
  };

  // Find book shelf location for restocking
  const relatedBook = selectedTx ? books.find((b) => b.id === selectedTx.bookId) : null;
  const restockLocation = selectedTx?.shelfLocation || relatedBook?.shelfLocation || "Main Stacks";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Circulation Desk: Return & Restock
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Process physical copy returns, verify book condition, calculate fines, and restock
          </p>
        </div>

        {onOpenQRScanner && (
          <button
            type="button"
            onClick={() => onOpenQRScanner("return")}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-xs shrink-0"
          >
            <BarcodeIcon className="w-4 h-4" />
            Scan Book Barcode to Return
          </button>
        )}
      </div>

      {resultMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in ${
            resultMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          {resultMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">
              {resultMessage.type === "success" ? "Book Returned" : "Return Failed"}
            </h4>
            <p className="mt-0.5">{resultMessage.text}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Active Borrowed Transactions Selector */}
        <div className="md:col-span-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Active Checkout Records ({activeTransactions.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Select record</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by book, copy ID, student, or Roll No..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active checkout records match your query.
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isSelected = selectedTx?.id === tx.id;
                const isOverdue = tx.status === "overdue" || new Date(tx.dueDate) < new Date();
                return (
                  <div
                    key={tx.id}
                    onClick={() => {
                      setSelectedTx(tx);
                      if (tx.conditionOnIssue) {
                        setReturnCondition(tx.conditionOnIssue);
                      }
                    }}
                    className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <img
                      src={tx.coverImage}
                      alt=""
                      className="w-10 h-14 object-cover rounded shadow-xs shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-400">
                          {tx.id}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isOverdue
                              ? "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                              : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isOverdue ? "Overdue" : "On-Time"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tx.bookTitle}
                      </h4>
                      {tx.copyId && (
                        <span className="inline-block font-mono text-[10px] bg-slate-100 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                          Copy: {tx.copyId}
                        </span>
                      )}
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                        Borrower: <strong>{tx.studentName}</strong> ({tx.studentId})
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due Date: {tx.dueDate}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Return Verification & Fine Calculator */}
        <div className="md:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700/60 pb-3">
              Return Verification & Fine Assessment
            </h3>

            {!selectedTx ? (
              <div className="py-16 text-center space-y-2">
                <RotateCcw className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500">
                  Select a checkout record on the left or scan a book barcode to proceed with return.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
                {/* Book & Student Summary */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Book Title:</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[200px] truncate">
                      {selectedTx.bookTitle}
                    </span>
                  </div>
                  {selectedTx.copyId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Physical Copy:</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {selectedTx.copyId}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student Borrower:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedTx.studentName} ({selectedTx.studentId})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Original Due Date:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {selectedTx.dueDate}
                    </span>
                  </div>
                  {selectedTx.conditionOnIssue && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Condition on Checkout:</span>
                      <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                        {selectedTx.conditionOnIssue}
                      </span>
                    </div>
                  )}
                </div>

                {/* Restock Shelf Location Preview */}
                <div className="space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                    Return to Shelf Location:
                  </span>
                  <ShelfLocatorBadge locationString={restockLocation} />
                </div>

                {/* Return Date Input */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                {/* Return Condition Selector */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Inspected Book Condition on Return
                  </label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value as CopyCondition)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="good">Good (Ready for Stacks)</option>
                    <option value="fair">Fair (Minor Wear)</option>
                    <option value="damaged">Damaged (Requires Mending / Penalty)</option>
                    <option value="poor">Poor (Water Damage / Missing Pages)</option>
                    <option value="lost">Lost / Unreturned</option>
                  </select>
                  {returnCondition === "damaged" || returnCondition === "poor" ? (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Condition degraded from issue. A note will be flagged on copy record.
                    </p>
                  ) : null}
                </div>

                {/* Return Condition & Notes */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Circulation Note
                  </label>
                  <input
                    type="text"
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                    placeholder="e.g. Returned to front desk, barcode verified"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                {/* Fine Assessment Box */}
                {(() => {
                  const { overdueDays, fine } = getLiveFineCalculation(selectedTx);
                  return (
                    <div
                      className={`p-4 rounded-xl border space-y-2 ${
                        fine > 0
                          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200"
                          : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200"
                      }`}
                    >
                      <div className="flex justify-between items-center font-semibold">
                        <span>Calculated Overdue Days:</span>
                        <span>{overdueDays} days</span>
                      </div>
                      <div className="flex justify-between items-center font-semibold">
                        <span>Fine Rate:</span>
                        <span>{settings.currency}{settings.finePerDay} / day</span>
                      </div>
                      <div className="pt-2 border-t border-current/20 flex justify-between items-center text-sm font-bold">
                        <span>Total Fine Payable:</span>
                        <span className="text-base">
                          {settings.currency}{fine}.00
                        </span>
                      </div>
                      {fine > 0 && (
                        <p className="text-[11px] text-red-600 dark:text-red-400">
                          * An automated fine invoice will be logged in the student's account upon return.
                        </p>
                      )}
                    </div>
                  );
                })()}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Return & Print Receipt
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Universal Receipt Modal for Returned Books */}
      {receiptData && (
        <UniversalReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          receipt={receiptData}
        />
      )}
    </div>
  );
};
