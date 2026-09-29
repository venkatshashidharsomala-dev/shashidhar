import React, { useState } from "react";
import { Book, BookCopy } from "../../types";
import { parseShelfLocation } from "../../utils/shelfLocation";
import {
  X,
  MapPin,
  Compass,
  Layers,
  CheckCircle,
  AlertTriangle,
  Bookmark,
  Printer,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building,
} from "lucide-react";

interface SmartShelfLocatorModalProps {
  book: Book | null;
  selectedCopy?: BookCopy | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueCopy?: (book: Book, copy?: BookCopy) => void;
}

export const SmartShelfLocatorModal: React.FC<SmartShelfLocatorModalProps> = ({
  book,
  selectedCopy: initialCopy,
  isOpen,
  onClose,
  onIssueCopy,
}) => {
  if (!isOpen || !book) return null;

  const copies = book.copies || [];
  const [activeCopyId, setActiveCopyId] = useState<string>(
    initialCopy?.id || (copies.length > 0 ? copies[0].id : "")
  );

  const currentCopy = copies.find((c) => c.id === activeCopyId) || copies[0] || null;
  const parsed = parseShelfLocation(currentCopy?.shelfLocation, currentCopy, book);

  const isAvailable = currentCopy ? currentCopy.status === "available" : book.availableCopies > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Smart Shelf Locator
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded font-semibold">
                  {parsed.building}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Precision spatial tracking of physical library volumes & shelf bay coordinates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Book & Target Copy Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3.5">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-14 h-20 object-cover rounded-lg shadow-xs border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                  {book.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {book.title}
                </h4>
                <p className="text-xs text-slate-500">By {book.author}</p>
                <div className="flex items-center gap-2 text-[11px] pt-0.5">
                  <span className="font-mono text-slate-500">ISBN: {book.isbn}</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Total: {book.totalCopies} | Available: {book.availableCopies}
                  </span>
                </div>
              </div>
            </div>

            {currentCopy && (
              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Copy</span>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {currentCopy.id}
                </p>
                <div className="mt-1 flex items-center sm:justify-end gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      currentCopy.status === "available"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : currentCopy.status === "issued"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                        : currentCopy.status === "reserved"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                        : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                    }`}
                  >
                    {currentCopy.status}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    ({currentCopy.condition} condition)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Copy Selector Tabs (if multiple copies) */}
          {copies.length > 1 && (
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-2">
                Select Physical Copy ({copies.length} in catalog):
              </label>
              <div className="flex flex-wrap gap-2">
                {copies.map((copy) => (
                  <button
                    key={copy.id}
                    type="button"
                    onClick={() => setActiveCopyId(copy.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-2 ${
                      activeCopyId === copy.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    }`}
                  >
                    <span>{copy.id}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        copy.status === "available"
                          ? "bg-emerald-400"
                          : copy.status === "issued"
                          ? "bg-blue-400"
                          : copy.status === "reserved"
                          ? "bg-amber-400"
                          : "bg-red-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exact Hierarchical Shelf Location Pill Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 dark:from-slate-800/70 dark:via-blue-950/20 dark:to-slate-800/50 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-2">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Exact Physical Coordinate
            </span>
            <div className="flex flex-wrap items-center gap-2 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                🏢 {parsed.building}
              </span>
              <span className="text-slate-400">→</span>
              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                📶 {parsed.floor}
              </span>
              <span className="text-slate-400">→</span>
              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs font-mono text-blue-600 dark:text-blue-400">
                📦 {parsed.rack}
              </span>
              <span className="text-slate-400">→</span>
              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs font-mono">
                🪜 {parsed.shelf}
              </span>
              <span className="text-slate-400">→</span>
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg shadow-2xs font-mono font-bold animate-pulse">
                📍 {parsed.position || "Position 01"}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
              <strong>Wayfinding:</strong> {parsed.wayfindingDirections}
            </p>
          </div>

          {/* Visual Shelf / Location Interface (2D Schematic Rack Visualizer) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900 text-white">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white">
                  Rack Bay Schematic • {parsed.rack} ({parsed.building})
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {isAvailable ? "● Ready on Shelf" : "○ Currently Loaned / Hold"}
              </span>
            </div>

            {/* Shelf Rack Bay Simulation */}
            <div className="p-4 space-y-3 bg-slate-900">
              {[4, 3, 2, 1].map((shelfLevel) => {
                const isTargetShelf = parsed.shelfNumber === shelfLevel;
                return (
                  <div
                    key={shelfLevel}
                    className={`p-2.5 rounded-lg border transition ${
                      isTargetShelf
                        ? "bg-blue-950/40 border-blue-500 shadow-sm shadow-blue-500/10"
                        : "bg-slate-800/40 border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-mono">
                      <span>SHELF LEVEL {shelfLevel}</span>
                      {isTargetShelf && (
                        <span className="text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Target Shelf
                        </span>
                      )}
                    </div>

                    {/* Book Slots Simulation */}
                    <div className="grid grid-cols-10 gap-1.5 h-12">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => {
                        const isTargetSlot = isTargetShelf && parsed.positionNumber === slot;
                        return (
                          <div
                            key={slot}
                            className={`rounded-sm border flex flex-col items-center justify-center text-[9px] font-mono transition relative ${
                              isTargetSlot
                                ? "bg-blue-500 border-white text-white font-bold ring-2 ring-blue-400 shadow-md shadow-blue-500/30 -translate-y-1"
                                : "bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-600"
                            }`}
                            title={`Position ${String(slot).padStart(2, "0")}`}
                          >
                            <span>{String(slot).padStart(2, "0")}</span>
                            {isTargetSlot && (
                              <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Shelf Plank Base */}
                    <div
                      className={`h-1.5 rounded-full mt-1.5 ${
                        isTargetShelf ? "bg-blue-400" : "bg-slate-700"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Floor Map Nav Footnote */}
            <div className="p-2.5 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                Floor 1 Main Stacks • Aisle Section B-East
              </span>
              <span className="font-mono text-blue-300">
                Position #{String(parsed.positionNumber).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Shelf Slip
          </button>

          <div className="flex items-center gap-2">
            {onIssueCopy && isAvailable && (
              <button
                type="button"
                onClick={() => {
                  onIssueCopy(book, currentCopy || undefined);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Proceed to Checkout
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
