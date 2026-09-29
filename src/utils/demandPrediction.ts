import { Book, Transaction, Reservation, BookDemandAnalysis, DemandLevel } from "../types";

export function analyzeBookDemand(
  book: Book,
  allTransactions: Transaction[],
  allReservations: Reservation[]
): BookDemandAnalysis {
  // Count real active and historical borrows
  const bookTx = allTransactions.filter((t) => t.bookId === book.id);
  const activeBorrows = bookTx.filter((t) => t.status === "issued" || t.status === "overdue").length;
  const activeReservations = allReservations.filter(
    (r) => r.bookId === book.id && (r.status === "pending" || r.status === "available")
  ).length;

  // Base borrow count
  const totalBorrows = Math.max(book.borrowCount, bookTx.length);
  const totalCopies = Math.max(book.totalCopies, 1);
  const availableCopies = book.availableCopies;

  // Utilization ratio
  const utilization = (totalCopies - availableCopies) / totalCopies;

  // Demand scoring formula strictly rooted in real facts
  let score = totalBorrows * 3 + activeBorrows * 5 + activeReservations * 8;
  if (availableCopies === 0) score += 15;

  let demandLevel: DemandLevel = "normal";
  let demandLabel = "🟡 Normal Demand";
  let recommendation = `Stock levels adequate (${availableCopies}/${totalCopies} copies on shelf).`;

  if (activeReservations >= 2 || (availableCopies === 0 && totalCopies > 0) || score >= 40) {
    demandLevel = "high";
    demandLabel = "🔥 High Demand";
    const suggestedExtra = Math.max(1, Math.ceil(activeReservations + 1));
    recommendation = `Consider acquiring ${suggestedExtra} additional ${suggestedExtra === 1 ? "copy" : "copies"} of "${book.title}". Current demand exceeds shelf capacity (${activeReservations} pending hold ${activeReservations === 1 ? "request" : "requests"}, ${availableCopies} copies left).`;
  } else if (activeReservations >= 1 || utilization >= 0.65 || score >= 22) {
    demandLevel = "increasing";
    demandLabel = "📈 Increasing Demand";
    recommendation = `Circulation velocity is rising for "${book.title}". Maintain on fast-track reserve shelf and inspect return condition promptly.`;
  } else if (score < 8 && totalBorrows <= 2) {
    demandLevel = "low";
    demandLabel = "📉 Low Demand";
    recommendation = `Sufficient inventory on hand. Circulation turnover is stable with ${availableCopies} copies currently ready on shelf.`;
  } else {
    demandLevel = "normal";
    demandLabel = "🟡 Normal Demand";
    recommendation = `Normal circulation rhythm. ${availableCopies} of ${totalCopies} copies available for checkout.`;
  }

  return {
    bookId: book.id,
    title: book.title,
    demandLevel,
    demandLabel,
    score,
    activeBorrows,
    activeReservations,
    availableCopies,
    totalCopies,
    recommendation,
  };
}

export function getAllBookDemandAnalyses(
  books: Book[],
  transactions: Transaction[],
  reservations: Reservation[]
): BookDemandAnalysis[] {
  return books
    .map((b) => analyzeBookDemand(b, transactions, reservations))
    .sort((a, b) => b.score - a.score);
}
