import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book } from "../../types";
import { StudentCardModal } from "../common/StudentCardModal";
import {
  BookOpen,
  Clock,
  Bookmark,
  DollarSign,
  IdCard,
  Sparkles,
  ArrowRight,
  Search,
  Award,
  Megaphone,
} from "lucide-react";

interface StudentDashboardProps {
  onNavigate: (view: string) => void;
  onSelectBook: (book: Book) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onSelectBook,
}) => {
  const { currentUser, students, transactions, fines, reservations, books, announcements, settings } = useLibrary();
  const [isCardOpen, setIsCardOpen] = useState(false);

  // Student profile
  const currentStudent =
    students.find((s) => s.studentId === currentUser.studentId) || students[0];

  const myTransactions = transactions.filter(
    (t) => t.studentId === (currentStudent?.studentId || currentUser.studentId)
  );

  const activeLoans = myTransactions.filter(
    (t) => t.status === "issued" || t.status === "overdue"
  );

  const myFines = fines.filter(
    (f) => f.studentId === (currentStudent?.studentId || currentUser.studentId)
  );

  const pendingFineTotal = myFines
    .filter((f) => f.status === "pending")
    .reduce((sum, f) => sum + f.amount, 0);

  const myReservations = reservations.filter(
    (r) => r.studentId === (currentStudent?.studentId || currentUser.studentId)
  );

  const activeAnnouncements = announcements.filter(
    (a) => a.targetAudience === "all" || a.targetAudience === "students"
  );

  return (
    <div className="space-y-6">
      {/* Student Welcome Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentStudent?.profileImage}
            alt={currentStudent?.fullName}
            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
          />
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
              Student Library Portal
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Hello, {currentStudent?.fullName || currentUser.name}
            </h2>
            <p className="text-xs text-slate-500">
              {currentStudent?.course} • Roll: <span className="font-mono text-slate-800 dark:text-slate-200">{currentStudent?.studentId}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate("reading-analytics")}
            className="px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-amber-600" />
            Reading & Honors
          </button>
          <button
            type="button"
            onClick={() => setIsCardOpen(true)}
            className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <IdCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Digital Library Pass
          </button>
          <button
            type="button"
            onClick={() => onNavigate("books")}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-200 dark:shadow-none transition flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Browse Catalog
          </button>
        </div>
      </div>

      {/* Announcements Notice Banner if available */}
      {activeAnnouncements.length > 0 && (
        <div
          onClick={() => onNavigate("announcements")}
          className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:bg-indigo-100/70 transition"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
              <Megaphone className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                Latest Circular: {activeAnnouncements[0].title}
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                {activeAnnouncements[0].description}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 flex items-center gap-1">
            View All ({activeAnnouncements.length}) <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      )}

      {/* KPI Cards - High Density */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Loans */}
        <div
          onClick={() => onNavigate("transactions")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Loans
          </p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {activeLoans.length}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              Limit: {currentStudent?.maxBorrowLimit || 3} books
            </span>
          </div>
        </div>

        {/* Pending Fine Dues */}
        <div
          onClick={() => onNavigate("fines")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Fines
          </p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
              {settings.currency}{pendingFineTotal}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              {pendingFineTotal > 0 ? "Pay at counter" : "All cleared"}
            </span>
          </div>
        </div>

        {/* Active Reservations */}
        <div
          onClick={() => onNavigate("reservations")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Reservations
          </p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {myReservations.length}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Hold queue</span>
          </div>
        </div>

        {/* AI Recommendations */}
        <div
          onClick={() => onNavigate("smart-recommendations")}
          className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-indigo-950/40 border border-blue-200 dark:border-slate-800 rounded-xl p-4 shadow-xs cursor-pointer hover:border-blue-400 transition"
        >
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            AI Academic Advisor
          </p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Semester Study Picks
            </h3>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5">
              Explore <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Currently Borrowed Books */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              My Currently Borrowed Books ({activeLoans.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Due in {settings.borrowDurationDays} days from issue date
          </span>
        </div>

        {activeLoans.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-400 space-y-2">
            <p>You currently do not have any borrowed books.</p>
            <button
              type="button"
              onClick={() => onNavigate("books")}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Explore Books to Borrow →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeLoans.map((loan) => {
              const isOverdue = loan.status === "overdue" || new Date(loan.dueDate) < new Date();
              return (
                <div
                  key={loan.id}
                  className={`p-3.5 rounded-lg border flex items-start gap-3 transition ${
                    isOverdue
                      ? "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <img
                    src={loan.coverImage}
                    alt=""
                    className="w-10 h-14 object-cover rounded shadow-2xs shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">
                        {loan.id}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isOverdue
                            ? "bg-red-600 text-white"
                            : "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-400"
                        }`}
                      >
                        {isOverdue ? "OVERDUE" : "ACTIVE"}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {loan.bookTitle}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      ISBN: {loan.bookIsbn}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Due Date:</span>
                      <span
                        className={`font-semibold ${
                          isOverdue ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {loan.dueDate}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommended Textbooks */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recommended for BCA Semester {currentStudent?.semester}
            </h3>
            <p className="text-xs text-slate-500">
              Prescribed textbooks and reference manuals available in the racks
            </p>
          </div>
          <button
            onClick={() => onNavigate("smart-recommendations")}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            AI Recs <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {books.slice(0, 4).map((book) => (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="p-3 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer transition flex items-center gap-2.5"
            >
              <img
                src={book.coverImage}
                alt=""
                className="w-9 h-13 object-cover rounded shadow-2xs shrink-0"
              />
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {book.title}
                </h5>
                <p className="text-[10px] text-slate-500 truncate">{book.author}</p>
                <span
                  className={`text-[9px] font-bold block mt-0.5 ${
                    book.availableCopies > 0 ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {book.availableCopies > 0 ? "IN STOCK" : "CHECKED OUT"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Digital ID Card Modal */}
      <StudentCardModal
        student={currentStudent}
        isOpen={isCardOpen}
        onClose={() => setIsCardOpen(false)}
      />
    </div>
  );
};
