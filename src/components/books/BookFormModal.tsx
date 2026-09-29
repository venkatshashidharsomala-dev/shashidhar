import React, { useState, useEffect } from "react";
import { Book } from "../../types";
import { useLibrary } from "../../context/LibraryContext";
import { availableGenres } from "../../data/mockData";
import { X, Plus, Edit2, Image, Layers, Sparkles, Tag, Check, Barcode as BarcodeIcon, AlertCircle } from "lucide-react";

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editBook?: Book | null;
  onBookAdded?: (newBook: Book) => void;
}

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  editBook,
  onBookAdded,
}) => {
  const { addBook, updateBook, categories } = useLibrary();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [barcode, setBarcode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [customGenreInput, setCustomGenreInput] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publicationYear, setPublicationYear] = useState<number>(new Date().getFullYear());
  const [language, setLanguage] = useState("English");
  const [totalCopies, setTotalCopies] = useState<number>(5);
  const [availableCopies, setAvailableCopies] = useState<number>(5);
  const [shelfLocation, setShelfLocation] = useState("Rack CS-01 / Shelf A");
  const [coverImage, setCoverImage] = useState("https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setErrorMessage(null);
    if (editBook) {
      setTitle(editBook.title);
      setAuthor(editBook.author);
      setIsbn(editBook.isbn);
      setBarcode(editBook.barcode || "");
      setCategoryId(editBook.categoryId);
      setSelectedCategories(
        editBook.categories && editBook.categories.length > 0
          ? editBook.categories
          : [editBook.category]
      );
      setSelectedGenres(editBook.genres || []);
      setPublisher(editBook.publisher);
      setPublicationYear(editBook.publicationYear);
      setLanguage(editBook.language);
      setTotalCopies(editBook.totalCopies);
      setAvailableCopies(editBook.availableCopies);
      setShelfLocation(editBook.shelfLocation);
      setCoverImage(editBook.coverImage);
      setDescription(editBook.description);
    } else {
      // Reset form
      const initialCat = categories[0]?.name || "Computer Science & IT";
      const randomIsbnDigits = Math.floor(100000000 + Math.random() * 900000000);
      const generatedIsbn = `978-0${randomIsbnDigits}`;
      setTitle("");
      setAuthor("");
      setIsbn(generatedIsbn);
      setBarcode(`9780${randomIsbnDigits}`);
      setCategoryId(categories[0]?.id || "cat-cs");
      setSelectedCategories([initialCat]);
      setSelectedGenres(["Algorithms"]);
      setPublisher("Academic Press");
      setPublicationYear(2024);
      setLanguage("English");
      setTotalCopies(5);
      setAvailableCopies(5);
      setShelfLocation("Rack CS-03 / Shelf B");
      setCoverImage("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80");
      setDescription("");
    }
  }, [editBook, isOpen, categories]);

  if (!isOpen) return null;

  const toggleCategorySelection = (catName: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catName)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((c) => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
  };

  const toggleGenreSelection = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const handleAddCustomGenre = () => {
    const trimmed = customGenreInput.trim();
    if (trimmed && !selectedGenres.includes(trimmed)) {
      setSelectedGenres((prev) => [...prev, trimmed]);
      setCustomGenreInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !author.trim() || !isbn.trim()) {
      setErrorMessage("Please fill in Title, Author, and ISBN.");
      return;
    }

    if (!barcode.trim()) {
      setErrorMessage("Please enter the physical barcode for this book.");
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const categoryName = selectedCategory ? selectedCategory.name : selectedCategories[0] || "General";

    // Ensure primary category is included in selectedCategories
    const finalCategories = selectedCategories.length > 0 ? selectedCategories : [categoryName];
    if (!finalCategories.includes(categoryName)) {
      finalCategories.unshift(categoryName);
    }

    let createdBook: Book | null = null;
    if (editBook) {
      const res = updateBook(editBook.id, {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        barcode: barcode.trim(),
        categoryId,
        category: categoryName,
        categories: finalCategories,
        genres: selectedGenres,
        publisher: publisher.trim(),
        publicationYear: Number(publicationYear),
        language,
        totalCopies: Number(totalCopies),
        availableCopies: Number(availableCopies),
        shelfLocation: shelfLocation.trim(),
        coverImage: coverImage.trim(),
        description: description.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || "Barcode already exists.");
        return;
      }
    } else {
      const res = addBook({
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        barcode: barcode.trim(),
        categoryId,
        category: categoryName,
        categories: finalCategories,
        genres: selectedGenres,
        publisher: publisher.trim(),
        publicationYear: Number(publicationYear),
        language,
        totalCopies: Number(totalCopies),
        availableCopies: Number(availableCopies),
        shelfLocation: shelfLocation.trim(),
        coverImage: coverImage.trim(),
        description: description.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || "Barcode already exists.");
        return;
      }
      createdBook = res.book || null;
    }

    onClose();

    if (createdBook && onBookAdded) {
      onBookAdded(createdBook);
    }
  };

  const sampleCoverImages = [
    "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              {editBook ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {editBook ? "Edit Library Book" : "Add New Book to Catalog"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {editBook ? `Updating ${editBook.id}` : "Assigns unique physical barcode and catalog record"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Book Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Python Programming"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Author(s) *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g., Mark Lutz"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ISBN Number *
              </label>
              <input
                type="text"
                required
                value={isbn}
                onChange={(e) => {
                  const val = e.target.value;
                  setIsbn(val);
                  if (!barcode || barcode === isbn.replace(/\D/g, "")) {
                    setBarcode(val.replace(/\D/g, ""));
                  }
                }}
                placeholder="e.g., 978-0133591620"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BarcodeIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Barcode / ISBN Barcode *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setBarcode(isbn.replace(/\D/g, ""))}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  title="Use digits from ISBN"
                >
                  Use ISBN digits
                </button>
              </div>
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g., 9780132350884 (enter physical barcode)"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400">
                Printed physical book barcode number (must be unique).
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Primary Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  const newCatId = e.target.value;
                  setCategoryId(newCatId);
                  const selected = categories.find((c) => c.id === newCatId);
                  if (selected && !selectedCategories.includes(selected.name)) {
                    setSelectedCategories((prev) => [selected.name, ...prev]);
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Shelf Location
              </label>
              <input
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="e.g., Rack CS-02 / Shelf B"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Multiselect Categories & Sub-Classifications */}
            <div className="space-y-2 md:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Multiselect Categories / Disciplines</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedCategories.length} selected
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tag multiple academic departments or divisions for cross-disciplinary search:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {categories.map((c) => {
                  const isSelected = selectedCategories.includes(c.name);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleCategorySelection(c.name)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition flex items-center gap-1 ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Multiselect Genres & Focus Topics */}
            <div className="space-y-2 md:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Genres & Technical Topics (Multiselect)</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedGenres.length} tags chosen
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Select topics or add custom keywords to help students find relevant coursework:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {availableGenres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <button
                      type="button"
                      key={genre}
                      onClick={() => toggleGenreSelection(genre)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition flex items-center gap-1 ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{genre}</span>
                    </button>
                  );
                })}
                {/* Any custom genres added not in default list */}
                {selectedGenres
                  .filter((g) => !availableGenres.includes(g))
                  .map((custom) => (
                    <button
                      type="button"
                      key={custom}
                      onClick={() => toggleGenreSelection(custom)}
                      className="px-2.5 py-1 text-[11px] rounded-lg border font-medium bg-emerald-600 text-white border-emerald-600 flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3 h-3" />
                      <span>{custom}</span>
                    </button>
                  ))}
              </div>

              {/* Add custom tag */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={customGenreInput}
                  onChange={(e) => setCustomGenreInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomGenre();
                    }
                  }}
                  placeholder="Add custom topic/genre (press enter or click Add)..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddCustomGenre}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Tag
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Publisher
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="e.g., Pearson Education"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Publication Year
              </label>
              <input
                type="number"
                value={publicationYear}
                onChange={(e) => setPublicationYear(Number(e.target.value))}
                min="1950"
                max="2030"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Copies
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={totalCopies}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalCopies(val);
                  if (!editBook) setAvailableCopies(val);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Available Copies
              </label>
              <input
                type="number"
                min="0"
                max={totalCopies}
                value={availableCopies}
                onChange={(e) => setAvailableCopies(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Cover image URL + Preset picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Cover Image URL</span>
              <span className="text-[10px] text-slate-400 font-normal">Pick preset or paste link</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <img
                src={coverImage}
                alt="Preview"
                className="w-9 h-9 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0"
              />
            </div>
            <div className="flex items-center gap-2">
              {sampleCoverImages.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setCoverImage(img)}
                  className={`w-7 h-7 rounded border overflow-hidden hover:opacity-100 transition ${
                    coverImage === img ? "ring-2 ring-indigo-500 border-transparent" : "opacity-60 border-slate-300"
                  }`}
                >
                  <img src={img} alt="sample" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description / Abstract
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a concise academic summary of the book contents..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
            >
              {editBook ? "Save Changes" : "Create Book Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
