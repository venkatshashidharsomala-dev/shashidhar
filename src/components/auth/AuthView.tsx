import React, { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { UserRole } from "../../types";
import {
  BookOpen,
  Lock,
  Mail,
  User,
  Shield,
  GraduationCap,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Database,
  Sparkles,
  School,
  Phone,
} from "lucide-react";

interface AuthViewProps {
  onLoginSuccess?: (role: UserRole) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const { loginUser, registerUser, darkMode, toggleDarkMode, databaseStatus } = useLibrary();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<UserRole>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration form state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regStudentId, setRegStudentId] = useState("");
  const [regCourse, setRegCourse] = useState("Bachelor of Computer Applications (BCA)");
  const [regSemester, setRegSemester] = useState<number>(6);
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Quick 1-Click Demo Login handler
  const handleQuickDemoLogin = (email: string, role: UserRole) => {
    setLoginLoading(true);
    setLoginError("");
    setTimeout(() => {
      const ok = loginUser(email, "Demo@123", role);
      setLoginLoading(false);
      if (ok) {
        onLoginSuccess?.(role);
      } else {
        setLoginError("Failed to authenticate demo user.");
      }
    }, 300);
  };

  // Handle manual Login submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim()) {
      setLoginError("Please enter your registered email address.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Please enter your account password.");
      return;
    }

    setLoginLoading(true);
    setTimeout(() => {
      const ok = loginUser(loginEmail.trim(), loginPassword, loginRole);
      setLoginLoading(false);
      if (ok) {
        onLoginSuccess?.(loginRole);
      } else {
        setLoginError("Invalid credentials or user not found. Try one of the demo logins above.");
      }
    }, 350);
  };

  // Handle Registration submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regFullName.trim()) {
      setRegError("Full student name is required.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setRegError("Please provide a valid college email address.");
      return;
    }
    if (!regStudentId.trim()) {
      setRegError("University student roll / ID number is required.");
      return;
    }
    if (regPassword.length < 4) {
      setRegError("Password must be at least 4 characters long.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match. Please verify.");
      return;
    }

    setRegLoading(true);
    setTimeout(() => {
      try {
        registerUser({
          name: regFullName.trim(),
          email: regEmail.trim().toLowerCase(),
          studentId: regStudentId.trim().toUpperCase(),
          course: regCourse,
          department: "Computer Applications",
          semester: Number(regSemester),
          phone: regPhone.trim() || "+91 98765 43210",
          password: regPassword,
          role: "student",
        });

        setRegLoading(false);
        setRegSuccess("Student account created successfully! Signing in...");
        setTimeout(() => {
          onLoginSuccess?.("student");
        }, 600);
      } catch (err: any) {
        setRegLoading(false);
        setRegError(err?.message || "Registration failed. Please try again.");
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Top right floating theme toggle */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-400 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Database: Online</span>
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>

      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 mb-1">
            <BookOpen className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Lib<span className="text-indigo-600 dark:text-indigo-400">Smart</span> Management System
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Central Academic Library & Circulation Portal • BCA Final-Year Project Demonstration
          </p>
        </div>

        {/* 1-Click Quick Demo Access Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              1-Click Project Guide Evaluation Logins
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              Zero typing needed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Admin Demo Button */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("admin@libsmart.edu", "admin")}
              disabled={loginLoading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-800 transition text-left group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Shield className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Dr. Rajesh Sharma</p>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium">Click to Login →</span>
            </button>

            {/* Librarian Demo Button */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("priya.patel@libsmart.edu", "librarian")}
              disabled={loginLoading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-800 transition text-left group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <BookOpen className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Librarian
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Priya Patel</p>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium">Click to Login →</span>
            </button>

            {/* Student Demo Button */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("shashidhar.bca@university.edu", "student")}
              disabled={loginLoading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-800 transition text-left group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <GraduationCap className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Student
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Shashidhar Somala</p>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium">Click to Login →</span>
            </button>
          </div>
        </div>

        {/* Main Card: Tab Switcher & Forms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setLoginError("");
              }}
              className={`py-3.5 text-xs font-semibold text-center transition flex items-center justify-center gap-2 ${
                activeTab === "login"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Sign In to Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setRegError("");
              }}
              className={`py-3.5 text-xs font-semibold text-center transition flex items-center justify-center gap-2 ${
                activeTab === "register"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Student Registration
            </button>
          </div>

          <div className="p-6 sm:p-7">
            {/* TAB 1: LOGIN FORM */}
            {activeTab === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Role selection chips */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target User Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { role: "admin", label: "Admin", icon: Shield },
                      { role: "librarian", label: "Librarian", icon: BookOpen },
                      { role: "student", label: "Student", icon: GraduationCap },
                    ].map((item) => (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => {
                          setLoginRole(item.role as UserRole);
                          if (item.role === "admin") setLoginEmail("admin@libsmart.edu");
                          else if (item.role === "librarian") setLoginEmail("priya.patel@libsmart.edu");
                          else setLoginEmail("shashidhar.bca@university.edu");
                          setLoginPassword("LibSmart@2024");
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                          loginRole === item.role
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. admin@libsmart.edu"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <span className="text-[10px] text-slate-400">Default: any password / Demo@123</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {loginLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to {loginRole.toUpperCase()} Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: STUDENT REGISTRATION FORM */}
            {activeTab === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {regError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{regError}</span>
                  </div>
                )}
                {regSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Venkat Shashidhar Somala"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Student Roll / ID */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Student ID / Roll No *
                    </label>
                    <input
                      type="text"
                      required
                      value={regStudentId}
                      onChange={(e) => setRegStudentId(e.target.value)}
                      placeholder="e.g. BCA-2024-042"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      College / University Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. shashidhar@university.edu"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 99000 11223"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Degree / Program */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Degree / Program
                    </label>
                    <select
                      value={regCourse}
                      onChange={(e) => setRegCourse(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Bachelor of Computer Applications (BCA)">BCA (Computer Applications)</option>
                      <option value="Master of Computer Applications (MCA)">MCA (Computer Applications)</option>
                      <option value="B.Tech Computer Science">B.Tech (Computer Science & Eng.)</option>
                      <option value="B.Sc Information Technology">B.Sc (Information Technology)</option>
                    </select>
                  </div>

                  {/* Semester */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Current Semester
                    </label>
                    <select
                      value={regSemester}
                      onChange={(e) => setRegSemester(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Create Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {regLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Student Library Account...</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4" />
                      <span>Complete Registration & Enter Student Portal</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* System & Database Status Footer */}
        <div className="text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              Connected to <strong>{databaseStatus?.engine || "LibSmart Production Database Engine"}</strong>
            </span>
          </div>
          <p>LibSmart Version 2.4.0 • Final-Year BCA Degree Project • Cloud Ready</p>
        </div>
      </div>
    </div>
  );
};
