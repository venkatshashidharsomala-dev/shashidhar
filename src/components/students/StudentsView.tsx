import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { StudentProfile } from "../../types";
import { StudentCardModal } from "../common/StudentCardModal";
import {
  GraduationCap,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  IdCard,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

export const StudentsView: React.FC = () => {
  const { students, transactions, fines, addStudent, updateStudent, deleteStudent, currentUser } = useLibrary();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<StudentProfile | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Add / Edit Student Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);

  // Form State
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("Bachelor of Computer Applications (BCA)");
  const [department, setDepartment] = useState("Computer Science & IT");
  const [semester, setSemester] = useState(6);
  const [profileImage, setProfileImage] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80");
  const [accountStatus, setAccountStatus] = useState<"active" | "suspended">("active");

  const canManage = currentUser.role === "admin" || currentUser.role === "librarian";

  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.course.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  });

  const openAddForm = () => {
    setEditingStudent(null);
    setStudentId(`BCA-2024-${String(students.length + 40).padStart(3, "0")}`);
    setFullName("");
    setEmail("");
    setPhone("+91 98765 43210");
    setCourse("Bachelor of Computer Applications (BCA)");
    setDepartment("Computer Science & IT");
    setSemester(6);
    setProfileImage("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80");
    setAccountStatus("active");
    setIsFormOpen(true);
  };

  const openEditForm = (student: StudentProfile) => {
    setEditingStudent(student);
    setStudentId(student.studentId);
    setFullName(student.fullName);
    setEmail(student.email);
    setPhone(student.phone);
    setCourse(student.course);
    setDepartment(student.department);
    setSemester(student.semester);
    setProfileImage(student.profileImage);
    setAccountStatus(student.accountStatus);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !fullName.trim() || !email.trim()) {
      alert("Please fill in Student ID, Name, and Email.");
      return;
    }

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        studentId: studentId.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        course: course.trim(),
        department: department.trim(),
        semester: Number(semester),
        profileImage: profileImage.trim(),
        accountStatus,
      });
    } else {
      addStudent({
        studentId: studentId.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        course: course.trim(),
        department: department.trim(),
        semester: Number(semester),
        profileImage: profileImage.trim(),
        accountStatus,
        maxBorrowLimit: 3,
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (student: StudentProfile) => {
    if (window.confirm(`Are you sure you want to remove student "${student.fullName}" (${student.studentId})?`)) {
      deleteStudent(student.id);
    }
  };

  const handleOpenCard = (student: StudentProfile) => {
    setSelectedStudentForCard(student);
    setIsCardModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Student Member Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registered students, borrowing privileges, library passes, and account statuses
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openAddForm}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            Register Student
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, Roll No (e.g. BCA-2024-042), email, or department..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map((std) => {
          const activeBorrows = transactions.filter(
            (t) => t.studentId === std.studentId && (t.status === "issued" || t.status === "overdue")
          );
          const pendingFines = fines
            .filter((f) => f.studentId === std.studentId && f.status === "pending")
            .reduce((sum, f) => sum + f.amount, 0);

          return (
            <div
              key={std.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={std.profileImage}
                      alt={std.fullName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {std.fullName}
                      </h4>
                      <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {std.studentId}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      std.accountStatus === "active"
                        ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {std.accountStatus.toUpperCase()}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p className="truncate font-medium">{std.course}</p>
                  <p className="text-slate-500 text-[11px]">
                    Dept: {std.department} • Semester {std.semester}
                  </p>
                  <p className="text-slate-500 text-[11px] truncate">
                    ✉️ {std.email}
                  </p>
                </div>

                {/* Badges */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Active Borrows</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {activeBorrows.length} / {std.maxBorrowLimit || 3} books
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Pending Fines</span>
                    <span className={`font-semibold ${pendingFines > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      ₹{pendingFines}.00
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => handleOpenCard(std)}
                  className="flex-1 py-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1"
                >
                  <IdCard className="w-3.5 h-3.5" />
                  Digital Library Pass
                </button>

                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditForm(std)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Edit Student"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {currentUser.role === "admin" && (
                      <button
                        type="button"
                        onClick={() => handleDelete(std)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Student Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {editingStudent ? "Edit Student Profile" : "Register New Student"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Student ID / Roll No *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. BCA-2024-042"
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
                    placeholder="e.g. John Doe"
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
                    placeholder="student@university.edu"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Course / Degree
                  </label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Semester
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Profile Photo URL
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
                  Account Status
                </label>
                <select
                  value={accountStatus}
                  onChange={(e) => setAccountStatus(e.target.value as "active" | "suspended")}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="active">Active (Privileges Granted)</option>
                  <option value="suspended">Suspended (Cannot Borrow)</option>
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
                  {editingStudent ? "Save Changes" : "Register Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Student Library Pass Modal */}
      <StudentCardModal
        student={selectedStudentForCard}
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />
    </div>
  );
};
