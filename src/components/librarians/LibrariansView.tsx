import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { LibrarianProfile } from "../../types";
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  Edit2,
  Trash2,
  Mail,
  Phone,
  X,
  Lock,
} from "lucide-react";

export const LibrariansView: React.FC = () => {
  const { librarians, addLibrarian, updateLibrarian, deleteLibrarian, currentUser } = useLibrary();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLibrarian, setEditingLibrarian] = useState<LibrarianProfile | null>(null);

  // Form State
  const [staffId, setStaffId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 98765 11223");
  const [assignedDesk, setAssignedDesk] = useState("Circulation Desk A");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [profileImage, setProfileImage] = useState("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80");

  const isAdmin = currentUser.role === "admin";

  const filteredLibrarians = librarians.filter((lib) => {
    const q = searchTerm.toLowerCase();
    const id = (lib.staffId || lib.employeeId || "").toLowerCase();
    const desk = (lib.assignedDesk || lib.designation || "").toLowerCase();
    return (
      lib.fullName.toLowerCase().includes(q) ||
      id.includes(q) ||
      lib.email.toLowerCase().includes(q) ||
      desk.includes(q)
    );
  });

  const openAddForm = () => {
    setEditingLibrarian(null);
    setStaffId(`LIB-2024-0${librarians.length + 3}`);
    setFullName("");
    setEmail("");
    setPhone("+91 98765 11223");
    setAssignedDesk("Circulation Desk B");
    setStatus("active");
    setProfileImage("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80");
    setIsFormOpen(true);
  };

  const openEditForm = (lib: LibrarianProfile) => {
    setEditingLibrarian(lib);
    setStaffId(lib.staffId || lib.employeeId || "");
    setFullName(lib.fullName);
    setEmail(lib.email);
    setPhone(lib.phone);
    setAssignedDesk(lib.assignedDesk || lib.designation || "");
    setStatus(lib.status);
    setProfileImage(lib.profileImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80");
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !fullName.trim() || !email.trim()) {
      alert("Please fill in Staff ID, Full Name, and Email.");
      return;
    }

    if (editingLibrarian) {
      updateLibrarian(editingLibrarian.id, {
        employeeId: staffId.trim(),
        staffId: staffId.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        designation: assignedDesk.trim(),
        assignedDesk: assignedDesk.trim(),
        status,
        profileImage: profileImage.trim(),
      });
    } else {
      addLibrarian({
        userId: `usr-lib-${Date.now()}`,
        employeeId: staffId.trim(),
        staffId: staffId.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        designation: assignedDesk.trim(),
        assignedDesk: assignedDesk.trim(),
        status,
        profileImage: profileImage.trim(),
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (lib: LibrarianProfile) => {
    const id = lib.staffId || lib.employeeId;
    if (window.confirm(`Are you sure you want to remove librarian ${lib.fullName} (${id})?`)) {
      deleteLibrarian(lib.id);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
          Administrator Access Required
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Librarian staff management is restricted to system administrators. Switch your role to Admin in the top bar to test this screen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Librarian Staff Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authorized circulation officers, desk assignments, and privileges
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by staff name, ID, desk, or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Librarians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLibrarians.map((lib) => (
          <div
            key={lib.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={lib.profileImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80"}
                    alt={lib.fullName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {lib.fullName}
                    </h4>
                    <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {lib.staffId || lib.employeeId}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    lib.status === "active"
                      ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {lib.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  {lib.assignedDesk || lib.designation}
                </p>
                <p className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Mail className="w-3.5 h-3.5" />
                  {lib.email}
                </p>
                <p className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Phone className="w-3.5 h-3.5" />
                  {lib.phone}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => openEditForm(lib)}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(lib)}
                className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Librarian Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {editingLibrarian ? "Edit Librarian" : "Add Librarian Staff"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Staff ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Circulation Station
                </label>
                <input
                  type="text"
                  value={assignedDesk}
                  onChange={(e) => setAssignedDesk(e.target.value)}
                  placeholder="e.g. Reference & Periodicals Desk"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Employment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="active">Active Duty</option>
                  <option value="inactive">On Leave / Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
                >
                  {editingLibrarian ? "Update Staff" : "Add Librarian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
