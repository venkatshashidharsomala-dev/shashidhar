import React from "react";
import { Book, BookCopy } from "../../types";
import { useLibrary } from "../../context/LibraryContext";
import { QRCodeView } from "./QRCodeView";
import { ShelfLocatorBadge } from "./ShelfLocatorBadge";
import { X, Printer, Tag, ShieldCheck, Download } from "lucide-react";

interface CopyQRModalProps {
  book: Book;
  copy: BookCopy;
  isOpen: boolean;
  onClose: () => void;
}

export const CopyQRModal: React.FC<CopyQRModalProps> = ({
  book,
  copy,
  isOpen,
  onClose,
}) => {
  const { settings } = useLibrary();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case "new":
        return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300";
      case "good":
        return "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300";
      case "fair":
        return "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300";
      case "damaged":
        return "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500 text-white";
      case "issued":
        return "bg-amber-500 text-white";
      case "reserved":
        return "bg-purple-500 text-white";
      case "maintenance":
        return "bg-orange-500 text-white";
      case "lost":
        return "bg-rose-600 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal Top Nav */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Book Copy Physical QR Tag
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {copy.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Print Spine Sticker"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Barcode / QR Label Sticker */}
        <div className="p-6">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-800/80 shadow-xs space-y-4">
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <p className="text-[10px] tracking-wider uppercase font-bold text-indigo-600 dark:text-indigo-400">
                  {settings.libraryName}
                </p>
                <p className="text-[11px] text-slate-500">Property of Central Library</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(copy.status)}`}>
                {copy.status}
              </span>
            </div>

            {/* Book Title & Copy Info */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                {book.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Author: {book.author}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  {copy.id}
                </span>
                <span className="text-xs text-slate-500">
                  Copy #{copy.copyNumber} of {book.totalCopies}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${getConditionColor(copy.condition)}`}>
                  {copy.condition} condition
                </span>
              </div>
            </div>

            {/* Large Centered QR Code with High Contrast */}
            <div className="bg-slate-50 dark:bg-white p-4 rounded-xl border border-slate-200 dark:border-slate-300 flex flex-col items-center justify-center space-y-2">
              <QRCodeView
                value={copy.qrCode || copy.id}
                size={140}
                className="p-1 border-0"
              />
              <p className="font-mono text-xs font-bold tracking-wider text-slate-800">
                {copy.id}
              </p>
              <p className="text-[10px] text-slate-500">Scan at circulation counter for instant issue/return</p>
            </div>

            {/* Shelf Locator Footer */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Assigned Physical Shelf
              </p>
              <ShelfLocatorBadge
                location={copy.shelfLocation || book.shelfLocation}
                size="xs"
                interactive={false}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            Standard 50×50mm Sticker Format
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Sticker Label
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
