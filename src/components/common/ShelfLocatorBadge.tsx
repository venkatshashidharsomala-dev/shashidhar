import React, { useState } from "react";
import { parseShelfLocation } from "../../utils/shelfLocation";
import { MapPin, Building2, Layers, Grid, Bookmark, ChevronRight, X, Compass } from "lucide-react";

interface ShelfLocatorBadgeProps {
  location: string;
  size?: "xs" | "sm" | "md";
  interactive?: boolean;
  className?: string;
}

export const ShelfLocatorBadge: React.FC<ShelfLocatorBadgeProps> = ({
  location,
  size = "sm",
  interactive = true,
  className = "",
}) => {
  const [showModal, setShowModal] = useState(false);
  const details = parseShelfLocation(location);

  const textSize =
    size === "xs" ? "text-[10px]" : size === "sm" ? "text-xs" : "text-sm";

  return (
    <>
      <div
        onClick={() => interactive && setShowModal(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
          interactive
            ? "cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs group"
            : ""
        } bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 ${textSize} ${className}`}
        title={interactive ? "Click to view shelf map locator" : location}
      >
        <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:animate-bounce" />
        
        <span className="font-semibold text-slate-900 dark:text-white">
          {details.building}
        </span>
        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
        
        <span>{details.floor}</span>
        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
        
        <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
          {details.rack}
        </span>
        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
        
        <span className="bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-medium">
          {details.shelf}
        </span>
      </div>

      {/* Interactive Shelf Map Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Smart Shelf Physical Locator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Physical navigation guide to find this book in the library
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Hierarchy Visual Steps */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
                  <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
                  <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                    Building
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {details.building}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-center">
                  <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400 mx-auto mb-1" />
                  <p className="text-[10px] text-sky-600/80 dark:text-sky-400 font-semibold uppercase tracking-wider">
                    Floor
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {details.floor}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center">
                  <Grid className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                  <p className="text-[10px] text-purple-600/80 dark:text-purple-400 font-semibold uppercase tracking-wider">
                    Aisle / Rack
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                    {details.rack}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <Bookmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                    Shelf Level
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {details.shelf}
                  </p>
                </div>
              </div>

              {/* Graphical Library Floorplan Diagram */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-300">
                    Floorplan Map: {details.building} - {details.floor}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Target Location
                  </span>
                </div>

                {/* Illustrated Rack Grid Layout */}
                <div className="grid grid-cols-4 gap-2 py-2">
                  {["Rack A1", "Rack A2", "Rack A3", "Rack B1", "Rack B2", "Rack B3", "Rack C1", "Rack C2"].map(
                    (r) => {
                      const isTarget =
                        details.rack.toLowerCase().includes(r.toLowerCase().replace("rack ", "")) ||
                        details.rack.toLowerCase() === r.toLowerCase();
                      return (
                        <div
                          key={r}
                          className={`p-2.5 rounded-lg text-center border text-xs transition ${
                            isTarget
                              ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] ring-2 ring-indigo-400/50"
                              : "bg-slate-800/60 border-slate-700 text-slate-400"
                          }`}
                        >
                          <p className="font-mono text-[11px]">{r}</p>
                          {isTarget && (
                            <span className="inline-block mt-1 text-[9px] bg-indigo-500 text-white px-1.5 py-0.2 rounded font-sans">
                              {details.shelf}
                            </span>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>← Circulation Desk & Entrance</span>
                  <span>Reading Gallery →</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Librarian Tip:</strong> Proceed through {details.building}, take the stairs/lift to {details.floor}, walk down aisle to {details.rack}. This title is located on {details.shelf}.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
