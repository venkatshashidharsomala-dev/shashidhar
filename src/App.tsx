import React, { useState } from "react";
import { LibraryProvider, useLibrary } from "./context/LibraryContext";
import { Sidebar } from "./components/layout/Sidebar";
import { TopNav } from "./components/layout/TopNav";
import { AdminDashboard } from "./components/dashboard/AdminDashboard";
import { LibrarianDashboard } from "./components/dashboard/LibrarianDashboard";
import { StudentDashboard } from "./components/dashboard/StudentDashboard";
import { BookCatalog } from "./components/books/BookCatalog";
import { BookModal } from "./components/books/BookModal";
import { BookFormModal } from "./components/books/BookFormModal";
import { IssueBookView } from "./components/circulation/IssueBookView";
import { ReturnBookView } from "./components/circulation/ReturnBookView";
import { TransactionsView } from "./components/circulation/TransactionsView";
import { FinesView } from "./components/circulation/FinesView";
import { ReservationsView } from "./components/circulation/ReservationsView";
import { StudentsView } from "./components/students/StudentsView";
import { LibrariansView } from "./components/librarians/LibrariansView";
import { ReportsView } from "./components/analytics/ReportsView";
import { SmartRecommendationsView } from "./components/ai/SmartRecommendationsView";
import { SettingsView } from "./components/settings/SettingsView";
import { InventoryAlertsView } from "./components/inventory/InventoryAlertsView";
import { AnnouncementsView } from "./components/announcements/AnnouncementsView";
import { AuditLogsView } from "./components/audit/AuditLogsView";
import { StudentReadingAnalyticsView } from "./components/students/StudentReadingAnalyticsView";
import { QRScannerModal } from "./components/common/QRScannerModal";
import { BarcodeScannerModal } from "./components/common/BarcodeScannerModal";
import { ScanBarcodeView } from "./components/circulation/ScanBarcodeView";
import { AuthView } from "./components/auth/AuthView";
import { Book, BookCopy, StudentProfile, Transaction } from "./types";
import { ShieldAlert, ArrowLeft } from "lucide-react";

function MainAppContent() {
  const { currentUser, books, transactions, isAuthenticated } = useLibrary();

  // Navigation State
  const [currentView, setCurrentView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals State
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrScannerMode, setQRScannerMode] = useState<"general" | "issue" | "return">("general");

  const [preselectedBookForIssue, setPreselectedBookForIssue] = useState<Book | null>(null);
  const [preselectedCopyForIssue, setPreselectedCopyForIssue] = useState<BookCopy | null>(null);
  const [preselectedStudentForIssue, setPreselectedStudentForIssue] = useState<StudentProfile | null>(null);
  const [preselectedTransactionForReturn, setPreselectedTransactionForReturn] = useState<string | null>(null);

  // Handle Book Selection (e.g. from search, cards, recommendations)
  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setIsBookModalOpen(true);
  };

  // Open Add Book modal
  const handleOpenAddBook = () => {
    setEditingBook(null);
    setIsBookFormOpen(true);
  };

  // Open Edit Book modal
  const handleOpenEditBook = (book: Book) => {
    setEditingBook(book);
    setIsBookFormOpen(true);
  };

  // Quick Issue Book from catalog or QR scan
  const handleIssueBook = (book: Book, copy?: BookCopy) => {
    setPreselectedBookForIssue(book);
    setPreselectedCopyForIssue(copy || null);
    setCurrentView("issue-book");
  };

  // Open QR Scanner with mode
  const handleOpenQRScanner = (mode: "general" | "issue" | "return" = "general") => {
    setQRScannerMode(mode);
    setIsQRScannerOpen(true);
  };

  // If not authenticated, render login/registration screen
  if (!isAuthenticated) {
    return <AuthView onLoginSuccess={() => setCurrentView("dashboard")} />;
  }

  // Check role authorization for current view
  const isStudentRestricted =
    currentUser.role === "student" &&
    ["issue-book", "return-book", "students", "librarians", "settings", "inventory-alerts", "audit-logs"].includes(currentView);

  const isLibrarianRestricted =
    currentUser.role === "librarian" &&
    ["librarians", "settings"].includes(currentView);

  const isAccessDenied = isStudentRestricted || isLibrarianRestricted;

  // Handle successful QR scan resolution
  const handleScanSuccess = (
    result: { book?: Book; copy?: BookCopy; student?: StudentProfile },
    actionType?: "view" | "issue" | "return"
  ) => {
    const effectiveAction = actionType || (qrScannerMode !== "general" ? qrScannerMode : "view");

    if (result.student) {
      setPreselectedStudentForIssue(result.student);
      setCurrentView("issue-book");
      return;
    }

    if (result.book) {
      if (effectiveAction === "issue") {
        setPreselectedBookForIssue(result.book);
        setPreselectedCopyForIssue(result.copy || null);
        setCurrentView("issue-book");
      } else if (effectiveAction === "return") {
        // Find matching active checkout
        const match = transactions.find(
          (t) =>
            (t.status === "issued" || t.status === "overdue") &&
            ((result.copy && t.copyId === result.copy.id) || t.bookId === result.book?.id)
        );
        if (match) {
          setPreselectedTransactionForReturn(match.id);
        }
        setCurrentView("return-book");
      } else {
        handleSelectBook(result.book);
      }
    }
  };

  // Render Role-Based Dashboard
  const renderDashboard = () => {
    if (currentUser.role === "admin") {
      return (
        <AdminDashboard
          onNavigate={setCurrentView}
          onOpenQRScanner={handleOpenQRScanner}
          onSelectBook={handleSelectBook}
        />
      );
    }
    if (currentUser.role === "librarian") {
      return (
        <LibrarianDashboard
          onNavigate={setCurrentView}
          onOpenQRScanner={handleOpenQRScanner}
          onSelectBook={handleSelectBook}
        />
      );
    }
    return (
      <StudentDashboard
        onNavigate={setCurrentView}
        onSelectBook={handleSelectBook}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenQRScanner={handleOpenQRScanner}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60">
        <TopNav
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onSelectBook={handleSelectBook}
          onNavigate={setCurrentView}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {isAccessDenied ? (
            <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Access Restricted
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Your current account role (
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {currentUser.role}
                </span>
                ) is not authorized to access this section. Please return to your portal or switch roles using the header switcher.
              </p>
              <button
                type="button"
                onClick={() => setCurrentView("dashboard")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          ) : (
            <>
              {currentView === "dashboard" && renderDashboard()}

              {currentView === "books" && (
                <BookCatalog
                  onSelectBook={handleSelectBook}
                  onOpenAddModal={handleOpenAddBook}
                  onEditBook={handleOpenEditBook}
                  onIssueBook={handleIssueBook}
                  onReturnBook={(book) => {
                    handleScanSuccess({ book }, "return");
                  }}
                />
              )}

              {currentView === "scan-barcode" && (
                <ScanBarcodeView
                  onSelectBook={handleSelectBook}
                  onNavigate={setCurrentView}
                />
              )}

              {currentView === "issue-book" && (
            <IssueBookView
              preselectedBook={preselectedBookForIssue}
              preselectedCopy={preselectedCopyForIssue}
              preselectedStudent={preselectedStudentForIssue}
              onOpenQRScanner={handleOpenQRScanner}
              onSuccess={() => {
                setPreselectedBookForIssue(null);
                setPreselectedCopyForIssue(null);
                setPreselectedStudentForIssue(null);
                setCurrentView("transactions");
              }}
            />
          )}

          {currentView === "return-book" && (
            <ReturnBookView
              preselectedTransactionId={preselectedTransactionForReturn || undefined}
              onOpenQRScanner={handleOpenQRScanner}
            />
          )}

          {currentView === "transactions" && (
            <TransactionsView
              onQuickReturn={(tx: Transaction) => {
                setPreselectedTransactionForReturn(tx.id);
                setCurrentView("return-book");
              }}
            />
          )}

          {currentView === "fines" && <FinesView />}

          {currentView === "reservations" && <ReservationsView />}

          {currentView === "students" && <StudentsView />}

          {currentView === "librarians" && <LibrariansView />}

          {currentView === "reports" && <ReportsView />}

          {currentView === "inventory-alerts" && (
            <InventoryAlertsView
              onSelectBook={handleSelectBook}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === "announcements" && <AnnouncementsView />}

          {currentView === "audit-logs" && <AuditLogsView />}

          {currentView === "reading-analytics" && (
            <StudentReadingAnalyticsView
              onSelectBook={handleSelectBook}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === "smart-recommendations" && (
            <SmartRecommendationsView onSelectBook={handleSelectBook} />
          )}

          {currentView === "settings" && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <BookModal
        book={selectedBook}
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onIssueRequest={handleIssueBook}
        onEditRequest={handleOpenEditBook}
      />

      <BookFormModal
        isOpen={isBookFormOpen}
        onClose={() => setIsBookFormOpen(false)}
        editBook={editingBook}
        onBookAdded={(newBook) => handleSelectBook(newBook)}
      />

      <BarcodeScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        mode={qrScannerMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <MainAppContent />
    </LibraryProvider>
  );
}
