import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { initialMonthlyStats } from "../../data/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Download,
  Printer,
  BookOpen,
  Users,
  DollarSign,
  Clock,
  PieChart as PieIcon,
  Award,
  AlertTriangle,
  Wrench,
  Archive,
  Bookmark,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export const ReportsView: React.FC = () => {
  const { books, students, transactions, fines, reservations, categories, settings } = useLibrary();
  const [activeTab, setActiveTab] = useState<"overview" | "books" | "students" | "inventory_health">("overview");

  const monthlyStats = initialMonthlyStats.map((s, idx) => {
    // Add overdue trend estimate per month
    const overdueCount = idx === 0 ? 3 : idx === 1 ? 5 : idx === 2 ? 2 : idx === 3 ? 6 : idx === 4 ? 4 : 2;
    return {
      ...s,
      overdue: overdueCount,
    };
  });

  // Category distribution data with total borrow count
  const categoryData = categories.map((cat) => {
    const catBooks = books.filter((b) => b.categoryId === cat.id);
    const count = catBooks.length;
    const borrows = catBooks.reduce((sum, b) => sum + b.borrowCount, 0);
    return { name: cat.name, value: count, borrows };
  });

  // Top borrowed books
  const topBooks = [...books]
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, 5);

  // Most active students
  const activeStudents = students
    .map((student) => {
      const studentTx = transactions.filter((t) => t.studentId === student.studentId);
      const totalBorrows = studentTx.length;
      const returned = studentTx.filter((t) => t.status === "returned").length;
      const onTime = studentTx.filter((t) => t.status === "returned" && t.fineAmount === 0).length;
      return {
        ...student,
        totalBorrows,
        returned,
        onTimeRate: returned > 0 ? Math.round((onTime / returned) * 100) : 100,
      };
    })
    .sort((a, b) => b.totalBorrows - a.totalBorrows)
    .slice(0, 5);

  // Most requested / reserved books
  const reservedBooksSummary = books
    .map((b) => {
      const queue = reservations.filter(
        (r) => r.bookId === b.id && (r.status === "pending" || r.status === "available")
      );
      return {
        book: b,
        queueCount: queue.length,
      };
    })
    .filter((item) => item.queueCount > 0)
    .sort((a, b) => b.queueCount - a.queueCount)
    .slice(0, 5);

  // Physical copy health (Lost, Damaged, Maintenance)
  const physicalCopies = books.flatMap((b) =>
    (b.copies || []).map((copy) => ({ ...copy, bookTitle: b.title, bookId: b.id }))
  );

  const lostCopies = physicalCopies.filter((c) => c.status === "lost");
  const damagedCopies = physicalCopies.filter((c) => c.status === "damaged" || c.condition === "damaged");
  const maintenanceCopies = physicalCopies.filter((c) => c.status === "maintenance");

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Month,Issued,Returned,Overdue,Fines Collected\n" +
      monthlyStats
        .map((s) => `${s.month},${s.issued},${s.returned},${s.overdue},${s.fines}`)
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `libsmart-analytics-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Smart Library Analytics & Executive Intelligence
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Circulation trends, fine collection velocity, student reading leaderboards, and physical copy health metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Issues Logged
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {transactions.length}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            ↑ 14% vs previous semester
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Circulation Return Rate
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {Math.round(
              (transactions.filter((t) => t.status === "returned").length /
                (transactions.length || 1)) *
                100
            )}%
          </p>
          <span className="text-[11px] text-indigo-600 font-medium">
            Active inventory on schedule
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Overdue Fines
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {settings.currency}
            {fines.reduce((sum, f) => sum + f.amount, 0)}.00
          </p>
          <span className="text-[11px] text-slate-400">
            {fines.filter((f) => f.status === "paid").length} cleared vouchers • {fines.filter((f) => f.status === "waived").length} waived
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Shelf Inventory
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {books.reduce((sum, b) => sum + b.availableCopies, 0)} / {books.reduce((sum, b) => sum + b.totalCopies, 0)}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            Volumes currently in library racks
          </span>
        </div>
      </div>

      {/* Navigation Tabs for Analytics Sections */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === "overview"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Circulation & Trends
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("books")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === "books"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Books & Category Velocity
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === "students"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Most Active Students
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("inventory_health")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === "inventory_health"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Physical Copy Health ({lostCopies.length + damagedCopies.length + maintenanceCopies.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & MONTHLY TRENDS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Chart 1: Monthly Circulation Activity (Recharts Bar Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Monthly Borrowing & Return Trends
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparative volume of books checked out vs. checked back in
                  </p>
                </div>
                <span className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 px-2.5 py-1 rounded-md">
                  Academic Year 2024-25
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        color: "#ffffff",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="issued" name="Books Issued" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="returned" name="Books Returned" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overdue & Fine Trends Line Chart */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Fine Collection & Overdue Rate
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly overdue fine recovery ({settings.currency})
                </p>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        color: "#ffffff",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="fines"
                      name="Fines Collected (₹)"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#ef4444" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="overdue"
                      name="Overdue Incidents"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#f59e0b" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 flex justify-between">
                <span>Average recovery: <strong>88%</strong></span>
                <span>Fine rate: <strong>{settings.currency}{settings.finePerDay}/day</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKS & CATEGORIES */}
      {activeTab === "books" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Borrowed Books */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Most Borrowed Academic Books
                  </h3>
                  <p className="text-xs text-slate-500">
                    Highest circulation velocity across computer science & applications
                  </p>
                </div>
                <Award className="w-5 h-5 text-amber-500" />
              </div>

              <div className="space-y-3 pt-2">
                {topBooks.map((book, idx) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <img
                        src={book.coverImage}
                        alt=""
                        className="w-8 h-11 object-cover rounded shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {book.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 truncate">
                          {book.author} • {book.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right pl-3 shrink-0">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                        {book.borrowCount} issues
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {book.availableCopies} on shelf
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Requested & Reserved Books */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Most Requested & Reserved Books (Hold Queue)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Titles with active student reservations waiting for return
                  </p>
                </div>
                <Bookmark className="w-5 h-5 text-blue-500" />
              </div>

              <div className="space-y-3 pt-2">
                {reservedBooksSummary.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No active reservations currently queued.
                  </div>
                ) : (
                  reservedBooksSummary.map(({ book, queueCount }, idx) => (
                    <div
                      key={book.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <img
                          src={book.coverImage}
                          alt=""
                          className="w-8 h-11 object-cover rounded shadow-xs shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {book.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 truncate">
                            Shelf: {book.shelfLocation || "Rack 1"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right pl-3 shrink-0">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                          {queueCount} {queueCount === 1 ? "student" : "students"} waiting
                        </span>
                        <span className="text-[10px] text-amber-600 font-semibold">
                          {book.availableCopies} available
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Category Popularity Breakdown */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Curriculum Category Circulation & Title Popularity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoryData.map((cat, idx) => (
                <div
                  key={cat.name}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {cat.name}
                    </span>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Total Titles:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.value}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Total Checkouts:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{cat.borrows} issues</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MOST ACTIVE STUDENTS */}
      {activeTab === "students" && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Most Active Student Scholars
              </h3>
              <p className="text-xs text-slate-500">
                Top borrowing patrons by checkouts, on-time punctuality, and library participation
              </p>
            </div>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rank</th>
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold">Roll Number</th>
                  <th className="px-4 py-3 font-semibold">Course & Sem</th>
                  <th className="px-4 py-3 font-semibold">Total Borrowed</th>
                  <th className="px-4 py-3 font-semibold">Returned</th>
                  <th className="px-4 py-3 font-semibold">On-Time Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {activeStudents.map((stu, idx) => (
                  <tr key={stu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <img
                        src={stu.profileImage}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <span>{stu.fullName}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400">
                      {stu.studentId}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {stu.course} (Sem {stu.semester})
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {stu.totalBorrows} books
                    </td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">
                      {stu.returned} books
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                        {stu.onTimeRate}% Punctual
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PHYSICAL COPY HEALTH (Lost, Damaged, Maintenance) */}
      {activeTab === "inventory_health" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-1">
              <div className="flex items-center justify-between text-red-600">
                <span className="text-xs font-bold uppercase tracking-wider">Lost Copies</span>
                <Archive className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{lostCopies.length}</p>
              <span className="text-[11px] text-red-600">Physical book unaccounted for</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1">
              <div className="flex items-center justify-between text-amber-600">
                <span className="text-xs font-bold uppercase tracking-wider">Damaged Copies</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{damagedCopies.length}</p>
              <span className="text-[11px] text-amber-600">Binding, cover or page damage</span>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1">
              <div className="flex items-center justify-between text-blue-600">
                <span className="text-xs font-bold uppercase tracking-wider">In Maintenance</span>
                <Wrench className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{maintenanceCopies.length}</p>
              <span className="text-[11px] text-blue-600">Currently undergoing restoration</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Detailed Physical Inventory Discrepancy Log
            </h3>

            {lostCopies.length + damagedCopies.length + maintenanceCopies.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All physical copies across all shelves are in good circulating condition.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Copy ID</th>
                      <th className="px-4 py-3 font-semibold">Book Title</th>
                      <th className="px-4 py-3 font-semibold">Shelf Location</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Condition</th>
                      <th className="px-4 py-3 font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {[...lostCopies, ...damagedCopies, ...maintenanceCopies].map((copy) => (
                      <tr key={copy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {copy.id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {copy.bookTitle}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {copy.shelfLocation?.rack || "Rack 1"} • Shelf {copy.shelfLocation?.shelf || "1"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              copy.status === "lost"
                                ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                                : copy.status === "damaged"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                            }`}
                          >
                            {copy.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium capitalize">
                          {copy.condition || "Standard"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {copy.conditionNotes || "Physical audit flagged for circulation review."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
