import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Announcement, AnnouncementPriority, AnnouncementAudience } from "../../types";
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  X,
  Megaphone,
  Pin,
  Sparkles,
} from "lucide-react";

export const AnnouncementsView: React.FC = () => {
  const { announcements, addAnnouncement, deleteAnnouncement, currentUser } = useLibrary();
  const [filterAudience, setFilterAudience] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("medium");
  const [targetAudience, setTargetAudience] = useState<AnnouncementAudience>("all");
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

  const canPost = currentUser.role === "admin" || currentUser.role === "librarian";

  const visibleAnnouncements = announcements.filter((a) => {
    // If student, hide announcements meant strictly for librarians
    if (currentUser.role === "student" && a.targetAudience === "librarians") return false;
    // Filter controls
    if (filterAudience !== "all" && a.targetAudience !== filterAudience) return false;
    if (filterPriority !== "all" && a.priority !== filterPriority) return false;
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    addAnnouncement({
      title: title.trim(),
      description: description.trim(),
      priority,
      targetAudience,
      expiryDate,
      createdBy: currentUser.name || "Library Administration",
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setTargetAudience("all");
    setIsCreateModalOpen(false);
  };

  const getPriorityStyle = (p: AnnouncementPriority) => {
    switch (p) {
      case "urgent":
        return {
          badge: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-900/60",
          cardBorder: "border-l-4 border-l-red-500",
          icon: <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />,
        };
      case "high":
        return {
          badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900/60",
          cardBorder: "border-l-4 border-l-amber-500",
          icon: <Bell className="w-4 h-4 text-amber-500 shrink-0" />,
        };
      case "medium":
        return {
          badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900/60",
          cardBorder: "border-l-4 border-l-blue-500",
          icon: <Megaphone className="w-4 h-4 text-blue-500 shrink-0" />,
        };
      case "low":
      default:
        return {
          badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          cardBorder: "border-l-4 border-l-slate-400",
          icon: <Pin className="w-4 h-4 text-slate-400 shrink-0" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            Library Announcements & Circulars
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official circulars, library timing updates, exam preparation hours, and curriculum book additions
          </p>
        </div>

        {canPost && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Post New Notice
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setFilterPriority("all");
              setFilterAudience("all");
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterPriority === "all" && filterAudience === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All Notices ({announcements.length})
          </button>
          <button
            onClick={() => setFilterPriority("urgent")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterPriority === "urgent"
                ? "bg-red-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Urgent Alerts ({announcements.filter((a) => a.priority === "urgent").length})
          </button>
          <button
            onClick={() => {
              setFilterPriority("all");
              setFilterAudience("students");
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterAudience === "students"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            For Students
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {visibleAnnouncements.length} circulars active
        </span>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {visibleAnnouncements.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No Active Notices
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no circulars matching your filter criteria.
            </p>
          </div>
        ) : (
          visibleAnnouncements.map((item) => {
            const style = getPriorityStyle(item.priority);
            return (
              <div
                key={item.id}
                className={`p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700 ${style.cardBorder}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {style.icon}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}
                      >
                        {item.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Target: {item.targetAudience === "all" ? "All Patrons" : item.targetAudience}
                      </span>
                    </div>
                  </div>

                  {canPost && (
                    <button
                      type="button"
                      onClick={() => deleteAnnouncement(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition self-end sm:self-start"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>
                      Posted by: <strong className="text-slate-700 dark:text-slate-300">{item.createdBy}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.createdAt}
                    </span>
                  </div>

                  {item.expiryDate && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <Clock className="w-3 h-3" />
                      Valid until: {item.expiryDate}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Announcement Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Publish Library Announcement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Circular Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Extended Library Hours for Mid-Semester BCA Exams"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="State the instructions, timings, rack locations, or academic policies clearly..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  >
                    <option value="low">Low (General)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Important)</option>
                    <option value="urgent">Urgent (Red Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as AnnouncementAudience)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  >
                    <option value="all">All Library Patrons</option>
                    <option value="students">Students Only</option>
                    <option value="librarians">Staff & Librarians</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valid Until Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
