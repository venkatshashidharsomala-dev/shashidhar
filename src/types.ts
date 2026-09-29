export type UserRole = "admin" | "librarian" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage: string;
  createdAt: string;
  studentId?: string;
  phone?: string;
  course?: string;
  department?: string;
  semester?: number;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  course: string;
  department: string;
  semester: number;
  profileImage: string;
  accountStatus: "active" | "suspended" | "graduated";
  joinedDate: string;
  maxBorrowLimit: number;
}

export interface LibrarianProfile {
  id: string;
  userId: string;
  employeeId: string;
  staffId?: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  assignedDesk?: string;
  profileImage?: string;
  status: "active" | "inactive";
  joinedDate: string;
}

export interface BookCategory {
  id: string;
  name: string;
  description: string;
  bookCount?: number;
  iconName?: string;
}

export type CopyStatus = "available" | "issued" | "reserved" | "lost" | "damaged" | "maintenance";
export type CopyCondition = "new" | "good" | "fair" | "damaged";

export interface ShelfLocationDetails {
  building: string; // e.g. "Block A"
  floor: string;    // e.g. "Floor 1"
  rack: string;     // e.g. "Rack A3"
  shelf: string;    // e.g. "Shelf 2"
  position?: string; // e.g. "Position 05"
}

export interface BookCopy {
  id: string;             // e.g. "LIB-PY-0001"
  bookId: string;         // e.g. "BK-1005"
  copyNumber: number;     // 1, 2, 3...
  barcode?: string;       // e.g. "9780132350884-01" or physical barcode
  qrCode?: string;
  status: CopyStatus;
  condition: CopyCondition;
  shelfLocation: string;  // "Block A → Floor 1 → Rack A3 → Shelf 2 → Position 05"
  building?: string;
  floor?: string;
  rack?: string;
  shelf?: string;
  position?: string;
  currentBorrowerStudentId?: string | null;
  currentTransactionId?: string | null;
  addedDate?: string;
  lastInspectedDate?: string;
  notes?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  barcode: string;
  categoryId: string;
  category: string;
  categories?: string[];
  genres?: string[];
  publisher: string;
  publicationYear: number;
  language: string;
  totalCopies: number;
  availableCopies: number;
  coverImage: string;
  shelfLocation: string; // Formatted hierarchy: "Block A → Floor 1 → Rack CS-01 → Shelf 2 → Position 05"
  building?: string;
  floor?: string;
  rack?: string;
  shelf?: string;
  position?: string;
  description: string;
  qrCode?: string;
  createdAt: string;
  rating?: number;
  reviewCount?: number;
  borrowCount: number;
  copies?: BookCopy[];
}

export interface Transaction {
  id: string;
  bookId: string;
  copyId?: string;       // Exact physical copy ID e.g. "LIB-PY-0001"
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string;
  coverImage: string;
  studentId: string; // BCA Roll No e.g. BCA-2024-042
  studentName: string;
  studentEmail: string;
  issueDate: string; // ISO date YYYY-MM-DD
  dueDate: string;   // ISO date YYYY-MM-DD
  returnDate: string | null;
  status: "issued" | "returned" | "overdue";
  fineAmount: number;
  fineStatus: "none" | "pending" | "paid";
  issuedBy: string;
  notes?: string;
  conditionOnIssue?: CopyCondition;
  conditionOnReturn?: CopyCondition;
  shelfLocation?: string;
}

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  studentId: string;
  studentName: string;
  reservationDate: string;
  status: "pending" | "available" | "fulfilled" | "cancelled";
  queuePosition: number;
  notifiedAt?: string;
}

export interface FineRecord {
  id: string;
  transactionId: string;
  studentId: string;
  studentName: string;
  bookTitle: string;
  daysOverdue: number;
  amount: number;
  status: "pending" | "paid" | "waived";
  dueDate: string;
  paidDate: string | null;
  paymentMethod?: "Cash" | "UPI" | "Student Card" | "Online NetBanking";
  receiptNo?: string;
  waivedDate?: string | null;
  waiverReason?: string;
  processedBy?: string;
}

export interface BookReview {
  id: string;
  bookId: string;
  studentId: string;
  studentName: string;
  rating: number; // 1 to 5
  feedback: string;
  createdAt: string; // ISO or YYYY-MM-DD
  verifiedBorrower: boolean;
}

export type AnnouncementPriority = "low" | "medium" | "high" | "urgent";
export type AnnouncementAudience = "all" | "students" | "librarians";

export interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: AnnouncementPriority;
  targetAudience: AnnouncementAudience;
  createdAt: string;
  expiryDate: string;
  createdBy: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  formattedDate: string;
  userName: string;
  userRole: UserRole;
  action: string;
  recordType: "book" | "copy" | "circulation" | "reservation" | "fine" | "student" | "librarian" | "settings" | "announcement" | "user";
  relatedRecordId: string;
  description: string;
}

export interface StudentAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "borrowing" | "exploration" | "responsibility";
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  maxProgress: number;
}

export type DemandLevel = "high" | "increasing" | "normal" | "low";

export interface BookDemandAnalysis {
  bookId: string;
  title: string;
  demandLevel: DemandLevel;
  demandLabel: string;
  score: number;
  activeBorrows: number;
  activeReservations: number;
  availableCopies: number;
  totalCopies: number;
  recommendation: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "issue" | "return" | "due_reminder" | "overdue" | "fine" | "reservation" | "system";
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface SystemSettings {
  finePerDay: number;
  borrowLimit: number;
  borrowDurationDays: number;
  currency: string;
  libraryName: string;
  institutionName: string;
  enableAutoReminders: boolean;
  allowStudentReservations: boolean;
}

export interface BookRecommendation {
  bookId?: string;
  title: string;
  author?: string;
  category?: string;
  reason: string;
  confidence: number;
  coverImage?: string;
}

export interface DigitalReceiptData {
  type: "issue" | "return" | "fine";
  transactionId: string;
  receiptNo: string;
  studentName: string;
  studentId: string;
  studentCourse?: string;
  studentDept?: string;
  bookTitle: string;
  bookAuthor?: string;
  copyId?: string;
  shelfLocation?: string;
  condition?: CopyCondition;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  fineAmount?: number;
  finePaid?: boolean;
  status: string;
  librarian: string;
  paymentMethod?: string;
  issuedAt: string;
}

export interface DatabaseStatus {
  status: "connected" | "connecting" | "error" | "offline";
  engine: string;
  storageType: string;
  schemaVersion: string;
  lastSynced: string;
  tableCounts: {
    books: number;
    users: number;
    students: number;
    librarians: number;
    categories: number;
    transactions: number;
    reservations: number;
    fines: number;
    notifications: number;
    announcements: number;
    reviews: number;
    auditLogs: number;
  };
}
