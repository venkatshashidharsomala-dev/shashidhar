import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { AuditLogEntry } from "../../types";
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Shield,
  Clock,
  ArrowDownRight,
  Database,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useLibrary();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecordType, setSelectedRecordType] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedRecordType !== "all" && log.recordType !== selectedRecordType) return false;
    if (selectedRole !== "all" && log.userRole !== selectedRole) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.description.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.relatedRecordId.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ["Audit ID", "Timestamp", "User", "Role", "Action", "Record Type", "Related ID", "Description"];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.formattedDate}"`,
      `"${l.userName}"`,
      l.userRole,
      `"${l.action}"`,
      l.recordType,
      `"${l.relatedRecordId}"`,
      `"${l.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `libsmart-audit-trail-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRecordBadge = (type: AuditLogEntry["recordType"]) => {
    switch (type) {
      case "circulation":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400";
      case "fine":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400";
      case "book":
      case "copy":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400";
      case "reservation":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400";
      case "announcement":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            System Audit Trail & Security Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable chronological logging of book circulations, fine collections, waivers, copy revisions, and administrative events
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition hover:bg-slate-50 flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export Audit Trail (CSV)
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Logged Events
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {auditLogs.length}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">100% verified session trail</span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Circulation Actions
          </span>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {auditLogs.filter((l) => l.recordType === "circulation").length}
          </p>
          <span className="text-[11px] text-slate-400">Checkouts & check-ins</span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Financial & Fine Events
          </span>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {auditLogs.filter((l) => l.recordType === "fine").length}
          </p>
          <span className="text-[11px] text-slate-400">Collections & waivers</span>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Catalog & Inventory Edits
          </span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {auditLogs.filter((l) => l.recordType === "book" || l.recordType === "copy").length}
          </p>
          <span className="text-[11px] text-slate-400">Copy status & titles</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedRecordType}
                onChange={(e) => setSelectedRecordType(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Record Types</option>
                <option value="circulation">Circulation (Issues & Returns)</option>
                <option value="fine">Fines (Payments & Waivers)</option>
                <option value="book">Books & Titles</option>
                <option value="copy">Physical Copies</option>
                <option value="reservation">Reservations</option>
                <option value="announcement">Announcements</option>
                <option value="settings">Settings</option>
              </select>
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="librarian">Librarian</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, action, book, or Roll No..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Event ID</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Authorized User</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Related Record</th>
                <th className="px-4 py-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {log.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[11px]">
                      {log.formattedDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                          {log.userName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                          {log.userRole}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRecordBadge(
                          log.recordType
                        )}`}
                      >
                        {log.recordType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {log.relatedRecordId}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-md">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
