import { StudentAchievement, Transaction, Book, BookReview, Reservation } from "../types";

export function calculateStudentAchievements(
  studentId: string,
  transactions: Transaction[],
  books: Book[],
  reviews: BookReview[] = [],
  reservations: Reservation[] = []
): StudentAchievement[] {
  const studentTx = transactions.filter((t) => t.studentId === studentId);
  const totalBorrowed = studentTx.length;
  const returnedTx = studentTx.filter((t) => t.status === "returned");

  // On-time returned books (no fine or fine === 0 or returned on or before due date)
  const onTimeReturns = returnedTx.filter((t) => {
    if (!t.returnDate) return false;
    return new Date(t.returnDate) <= new Date(t.dueDate) || t.fineAmount === 0;
  }).length;

  // Categories explored
  const borrowedBookIds = new Set(studentTx.map((t) => t.bookId));
  const borrowedCategories = new Set(
    books
      .filter((b) => borrowedBookIds.has(b.id))
      .map((b) => b.category)
  );
  const uniqueCategoryCount = borrowedCategories.size;

  // Reviews written by this student
  const studentReviews = reviews.filter((r) => r.studentId === studentId);
  const reviewCount = studentReviews.length;

  // Reservations placed by this student
  const studentRes = reservations.filter((r) => r.studentId === studentId);
  const reservationCount = studentRes.length;

  const achievements: StudentAchievement[] = [
    {
      id: "ach-first-book",
      title: "First Book Borrowed",
      description: "Stepped through the library threshold and checked out your first book.",
      icon: "📚",
      category: "borrowing",
      unlocked: totalBorrowed >= 1,
      unlockedDate: studentTx[0]?.issueDate,
      progress: Math.min(totalBorrowed, 1),
      maxProgress: 1,
    },
    {
      id: "ach-5-books",
      title: "Curious Scholar",
      description: "Borrowed 5 academic books across your study semesters.",
      icon: "📖",
      category: "borrowing",
      unlocked: totalBorrowed >= 5,
      unlockedDate: studentTx[4]?.issueDate,
      progress: Math.min(totalBorrowed, 5),
      maxProgress: 5,
    },
    {
      id: "ach-10-books",
      title: "Dedicated Reader",
      description: "Completed checkout of 10 library books to support coursework.",
      icon: "🏆",
      category: "borrowing",
      unlocked: totalBorrowed >= 10,
      unlockedDate: studentTx[9]?.issueDate,
      progress: Math.min(totalBorrowed, 10),
      maxProgress: 10,
    },
    {
      id: "ach-regular-reader",
      title: "Regular Reader & On-Time Patron",
      description: "Returned 2 or more books punctually on or before their due dates.",
      icon: "🔄",
      category: "responsibility",
      unlocked: onTimeReturns >= 2,
      unlockedDate: returnedTx[1]?.returnDate || undefined,
      progress: Math.min(onTimeReturns, 2),
      maxProgress: 2,
    },
    {
      id: "ach-category-explorer",
      title: "Category Explorer",
      description: "Explored literature across at least 2 distinct academic disciplines.",
      icon: "🎯",
      category: "exploration",
      unlocked: uniqueCategoryCount >= 2,
      progress: Math.min(uniqueCategoryCount, 2),
      maxProgress: 2,
    },
    {
      id: "ach-reviewer",
      title: "Constructive Reviewer",
      description: "Shared feedback or rated a completed book to guide fellow peers.",
      icon: "⭐",
      category: "exploration",
      unlocked: reviewCount >= 1,
      unlockedDate: studentReviews[0]?.createdAt,
      progress: Math.min(reviewCount, 1),
      maxProgress: 1,
    },
    {
      id: "ach-planner",
      title: "Proactive Planner",
      description: "Placed a hold reservation on a high-demand volume in advance.",
      icon: "🔖",
      category: "responsibility",
      unlocked: reservationCount >= 1,
      unlockedDate: studentRes[0]?.reservationDate,
      progress: Math.min(reservationCount, 1),
      maxProgress: 1,
    },
  ];

  return achievements;
}
