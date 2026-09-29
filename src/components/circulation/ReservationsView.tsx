import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Reservation } from "../../types";
import {
  Bookmark,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  BookOpen,
  AlertCircle,
} from "lucide-react";

export const ReservationsView: React.FC = () => {
  const { reservations, cancelReservation, currentUser, books } = useLibrary();
  const [searchTerm, setSearchTerm] = useState("");

  const visibleReservations = currentUser.role === "student" && currentUser.studentId
    ? reservations.filter((r) => r.studentId === currentUser.studentId)
    : reservations;

  const filteredReservations = visibleReservations.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.bookTitle.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.studentId.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {currentUser.role === "student" ? "My Book Reservations" : "Book Reservation Queue"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Hold requests placed by students for high-demand checked out titles
        </p>
      </div>

      {/* Search */}
      <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reservation by student, book, or Roll No..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Res ID</th>
                <th className="px-4 py-3 font-semibold">Book Title</th>
                <th className="px-4 py-3 font-semibold">Student Name</th>
                <th className="px-4 py-3 font-semibold">Roll No</th>
                <th className="px-4 py-3 font-semibold">Request Date</th>
                <th className="px-4 py-3 font-semibold">Queue Position</th>
                <th className="px-4 py-3 font-semibold">Current Availability</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No reservations found in queue.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => {
                  const book = books.find((b) => b.id === res.bookId);
                  const isAvailableNow = (book?.availableCopies || 0) > 0;
                  return (
                    <tr
                      key={res.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-mono text-slate-400">{res.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                        {res.bookTitle}
                      </td>
                      <td className="px-4 py-3">{res.studentName}</td>
                      <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400">
                        {res.studentId}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{res.reservationDate}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          #{res.queuePosition} in line
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isAvailableNow ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" /> Ready for pickup ({book?.availableCopies} available)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px]">
                            <Clock className="w-3.5 h-3.5" /> All copies out
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {res.status === "active" && (
                          <button
                            type="button"
                            onClick={() => cancelReservation(res.id)}
                            className="px-2.5 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-[11px] font-medium transition"
                          >
                            Cancel Reservation
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
