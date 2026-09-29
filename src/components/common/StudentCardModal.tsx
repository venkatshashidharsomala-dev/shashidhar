import React from "react";
import { StudentProfile } from "../../types";
import { useLibrary } from "../../context/LibraryContext";
import { QRCodeView } from "./QRCodeView";
import { X, Printer, ShieldCheck, GraduationCap, Phone, Mail } from "lucide-react";

interface StudentCardModalProps {
  student: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const { transactions, settings } = useLibrary();

  if (!isOpen || !student) return null;

  const activeBorrows = transactions.filter(
    (t) => t.studentId === student.studentId && (t.status === "issued" || t.status === "overdue")
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Digital Student Library Pass
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Print Card"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable ID Card */}
        <div className="p-6">
          <div className="border-2 border-indigo-500/30 dark:border-indigo-500/40 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 shadow-xl relative overflow-hidden">
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b border-indigo-400/20 pb-3">
              <div>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-indigo-300">
                  {settings.institutionName}
                </span>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  {settings.libraryName}
                </h4>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED PASS
              </div>
            </div>

            {/* Profile Content */}
            <div className="flex gap-4 mt-4 items-center">
              <img
                src={student.profileImage}
                alt={student.fullName}
                className="w-20 h-20 rounded-xl object-cover border-2 border-white/80 shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">
                  Student Member
                </p>
                <h3 className="text-base font-bold text-white truncate">
                  {student.fullName}
                </h3>
                <p className="text-xs text-slate-300 truncate">
                  {student.course}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-indigo-200">
                  <span>Sem: {student.semester}</span>
                  <span>•</span>
                  <span>Dept: {student.department}</span>
                </div>
              </div>
            </div>

            {/* ID & Barcode / QR */}
            <div className="mt-4 pt-3 border-t border-indigo-400/20 flex items-center justify-between">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-slate-400">ID:</span>
                  <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                    {student.studentId}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <Mail className="w-3 h-3 text-indigo-300" />
                  <span className="truncate max-w-[170px]">{student.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <Phone className="w-3 h-3 text-indigo-300" />
                  <span>{student.phone}</span>
                </div>
              </div>

              {/* QR Tag */}
              <div className="bg-white p-1 rounded-lg">
                <QRCodeView
                  value={student.studentId}
                  size={68}
                  className="p-0 border-0"
                />
              </div>
            </div>

            {/* Bottom stats footer */}
            <div className="mt-3 pt-2 border-t border-indigo-400/10 flex justify-between items-center text-[10px] text-indigo-200">
              <span>Active Borrows: {activeBorrows.length}/{student.maxBorrowLimit || settings.borrowLimit}</span>
              <span>Valid Thru: June 2027</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
