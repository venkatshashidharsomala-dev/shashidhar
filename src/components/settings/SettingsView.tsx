import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  CheckCircle,
  Building,
  Clock,
  DollarSign,
  BookOpen,
  ShieldAlert,
  Sun,
  Moon,
  Check,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToSampleData,
    currentUser,
    darkMode,
    setTheme,
  } = useLibrary();

  const [finePerDay, setFinePerDay] = useState(settings.finePerDay);
  const [borrowDurationDays, setBorrowDurationDays] = useState(settings.borrowDurationDays);
  const [borrowLimit, setBorrowLimit] = useState(settings.borrowLimit);
  const [libraryName, setLibraryName] = useState(settings.libraryName);
  const [institutionName, setInstitutionName] = useState(settings.institutionName);
  const [currency, setCurrency] = useState(settings.currency);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isAdmin = currentUser.role === "admin";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      finePerDay: Number(finePerDay),
      borrowDurationDays: Number(borrowDurationDays),
      borrowLimit: Number(borrowLimit),
      libraryName: libraryName.trim(),
      institutionName: institutionName.trim(),
      currency,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDemo = () => {
    if (
      window.confirm(
        "Reset all library catalog, transactions, fines, and student test records back to pristine demo state?"
      )
    ) {
      resetToSampleData();
      alert("Library database reset to initial demo seeds!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            System & Circulation Policy Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define global institutional fine rates, lending duration limits, and institution branding
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleResetDemo}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 shrink-0"
            title="Reset to fresh demo seeds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Database
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>System configuration successfully updated and saved to local persistence!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card: Appearance & Theme Preferences */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Appearance & Theme Preference
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Persisted across sessions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Light Mode Option */}
            <button
              id="theme-select-light"
              type="button"
              onClick={() => setTheme(false)}
              className={`p-4 rounded-xl border text-left transition flex items-start justify-between cursor-pointer ${
                !darkMode
                  ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-600"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Light Theme
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Clean, high-contrast crisp surfaces optimized for daytime reading
                </p>
              </div>
              {!darkMode && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>

            {/* Dark Mode Option */}
            <button
              id="theme-select-dark"
              type="button"
              onClick={() => setTheme(true)}
              className={`p-4 rounded-xl border text-left transition flex items-start justify-between cursor-pointer ${
                darkMode
                  ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-600"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Dark Theme
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deep slate & dark canvas designed for low-glare nighttime comfort
                </p>
              </div>
              {darkMode && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Card 1: Circulation Policies */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Circulation Rules & Fine Schedule
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Daily Overdue Fine Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  {currency}
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={finePerDay}
                  onChange={(e) => setFinePerDay(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <span className="text-[10px] text-slate-400">Assessed per day per overdue volume</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Standard Loan Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={borrowDurationDays}
                onChange={(e) => setBorrowDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Default checkout window</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Max Student Borrow Limit
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={borrowLimit}
                onChange={(e) => setBorrowLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Concurrent active checkouts allowed</span>
            </div>
          </div>
        </div>

        {/* Card 2: Institution Identity */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Institutional Branding & Identity
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Library Name
              </label>
              <input
                type="text"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Parent University / College
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save System Policies
          </button>
        </div>
      </form>
    </div>
  );
};
