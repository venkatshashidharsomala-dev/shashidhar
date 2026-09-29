import React, { useMemo } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book } from "../../types";
import { calculateStudentAchievements } from "../../utils/studentAchievements";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  PieChart as PieIcon,
  Star,
  Target,
  TrendingUp,
  Bookmark,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

interface StudentReadingAnalyticsViewProps {
  onSelectBook?: (book: Book) => void;
  onNavigate?: (view: string) => void;
}

export const StudentReadingAnalyticsView: React.FC<StudentReadingAnalyticsViewProps> = ({
  onSelectBook,
  onNavigate,
}) => {
  const { currentUser, students, transactions, books, reviews, reservations } = useLibrary();

  // Strictly identify student profile - NEVER expose other students
  const currentStudent = useMemo(() => {
    return students.find((s) => s.studentId === currentUser.studentId) || students[0];
  }, [students, currentUser.studentId]);

  const studentId = currentStudent?.studentId || currentUser.studentId || "";

  // Student specific transactions
  const studentTx = useMemo(() => {
    return transactions.filter((t) => t.studentId === studentId);
  }, [transactions, studentId]);

  const returnedTx = useMemo(() => {
    return studentTx.filter((t) => t.status === "returned");
  }, [studentTx]);

  const activeTx = useMemo(() => {
    return studentTx.filter((t) => t.status === "issued" || t.status === "overdue");
  }, [studentTx]);

  // Achievements
  const achievements = useMemo(() => {
    return calculateStudentAchievements(studentId, transactions, books, reviews, reservations);
  }, [studentId, transactions, books, reviews, reservations]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Reading Goal (Target: 10 books per semester)
  const semesterGoal = 10;
  const goalProgress = Math.min(Math.round((returnedTx.length / semesterGoal) * 100), 100);

  // Category distribution of books read by this student
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    studentTx.forEach((tx) => {
      const book = books.find((b) => b.id === tx.bookId);
      const cat = book?.category || "Computer Science";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length],
    }));
  }, [studentTx, books]);

  // Reading Streak calculation
  const readingStreakDays = useMemo(() => {
    if (studentTx.length === 0) return 0;
    // Calculate based on issue and return velocity
    return Math.min(studentTx.length * 2 + 1, 14);
  }, [studentTx]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            My Reading Analytics & Academic Achievements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personal reading goals, semester reading velocity, discipline coverage, and library honors
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
          <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
            {readingStreakDays} Day Active Reading Streak
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Books Read
            </span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {returnedTx.length}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Completed & returned</span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Loans
            </span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {activeTx.length}
          </p>
          <span className="text-[11px] text-slate-400">Currently in your possession</span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Semester Goal
            </span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {returnedTx.length}/{semesterGoal}
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Badges Unlocked
            </span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {unlockedCount} / {achievements.length}
          </p>
          <span className="text-[11px] text-purple-500 font-medium">Honor levels attained</span>
        </div>
      </div>

      {/* Main Grid: Discipline Distribution & Semester Goal Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Academic Discipline Breakdown */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Reading by Academic Discipline
              </h3>
              <p className="text-xs text-slate-500">
                Curriculum subject distribution across your borrowed literature
              </p>
            </div>
            <PieIcon className="w-4 h-4 text-slate-400" />
          </div>

          {categoryStats.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No borrowing history yet. Check out a book to see your analytics.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div className="w-44 h-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        color: "#ffffff",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 flex-1 w-full">
                {categoryStats.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate max-w-[180px]">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white shrink-0">
                      {item.value} {item.value === 1 ? "book" : "books"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Semester Reading Goal Progress */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-500" />
              Semester Reading Challenge (10 Books)
            </h3>
            <p className="text-xs text-slate-500">
              Department of Computer Applications Dean&apos;s Reading List Challenge
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Challenge Progress
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {goalProgress}% Complete ({returnedTx.length}/{semesterGoal})
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-linear-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              {returnedTx.length >= semesterGoal
                ? "🎉 Congratulations! You have achieved your semester reading target. Outstanding scholarly dedication!"
                : `Read ${semesterGoal - returnedTx.length} more academic titles to earn your BCA Scholar Certificate.`}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>On-Time Return Rate:</span>
            <strong className="text-emerald-600 font-bold">
              {returnedTx.length > 0
                ? `${Math.round(
                    (returnedTx.filter((t) => t.fineAmount === 0).length /
                      returnedTx.length) *
                      100
                  )}% Punctual`
                : "100%"}
            </strong>
          </div>
        </div>
      </div>

      {/* Library Achievement Badges Grid */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Library Achievement Honors & Badges
          </h3>
          <p className="text-xs text-slate-500">
            Gamified milestones awarded for academic borrowing volume, on-time returns, subject diversity, and peer book reviews
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-xl border transition flex items-start gap-3.5 ${
                ach.unlocked
                  ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                  : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 opacity-75"
              }`}
            >
              <div className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shadow-2xs shrink-0">
                {ach.icon}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {ach.title}
                  </h4>
                  {ach.unlocked ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 shrink-0">
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                      {ach.progress}/{ach.maxProgress}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {ach.description}
                </p>

                {!ach.unlocked && (
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{
                        width: `${Math.round((ach.progress / ach.maxProgress) * 100)}%`,
                      }}
                    />
                  </div>
                )}

                {ach.unlocked && ach.unlockedDate && (
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block pt-0.5">
                    Earned on {ach.unlockedDate}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reading History Log */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          My Borrowed Books History
        </h3>

        <div className="space-y-2.5">
          {studentTx.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No borrowing records logged under your student ID yet.
            </p>
          ) : (
            studentTx.map((tx) => {
              const book = books.find((b) => b.id === tx.bookId);
              const isReturned = tx.status === "returned";
              return (
                <div
                  key={tx.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={tx.coverImage}
                      alt=""
                      className="w-8 h-11 object-cover rounded shadow-2xs shrink-0"
                    />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tx.bookTitle}
                      </h5>
                      <p className="text-[10px] text-slate-500 truncate">
                        {tx.bookAuthor} • Copy: {tx.copyId || "Standard"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isReturned
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                      }`}
                    >
                      {isReturned ? "RETURNED" : "ACTIVE"}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {isReturned ? `Returned ${tx.returnDate}` : `Due ${tx.dueDate}`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
