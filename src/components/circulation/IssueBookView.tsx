import React, { useState, useEffect } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book, BookCopy, StudentProfile, CopyCondition, DigitalReceiptData } from "../../types";
import { ShelfLocatorBadge } from "../common/ShelfLocatorBadge";
import { UniversalReceiptModal } from "../common/UniversalReceiptModal";
import confetti from "canvas-confetti";
import {
  BookOpen,
  UserCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Search,
  ArrowRight,
  Clock,
  Sparkles,
  Tag,
  ShieldCheck,
  Printer,
  Barcode as BarcodeIcon,
} from "lucide-react";

interface IssueBookViewProps {
  preselectedBook?: Book | null;
  preselectedCopy?: BookCopy | null;
  preselectedStudent?: StudentProfile | null;
  onOpenQRScanner?: (mode: "issue") => void;
  onSuccess?: () => void;
}

export const IssueBookView: React.FC<IssueBookViewProps> = ({
  preselectedBook,
  preselectedCopy,
  preselectedStudent,
  onOpenQRScanner,
  onSuccess,
}) => {
  const { students, books, issueBook, settings, transactions } = useLibrary();

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(preselectedStudent || null);

  const [bookSearch, setBookSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(preselectedBook || null);
  const [selectedCopyId, setSelectedCopyId] = useState<string>(preselectedCopy?.id || "");
  const [conditionOnIssue, setConditionOnIssue] = useState<CopyCondition>(preselectedCopy?.condition || "good");

  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.borrowDurationDays || 14));
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("Semester curriculum study");

  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [receiptData, setReceiptData] = useState<DigitalReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (preselectedBook) {
      setSelectedBook(preselectedBook);
    }
  }, [preselectedBook]);

  useEffect(() => {
    if (preselectedCopy) {
      setSelectedCopyId(preselectedCopy.id);
      setConditionOnIssue(preselectedCopy.condition);
    }
  }, [preselectedCopy]);

  useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudent(preselectedStudent);
    }
  }, [preselectedStudent]);

  // When selected book changes, default to first available copy
  useEffect(() => {
    if (selectedBook && selectedBook.copies && selectedBook.copies.length > 0) {
      const availableCopy = selectedBook.copies.find((c) => c.status === "available");
      if (availableCopy) {
        setSelectedCopyId(availableCopy.id);
        setConditionOnIssue(availableCopy.condition);
      } else {
        setSelectedCopyId(selectedBook.copies[0].id);
        setConditionOnIssue(selectedBook.copies[0].condition);
      }
    }
  }, [selectedBook]);

  // Filter students based on search
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  // Filter books based on search
  const filteredBooks = books.filter((b) => {
    const q = bookSearch.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q) ||
      (b.barcode && b.barcode.toLowerCase().includes(q)) ||
      b.id.toLowerCase().includes(q) ||
      b.copies?.some((c) => c.id.toLowerCase().includes(q) || (c.barcode && c.barcode.toLowerCase().includes(q)))
    );
  });

  // Check active borrows for selected student
  const studentActiveBorrows = selectedStudent
    ? transactions.filter(
        (t) => t.studentId === selectedStudent.studentId && (t.status === "issued" || t.status === "overdue")
      )
    : [];

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setStatusMessage({ type: "error", text: "Please select an enrolled student." });
      return;
    }
    if (!selectedBook) {
      setStatusMessage({ type: "error", text: "Please select a book to issue." });
      return;
    }

    const res = issueBook(
      selectedStudent.studentId,
      selectedBook.id,
      dueDate,
      notes,
      selectedCopyId || undefined,
      conditionOnIssue
    );

    if (res.success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setStatusMessage({ type: "success", text: res.message });
      if (res.receipt) {
        setReceiptData(res.receipt);
        setIsReceiptOpen(true);
      }
      // Clear inputs
      setSelectedBook(null);
      setSelectedCopyId("");
      setNotes("");
      onSuccess?.();
    } else {
      setStatusMessage({ type: "error", text: res.message });
    }
  };

  const selectedCopyObj = selectedBook?.copies?.find((c) => c.id === selectedCopyId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Circulation Desk: Fast Checkout
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scan or select Student ID and physical Book Copy with instant barcode verification
          </p>
        </div>
        {onOpenQRScanner && (
          <button
            type="button"
            onClick={() => onOpenQRScanner("issue")}
            className="self-start sm:self-auto px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-xs"
          >
            <BarcodeIcon className="w-4 h-4" />
            Scan Barcode to Checkout
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">
              {statusMessage.type === "success" ? "Transaction Completed" : "Issue Failed"}
            </h4>
            <p className="mt-0.5">{statusMessage.text}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleIssueSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Student Selection */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Select Student
                </h3>
              </div>
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Change
                </button>
              )}
            </div>

            {!selectedStudent ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by student name or Roll No (e.g. BCA-2024-042)..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
                  {filteredStudents.map((std) => (
                    <div
                      key={std.id}
                      onClick={() => setSelectedStudent(std)}
                      className="p-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition flex items-center gap-3"
                    >
                      <img
                        src={std.profileImage}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {std.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {std.studentId} • Sem {std.semester}
                        </p>
                      </div>
                      <span className="text-[11px] text-indigo-600 font-medium">Select</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Selected Student Profile Box */
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudent.profileImage}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {selectedStudent.fullName}
                    </h4>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                      {selectedStudent.studentId}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedStudent.course}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Current Borrowed:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {studentActiveBorrows.length} / {selectedStudent.maxBorrowLimit || settings.borrowLimit}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Account Status:</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                      {selectedStudent.accountStatus}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Book & Physical Copy Selection */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Select Book & Physical Copy
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedBook && (
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>

            {!selectedBook ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Search by title, ISBN, or copy ID (e.g. LIB-PY-0001)..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
                  {filteredBooks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBook(b)}
                      className="p-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition flex items-center gap-3"
                    >
                      <img
                        src={b.coverImage}
                        alt=""
                        className="w-8 h-11 object-cover rounded shadow-xs shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {b.title}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {b.id} • {b.availableCopies} available
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          b.availableCopies > 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {b.availableCopies > 0 ? "Select" : "No copies"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Selected Book & Copies UI */
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                  <img
                    src={selectedBook.coverImage}
                    alt=""
                    className="w-12 h-16 object-cover rounded-md shadow-xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {selectedBook.title}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      By {selectedBook.author}
                    </p>
                    <div className="mt-1">
                      <ShelfLocatorBadge locationString={selectedBook.shelfLocation} />
                    </div>
                  </div>
                </div>

                {/* Specific Physical Copy Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Specific Physical Copy Tag:</span>
                    <span className="text-[11px] text-indigo-600 font-mono">
                      {selectedBook.copies?.length || 0} Total Copies
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                    {selectedBook.copies?.map((copy) => {
                      const isAvail = copy.status === "available";
                      const isSelected = selectedCopyId === copy.id;
                      return (
                        <button
                          key={copy.id}
                          type="button"
                          disabled={!isAvail}
                          onClick={() => {
                            setSelectedCopyId(copy.id);
                            setConditionOnIssue(copy.condition);
                          }}
                          className={`p-2 rounded-lg text-left border transition flex flex-col justify-between ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 ring-1 ring-indigo-500"
                              : isAvail
                              ? "border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-white dark:bg-slate-800"
                              : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              {copy.id}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1 rounded ${
                                isAvail
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              }`}
                            >
                              {copy.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            Cond: {copy.condition}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Condition on checkout selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">Condition on Checkout:</span>
                  <select
                    value={conditionOnIssue}
                    onChange={(e) => setConditionOnIssue(e.target.value as CopyCondition)}
                    className="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="new">Like New (Mint)</option>
                    <option value="good">Good (Normal Wear)</option>
                    <option value="fair">Fair (Minor Highlights/Creases)</option>
                    <option value="poor">Poor (Requires Repair)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Dates & Confirmation Bar */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Checkout Schedule & Digital Verification
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Due Date (Return Deadline)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Circulation Note / Purpose
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. BCA Semester Study"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-500">
              * Overdue policy: {settings.currency}{settings.finePerDay}/day fine automatically begins 1 day after due date.
            </p>

            <button
              type="submit"
              disabled={!selectedStudent || !selectedBook || selectedBook.availableCopies <= 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Confirm & Issue Book (Generates Digital Receipt)
            </button>
          </div>
        </div>
      </form>

      {/* Universal Receipt Modal */}
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

