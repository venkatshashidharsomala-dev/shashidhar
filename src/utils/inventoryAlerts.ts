import { Book, Transaction, Reservation } from "../types";
import { analyzeBookDemand } from "./demandPrediction";

export type InventoryAlertSeverity = "critical" | "warning" | "info";
export type InventoryAlertType =
  | "zero_copies"
  | "low_copies"
  | "frequently_borrowed"
  | "frequently_reserved"
  | "lost_book"
  | "damaged_book"
  | "maintenance"
  | "high_demand";

export interface InventoryAlert {
  id: string;
  type: InventoryAlertType;
  severity: InventoryAlertSeverity;
  title: string;
  message: string;
  bookId: string;
  bookTitle: string;
  copyId?: string;
  count?: number;
  actionText: string;
  actionType: "view_book" | "manage_copies" | "restock" | "view_reservations";
}

export function generateInventoryAlerts(
  books: Book[],
  transactions: Transaction[],
  reservations: Reservation[]
): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];

  books.forEach((book) => {
    const demand = analyzeBookDemand(book, transactions, reservations);
    const activeRes = reservations.filter(
      (r) => r.bookId === book.id && (r.status === "pending" || r.status === "available")
    );

    // 1. Zero available copies
    if (book.availableCopies === 0 && book.totalCopies > 0) {
      alerts.push({
        id: `alert-zero-${book.id}`,
        type: "zero_copies",
        severity: "critical",
        title: "Zero Available Copies",
        message: `"${book.title}" has 0 copies on the shelf. All ${book.totalCopies} copies are currently loaned out.`,
        bookId: book.id,
        bookTitle: book.title,
        actionText: "Manage Copies",
        actionType: "manage_copies",
      });
    }
    // 2. Low available copies (exactly 1 copy left, when total >= 2)
    else if (book.availableCopies === 1 && book.totalCopies >= 2) {
      alerts.push({
        id: `alert-low-${book.id}`,
        type: "low_copies",
        severity: "warning",
        title: "Low Inventory Stock",
        message: `⚠️ ${book.title} has only 1 available copy remaining on shelf.`,
        bookId: book.id,
        bookTitle: book.title,
        actionText: "Check Shelf",
        actionType: "view_book",
      });
    }

    // 3. Frequently reserved books
    if (activeRes.length >= 2) {
      alerts.push({
        id: `alert-res-${book.id}`,
        type: "frequently_reserved",
        severity: "warning",
        title: "High Hold Queue",
        message: `🔥 ${book.title} is currently highly requested (${activeRes.length} students waiting in queue).`,
        bookId: book.id,
        bookTitle: book.title,
        count: activeRes.length,
        actionText: "View Hold Queue",
        actionType: "view_reservations",
      });
    }

    // 4. Frequently borrowed books
    if (book.borrowCount >= 12) {
      alerts.push({
        id: `alert-borrow-${book.id}`,
        type: "frequently_borrowed",
        severity: "info",
        title: "High Circulation Velocity",
        message: `"${book.title}" is among the most borrowed titles this semester (${book.borrowCount} total checkouts).`,
        bookId: book.id,
        bookTitle: book.title,
        count: book.borrowCount,
        actionText: "View Book",
        actionType: "view_book",
      });
    }

    // 5. High demand classification
    if (demand.demandLevel === "high" && book.availableCopies > 0 && activeRes.length < 2) {
      alerts.push({
        id: `alert-demand-${book.id}`,
        type: "high_demand",
        severity: "warning",
        title: "Predicted High Demand",
        message: `🔥 ${book.title} has high demand score. ${demand.recommendation}`,
        bookId: book.id,
        bookTitle: book.title,
        actionText: "Review Stock",
        actionType: "manage_copies",
      });
    }

    // Check physical copies for lost, damaged, maintenance
    if (book.copies && book.copies.length > 0) {
      book.copies.forEach((copy) => {
        if (copy.status === "lost") {
          alerts.push({
            id: `alert-lost-${copy.id}`,
            type: "lost_book",
            severity: "critical",
            title: "Physical Copy Reported Lost",
            message: `Copy ${copy.id} of "${book.title}" is marked as lost in physical inventory.`,
            bookId: book.id,
            bookTitle: book.title,
            copyId: copy.id,
            actionText: "Audit Copy",
            actionType: "manage_copies",
          });
        }
        if (copy.status === "damaged" || copy.condition === "damaged") {
          alerts.push({
            id: `alert-damaged-${copy.id}`,
            type: "damaged_book",
            severity: "warning",
            title: "Physical Damage Detected",
            message: `Copy ${copy.id} of "${book.title}" has recorded binding/page wear. Inspection needed.`,
            bookId: book.id,
            bookTitle: book.title,
            copyId: copy.id,
            actionText: "Inspect Copy",
            actionType: "manage_copies",
          });
        }
        if (copy.status === "maintenance") {
          alerts.push({
            id: `alert-maint-${copy.id}`,
            type: "maintenance",
            severity: "info",
            title: "Copy Under Maintenance",
            message: `Copy ${copy.id} of "${book.title}" is currently undergoing rebinding or restoration.`,
            bookId: book.id,
            bookTitle: book.title,
            copyId: copy.id,
            actionText: "Status Check",
            actionType: "manage_copies",
          });
        }
      });
    }
  });

  // Sort: critical first, then warning, then info
  const severityOrder: Record<InventoryAlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
