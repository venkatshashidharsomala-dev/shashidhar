import React, { useState } from "react";
import { Book, BookCopy } from "../../types";
import { useLibrary } from "../../context/LibraryContext";
import { QRCodeView } from "./QRCodeView";
import { ShelfLocatorBadge } from "./ShelfLocatorBadge";
import {
  X,
  Printer,
  Download,
  QrCode,
  CheckCircle,
  AlertCircle,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface BookQRModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueRequest?: (book: Book, copy?: BookCopy) => void;
  onReturnRequest?: (book: Book) => void;
}

export const BookQRModal: React.FC<BookQRModalProps> = ({
  book,
  isOpen,
  onClose,
  onIssueRequest,
  onReturnRequest,
}) => {
  const { settings, generateBookQR, currentUser, transactions } = useLibrary();
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  if (!isOpen || !book) return null;

  const canManage = currentUser.role === "admin" || currentUser.role === "librarian";
  const isAvailable = book.availableCopies > 0;
  const qrValue = selectedCopy ? selectedCopy.id : (book.qrCode || book.id);

  // Check if there are active loans for this book
  const activeLoans = transactions.filter(
    (t) => (t.status === "issued" || t.status === "overdue") && t.bookId === book.id
  );

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateQR = () => {
    generateBookQR(book.id);
    setCopiedStatus("QR code regenerated successfully!");
    setTimeout(() => setCopiedStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Book QR Code & Barcode
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {book.id} • {book.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Printable Book Identification Card */}
          <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5 bg-slate-50/70 dark:bg-slate-800/50 space-y-4">
            {/* Header / Library Info */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <p className="text-[10px] tracking-wider uppercase font-bold text-indigo-600 dark:text-indigo-400">
                  {settings.libraryName}
                </p>
                <p className="text-[11px] text-slate-500">Official Accession QR Tag</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  isAvailable
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                }`}
              >
                {isAvailable ? `${book.availableCopies} Available` : "Checked Out"}
              </span>
            </div>

            {/* Book Meta & Cover Thumbnail */}
            <div className="flex gap-3 items-center">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-12 h-16 object-cover rounded-md shadow-xs border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {book.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  By {book.author}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  ISBN: {book.isbn}
                </p>
              </div>
            </div>

            {/* Prominent High-Resolution QR Code View */}
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-white rounded-xl shadow-xs border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider text-center">
                Scan Book QR Code
              </p>
              <QRCodeView
                value={qrValue}
                size={160}
                className="p-1 border-0 shadow-none"
                showValue={false}
              />
              <div className="mt-3 px-3 py-1 bg-slate-100 dark:bg-slate-100 rounded-lg text-center border border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-800 tracking-wider">
                  Book ID: {qrValue}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 text-center mt-2 max-w-xs">
                Scan this QR code with any mobile camera or the LibSmart scanner to identify and manage this title.
              </p>
            </div>

            {/* Shelf Location */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Assigned Shelf:</span>
              <ShelfLocatorBadge location={book.shelfLocation} size="xs" interactive={false} />
            </div>
          </div>

          {/* Copy Selector Tabs if physical copies exist */}
          {book.copies && book.copies.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Select Physical Copy QR Tag
                </label>
                {selectedCopy && (
                  <button
                    type="button"
                    onClick={() => setSelectedCopy(null)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Reset to Main Title QR
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-28 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCopy(null)}
                  className={`p-2 rounded-lg text-xs font-medium border text-left transition ${
                    selectedCopy === null
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <p className="truncate">Master Book ID</p>
                  <p className="text-[10px] font-mono text-slate-400 truncate">{book.id}</p>
                </button>
                {book.copies.map((copy) => (
                  <button
                    key={copy.id}
                    type="button"
                    onClick={() => setSelectedCopy(copy)}
                    className={`p-2 rounded-lg text-xs font-medium border text-left transition ${
                      selectedCopy?.id === copy.id
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-bold"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <p className="truncate">Copy #{copy.copyNumber}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">{copy.id}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {copiedStatus && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{copiedStatus}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {canManage && (
              <button
                type="button"
                onClick={handleGenerateQR}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                title="Regenerate QR code"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Generate QR
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Print QR
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canManage && isAvailable && onIssueRequest && (
              <button
                type="button"
                onClick={() => {
                  onIssueRequest(book, selectedCopy || undefined);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-xs"
              >
                Issue Book
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {canManage && activeLoans.length > 0 && onReturnRequest && (
              <button
                type="button"
                onClick={() => {
                  onReturnRequest(book);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return Book
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
