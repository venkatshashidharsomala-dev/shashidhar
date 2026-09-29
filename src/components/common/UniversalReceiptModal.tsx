import React from "react";
import { DigitalReceiptData } from "../../types";
import { useLibrary } from "../../context/LibraryContext";
import { QRCodeView } from "./QRCodeView";
import {
  Printer,
  X,
  CheckCircle2,
  FileCheck2,
  Receipt,
  RotateCcw,
  BookOpen,
  ShieldCheck,
  Calendar,
  User,
  Clock,
  Sparkles,
} from "lucide-react";

interface UniversalReceiptModalProps {
  receipt: DigitalReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalReceiptModal: React.FC<UniversalReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
}) => {
  const { settings } = useLibrary();

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const getReceiptConfig = () => {
    switch (receipt.type) {
      case "issue":
        return {
          title: "Book Issue Receipt",
          subtitle: "Official Circulation Checkout Voucher",
          badgeColor: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          icon: <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        };
      case "return":
        return {
          title: "Book Return Receipt",
          subtitle: "Official Book Check-In & Clearance Voucher",
          badgeColor: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          icon: <RotateCcw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case "fine":
        return {
          title: "Overdue Fine Receipt",
          subtitle: "Official Fine Settlement Clearance Voucher",
          badgeColor: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          icon: <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        };
    }
  };

  const config = getReceiptConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/10 flex items-center justify-center">
              {config.icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {config.title}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {receipt.receiptNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Print Receipt"
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

        {/* Printable Voucher Slip */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 bg-white dark:bg-slate-800/60 space-y-4 print:border-slate-400 print:shadow-none">
            {/* Institution Brand */}
            <div className="text-center border-b border-dashed border-slate-200 dark:border-slate-700 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                {settings.institutionName}
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {settings.libraryName}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{config.subtitle}</p>
            </div>

            {/* Receipt Summary Grid */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Receipt Voucher #:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {receipt.receiptNo}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {receipt.transactionId}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Student Roll No:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {receipt.studentId}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Student Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {receipt.studentName}
                </span>
              </div>

              {receipt.studentCourse && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Department / Course:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {receipt.studentCourse}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Book Title:</span>
                <span className="font-bold text-slate-900 dark:text-white text-right max-w-[220px] truncate">
                  {receipt.bookTitle}
                </span>
              </div>

              {receipt.bookAuthor && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Author:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {receipt.bookAuthor}
                  </span>
                </div>
              )}

              {receipt.copyId && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Physical Copy Tag:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    {receipt.copyId}
                  </span>
                </div>
              )}

              {receipt.condition && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Inspected Condition:</span>
                  <span className="capitalize font-medium text-slate-800 dark:text-slate-200">
                    {receipt.condition}
                  </span>
                </div>
              )}

              {receipt.shelfLocation && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Shelf Locator:</span>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {receipt.shelfLocation}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Issue Date:</span>
                <span>{receipt.issueDate}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Scheduled Due Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {receipt.dueDate}
                </span>
              </div>

              {receipt.returnDate && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Actual Return Date:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {receipt.returnDate}
                  </span>
                </div>
              )}

              {receipt.fineAmount !== undefined && receipt.fineAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Overdue Fine Calculated:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {settings.currency}{receipt.fineAmount}.00 ({receipt.finePaid ? "PAID" : "PENDING"})
                  </span>
                </div>
              )}

              {receipt.paymentMethod && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Payment Mode:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {receipt.paymentMethod}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Circulation Staff / Desk:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {receipt.librarian || "Circulation Desk"}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-[11px] text-slate-500">
                  {receipt.issuedAt || new Date().toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bottom Verification Seal & Mini QR */}
            <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="space-y-1 text-[10px] text-slate-500">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>VERIFIED DIGITAL CLEARANCE</span>
                </div>
                <p>Status: <span className="font-semibold uppercase text-slate-700 dark:text-slate-300">{receipt.status}</span></p>
                <p>Authorized by {settings.libraryName}</p>
              </div>

              <div className="p-1 bg-slate-50 dark:bg-white rounded-lg border border-slate-200 shrink-0">
                <QRCodeView
                  value={`RECEIPT:${receipt.receiptNo}|${receipt.transactionId}|${receipt.studentId}|${receipt.copyId || ""}`}
                  size={58}
                  className="p-0 border-0"
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-center text-slate-400">
            Please retain this voucher for semester examination clearance and library records.
          </p>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Official Receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
