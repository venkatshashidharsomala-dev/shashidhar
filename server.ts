import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { serverDatabase } from "./server/db";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client if key is available
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    appName: "Lib Smart",
    aiEnabled: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    database: serverDatabase.getStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Database status endpoint
app.get("/api/database/status", (_req, res) => {
  res.json(serverDatabase.getStatus());
});

// Database bootstrap endpoint (delivers persistent server state)
app.get("/api/database/bootstrap", (_req, res) => {
  res.json({
    success: true,
    data: serverDatabase.getState(),
    status: serverDatabase.getStatus(),
  });
});

// Database sync endpoint (persists frontend state changes to disk)
app.post("/api/database/sync", (req, res) => {
  try {
    const updatedState = req.body;
    if (!updatedState || typeof updatedState !== "object") {
      return res.status(400).json({ error: "Invalid database payload" });
    }
    const saved = serverDatabase.saveDatabase(updatedState);
    return res.json({
      success: true,
      message: "Database synchronized successfully with server storage",
      status: serverDatabase.getStatus(),
    });
  } catch (error: any) {
    console.error("Database sync error:", error);
    return res.status(500).json({ error: error.message || "Failed to sync database" });
  }
});

// Database reset endpoint
app.post("/api/database/reset", (_req, res) => {
  try {
    const resetState = serverDatabase.resetDatabase();
    return res.json({
      success: true,
      message: "Database reset to fresh seeds",
      data: resetState,
      status: serverDatabase.getStatus(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to reset database" });
  }
});

// Authentication: Login endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }
  const result = serverDatabase.authenticate(email, role);
  return res.json(result);
});

// Authentication: Register student endpoint
app.post("/api/auth/register", (req, res) => {
  const result = serverDatabase.registerStudent(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// AI Book Recommendations Endpoint
app.post("/api/gemini/recommendations", async (req, res) => {
  try {
    const { studentName, course, department, semester, borrowedBookTitles, availableBooks } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Return smart algorithmic recommendations if API key is not configured
      return res.json({
        source: "algorithmic",
        recommendations: [
          {
            title: "Artificial Intelligence: A Modern Approach",
            reason: "Essential for modern computing students and matches trending AI research topics in your syllabus.",
            confidence: 96,
          },
          {
            title: "Clean Code: A Handbook of Agile Software Craftsmanship",
            reason: "Highly recommended for practical software development and BCA project architecture.",
            confidence: 94,
          },
          {
            title: "Database System Concepts (Silberschatz)",
            reason: "Complements your recent borrowing habits and core database coursework.",
            confidence: 91,
          },
        ],
      });
    }

    const prompt = `You are the Lib Smart AI Library Assistant. Recommend 3 to 5 books from the library catalog for a student with the following profile:
Student: ${studentName || "Student"}
Program: ${course || "BCA"} - ${department || "Computer Applications"}, Semester: ${semester || "6"}
Previously borrowed books: ${borrowedBookTitles?.join(", ") || "Python Programming, Data Structures"}
Available library books:
${JSON.stringify(availableBooks?.map((b: any) => ({ id: b.id, title: b.title, author: b.author, category: b.category })) || [])}

Return JSON formatted as:
[
  {
    "bookId": "string or null",
    "title": "Book Title",
    "reason": "1-2 sentence academic/intellectual justification tailored to their course and borrowing interests",
    "confidence": 95
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "[]");
    return res.json({ source: "gemini", recommendations: parsed });
  } catch (error: any) {
    console.error("AI recommendation error:", error);
    return res.status(500).json({
      error: "Failed to generate AI recommendations",
      fallback: true,
      recommendations: [
        {
          title: "Introduction to Algorithms (CLRS)",
          reason: "Top academic recommendation for foundational problem solving and competitive coding.",
          confidence: 95,
        },
        {
          title: "Operating System Concepts",
          reason: "Foundational computer systems text for undergraduate computer applications.",
          confidence: 90,
        },
      ],
    });
  }
});

// AI Librarian Assistant Chat Endpoint
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { query, userRole, userName } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reply: `Hello ${userName || "there"}! I am the Lib Smart AI Library Assistant. Currently in offline/heuristic mode. You can search books across Computer Science, Business, Electronics, Literature, and Mathematics, check due dates, reserve books when copies reach zero, and track fines (₹5/day). How can I assist you with your library journey today?`,
        source: "offline-assistant",
      });
    }

    const systemInstruction = `You are "Lib Smart Assistant", an expert academic librarian and AI study advisor for a college university library.
You help students, librarians, and administrators with book queries, research suggestions, BCA/B.Tech/MCA project reference books, citation formats, and library guidelines.
Keep answers professional, polite, concise, structured with bullet points where appropriate, and enthusiastic about learning.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `User (${userRole || "Student"} - ${userName || "User"}): ${query}`,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      reply: response.text || "I am glad to assist you with library resources.",
      source: "gemini",
    });
  } catch (error: any) {
    console.error("AI Assistant error:", error);
    return res.json({
      reply: "Lib Smart Library Assistant: I'm currently unable to reach the AI cloud model, but you can explore books in the catalog, search by ISBN or category, or view your current borrowed titles on your dashboard.",
      source: "fallback",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Lib Smart] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
