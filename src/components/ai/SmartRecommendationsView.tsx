import React, { useState, useEffect } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book } from "../../types";
import {
  Sparkles,
  Send,
  BookOpen,
  Bot,
  User,
  Lightbulb,
  Compass,
  ArrowRight,
  RefreshCw,
  Award,
  Layers,
} from "lucide-react";

interface SmartRecommendationsViewProps {
  onSelectBook: (book: Book) => void;
}

export const SmartRecommendationsView: React.FC<SmartRecommendationsViewProps> = ({
  onSelectBook,
}) => {
  const { currentUser, books, students, transactions } = useLibrary();

  // Recommendations state
  const [recommendations, setRecommendations] = useState<{
    bookTitle: string;
    author: string;
    reason: string;
    relevanceScore: number;
    category: string;
  }[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Chat assistant state
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; time: string }[]
  >([
    {
      role: "assistant",
      content:
        "Hello! I am your LibSmart AI Academic Assistant. Ask me anything about finding books in the library racks, exam preparation reading lists, syllabus topics (BCA / CS), or project references.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  // Find current student profile if role is student
  const student = students.find((s) => s.studentId === currentUser.studentId) || students[0];

  const studentHistory = transactions
    .filter((t) => t.studentId === student?.studentId)
    .map((t) => t.bookTitle);

  // Fetch AI Recommendations
  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const response = await fetch("/api/gemini/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: student?.fullName || "BCA Student",
          course: student?.course || "Bachelor of Computer Applications (BCA)",
          department: student?.department || "Computer Applications",
          semester: student?.semester || 6,
          borrowedBookTitles: studentHistory,
          availableBooks: books.map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            category: b.category,
          })),
        }),
      });

      const data = await response.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        const normalized = data.recommendations.map((r: any) => ({
          bookTitle: r.bookTitle || r.title || "Academic Reference",
          author: r.author || "Faculty Recommended",
          reason: r.reason || "Recommended reading for BCA syllabus topics.",
          relevanceScore: r.relevanceScore || r.confidence || 95,
          category: r.category || "Core Computing",
        }));
        setRecommendations(normalized);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [student?.studentId]);

  // Handle Chat Submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loadingChat) return;

    const userText = inputQuery.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [...prev, { role: "user", content: userText, time: timeNow }]);
    setInputQuery("");
    setLoadingChat(true);

    try {
      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userText,
          message: userText,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "I am glad to assist you with library resources.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, the AI service is currently unavailable. Please check your connection or contact the librarian.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const matchedCatalogBooks = recommendations.map((rec) => {
    const found = books.find(
      (b) =>
        b.title.toLowerCase().includes(rec.bookTitle.toLowerCase()) ||
        rec.bookTitle.toLowerCase().includes(b.title.toLowerCase())
    );
    return { ...rec, catalogBook: found };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Academic Advisor & Smart Recommendations
            </h2>
            <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> GEMINI 2.5
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tailored literature recommendations mapped to student curriculum and intelligent reference chatbot
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRecommendations}
          disabled={loadingRecs}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingRecs ? "animate-spin" : ""}`} />
          Refresh Recommendations
        </button>
      </div>

      {/* Student Context Card */}
      <div className="p-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={student?.profileImage}
            alt=""
            className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-400/40 shrink-0"
          />
          <div>
            <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-semibold">
              Personalized for Student
            </span>
            <h3 className="text-base font-bold text-white">
              {student?.fullName} ({student?.studentId})
            </h3>
            <p className="text-xs text-slate-300">
              {student?.course} • Semester {student?.semester}
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xs border border-white/10 px-3.5 py-2 rounded-xl text-xs space-y-0.5">
          <span className="text-indigo-200 block text-[10px]">Previously Borrowed</span>
          <p className="font-semibold text-white truncate max-w-xs">
            {studentHistory.length > 0 ? studentHistory.join(", ") : "No prior borrowings yet"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recommended Books List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Syllabus & Career Curated Picks
            </h3>
            <span className="text-[11px] text-slate-400">
              {recommendations.length} Suggestions
            </span>
          </div>

          {loadingRecs ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Gemini AI is analyzing semester syllabus and borrowing patterns...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchedCatalogBooks.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {item.catalogBook ? (
                        <img
                          src={item.catalogBook.coverImage}
                          alt=""
                          className="w-12 h-16 object-cover rounded-lg shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0 text-indigo-600">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                            {item.category}
                          </span>
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded">
                            Score: {item.relevanceScore}% match
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {item.bookTitle}
                        </h4>
                        <p className="text-xs text-slate-500">By {item.author}</p>
                      </div>
                    </div>

                    {item.catalogBook && (
                      <button
                        type="button"
                        onClick={() => onSelectBook(item.catalogBook!)}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg transition flex items-center gap-1 shrink-0"
                      >
                        View
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* AI Reason explanation */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 block text-[11px] mb-0.5">
                      💡 Why LibSmart recommends this:
                    </span>
                    {item.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Interactive Gemini AI Chat Assistant */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col h-[560px] overflow-hidden">
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  LibSmart AI Reference Desk
                </h4>
                <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online & Ready
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] p-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-slate-100 dark:bg-slate-900/70 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-800"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.role === "user" ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {loadingChat && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs pl-8">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>LibSmart AI is searching catalog and formulating answer...</span>
              </div>
            )}
          </div>

          {/* Quick prompt suggestions */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex gap-1.5 overflow-x-auto text-[10px]">
            <button
              type="button"
              onClick={() => setInputQuery("Where is the Algorithms book located?")}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 shrink-0"
            >
              📍 Shelf location for CLRS?
            </button>
            <button
              type="button"
              onClick={() => setInputQuery("What books are best for 6th semester BCA cloud computing?")}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 shrink-0"
            >
              ☁️ Sem 6 Cloud Computing picks?
            </button>
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about books, shelf locations, BCA syllabus..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loadingChat || !inputQuery.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition flex items-center justify-center shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
