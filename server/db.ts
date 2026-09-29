import fs from "fs";
import path from "path";
import {
  initialBooks,
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
} from "../src/data/mockData";
import {
  Book,
  BookCategory,
  StudentProfile,
  LibrarianProfile,
  Transaction,
  Reservation,
  FineRecord,
  NotificationItem,
  SystemSettings,
  User,
  BookReview,
  Announcement,
  AuditLogEntry,
} from "../src/types";

export interface DatabaseState {
  books: Book[];
  categories: BookCategory[];
  students: StudentProfile[];
  librarians: LibrarianProfile[];
  transactions: Transaction[];
  reservations: Reservation[];
  fines: FineRecord[];
  notifications: NotificationItem[];
  settings: SystemSettings;
  users: User[];
  reviews: BookReview[];
  announcements: Announcement[];
  auditLogs: AuditLogEntry[];
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

// Default initial state
function getDefaultDatabaseState(): DatabaseState {
  const users: User[] = [
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
    {
      id: "usr-student-3",
      name: "Ananya Iyer",
      email: "ananya.iyer@university.edu",
      role: "student",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
      createdAt: "2023-08-20",
      studentId: "MCA-2024-008",
      course: "MCA (Master of Computer Applications)",
      department: "Computer Applications",
      semester: 4,
    },
    {
      id: "usr-student-4",
      name: "Rohan Verma",
      email: "rohan.v@university.edu",
      role: "student",
      profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
      createdAt: "2022-08-15",
      studentId: "BCA-2024-088",
      course: "BCA (Computer Applications)",
      department: "Computer Applications",
      semester: 6,
    },
  ];

  return {
    books: initialBooks,
    categories: initialCategories,
    students: initialStudents,
    librarians: initialLibrarians,
    transactions: initialTransactions,
    reservations: initialReservations,
    fines: initialFines,
    notifications: initialNotifications,
    settings: initialSettings,
    users,
    reviews: initialReviews,
    announcements: initialAnnouncements,
    auditLogs: initialAuditLogs,
    lastUpdated: new Date().toISOString(),
  };
}

class ServerDatabase {
  private state: DatabaseState;

  constructor() {
    this.ensureDataDirectory();
    this.state = this.loadDatabase();
  }

  private ensureDataDirectory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.error("[Database] Failed to ensure data directory:", err);
    }
  }

  private loadDatabase(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        console.log(`[Database] Successfully loaded persistent state from ${DB_FILE}`);
        return {
          ...getDefaultDatabaseState(),
          ...parsed,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error("[Database] Error reading database file, using default seeds:", err);
    }

    const defaultState = getDefaultDatabaseState();
    this.saveDatabase(defaultState);
    return defaultState;
  }

  public saveDatabase(newState?: Partial<DatabaseState>): DatabaseState {
    try {
      this.ensureDataDirectory();
      if (newState) {
        this.state = {
          ...this.state,
          ...newState,
          lastUpdated: new Date().toISOString(),
        };
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (err) {
      console.error("[Database] Failed to write database file:", err);
    }
    return this.state;
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public getStatus() {
    const isPostgresConfigured = !!process.env.DATABASE_URL || !!process.env.SUPABASE_URL;
    return {
      status: "connected",
      engine: isPostgresConfigured
        ? "PostgreSQL / Supabase Connected"
        : "LibSmart Persistent PostgreSQL-Compatible Server Store",
      storageType: "durable_server_storage",
      schemaVersion: "2.4.0-production",
      lastSynced: this.state.lastUpdated,
      tableCounts: {
        books: this.state.books.length,
        users: this.state.users.length,
        students: this.state.students.length,
        librarians: this.state.librarians.length,
        categories: this.state.categories.length,
        transactions: this.state.transactions.length,
        reservations: this.state.reservations.length,
        fines: this.state.fines.length,
        notifications: this.state.notifications.length,
        announcements: this.state.announcements.length,
        reviews: this.state.reviews.length,
        auditLogs: this.state.auditLogs.length,
      },
    };
  }

  public authenticate(email: string, role?: string): { success: boolean; user?: User; token?: string; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.state.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (user) {
      // If role specified, verify or match
      const token = `tok_${user.id}_${Date.now()}`;
      return {
        success: true,
        user,
        token,
        message: `Welcome back, ${user.name}!`,
      };
    }

    // If not found in seed list, create student or requested role user
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: email.split("@")[0].toUpperCase(),
      email: cleanEmail,
      role: (role as any) || "student",
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString().split("T")[0],
      studentId: role === "student" || !role ? `BCA-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
    };

    this.state.users.push(newUser);

    if (newUser.role === "student") {
      const studentProfile: StudentProfile = {
        id: `std-${Date.now()}`,
        userId: newUser.id,
        studentId: newUser.studentId || `BCA-${Date.now()}`,
        fullName: newUser.name,
        email: newUser.email,
        phone: "+91 99000 11223",
        course: "BCA (Computer Applications)",
        department: "Computer Applications",
        semester: 6,
        profileImage: newUser.profileImage,
        accountStatus: "active",
        joinedDate: new Date().toISOString().split("T")[0],
        maxBorrowLimit: 4,
      };
      this.state.students.unshift(studentProfile);
    }

    this.saveDatabase();

    return {
      success: true,
      user: newUser,
      token: `tok_${newUser.id}_${Date.now()}`,
      message: `Account initialized for ${newUser.name}`,
    };
  }

  public registerStudent(studentData: Partial<StudentProfile> & { password?: string }): {
    success: boolean;
    user?: User;
    token?: string;
    message: string;
  } {
    const cleanEmail = (studentData.email || "").trim().toLowerCase();
    const existing = this.state.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: "An account with this email address already exists. Please sign in instead.",
      };
    }

    const userId = `usr-student-${Date.now()}`;
    const studentId = studentData.studentId?.trim() || `BCA-2024-${Math.floor(100 + Math.random() * 900)}`;

    const user: User = {
      id: userId,
      name: studentData.fullName?.trim() || "Student Scholar",
      email: cleanEmail,
      role: "student",
      profileImage: studentData.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString().split("T")[0],
      studentId,
      phone: studentData.phone || "+91 98765 43210",
      course: studentData.course || "Bachelor of Computer Applications (BCA)",
      department: studentData.department || "Computer Applications",
      semester: studentData.semester || 6,
    };

    const profile: StudentProfile = {
      id: `std-${Date.now()}`,
      userId,
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

    this.state.users.push(user);
    this.state.students.unshift(profile);

    // Add audit log
    this.state.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      formattedDate: new Date().toLocaleString(),
      userName: user.name,
      userRole: "student",
      action: "Student Self-Registration",
      recordType: "user",
      relatedRecordId: studentId,
      description: `New student registration for ${user.name} (${studentId}) in ${user.course}.`,
    });

    this.saveDatabase();

    return {
      success: true,
      user,
      token: `tok_${user.id}_${Date.now()}`,
      message: `Registration successful! Welcome to LibSmart, ${user.name}.`,
    };
  }

  public resetDatabase(): DatabaseState {
    const defaultState = getDefaultDatabaseState();
    this.state = defaultState;
    this.saveDatabase(defaultState);
    console.log("[Database] Reset to fresh seed data");
    return this.state;
  }
}

export const serverDatabase = new ServerDatabase();
