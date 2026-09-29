import React, { useState, useMemo } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book } from "../../types";
import { SmartShelfLocatorModal } from "../common/SmartShelfLocatorModal";
import { BookBarcodeModal } from "../common/BookBarcodeModal";
import {
  Search,
  Filter,
  Plus,
  Barcode as BarcodeIcon,
  Eye,
  CheckCircle,
  AlertCircle,
  LayoutGrid,
  List,
  Layers,
  ArrowUpDown,
  BookOpen,
  Compass,
  MapPin,
  Edit2,
  RotateCcw,
} from "lucide-react";

interface BookCatalogProps {
  onSelectBook: (book: Book) => void;
  onOpenAddModal?: () => void;
  onEditBook?: (book: Book) => void;
  onIssueBook?: (book: Book) => void;
  onReturnBook?: (book: Book) => void;
}

export const BookCatalog: React.FC<BookCatalogProps> = ({
  onSelectBook,
  onOpenAddModal,
  onEditBook,
  onIssueBook,
  onReturnBook,
}) => {
  const { books, categories, currentUser, transactions } = useLibrary();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all"); // 'all' | 'available' | 'unavailable'
  const [sortBy, setSortBy] = useState<string>("popular"); // 'popular' | 'title' | 'year' | 'available'
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [locatingBook, setLocatingBook] = useState<Book | null>(null);
  const [barcodeModalBook, setBarcodeModalBook] = useState<Book | null>(null);

  const canManage = currentUser.role === "admin" || currentUser.role === "librarian";

  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Search query
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.isbn.toLowerCase().includes(query) ||
          (book.barcode && book.barcode.toLowerCase().includes(query)) ||
          book.category.toLowerCase().includes(query) ||
          book.publisher.toLowerCase().includes(query) ||
          book.id.toLowerCase().includes(query) ||
          (book.categories && book.categories.some((c) => c.toLowerCase().includes(query))) ||
          (book.genres && book.genres.some((g) => g.toLowerCase().includes(query)));

        // Category filter
        const matchesCategory =
          selectedCategory === "all" ||
          book.categoryId === selectedCategory ||
          (book.categories && categories.find((c) => c.id === selectedCategory) &&
            book.categories.includes(categories.find((c) => c.id === selectedCategory)!.name));

        // Availability filter
        const matchesAvailability =
          availabilityFilter === "all" ||
          (availabilityFilter === "available" && book.availableCopies > 0) ||
          (availabilityFilter === "unavailable" && book.availableCopies === 0);

        return matchesSearch && matchesCategory && matchesAvailability;
      })
      .sort((a, b) => {
        if (sortBy === "popular") return b.borrowCount - a.borrowCount;
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "year") return b.publicationYear - a.publicationYear;
        if (sortBy === "available") return b.availableCopies - a.availableCopies;
        return 0;
      });
  }, [books, searchTerm, selectedCategory, availabilityFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Book Catalog & Repository
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explore {books.length} academic and technical volumes in the library collection
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {canManage && onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Book
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Main Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, author, ISBN, category, publisher..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="md:col-span-2">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Copies</option>
              <option value="available">Available Now</option>
              <option value="unavailable">Checked Out (0 left)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="popular">Most Popular</option>
              <option value="title">Title (A-Z)</option>
              <option value="year">Publication Year</option>
              <option value="available">Most Available</option>
            </select>
          </div>
        </div>

        {/* Active search pill count */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredBooks.length}</strong> of {books.length} books
          </span>
          {(searchTerm || selectedCategory !== "all" || availabilityFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setAvailabilityFilter("all");
              }}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Book List / Cards Display */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-1" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
            No Books Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            We couldn't find any books matching your current search and filters. Try adjusting keywords or category filters.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return (
              <div
                key={book.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col group"
              >
                {/* Book Cover Banner */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Status badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs ${
                        isAvailable
                          ? "bg-emerald-600/90 text-white"
                          : "bg-red-600/90 text-white"
                      }`}
                    >
                      {isAvailable ? `${book.availableCopies} in stock` : "Checked out"}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocatingBook(book);
                      }}
                      className="text-[10px] font-mono bg-slate-900/80 hover:bg-blue-600 text-white px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 transition shadow-xs"
                      title="Locate exact shelf coordinate"
                    >
                      <Compass className="w-3 h-3 text-blue-300" />
                      {book.shelfLocation}
                    </button>
                  </div>
                </div>

                {/* Body details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block truncate">
                      {book.category}
                    </span>
                    <h4
                      onClick={() => onSelectBook(book)}
                      className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition"
                      title={book.title}
                    >
                      {book.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      By {book.author}
                    </p>

                    {/* Genre Tags Preview */}
                    {book.genres && book.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {book.genres.slice(0, 2).map((genre, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                          >
                            #{genre}
                          </span>
                        ))}
                        {book.genres.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{book.genres.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">ISBN: {book.isbn.slice(-7)}</span>
                    <span>{book.publicationYear}</span>
                  </div>

                  {/* Actions: View | Edit | QR | Issue | Return */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => onSelectBook(book)}
                      className="flex-1 min-w-[60px] py-1.5 px-2 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    {canManage && onEditBook && (
                      <button
                        type="button"
                        onClick={() => onEditBook(book)}
                        className="py-1.5 px-2 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1"
                        title="Edit Book Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setBarcodeModalBook(book)}
                      className="py-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 border border-indigo-200/80 dark:border-indigo-800/80"
                      title="View & Manage Book Barcode"
                    >
                      <BarcodeIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Barcode
                    </button>
                    {canManage && onIssueBook && (
                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => onIssueBook(book)}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                          isAvailable
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        }`}
                        title={isAvailable ? "Quick Issue to Student" : "No copies available"}
                      >
                        Issue
                      </button>
                    )}
                    {canManage && onReturnBook && (
                      <button
                        type="button"
                        disabled={!transactions.some((t) => (t.status === "issued" || t.status === "overdue") && t.bookId === book.id)}
                        onClick={() => onReturnBook(book)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                          transactions.some((t) => (t.status === "issued" || t.status === "overdue") && t.bookId === book.id)
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        }`}
                        title="Process Return"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Return
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Book Info</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">ISBN</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Availability</th>
                  <th className="px-4 py-3 font-semibold">Total Issued</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableCopies > 0;
                  const hasActiveCheckout = transactions.some(
                    (t) => (t.status === "issued" || t.status === "overdue") && t.bookId === book.id
                  );
                  return (
                    <tr
                      key={book.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={book.coverImage}
                            alt=""
                            className="w-9 h-12 object-cover rounded shadow-xs shrink-0"
                          />
                          <div>
                            <p
                              onClick={() => onSelectBook(book)}
                              className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 cursor-pointer line-clamp-1 max-w-xs"
                            >
                              {book.title}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate max-w-xs">
                              {book.author}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {book.category}
                        </span>
                        {book.genres && book.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {book.genres.slice(0, 2).map((g, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                              >
                                #{g}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">{book.isbn}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setLocatingBook(book)}
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium text-left"
                          title="Locate shelf position"
                        >
                          <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{book.shelfLocation}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isAvailable
                              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {book.availableCopies} / {book.totalCopies}
                        </span>
                      </td>
                      <td className="px-4 py-3">{book.borrowCount} times</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectBook(book)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-semibold transition flex items-center gap-1"
                            title="View Book Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          {canManage && onEditBook && (
                            <button
                              type="button"
                              onClick={() => onEditBook(book)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-semibold transition flex items-center gap-1"
                              title="Edit Book Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setBarcodeModalBook(book)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded text-[11px] font-semibold transition flex items-center gap-1"
                            title="View and Manage Book Barcode"
                          >
                            <BarcodeIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            Barcode
                          </button>
                          {canManage && onIssueBook && (
                            <button
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => onIssueBook(book)}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                                isAvailable
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                              }`}
                              title={isAvailable ? "Issue Book" : "No copies available"}
                            >
                              Issue
                            </button>
                          )}
                          {canManage && onReturnBook && (
                            <button
                              type="button"
                              disabled={!hasActiveCheckout}
                              onClick={() => onReturnBook(book)}
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition flex items-center gap-0.5 ${
                                hasActiveCheckout
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                              }`}
                              title={hasActiveCheckout ? "Return Book" : "No active checkouts"}
                            >
                              <RotateCcw className="w-3 h-3" />
                              Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dedicated Book Barcode Modal */}
      {barcodeModalBook && (
        <BookBarcodeModal
          book={barcodeModalBook}
          isOpen={Boolean(barcodeModalBook)}
          onClose={() => setBarcodeModalBook(null)}
          onIssueRequest={(targetBook) => {
            setBarcodeModalBook(null);
            onIssueBook?.(targetBook);
          }}
          onReturnRequest={(targetBook) => {
            setBarcodeModalBook(null);
            onReturnBook?.(targetBook);
          }}
        />
      )}

      {/* Smart Shelf Locator Modal */}
      {locatingBook && (
        <SmartShelfLocatorModal
          book={locatingBook}
          isOpen={Boolean(locatingBook)}
          onClose={() => setLocatingBook(null)}
          onIssueCopy={(targetBook, copy) => {
            setLocatingBook(null);
            onIssueBook?.(targetBook);
          }}
        />
      )}
    </div>
  );
};
