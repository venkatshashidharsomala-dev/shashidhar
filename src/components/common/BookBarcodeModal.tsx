import React, { useState } from "react";
import { Book, BookCopy } from "../../types";
import { useLibrary } from "../../context/LibraryContext";
import { BarcodeView } from "./BarcodeView";
import { ShelfLocatorBadge } from "./ShelfLocatorBadge";
import {
  X,
  Printer,
  Download,
  Barcode as BarcodeIcon,
  CheckCircle,
  AlertCircle,
  Layers,
  ArrowRight,
  RotateCcw,
  Edit2,
  Save,
  Plus,
} from "lucide-react";

interface BookBarcodeModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueRequest?: (book: Book, copy?: BookCopy) => void;
  onReturnRequest?: (book: Book) => void;
}

export const BookBarcodeModal: React.FC<BookBarcodeModalProps> = ({
  book,
  isOpen,
  onClose,
  onIssueRequest,
  onReturnRequest,
}) => {
  const { updateBookBarcode, currentUser, transactions } = useLibrary();
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const [isEditingBarcode, setIsEditingBarcode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState(book?.barcode || "");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen || !book) return null;

  const canManage = currentUser.role === "admin" || currentUser.role === "librarian";
  const isAvailable = book.availableCopies > 0;
  const barcodeValue = selectedCopy
    ? (selectedCopy.barcode || selectedCopy.id)
    : (book.barcode || book.id);

  // Check if there are active loans for this book
  const activeLoans = transactions.filter(
    (t) => (t.status === "issued" || t.status === "overdue") && t.bookId === book.id
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSaveBarcode = () => {
    const clean = barcodeInput.trim();
    if (!clean) {
      setFeedback({ type: "error", text: "Barcode cannot be empty." });
      return;
    }
    const res = updateBookBarcode(book.id, clean);
    if (res.success) {
      setFeedback({ type: "success", text: `Physical barcode "${clean}" assigned successfully!` });
      setIsEditingBarcode(false);
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: "error", text: res.error || "Barcode already exists." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BarcodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Book Barcode Tag
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[280px]">
                {book.title} (ID: {book.id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Barcode Visualization Tag */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-indigo-200/80 dark:border-indigo-900/60 text-center space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-full overflow-hidden flex flex-col items-center">
              <BarcodeView
                value={barcodeValue}
                width={1.8}
                height={55}
                displayValue={true}
                showActions={false}
                className="p-0 border-0 shadow-none bg-transparent"
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {book.title}
              </h4>
              <p className="text-xs text-slate-500">
                Author: {book.author} • ISBN: {book.isbn}
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  Barcode: {barcodeValue}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isAvailable
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {isAvailable ? "Available" : "Checked Out"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
              Scan this barcode using device camera or barcode scanner gun to instantly identify and issue/return this title.
            </p>
          </div>

          {/* Copy Selector if multiple copies exist */}
          {book.copies && book.copies.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Select Specific Physical Copy Tag</span>
                </label>
                {selectedCopy && (
                  <button
                    type="button"
                    onClick={() => setSelectedCopy(null)}
                    className="text-[11px] text-indigo-600 hover:underline font-medium"
                  >
                    Reset to Main Title Barcode
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                {book.copies.map((copy) => (
                  <button
                    key={copy.id}
                    type="button"
                    onClick={() => setSelectedCopy(copy)}
                    className={`p-2 rounded-lg border text-left text-xs transition ${
                      selectedCopy?.id === copy.id
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                      <span>Copy #{copy.copyNumber}</span>
                      <span className={`text-[10px] capitalize ${copy.status === "available" ? "text-emerald-600" : "text-amber-600"}`}>
                        {copy.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {copy.barcode || copy.id}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shelf location indicator */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-500 font-medium">Shelf Assignment:</span>
            <ShelfLocatorBadge locationString={selectedCopy?.shelfLocation || book.shelfLocation} />
          </div>

          {/* Inline Edit / Add Barcode for Existing Books */}
          {isEditingBarcode && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {book.barcode ? "Update Physical Barcode" : "Add Physical Barcode"}
                </span>
                <button
                  type="button"
                  onClick={() => setBarcodeInput(book.isbn.replace(/\D/g, ""))}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Use ISBN digits
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveBarcode()}
                  placeholder="Enter barcode printed on book..."
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleSaveBarcode}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBarcode(false)}
                  className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 text-red-700 dark:text-red-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingBarcode(!isEditingBarcode);
                  setBarcodeInput(book.barcode || "");
                  setFeedback(null);
                }}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
                title="Edit barcode number"
              >
                {book.barcode ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {book.barcode ? "Edit Barcode" : "Add Barcode"}
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Barcode Tag
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canManage && onIssueRequest && isAvailable && (
              <button
                type="button"
                onClick={() => {
                  onIssueRequest(book, selectedCopy || undefined);
                  onClose();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1"
              >
                Issue Book
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {canManage && onReturnRequest && activeLoans.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onReturnRequest(book);
                  onClose();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return Book
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
