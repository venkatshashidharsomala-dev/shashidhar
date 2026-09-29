import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  UserRole,
  Book,
  BookCopy,
  CopyStatus,
  CopyCondition,
  BookCategory,
  StudentProfile,
  LibrarianProfile,
  Transaction,
  Reservation,
  FineRecord,
  NotificationItem,
  SystemSettings,
  DigitalReceiptData,
  BookReview,
  Announcement,
  AuditLogEntry,
  DatabaseStatus,
} from "../types";
import {
  initialBooks,
  createDefaultCopies,
  initialCategories,
  initialStudents,
  initialLibrarians,
  initialTransactions,
  initialReservations,
  initialFines,
  initialNotifications,
  initialSettings,
  defaultAdminUser,
  defaultLibrarianUser,
  defaultStudentUser,
  initialReviews,
  initialAnnouncements,
  initialAuditLogs,
} from "../data/mockData";

interface LibraryContextType {
  isAuthenticated: boolean;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  allUsers: User[];
  loginUser: (email: string, password?: string, role?: UserRole) => boolean;
  registerUser: (newUser: Partial<User> & { password?: string }) => void;
  logoutUser: () => void;
  databaseStatus: DatabaseStatus;
  syncDatabaseWithServer: () => Promise<boolean>;
  
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
  setTheme: (isDark: boolean) => void;

  // Books
  books: Book[];
  addBook: (book: Omit<Book, "id" | "createdAt" | "borrowCount" | "qrCode">) => { success: boolean; book?: Book; error?: string };
  updateBook: (id: string, updates: Partial<Book>) => { success: boolean; error?: string };
  deleteBook: (id: string) => void;
  getBookById: (id: string) => Book | undefined;
  getBookByBarcode: (barcodeOrCode: string) => Book | undefined;
  getBookByQR: (qrOrIsbn: string) => Book | undefined;
  generateBookQR: (bookId: string) => Book | undefined;
  updateBookBarcode: (bookId: string, barcode: string) => { success: boolean; book?: Book; error?: string };
  associateBarcodeWithBook: (barcode: string, bookId: string) => { success: boolean; book?: Book; error?: string };

  // Physical Book Copies
  addBookCopy: (bookId: string, copyData?: Partial<BookCopy>) => BookCopy;
  updateBookCopy: (bookId: string, copyId: string, updates: Partial<BookCopy>) => void;
  deleteBookCopy: (bookId: string, copyId: string) => void;
  getCopyById: (copyId: string) => { book: Book; copy: BookCopy } | undefined;
  identifyCode: (scannedCode: string) => {
    type: "copy" | "book" | "student" | "unknown";
    book?: Book;
    copy?: BookCopy;
    student?: StudentProfile;
    rawCode: string;
  };

  // Categories
  categories: BookCategory[];
  addCategory: (category: Omit<BookCategory, "id">) => void;

  // Students
  students: StudentProfile[];
  addStudent: (student: Omit<StudentProfile, "id" | "joinedDate">) => StudentProfile;
  updateStudent: (id: string, updates: Partial<StudentProfile>) => void;
  deleteStudent: (id: string) => void;
  getStudentByStudentId: (studentId: string) => StudentProfile | undefined;

  // Librarians
  librarians: LibrarianProfile[];
  addLibrarian: (librarian: Omit<LibrarianProfile, "id" | "joinedDate">) => void;
  updateLibrarian: (id: string, updates: Partial<LibrarianProfile>) => void;
  deleteLibrarian: (id: string) => void;

  // Transactions
  transactions: Transaction[];
  issueBook: (
    studentId: string,
    bookId: string,
    dueDateStr?: string,
    notes?: string,
    copyId?: string,
    conditionOnIssue?: CopyCondition
  ) => {
    success: boolean;
    message: string;
    transaction?: Transaction;
    receipt?: DigitalReceiptData;
  };
  returnBook: (
    transactionId: string,
    returnDateStr?: string,
    notes?: string,
    conditionOnReturn?: CopyCondition
  ) => {
    success: boolean;
    message: string;
    fineAmount: number;
    receipt?: DigitalReceiptData;
  };
  
  // Reservations
  reservations: Reservation[];
  reserveBook: (bookId: string, studentId: string) => { success: boolean; message: string };
  cancelReservation: (id: string) => void;

  // Fines
  fines: FineRecord[];
  payFine: (
    id: string,
    paymentMethod: "Cash" | "UPI" | "Student Card" | "Online NetBanking"
  ) => { receiptNo: string; receipt?: DigitalReceiptData };
  waiveFine: (
    id: string,
    reason: string,
    processedBy: string
  ) => { success: boolean; message: string; receipt?: DigitalReceiptData };

  // Reviews & Feedback
  reviews: BookReview[];
  addBookReview: (review: Omit<BookReview, "id" | "createdAt">) => { success: boolean; message: string };
  deleteBookReview: (id: string) => void;

  // Announcements
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, "id" | "createdAt">) => void;
  deleteAnnouncement: (id: string) => void;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, "id" | "timestamp" | "formattedDate">) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notif: Omit<NotificationItem, "id" | "createdAt">) => void;

  // Settings
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;

  // Reset
  resetToSampleData: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "libsmart_user",
  AUTH_TOKEN: "libsmart_auth_token",
  BOOKS: "libsmart_books",
  STUDENTS: "libsmart_students",
  LIBRARIANS: "libsmart_librarians",
  CATEGORIES: "libsmart_categories",
  TRANSACTIONS: "libsmart_transactions",
  RESERVATIONS: "libsmart_reservations",
  FINES: "libsmart_fines",
  NOTIFICATIONS: "libsmart_notifications",
  SETTINGS: "libsmart_settings",
  THEME: "libsmart_darkmode",
  REVIEWS: "libsmart_reviews",
  ANNOUNCEMENTS: "libsmart_announcements",
  AUDIT_LOGS: "libsmart_audit_logs",
  USERS: "libsmart_users",
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(darkMode));
    } catch (err) {
      console.error("Failed to persist theme", err);
    }
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Sync theme changes across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.THEME && e.newValue !== null) {
        try {
          const newTheme = JSON.parse(e.newValue);
          setDarkMode(Boolean(newTheme));
        } catch {
          // ignore parsing error
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const setTheme = (isDark: boolean) => setDarkMode(isDark);

  // Users
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : defaultAdminUser;
  });

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token === "logged_out") return false;
    if (!token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "tok_admin_active");
      return true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  // Database Connection and Status State
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus>({
    status: "connected",
    engine: "LibSmart Persistent PostgreSQL-Compatible Server Store",
    storageType: "durable_server_storage",
    schemaVersion: "2.4.0-production",
    lastSynced: new Date().toISOString(),
    tableCounts: {
      books: initialBooks.length,
      users: 6,
      students: initialStudents.length,
      librarians: initialLibrarians.length,
      categories: initialCategories.length,
      transactions: initialTransactions.length,
      reservations: initialReservations.length,
      fines: initialFines.length,
      notifications: initialNotifications.length,
      announcements: initialAnnouncements.length,
      reviews: initialReviews.length,
      auditLogs: initialAuditLogs.length,
    },
  });

  // System Settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Books
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (!saved) return initialBooks;
    try {
      const parsed: Book[] = JSON.parse(saved);
      return parsed.map((b) => {
        const safeBarcode = b.barcode || (b.isbn ? b.isbn.replace(/\D/g, "") : b.id);
        const prefix = b.title.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "BK");
        const copies =
          b.copies && b.copies.length > 0
            ? b.copies.map((c) => ({
                ...c,
                barcode: c.barcode || c.id,
              }))
            : createDefaultCopies(
                b.id,
                prefix,
                b.totalCopies || 4,
                b.availableCopies !== undefined ? b.availableCopies : 2,
                b.shelfLocation || "Block A → Floor 1 → Rack CS-01 → Shelf 1"
              );
        return {
          ...b,
          barcode: safeBarcode,
          copies,
        };
      });
    } catch {
      return initialBooks;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }, [books]);

  // Categories
  const [categories, setCategories] = useState<BookCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  // Students
  const [students, setStudents] = useState<StudentProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return saved ? JSON.parse(saved) : initialStudents;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  // Librarians
  const [librarians, setLibrarians] = useState<LibrarianProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LIBRARIANS);
    return saved ? JSON.parse(saved) : initialLibrarians;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LIBRARIANS, JSON.stringify(librarians));
  }, [librarians]);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  // Reservations
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    return saved ? JSON.parse(saved) : initialReservations;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  }, [reservations]);

  // Fines
  const [fines, setFines] = useState<FineRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FINES);
    return saved ? JSON.parse(saved) : initialFines;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FINES, JSON.stringify(fines));
  }, [fines]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Book Reviews
  const [reviews, setReviews] = useState<BookReview[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return saved ? JSON.parse(saved) : initialReviews;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }, [reviews]);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Audit Logs Helper
  const addAuditLog = (entry: Omit<AuditLogEntry, "id" | "timestamp" | "formattedDate">) => {
    const now = new Date();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: now.toISOString(),
      formattedDate: now.toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // All Users State with persistent local storage
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      defaultAdminUser,
      defaultLibrarianUser,
      defaultStudentUser,
      {
        id: "usr-student-2",
        name: "Aarav Sharma",
        email: "aarav.sharma@university.edu",
        role: "student",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
        createdAt: "2022-08-15",
        studentId: "BCA-2024-015",
        course: "BCA (Computer Applications)",
        department: "Computer Applications",
        semester: 6,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
  }, [allUsers]);

  const switchRole = (role: UserRole) => {
    if (role === "admin") {
      setCurrentUser(defaultAdminUser);
    } else if (role === "librarian") {
      setCurrentUser(defaultLibrarianUser);
    } else {
      setCurrentUser(defaultStudentUser);
    }
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, `tok_${role}_${Date.now()}`);
  };

  const loginUser = (email: string, password?: string, role?: UserRole): boolean => {
    const matched = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    let targetUser: User;

    if (matched) {
      targetUser = matched;
    } else {
      // Create session user with selected role
      targetUser = {
        id: "usr-" + Date.now(),
        name: email.split("@")[0].toUpperCase(),
        email,
        role: role || "student",
        profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString().split("T")[0],
        studentId: role === "student" ? "BCA-" + Math.floor(1000 + Math.random() * 9000) : undefined,
      };
      setAllUsers((prev) => [targetUser, ...prev]);
    }

    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(targetUser));
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, `tok_${targetUser.id}_${Date.now()}`);

    // Record audit log
    addAuditLog({
      userName: targetUser.name,
      userRole: targetUser.role,
      action: "User Authentication",
      recordType: "user",
      relatedRecordId: targetUser.id,
      description: `Signed in as ${targetUser.role.toUpperCase()} (${targetUser.email}).`,
    });

    // Notify server auth in background
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: targetUser.role }),
    }).catch(() => {});

    return true;
  };

  const registerUser = (newUser: Partial<User> & { password?: string }) => {
    const userId = "usr-" + Date.now();
    const studentId = newUser.studentId || "BCA-2024-" + Math.floor(100 + Math.random() * 900);

    const user: User = {
      id: userId,
      name: newUser.name || "New Student",
      email: newUser.email || "student@university.edu",
      role: "student",
      profileImage: newUser.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString().split("T")[0],
      studentId,
      course: newUser.course || "BCA (Computer Applications)",
      department: newUser.department || "Computer Applications",
      semester: newUser.semester || 6,
      phone: newUser.phone || "+91 99000 11223",
    };

    const std: StudentProfile = {
      id: "std-" + Date.now(),
      userId: user.id,
      studentId,
      fullName: user.name,
      email: user.email,
      phone: user.phone || "",
      course: user.course || "BCA",
      department: user.department || "Computer Applications",
      semester: user.semester || 6,
      profileImage: user.profileImage,
      accountStatus: "active",
      joinedDate: new Date().toISOString().split("T")[0],
      maxBorrowLimit: 4,
    };

    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, `tok_${user.id}_${Date.now()}`);
    setStudents((prev) => [std, ...prev]);
    setAllUsers((prev) => [user, ...prev.filter((u) => u.email.toLowerCase() !== user.email.toLowerCase())]);

    // Record audit log
    addAuditLog({
      userName: user.name,
      userRole: "student",
      action: "Student Self-Registration",
      recordType: "user",
      relatedRecordId: studentId,
      description: `New student registered: ${user.name} (${studentId}) in ${user.course}.`,
    });

    // Notify server registration
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...std,
        password: newUser.password,
      }),
    }).catch(() => {});
  };

  const logoutUser = () => {
    addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "User Sign Out",
      recordType: "user",
      relatedRecordId: currentUser.id,
      description: `User signed out of session successfully.`,
    });
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "logged_out");
    setIsAuthenticated(false);
  };

  // Synchronize entire client database with server
  const syncDatabaseWithServer = async (): Promise<boolean> => {
    try {
      const payload = {
        books,
        categories,
        students,
        librarians,
        transactions,
        reservations,
        fines,
        notifications,
        settings,
        users: allUsers,
        reviews,
        announcements,
        auditLogs,
        lastUpdated: new Date().toISOString(),
      };
      const res = await fetch("/api/database/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data && data.status) {
        setDatabaseStatus(data.status);
      }
      return true;
    } catch (err) {
      console.warn("[LibraryContext] Database sync error:", err);
      return false;
    }
  };

  // Bootstrap initial server state and status check on load
  useEffect(() => {
    fetch("/api/database/bootstrap")
      .then((r) => r.json())
      .then((res) => {
        if (res && res.success && res.data) {
          const d = res.data;
          // Hydrate client state if server has persisted records
          if (Array.isArray(d.books) && d.books.length > 0) setBooks(d.books);
          if (Array.isArray(d.categories) && d.categories.length > 0) setCategories(d.categories);
          if (Array.isArray(d.students) && d.students.length > 0) setStudents(d.students);
          if (Array.isArray(d.librarians) && d.librarians.length > 0) setLibrarians(d.librarians);
          if (Array.isArray(d.transactions)) setTransactions(d.transactions);
          if (Array.isArray(d.reservations)) setReservations(d.reservations);
          if (Array.isArray(d.fines)) setFines(d.fines);
          if (Array.isArray(d.notifications)) setNotifications(d.notifications);
          if (d.settings && typeof d.settings === "object") setSettings(d.settings);
          if (Array.isArray(d.users) && d.users.length > 0) setAllUsers(d.users);
          if (Array.isArray(d.reviews)) setReviews(d.reviews);
          if (Array.isArray(d.announcements)) setAnnouncements(d.announcements);
          if (Array.isArray(d.auditLogs)) setAuditLogs(d.auditLogs);
        }
        if (res && res.status) {
          setDatabaseStatus(res.status);
        }
      })
      .catch(() => {
        // Fallback to checking status only if bootstrap fails
        fetch("/api/database/status")
          .then((r) => r.json())
          .then((status) => {
            if (status && status.status) setDatabaseStatus(status);
          })
          .catch(() => {});
      });
  }, []);

  // Debounced auto-save to server storage on any significant change
  useEffect(() => {
    const timer = setTimeout(() => {
      syncDatabaseWithServer();
    }, 2000);
    return () => clearTimeout(timer);
  }, [books, transactions, fines, reservations, students, librarians, categories, allUsers, reviews, announcements, auditLogs, settings]);

  // Book Methods
  const addBook = (bookData: Omit<Book, "id" | "createdAt" | "borrowCount" | "qrCode">) => {
    // Validate barcode uniqueness if provided
    const userBarcode = (bookData as any).barcode?.trim();
    if (userBarcode) {
      const duplicate = books.find(
        (b) => b.barcode && b.barcode.trim().toLowerCase() === userBarcode.toLowerCase()
      );
      if (duplicate) {
        return { success: false, error: "Barcode already exists." };
      }
    }

    const nextNum = books.length + 1;
    const newId = `BK${String(nextNum).padStart(6, "0")}`;
    const prefix = bookData.title.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "BK") || "BK";
    const totalCopies = bookData.totalCopies || 4;
    const availableCopies = bookData.availableCopies !== undefined ? bookData.availableCopies : totalCopies;
    const shelfLoc = bookData.shelfLocation || "Rack CS-01 / Shelf A";

    // Use physical barcode entered by librarian, or fallback to digits from ISBN or clean Book ID
    const assignedBarcode = userBarcode || (bookData.isbn ? bookData.isbn.replace(/\D/g, "") : newId);

    const copies = createDefaultCopies(newId, prefix, totalCopies, availableCopies, shelfLoc);

    const newBook: Book = {
      ...bookData,
      id: newId,
      barcode: assignedBarcode,
      borrowCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
      shelfLocation: shelfLoc,
      totalCopies,
      availableCopies,
      copies,
    };

    setBooks((prev) => [newBook, ...prev]);

    addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Book Cataloged",
      recordType: "book",
      relatedRecordId: newId,
      description: `Cataloged new book "${bookData.title}" (Barcode: ${assignedBarcode}, ID: ${newId}).`,
    });

    return { success: true, book: newBook };
  };

  const updateBookBarcode = (bookId: string, barcode: string) => {
    const clean = barcode.trim();
    if (!clean) return { success: false, error: "Barcode cannot be empty." };
    const duplicate = books.find(
      (b) => b.id !== bookId && b.barcode && b.barcode.trim().toLowerCase() === clean.toLowerCase()
    );
    if (duplicate) {
      return { success: false, error: "Barcode already exists." };
    }
    let updated: Book | undefined;
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          updated = { ...b, barcode: clean };
          return updated;
        }
        return b;
      })
    );
    addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "Barcode Assigned",
      recordType: "book",
      relatedRecordId: bookId,
      description: `Assigned physical barcode "${clean}" to book (ID: ${bookId}).`,
    });
    return { success: true, book: updated };
  };

  const associateBarcodeWithBook = (barcode: string, bookId: string) => {
    return updateBookBarcode(bookId, barcode);
  };

  const generateBookQR = (bookId: string): Book | undefined => {
    let targetBook: Book | undefined;
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          const validQr = b.barcode || b.id;
          targetBook = {
            ...b,
            qrCode: validQr,
          };
          return targetBook;
        }
        return b;
      })
    );

    return targetBook;
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    if (updates.barcode) {
      const clean = updates.barcode.trim();
      const duplicate = books.find(
        (b) => b.id !== id && b.barcode && b.barcode.trim().toLowerCase() === clean.toLowerCase()
      );
      if (duplicate) {
        return { success: false, error: "Barcode already exists." };
      }
    }
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    return { success: true };
  };

  const deleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const getBookById = (id: string) => books.find((b) => b.id === id);

  const getBookByBarcode = (barcodeOrCode: string) => {
    if (!barcodeOrCode || typeof barcodeOrCode !== "string") return undefined;
    const clean = barcodeOrCode.trim().toLowerCase();
    const cleanAlnum = clean.replace(/[^a-z0-9]/g, "");

    return books.find((b) => {
      const bBarcode = b.barcode ? b.barcode.toLowerCase() : "";
      const bIsbn = b.isbn ? b.isbn.toLowerCase().replace(/-/g, "") : "";
      const bId = b.id ? b.id.toLowerCase() : "";
      const bTitle = b.title ? b.title.toLowerCase() : "";

      if (
        (bBarcode && bBarcode === clean) ||
        (bBarcode && bBarcode.replace(/[^a-z0-9]/g, "") === cleanAlnum) ||
        (bIsbn && bIsbn === clean) ||
        (bIsbn && bIsbn === cleanAlnum) ||
        (bId && bId === clean) ||
        (bId && bId.replace(/[^a-z0-9]/g, "") === cleanAlnum) ||
        (clean.length >= 4 && bTitle.includes(clean))
      ) {
        return true;
      }
      if (b.copies) {
        return b.copies.some((c) => {
          const cBarcode = c.barcode ? c.barcode.toLowerCase() : "";
          const cId = c.id ? c.id.toLowerCase() : "";
          return (
            (cBarcode && cBarcode === clean) ||
            (cBarcode && cBarcode.replace(/[^a-z0-9]/g, "") === cleanAlnum) ||
            (cId && cId === clean) ||
            (cId && cId.replace(/[^a-z0-9]/g, "") === cleanAlnum)
          );
        });
      }
      return false;
    });
  };

  const getBookByQR = (qrOrIsbn: string) => getBookByBarcode(qrOrIsbn);

  // Physical Book Copies Management
  const addBookCopy = (bookId: string, copyData?: Partial<BookCopy>): BookCopy => {
    const targetBook = books.find((b) => b.id === bookId);
    const existingCopies = targetBook?.copies || [];
    const copyNum = existingCopies.length + 1;
    const prefix = targetBook?.title.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "BK") || "CP";
    const copyId = copyData?.id || `LIB-${prefix}-${String(copyNum).padStart(4, "0")}`;

    const newCopy: BookCopy = {
      id: copyId,
      bookId,
      copyNumber: copyNum,
      qrCode: copyId,
      status: copyData?.status || "available",
      condition: copyData?.condition || "good",
      shelfLocation: copyData?.shelfLocation || targetBook?.shelfLocation || "Block A → Floor 1 → Rack 1 → Shelf 1",
      building: copyData?.building,
      floor: copyData?.floor,
      rack: copyData?.rack,
      shelf: copyData?.shelf,
      currentBorrowerStudentId: null,
      currentTransactionId: null,
      addedDate: new Date().toISOString().split("T")[0],
      notes: copyData?.notes || "New physical copy registered",
      ...copyData,
    };

    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const updatedCopies = [...(b.copies || []), newCopy];
        const avail = updatedCopies.filter((c) => c.status === "available").length;
        return {
          ...b,
          copies: updatedCopies,
          totalCopies: updatedCopies.length,
          availableCopies: avail,
        };
      })
    );

    return newCopy;
  };

  const updateBookCopy = (bookId: string, copyId: string, updates: Partial<BookCopy>) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const updatedCopies = (b.copies || []).map((c) => (c.id === copyId ? { ...c, ...updates } : c));
        const avail = updatedCopies.filter((c) => c.status === "available").length;
        return {
          ...b,
          copies: updatedCopies,
          availableCopies: avail,
        };
      })
    );
  };

  const deleteBookCopy = (bookId: string, copyId: string) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const updatedCopies = (b.copies || []).filter((c) => c.id !== copyId);
        const avail = updatedCopies.filter((c) => c.status === "available").length;
        return {
          ...b,
          copies: updatedCopies,
          totalCopies: updatedCopies.length,
          availableCopies: avail,
        };
      })
    );
  };

  const getCopyById = (copyId: string): { book: Book; copy: BookCopy } | undefined => {
    const clean = copyId.trim().toLowerCase();
    for (const b of books) {
      if (b.copies) {
        const copy = b.copies.find(
          (c) => c.id.toLowerCase() === clean || c.qrCode.toLowerCase() === clean
        );
        if (copy) return { book: b, copy };
      }
    }
    return undefined;
  };

  // Smart Universal Code Identifier (Student ID vs Copy ID vs Book QR/ISBN)
  const identifyCode = (scannedCode: string) => {
    const code = scannedCode.trim();
    const clean = code.toLowerCase();

    // 1. Check Student Profile
    const matchedStudent = students.find(
      (s) =>
        s.studentId.toLowerCase() === clean ||
        clean.includes(s.studentId.toLowerCase()) ||
        s.email.toLowerCase() === clean
    );
    if (matchedStudent) {
      return { type: "student" as const, student: matchedStudent, rawCode: code };
    }

    // 2. Check Specific Book Physical Copy
    for (const b of books) {
      if (b.copies) {
        const copy = b.copies.find(
          (c) =>
            c.id.toLowerCase() === clean ||
            (c.barcode && c.barcode.toLowerCase() === clean) ||
            (c.barcode && c.barcode.replace(/[^a-z0-9]/g, "") === clean.replace(/[^a-z0-9]/g, "")) ||
            (c.qrCode && c.qrCode.toLowerCase() === clean)
        );
        if (copy) {
          return { type: "copy" as const, book: b, copy, rawCode: code };
        }
      }
    }

    // 3. Check Book Barcode / ISBN / ID / Title
    const matchedBook = getBookByBarcode(code);
    if (matchedBook) {
      return { type: "book" as const, book: matchedBook, rawCode: code };
    }

    return { type: "unknown" as const, rawCode: code };
  };

  // Categories
  const addCategory = (categoryData: Omit<BookCategory, "id">) => {
    const newCat: BookCategory = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      bookCount: 0,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  // Student Methods
  const addStudent = (studentData: Omit<StudentProfile, "id" | "joinedDate">) => {
    const newStd: StudentProfile = {
      ...studentData,
      id: `std-${100 + students.length + 1}`,
      joinedDate: new Date().toISOString().split("T")[0],
    };
    setStudents((prev) => [newStd, ...prev]);
    return newStd;
  };

  const updateStudent = (id: string, updates: Partial<StudentProfile>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const getStudentByStudentId = (studentId: string) => {
    return students.find((s) => s.studentId.toLowerCase() === studentId.toLowerCase());
  };

  // Librarian Methods
  const addLibrarian = (librarianData: Omit<LibrarianProfile, "id" | "joinedDate">) => {
    const newLib: LibrarianProfile = {
      ...librarianData,
      id: `lib-${100 + librarians.length + 1}`,
      joinedDate: new Date().toISOString().split("T")[0],
    };
    setLibrarians((prev) => [...prev, newLib]);
  };

  const updateLibrarian = (id: string, updates: Partial<LibrarianProfile>) => {
    setLibrarians((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteLibrarian = (id: string) => {
    setLibrarians((prev) => prev.filter((l) => l.id !== id));
  };

  // Notifications helper
  const addNotification = (notif: Omit<NotificationItem, "id" | "createdAt">) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Issue Book System
  const issueBook = (
    studentIdInput: string,
    bookIdInput: string,
    dueDateInput?: string,
    notes?: string,
    copyIdInput?: string,
    conditionOnIssue?: CopyCondition
  ) => {
    const student = getStudentByStudentId(studentIdInput);
    if (!student) {
      return { success: false, message: `Student ID '${studentIdInput}' not found.` };
    }

    if (student.accountStatus !== "active") {
      return { success: false, message: `Student account is ${student.accountStatus}. Cannot issue books.` };
    }

    // Check active borrows
    const activeBorrows = transactions.filter(
      (t) => t.studentId === student.studentId && (t.status === "issued" || t.status === "overdue")
    );
    if (activeBorrows.length >= (student.maxBorrowLimit || settings.borrowLimit)) {
      return {
        success: false,
        message: `Student has reached the maximum borrowing limit (${student.maxBorrowLimit || settings.borrowLimit} books).`,
      };
    }

    // Check pending unpaid fines
    const unpaidFines = fines.filter((f) => f.studentId === student.studentId && f.status === "pending");
    if (unpaidFines.length > 0) {
      const totalPending = unpaidFines.reduce((sum, f) => sum + f.amount, 0);
      return {
        success: false,
        message: `Student has pending fines of ${settings.currency}${totalPending}. Please clear fines before issuing new books.`,
      };
    }

    const book = getBookById(bookIdInput);
    if (!book) {
      return { success: false, message: `Book ID '${bookIdInput}' not found.` };
    }

    if (book.availableCopies <= 0) {
      return {
        success: false,
        message: `No copies of "${book.title}" are currently available. Student can place a reservation.`,
      };
    }

    // Target copy resolution
    const targetCopy = copyIdInput
      ? book.copies?.find((c) => c.id.toLowerCase() === copyIdInput.toLowerCase())
      : book.copies?.find((c) => c.status === "available");

    if (copyIdInput && (!targetCopy || targetCopy.status !== "available")) {
      return {
        success: false,
        message: `Selected copy ${copyIdInput} is currently ${targetCopy?.status || "unavailable"}. Please select another copy.`,
      };
    }

    const assignedCopyId = targetCopy?.id || `LIB-${book.id}-0001`;
    const assignedShelf = targetCopy?.shelfLocation || book.shelfLocation;
    const finalCondition = conditionOnIssue || targetCopy?.condition || "good";

    // Dates
    const today = new Date();
    const issueDateStr = today.toISOString().split("T")[0];
    let dueDateStr = dueDateInput;
    if (!dueDateStr) {
      const due = new Date();
      due.setDate(due.getDate() + settings.borrowDurationDays);
      dueDateStr = due.toISOString().split("T")[0];
    }

    const newTxId = `TX-2024-${Math.floor(100 + Math.random() * 900)}`;

    const newTx: Transaction = {
      id: newTxId,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookIsbn: book.isbn,
      coverImage: book.coverImage,
      copyId: assignedCopyId,
      shelfLocation: assignedShelf,
      conditionOnIssue: finalCondition,
      studentId: student.studentId,
      studentName: student.fullName,
      studentEmail: student.email,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      returnDate: null,
      status: "issued",
      fineAmount: 0,
      fineStatus: "none",
      issuedBy: currentUser.name || "Circulation Desk",
      notes: notes || `Copy ${assignedCopyId} issued in ${finalCondition} condition`,
    };

    // Update book inventory & specific copy state
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== book.id) return b;
        const updatedCopies = (b.copies || []).map((c) =>
          c.id === assignedCopyId
            ? {
                ...c,
                status: "issued" as CopyStatus,
                currentBorrowerStudentId: student.studentId,
                currentTransactionId: newTxId,
                condition: finalCondition,
              }
            : c
        );
        const avail = updatedCopies.filter((c) => c.status === "available").length;
        return {
          ...b,
          availableCopies: avail,
          borrowCount: b.borrowCount + 1,
          copies: updatedCopies,
        };
      })
    );

    // Add transaction
    setTransactions((prev) => [newTx, ...prev]);

    // Send confirmation notification
    addNotification({
      userId: student.userId,
      title: "Book Issued Successfully",
      message: `"${book.title}" (Copy: ${assignedCopyId}) has been issued to you. Please return by ${dueDateStr} to avoid fines.`,
      type: "issue",
      isRead: false,
    });

    addAuditLog({
      userName: currentUser.name || "Circulation Desk",
      userRole: currentUser.role,
      action: "Issue Book",
      recordType: "circulation",
      relatedRecordId: assignedCopyId,
      description: `Issued copy ${assignedCopyId} ("${book.title}") to ${student.fullName} (${student.studentId}). Due: ${dueDateStr}.`,
    });

    const receiptNo = `RCPT-ISS-${Date.now().toString().slice(-6)}`;
    const receipt: DigitalReceiptData = {
      type: "issue",
      transactionId: newTx.id,
      receiptNo,
      studentName: student.fullName,
      studentId: student.studentId,
      bookTitle: book.title,
      copyId: assignedCopyId,
      shelfLocation: assignedShelf,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      fineAmount: 0,
      status: "ISSUED",
      librarian: currentUser.name || "Circulation Desk",
      issuedAt: new Date().toLocaleString(),
    };

    return {
      success: true,
      message: `Book "${book.title}" [${assignedCopyId}] successfully issued to ${student.fullName} (Due: ${dueDateStr})`,
      transaction: newTx,
      receipt,
    };
  };

  // Return Book System
  const returnBook = (
    transactionId: string,
    returnDateStrInput?: string,
    notes?: string,
    conditionOnReturn?: CopyCondition
  ) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) {
      return { success: false, message: "Transaction record not found.", fineAmount: 0 };
    }

    if (tx.status === "returned") {
      return { success: false, message: "This transaction is already marked as returned.", fineAmount: 0 };
    }

    const returnDateStr = returnDateStrInput || new Date().toISOString().split("T")[0];
    const dueDate = new Date(tx.dueDate);
    const returnDate = new Date(returnDateStr);

    let daysOverdue = 0;
    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
      daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const fineAmount = daysOverdue > 0 ? daysOverdue * settings.finePerDay : 0;
    const fineStatus: "none" | "pending" | "paid" = fineAmount > 0 ? "pending" : "none";
    const finalReturnCondition = conditionOnReturn || "good";

    // Update transaction
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              returnDate: returnDateStr,
              status: "returned",
              fineAmount,
              fineStatus,
              conditionOnReturn: finalReturnCondition,
              notes: notes ? `${t.notes || ""} | Return note: ${notes}` : t.notes,
            }
          : t
      )
    );

    // Increase available copies for the book and restore physical copy status
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== tx.bookId) return b;
        const updatedCopies = (b.copies || []).map((c) => {
          const isMatch =
            (tx.copyId && c.id === tx.copyId) ||
            c.currentTransactionId === tx.id ||
            c.currentBorrowerStudentId === tx.studentId;
          if (isMatch) {
            return {
              ...c,
              status: "available" as CopyStatus,
              currentBorrowerStudentId: null,
              currentTransactionId: null,
              condition: finalReturnCondition,
            };
          }
          return c;
        });
        const avail = updatedCopies.filter((c) => c.status === "available").length;
        return {
          ...b,
          availableCopies: avail,
          copies: updatedCopies,
        };
      })
    );

    // If fine generated, add to fines list
    if (fineAmount > 0) {
      const newFine: FineRecord = {
        id: `FN-${1000 + fines.length + 1}`,
        transactionId: tx.id,
        studentId: tx.studentId,
        studentName: tx.studentName,
        bookTitle: tx.bookTitle,
        daysOverdue,
        amount: fineAmount,
        status: "pending",
        dueDate: tx.dueDate,
        paidDate: null,
      };
      setFines((prev) => [newFine, ...prev]);

      // Notify student about overdue fine
      const student = getStudentByStudentId(tx.studentId);
      if (student) {
        addNotification({
          userId: student.userId,
          title: "Overdue Fine Generated",
          message: `Book "${tx.bookTitle}" was returned ${daysOverdue} days late. A fine of ${settings.currency}${fineAmount} is due.`,
          type: "fine",
          isRead: false,
        });
      }
    }

    // Notify student of return
    const student = getStudentByStudentId(tx.studentId);
    if (student) {
      addNotification({
        userId: student.userId,
        title: "Book Returned Successfully",
        message: `"${tx.bookTitle}" has been checked back into the library system. Thank you!`,
        type: "return",
        isRead: false,
      });
    }

    // Check if another student has a pending reservation on this book!
    const pendingRes = reservations
      .filter((r) => r.bookId === tx.bookId && r.status === "pending")
      .sort((a, b) => a.queuePosition - b.queuePosition);

    if (pendingRes.length > 0) {
      const nextInLine = pendingRes[0];
      setReservations((prev) =>
        prev.map((r) =>
          r.id === nextInLine.id
            ? { ...r, status: "available", notifiedAt: new Date().toISOString() }
            : r
        )
      );
      const resStudent = getStudentByStudentId(nextInLine.studentId);
      if (resStudent) {
        addNotification({
          userId: resStudent.userId,
          title: "Reserved Book Is Now Available!",
          message: `Good news! "${tx.bookTitle}" is now back in stock and reserved for you at the circulation desk.`,
          type: "reservation",
          isRead: false,
        });
      }
    }

    addAuditLog({
      userName: currentUser.name || "Circulation Desk",
      userRole: currentUser.role,
      action: "Return Book",
      recordType: "circulation",
      relatedRecordId: tx.copyId || tx.bookId,
      description: `Checked in copy ${tx.copyId || tx.bookId} ("${tx.bookTitle}") from student ${tx.studentName}.${
        fineAmount > 0 ? ` Overdue fine: ${settings.currency}${fineAmount}.` : " Returned on-time."
      }`,
    });

    const receiptNo = `RCPT-RTN-${Date.now().toString().slice(-6)}`;
    const receipt: DigitalReceiptData = {
      type: fineAmount > 0 ? "fine" : "return",
      transactionId: tx.id,
      receiptNo,
      studentName: tx.studentName,
      studentId: tx.studentId,
      bookTitle: tx.bookTitle,
      copyId: tx.copyId,
      shelfLocation: tx.shelfLocation,
      issueDate: tx.issueDate,
      dueDate: tx.dueDate,
      returnDate: returnDateStr,
      fineAmount,
      finePaid: false,
      status: fineAmount > 0 ? "OVERDUE RETURN" : "RETURNED ON TIME",
      librarian: currentUser.name || "Circulation Desk",
      issuedAt: new Date().toLocaleString(),
    };

    return {
      success: true,
      message: `Book "${tx.bookTitle}" returned successfully.${
        fineAmount > 0 ? ` Note: Overdue by ${daysOverdue} days. Fine of ${settings.currency}${fineAmount} applied.` : ""
      }`,
      fineAmount,
      receipt,
    };
  };

  // Reservation System
  const reserveBook = (bookId: string, studentId: string) => {
    const book = getBookById(bookId);
    if (!book) return { success: false, message: "Book not found." };
    const student = getStudentByStudentId(studentId);
    if (!student) return { success: false, message: "Student record not found." };

    // Check if already reserved
    const existing = reservations.find(
      (r) => r.bookId === bookId && r.studentId === studentId && (r.status === "pending" || r.status === "available")
    );
    if (existing) {
      return { success: false, message: "You already have an active reservation for this book." };
    }

    const currentBookPending = reservations.filter((r) => r.bookId === bookId && r.status === "pending").length;

    const newRes: Reservation = {
      id: `RES-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.coverImage,
      studentId: student.studentId,
      studentName: student.fullName,
      reservationDate: new Date().toISOString().split("T")[0],
      status: book.availableCopies > 0 ? "available" : "pending",
      queuePosition: currentBookPending + 1,
    };

    setReservations((prev) => [newRes, ...prev]);

    addNotification({
      userId: student.userId,
      title: "Book Reservation Confirmed",
      message: `Your reservation for "${book.title}" is logged (Position #${newRes.queuePosition}). You will be notified as soon as a copy is returned.`,
      type: "reservation",
      isRead: false,
    });

    return {
      success: true,
      message: `Successfully reserved "${book.title}"! Queue position: #${newRes.queuePosition}.`,
    };
  };

  const cancelReservation = (id: string) => {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
  };

  // Fine Payment
  const payFine = (id: string, paymentMethod: "Cash" | "UPI" | "Student Card" | "Online NetBanking") => {
    const receiptNo = `RCPT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidDate = new Date().toISOString().split("T")[0];

    const targetFine = fines.find((f) => f.id === id);

    setFines((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              status: "paid",
              paidDate,
              paymentMethod,
              receiptNo,
            }
          : f
      )
    );

    // Also update transaction fine status
    if (targetFine) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === targetFine.transactionId
            ? { ...t, fineStatus: "paid" }
            : t
        )
      );

      const student = getStudentByStudentId(targetFine.studentId);
      if (student) {
        addNotification({
          userId: student.userId,
          title: "Fine Payment Received",
          message: `Payment of ${settings.currency}${targetFine.amount} received via ${paymentMethod}. Receipt #${receiptNo}.`,
          type: "fine",
          isRead: false,
        });
      }

      addAuditLog({
        userName: currentUser.name || "Circulation Desk",
        userRole: currentUser.role,
        action: "Collect Fine",
        recordType: "fine",
        relatedRecordId: id,
        description: `Collected ${settings.currency}${targetFine.amount} from student ${targetFine.studentName} via ${paymentMethod}. Receipt #${receiptNo}.`,
      });
    }

    const receipt: DigitalReceiptData = {
      type: "fine",
      transactionId: targetFine?.transactionId || id,
      receiptNo,
      studentName: targetFine?.studentName || "Student",
      studentId: targetFine?.studentId || "",
      bookTitle: targetFine?.bookTitle || "Library Book",
      issueDate: "N/A",
      dueDate: targetFine?.dueDate || "",
      returnDate: paidDate,
      fineAmount: targetFine?.amount || 0,
      finePaid: true,
      status: "FINE CLEARED",
      librarian: currentUser.name || "Circulation Desk",
      paymentMethod,
      issuedAt: new Date().toLocaleString(),
    };

    return { receiptNo, receipt };
  };

  // Fine Waiver
  const waiveFine = (
    id: string,
    reason: string,
    processedBy: string
  ) => {
    const targetFine = fines.find((f) => f.id === id);
    if (!targetFine) {
      return { success: false, message: "Fine record not found." };
    }
    const waivedDate = new Date().toISOString().split("T")[0];
    const receiptNo = `WAI-RCPT-${Date.now().toString().slice(-6)}`;

    setFines((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              status: "waived" as const,
              waivedDate,
              waiverReason: reason,
              processedBy,
              receiptNo,
            }
          : f
      )
    );

    // Update transaction if exists
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === targetFine.transactionId
          ? { ...t, fineStatus: "waived" }
          : t
      )
    );

    const student = getStudentByStudentId(targetFine.studentId);
    if (student) {
      addNotification({
        userId: student.userId,
        title: "Library Fine Waived",
        message: `Your overdue fine of ${settings.currency}${targetFine.amount} for "${targetFine.bookTitle}" was waived. Reason: ${reason}`,
        type: "fine",
        isRead: false,
      });
    }

    addAuditLog({
      userName: processedBy || currentUser.name || "Authorized Staff",
      userRole: currentUser.role,
      action: "Waive Fine",
      recordType: "fine",
      relatedRecordId: id,
      description: `Waived ${settings.currency}${targetFine.amount} overdue fine for student ${targetFine.studentName} (${targetFine.studentId}). Reason: ${reason}`,
    });

    const receipt: DigitalReceiptData = {
      type: "fine",
      transactionId: targetFine.transactionId || id,
      receiptNo,
      studentName: targetFine.studentName,
      studentId: targetFine.studentId,
      bookTitle: targetFine.bookTitle,
      issueDate: "N/A",
      dueDate: targetFine.dueDate,
      returnDate: waivedDate,
      fineAmount: targetFine.amount,
      finePaid: false,
      status: "FINE WAIVED (FEE FORGIVEN)",
      librarian: processedBy || currentUser.name || "Administrator",
      paymentMethod: "Official Waiver Authorized",
      issuedAt: new Date().toLocaleString(),
    };

    return { success: true, message: `Successfully waived fine for ${targetFine.studentName}.`, receipt };
  };

  // Book Reviews
  const addBookReview = (reviewData: Omit<BookReview, "id" | "createdAt">) => {
    const hasBorrowed = transactions.some(
      (t) => t.studentId === reviewData.studentId && t.bookId === reviewData.bookId
    );

    const newReview: BookReview = {
      ...reviewData,
      id: `REV-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      verifiedBorrower: hasBorrowed,
    };

    setReviews((prev) => [newReview, ...prev]);

    // Recalculate book rating & reviewCount
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === reviewData.bookId) {
          const bookReviews = [...reviews.filter((r) => r.bookId === b.id), newReview];
          const avg = bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;
          return {
            ...b,
            rating: Number(avg.toFixed(1)),
            reviewCount: bookReviews.length,
          };
        }
        return b;
      })
    );

    addAuditLog({
      userName: reviewData.studentName,
      userRole: "student",
      action: "Submit Review",
      recordType: "book",
      relatedRecordId: reviewData.bookId,
      description: `Student ${reviewData.studentName} rated ${reviewData.rating} stars: "${reviewData.feedback.slice(0, 45)}..."`,
    });

    return { success: true, message: "Review posted successfully!" };
  };

  const deleteBookReview = (id: string) => {
    const target = reviews.find((r) => r.id === id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    if (target) {
      addAuditLog({
        userName: currentUser.name || "Staff",
        userRole: currentUser.role,
        action: "Moderate Review",
        recordType: "book",
        relatedRecordId: target.bookId,
        description: `Removed review by ${target.studentName} for compliance moderation.`,
      });
    }
  };

  // Announcements
  const addAnnouncement = (data: Omit<Announcement, "id" | "createdAt">) => {
    const newAnn: Announcement = {
      ...data,
      id: `ANN-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    addAuditLog({
      userName: data.createdBy,
      userRole: currentUser.role,
      action: "Post Announcement",
      recordType: "announcement",
      relatedRecordId: newAnn.id,
      description: `Broadcast notice: "${data.title}" (Priority: ${data.priority})`,
    });
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // Update System Settings
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addAuditLog({
      userName: currentUser.name || "Administrator",
      userRole: currentUser.role,
      action: "Update Settings",
      recordType: "settings",
      relatedRecordId: "SETTINGS",
      description: "Updated library circulation rules and general preferences.",
    });
  };

  // Reset demo data
  const resetToSampleData = () => {
    const currentTheme = darkMode;
    setBooks(initialBooks);
    setCategories(initialCategories);
    setStudents(initialStudents);
    setLibrarians(initialLibrarians);
    setTransactions(initialTransactions);
    setReservations(initialReservations);
    setFines(initialFines);
    setNotifications(initialNotifications);
    setReviews(initialReviews);
    setAnnouncements(initialAnnouncements);
    setAuditLogs(initialAuditLogs);
    setSettings(initialSettings);
    setCurrentUser(defaultAdminUser);
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(currentTheme));
    fetch("/api/database/reset", { method: "POST" })
      .then((r) => r.json())
      .then((res) => {
        if (res && res.status) setDatabaseStatus(res.status);
      })
      .catch(() => {});
  };

  return (
    <LibraryContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        switchRole,
        allUsers,
        loginUser,
        registerUser,
        logoutUser,
        databaseStatus,
        syncDatabaseWithServer,
        darkMode,
        toggleDarkMode,
        setTheme,
        books,
        addBook,
        updateBook,
        deleteBook,
        getBookById,
        getBookByBarcode,
        getBookByQR,
        generateBookQR,
        updateBookBarcode,
        associateBarcodeWithBook,
        addBookCopy,
        updateBookCopy,
        deleteBookCopy,
        getCopyById,
        identifyCode,
        categories,
        addCategory,
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        getStudentByStudentId,
        librarians,
        addLibrarian,
        updateLibrarian,
        deleteLibrarian,
        transactions,
        issueBook,
        returnBook,
        reservations,
        reserveBook,
        cancelReservation,
        fines,
        payFine,
        waiveFine,
        reviews,
        addBookReview,
        deleteBookReview,
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        auditLogs,
        addAuditLog,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        settings,
        updateSettings,
        resetToSampleData,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
};
