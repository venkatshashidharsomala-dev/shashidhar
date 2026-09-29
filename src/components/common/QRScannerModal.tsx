import React, { useState, useEffect, useRef } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book, BookCopy, StudentProfile } from "../../types";
import { ShelfLocatorBadge } from "./ShelfLocatorBadge";
import jsQR from "jsqr";
import {
  Camera,
  CameraOff,
  X,
  CheckCircle,
  Search,
  ArrowRight,
  BookOpen,
  AlertCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  UserCheck,
  Tag,
  RefreshCw,
} from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (
    result: { book?: Book; copy?: BookCopy; student?: StudentProfile },
    actionType?: "view" | "issue" | "return"
  ) => void;
  mode?: "general" | "issue" | "return";
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  mode = "general",
}) => {
  const { books, identifyCode, transactions } = useLibrary();

  const [manualCode, setManualCode] = useState("");
  const [scannedResult, setScannedResult] = useState<{
    type: "copy" | "book" | "student" | "unknown";
    book?: Book;
    copy?: BookCopy;
    student?: StudentProfile;
    rawCode: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Sound feedback via Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      setError(null);
      setCameraError(null);
      setManualCode("");
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API is not supported in this browser environment.");
        setCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn("Camera access failed or denied:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access or use manual code entry.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device was detected on your system.");
      } else {
        setCameraError("Unable to access camera. You can still test with manual code input or sample cards below.");
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Real-time Video frame processing with jsQR
  const startScanningLoop = () => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data && code.data.trim()) {
          handleDetectedCode(code.data.trim());
          return; // pause loop until handled
        }
      }
      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);
  };

  const handleDetectedCode = (rawCode: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    playBeep();

    const result = identifyCode(rawCode);
    if (result.type !== "unknown") {
      setScannedResult(result);
      setError(null);
    } else {
      setError(`Scanned code "${rawCode}" was not recognized in the library database.`);
      setScannedResult(null);
    }

    // Delay before allowing another detection
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  const handleResolveCode = (code: string) => {
    if (!code.trim()) return;
    handleDetectedCode(code.trim());
  };

  const handleQuickSelectBook = (book: Book, copy?: BookCopy) => {
    if (copy) {
      handleDetectedCode(copy.id);
    } else {
      handleDetectedCode(book.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Scan Book QR Code
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Point the camera at the book's QR code.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={soundEnabled ? "Mute beep" : "Unmute beep"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Camera Viewport */}
          <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />

            {!cameraActive && (
              <div className="text-center p-6 space-y-2.5">
                <CameraOff className="w-9 h-9 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">Camera preview inactive</p>
                {cameraError ? (
                  <p className="text-[11px] text-amber-400 max-w-xs mx-auto leading-relaxed">{cameraError}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">Camera turned off. Click below to activate scanner.</p>
                )}
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry / Start Camera
                </button>
              </div>
            )}

            {/* Scanning Overlay Reticle */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-44 h-44 border-2 border-indigo-500/70 rounded-xl relative shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400 -mt-0.5 -ml-0.5" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400 -mt-0.5 -mr-0.5" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400 -mb-0.5 -ml-0.5" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400 -mb-0.5 -mr-0.5" />
                  <div className="w-full h-0.5 bg-red-500/80 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-sm shadow-red-500" />
                </div>
              </div>
            )}

            {/* Camera Controls Overlay */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={flipCamera}
                className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-medium rounded-md backdrop-blur-xs border border-white/10 transition flex items-center gap-1"
                title="Switch front/back camera"
              >
                <RefreshCw className="w-3 h-3" />
                Flip
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className="px-2.5 py-1 bg-indigo-600/90 hover:bg-indigo-600 text-white text-[11px] font-medium rounded-md backdrop-blur-xs transition flex items-center gap-1"
              >
                {cameraActive ? <CameraOff className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                {cameraActive ? "Stop" : "Start"}
              </button>
            </div>
          </div>

          {/* Manual Input Search Fallback */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Enter Book ID manually
            </span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResolveCode(manualCode)}
                  placeholder="Enter Book ID (e.g. BK000001, BK-1001)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleResolveCode(manualCode)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shrink-0"
              >
                Search
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Scanned Result: Physical Copy or Book */}
          {scannedResult && (scannedResult.type === "copy" || scannedResult.type === "book") && scannedResult.book && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <img
                  src={scannedResult.book.coverImage}
                  alt={scannedResult.book.title}
                  className="w-14 h-20 object-cover rounded-md shadow-xs shrink-0 border border-emerald-300 dark:border-emerald-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {scannedResult.type === "copy"
                        ? `Physical Copy Verified (${scannedResult.copy?.id})`
                        : "Book Catalog Record Identified"}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    Book: {scannedResult.book.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Author: {scannedResult.book.author}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                      Book ID: {scannedResult.type === "copy" ? scannedResult.copy?.id : scannedResult.book.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        scannedResult.book.availableCopies > 0
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      Status: {scannedResult.book.availableCopies > 0 ? "Available" : "Checked Out"}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      • Available Copies: {scannedResult.book.availableCopies}
                    </span>
                  </div>

                  {/* Scanned Book Categories & Genres */}
                  {((scannedResult.book.categories && scannedResult.book.categories.length > 0) || (scannedResult.book.genres && scannedResult.book.genres.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {(scannedResult.book.categories || [scannedResult.book.category]).slice(0, 2).map((cat, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                          {cat}
                        </span>
                      ))}
                      {scannedResult.book.genres?.slice(0, 2).map((genre, i) => (
                        <span key={i} className="text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                          #{genre}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2">
                    <ShelfLocatorBadge locationString={scannedResult.copy?.shelfLocation || scannedResult.book.shelfLocation} />
                  </div>
                </div>
              </div>

              {/* Action Buttons: [Issue Book] [View Details] [Return Book] */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                <button
                  type="button"
                  onClick={() => {
                    onScanSuccess?.(
                      { book: scannedResult.book, copy: scannedResult.copy },
                      "view"
                    );
                    onClose();
                  }}
                  className="flex-1 py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  View Details
                </button>

                {scannedResult.book.availableCopies > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onScanSuccess?.(
                        { book: scannedResult.book, copy: scannedResult.copy },
                        "issue"
                      );
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    Issue Book
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {transactions.some(
                  (t) =>
                    (t.status === "issued" || t.status === "overdue") &&
                    (t.bookId === scannedResult.book?.id || (scannedResult.copy && t.copyId === scannedResult.copy.id))
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      onScanSuccess?.(
                        { book: scannedResult.book, copy: scannedResult.copy },
                        "return"
                      );
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Return Book
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scanned Result: Student ID Card */}
          {scannedResult && scannedResult.type === "student" && scannedResult.student && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <img
                  src={scannedResult.student.profileImage}
                  alt={scannedResult.student.fullName}
                  className="w-12 h-12 rounded-xl object-cover border border-indigo-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                    <UserCheck className="w-4 h-4" />
                    <span>Student ID Card Verified</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {scannedResult.student.fullName}
                  </h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                    {scannedResult.student.studentId} • {scannedResult.student.course}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Sem {scannedResult.student.semester} • Max limit: {scannedResult.student.maxBorrowLimit} books
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60">
                <button
                  type="button"
                  onClick={() => {
                    onScanSuccess?.({ student: scannedResult.student }, "issue");
                    onClose();
                  }}
                  className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Proceed to Issue Books to this Student
                </button>
              </div>
            </div>
          )}

          {/* Quick Test Barcode / Copy QR Buttons for Instant Sandbox Testing */}
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick Test Codes (Click to simulate scanning real book tags)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {books.slice(0, 4).map((book) => {
                const firstCopy = book.copies?.[0];
                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => handleQuickSelectBook(book, firstCopy)}
                    className="text-left p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition group"
                  >
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {book.title}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {firstCopy ? firstCopy.id : book.id} • {book.category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

