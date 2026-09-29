import React, { useState } from "react";
import { Book, BookCopy } from "../../types";
import { useLibrary } from "../../context/LibraryContext";
import { BarcodeView } from "../common/BarcodeView";
import { SmartShelfLocatorModal } from "../common/SmartShelfLocatorModal";
import { analyzeBookDemand } from "../../utils/demandPrediction";
import {
  X,
  BookOpen,
  Calendar,
  Layers,
  MapPin,
  Barcode as BarcodeIcon,
  CheckCircle,
  AlertTriangle,
  Bookmark,
  Printer,
  Edit2,
  Trash2,
  Share2,
  Compass,
  Star,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Send,
  Tag,
  Download,
  Save,
  Plus,
} from "lucide-react";

interface BookModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueRequest?: (book: Book, copy?: BookCopy) => void;
  onEditRequest?: (book: Book) => void;
}

export const BookModal: React.FC<BookModalProps> = ({
  book,
  isOpen,
  onClose,
  onIssueRequest,
  onEditRequest,
}) => {
  const {
    currentUser,
    reserveBook,
    deleteBook,
    updateBookBarcode,
    settings,
    transactions,
    reservations,
    reviews,
    addBookReview,
    deleteBookReview,
  } = useLibrary();

  const [isEditingBarcode, setIsEditingBarcode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState(book?.barcode || "");
  const [barcodeFeedback, setBarcodeFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showLocatorModal, setShowLocatorModal] = useState(false);
  const [selectedCopyForLocator, setSelectedCopyForLocator] = useState<BookCopy | null>(null);
  const [reserveMessage, setReserveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Review form state
  const [newRating, setNewRating] = useState<number>(5);
  const [newFeedback, setNewFeedback] = useState<string>("");
  const [reviewMsg, setReviewMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen || !book) return null;

  const isAvailable = book.availableCopies > 0;
  const canManage = currentUser.role === "admin" || currentUser.role === "librarian";

  const demand = analyzeBookDemand(book, transactions, reservations);
  const bookReviews = reviews.filter((r) => r.bookId === book.id);
  const avgRating =
    bookReviews.length > 0
      ? (bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length).toFixed(1)
      : book.rating || 4.5;

  const hasStudentBorrowed = transactions.some(
    (t) => t.studentId === currentUser.studentId && t.bookId === book.id
  );

  const handleSaveBarcode = () => {
    const clean = barcodeInput.trim();
    if (!clean) {
      setBarcodeFeedback({ type: "error", text: "Barcode cannot be empty." });
      return;
    }
    const res = updateBookBarcode(book.id, clean);
    if (res.success) {
      setBarcodeFeedback({ type: "success", text: `Physical barcode "${clean}" assigned successfully!` });
      setIsEditingBarcode(false);
      setTimeout(() => setBarcodeFeedback(null), 3500);
    } else {
      setBarcodeFeedback({ type: "error", text: res.error || "Barcode already exists." });
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim()) {
      setReviewMsg({ type: "error", text: "Please provide your review feedback." });
      return;
    }
    const res = addBookReview({
      bookId: book.id,
      studentId: currentUser.studentId || currentUser.id,
      studentName: currentUser.name,
      rating: newRating,
      feedback: newFeedback.trim(),
      verifiedBorrower: hasStudentBorrowed,
    });
    if (res.success) {
      setNewFeedback("");
      setReviewMsg({ type: "success", text: "Thank you! Your review has been recorded." });
    }
  };

  const openShelfLocator = (copy?: BookCopy) => {
    setSelectedCopyForLocator(copy || null);
    setShowLocatorModal(true);
  };

  const handleReserve = () => {
    if (!currentUser.studentId) {
      setReserveMessage({ type: "error", text: "Only enrolled students can place book reservations." });
      return;
    }
    const res = reserveBook(book.id, currentUser.studentId);
    if (res.success) {
      setReserveMessage({ type: "success", text: res.message });
    } else {
      setReserveMessage({ type: "error", text: res.message });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove "${book.title}" from the library catalog?`)) {
      deleteBook(book.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Top bar */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded">
                {book.id}
              </span>
              <span className="text-xs text-slate-500">• {book.category}</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  demand.demandLevel === "high"
                    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                    : demand.demandLevel === "increasing"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                }`}
                title={demand.recommendation}
              >
                {demand.demandLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openShelfLocator()}
                className="px-2.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1.5 border border-blue-200 dark:border-blue-800"
                title="Open Smart Shelf Locator"
              >
                <Compass className="w-3.5 h-3.5" />
                Locate Book
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scroll Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Book Information Section (Requirement 10) */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Book Information
                </h4>
                <span className="text-[11px] font-mono text-slate-400">ID: {book.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Title</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">{book.title}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Author</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{book.author}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">ISBN</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">{book.isbn}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Barcode</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{book.barcode || "None Assigned"}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Category</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{book.category}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Shelf Number</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{book.shelfLocation}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Available Copies</span>
                  <span className="font-bold text-slate-900 dark:text-white">{book.availableCopies} of {book.totalCopies}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Status</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${book.availableCopies > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                    <span className={`w-2 h-2 rounded-full ${book.availableCopies > 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {book.availableCopies > 0 ? "Available" : "Checked Out"}
                  </span>
                </div>
              </div>
            </div>

            {/* Physical Barcode Tag Section */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/40 border-2 border-indigo-200 dark:border-indigo-800/60 rounded-2xl shadow-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full sm:w-auto">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs shrink-0 max-w-full overflow-hidden flex flex-col items-center">
                    <BarcodeView
                      value={book.barcode || book.id}
                      width={1.6}
                      height={46}
                      displayValue={true}
                      showActions={false}
                      className="p-0 border-0 shadow-none bg-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-800 flex items-center gap-1">
                        <BarcodeIcon className="w-3 h-3" />
                        Physical Barcode
                      </span>
                      <span className="text-xs text-slate-500 font-medium">• Book Accession</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Barcode: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{book.barcode || "None Assigned"}</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm">
                      Scan the barcode on the physical book using the device camera or search barcode number manually.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingBarcode(!isEditingBarcode);
                        setBarcodeInput(book.barcode || "");
                        setBarcodeFeedback(null);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                      title={book.barcode ? "Update physical barcode" : "Enter physical barcode from book"}
                    >
                      {book.barcode ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {book.barcode ? "Edit Barcode" : "Add Barcode"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const svg = document.querySelector("svg");
                      if (!svg) { window.print(); return; }
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                      const blobURL = window.URL.createObjectURL(svgBlob);
                      const image = new Image();
                      image.onload = () => {
                        const canvas = document.createElement("canvas");
                        canvas.width = image.width * 2;
                        canvas.height = image.height * 2;
                        const context = canvas.getContext("2d");
                        if (context) {
                          context.fillStyle = "#ffffff";
                          context.fillRect(0, 0, canvas.width, canvas.height);
                          context.drawImage(image, 0, 0, canvas.width, canvas.height);
                          const a = document.createElement("a");
                          a.download = `Barcode-${book.barcode || book.id}.png`;
                          a.href = canvas.toDataURL("image/png");
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }
                      };
                      image.src = blobURL;
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition flex items-center justify-center gap-1.5"
                    title="Download barcode image"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    Download Barcode
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5"
                    title="Print barcode tag label"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Tag
                  </button>
                </div>
              </div>

              {/* Inline Add / Edit Barcode for Existing Books (Requirement 11) */}
              {isEditingBarcode && (
                <div className="mt-4 p-3.5 bg-white dark:bg-slate-800/90 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <BarcodeIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{book.barcode ? "Update Physical Barcode" : "Add Barcode to Existing Book"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBarcodeInput(book.isbn.replace(/\D/g, ""))}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Use ISBN digits ({book.isbn.replace(/\D/g, "")})
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveBarcode()}
                      placeholder="Enter physical barcode printed on book..."
                      className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleSaveBarcode}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Barcode
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBarcode(false)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Enter the barcode printed on the actual physical book. Validates uniqueness across all library titles.
                  </p>
                </div>
              )}

              {/* Barcode feedback message */}
              {barcodeFeedback && (
                <div
                  className={`mt-3 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    barcodeFeedback.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-50 dark:bg-red-950/40 border-red-200 text-red-700 dark:text-red-300"
                  }`}
                >
                  {barcodeFeedback.type === "success" ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{barcodeFeedback.text}</span>
                </div>
              )}
            </div>

            {/* Book Hero Section */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full sm:w-44 h-64 object-cover rounded-xl shadow-md shrink-0 border border-slate-200 dark:border-slate-800"
              />
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isAvailable
                          ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {isAvailable ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {isAvailable ? `${book.availableCopies} Copies Available` : "Currently Checked Out"}
                    </span>
                    <span className="text-xs text-slate-500">
                      Total: {book.totalCopies} copies
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {avgRating} ({bookReviews.length} reviews)
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                    {book.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                    By {book.author}
                  </p>

                  {/* Categories & Genres Multiselect Tags */}
                  {((book.categories && book.categories.length > 0) || (book.genres && book.genres.length > 0) || book.category) && (
                    <div className="pt-1.5 space-y-1.5">
                      {/* Categories / Disciplines */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mr-0.5">
                          <Layers className="w-3 h-3 text-indigo-500" />
                          Categories:
                        </span>
                        {(book.categories && book.categories.length > 0 ? book.categories : [book.category]).map((cat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>

                      {/* Genres / Topics */}
                      {book.genres && book.genres.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mr-0.5">
                            <Tag className="w-3 h-3 text-emerald-500" />
                            Genres:
                          </span>
                          {book.genres.map((genre, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80"
                            >
                              #{genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Specs Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">ISBN</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{book.isbn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Physical Shelf Location</span>
                    <button
                      type="button"
                      onClick={() => openShelfLocator()}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 text-left"
                    >
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{book.shelfLocation}</span>
                    </button>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Publisher & Year</span>
                    <span className="text-slate-700 dark:text-slate-300">{book.publisher} ({book.publicationYear})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Demand Prediction</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {demand.demandLabel}
                    </span>
                  </div>
                </div>

                {/* Demand insight banner */}
                <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Demand Recommendation:</strong> {demand.recommendation}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                    Book Overview
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {book.description}
                  </p>
                </div>

                {/* Reservation feedback */}
                {reserveMessage && (
                  <div
                    className={`p-3 text-xs rounded-lg border ${
                      reserveMessage.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-50 dark:bg-red-950/40 border-red-200 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {reserveMessage.text}
                  </div>
                )}
              </div>
            </div>

            {/* Physical Copies Directory Section */}
            {book.copies && book.copies.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Physical Copies & Shelf Positions ({book.copies.length})
                  </h5>
                  <button
                    type="button"
                    onClick={() => openShelfLocator()}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Compass className="w-3 h-3" /> View Visual Map
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {book.copies.map((copy) => (
                    <div
                      key={copy.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs hover:border-blue-300 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{copy.id}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full capitalize ${
                              copy.status === "available"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                : copy.status === "issued"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                                : copy.status === "reserved"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                            }`}
                          >
                            {copy.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[210px]">
                          {copy.shelfLocation}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openShelfLocator(copy)}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 transition shrink-0"
                      >
                        Locate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Ratings & Feedback Section */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  Student Ratings & Reviews ({bookReviews.length})
                </h5>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Average Rating: ⭐ {avgRating}/5.0
                </span>
              </div>

              {/* Review Input Box for Enrolled Students */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Leave a Rating & Review
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-0.5 text-amber-400 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            newRating >= star ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 ml-1">
                      {newRating}.0
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    placeholder="Share how this book supported your coursework, clarity of topics, hands-on examples..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Posting as: <strong>{currentUser.name}</strong>{" "}
                      {hasStudentBorrowed && (
                        <span className="text-emerald-600 font-semibold">• Verified Borrower</span>
                      )}
                    </span>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Post Review
                    </button>
                  </div>
                </form>

                {reviewMsg && (
                  <p
                    className={`text-xs p-2 rounded ${
                      reviewMsg.type === "success"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    }`}
                  >
                    {reviewMsg.text}
                  </p>
                )}
              </div>

              {/* Existing Reviews List */}
              <div className="space-y-2.5">
                {bookReviews.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No student reviews posted yet. Be the first to share your learning feedback!
                  </p>
                ) : (
                  bookReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {rev.studentName}
                          </span>
                          {rev.verifiedBorrower && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full font-semibold flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Verified Borrower
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  rev.rating >= s
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200 dark:text-slate-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400">{rev.createdAt}</span>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => deleteBookReview(rev.id)}
                              className="text-slate-400 hover:text-red-500 p-0.5 rounded transition ml-1"
                              title="Delete review"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rev.feedback}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openShelfLocator()}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                Locate Book
              </button>

              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onEditRequest?.(book);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-medium rounded-lg transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Book
                  </button>
                  {currentUser.role === "admin" && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                      title="Delete Book"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Student Action: Reserve */}
              {currentUser.role === "student" && !isAvailable && (
                <button
                  type="button"
                  onClick={handleReserve}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Reserve This Book
                </button>
              )}

              {/* Librarian/Admin Action: Issue */}
              {canManage && (
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    onIssueRequest?.(book);
                    onClose();
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm ${
                    isAvailable
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Issue to Student
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Shelf Locator Modal */}
      {showLocatorModal && (
        <SmartShelfLocatorModal
          book={book}
          selectedCopy={selectedCopyForLocator}
          isOpen={showLocatorModal}
          onClose={() => setShowLocatorModal(false)}
          onIssueCopy={(targetBook, copy) => {
            setShowLocatorModal(false);
            onIssueRequest?.(targetBook, copy);
            onClose();
          }}
        />
      )}
    </>
  );
};
