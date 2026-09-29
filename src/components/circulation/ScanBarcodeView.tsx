import React, { useState, useEffect, useRef } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book, BookCopy, StudentProfile, Transaction } from "../../types";
import { ShelfLocatorBadge } from "../common/ShelfLocatorBadge";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import {
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  AlertCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  Barcode as BarcodeIcon,
  RefreshCw,
  PlusCircle,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  Compass,
} from "lucide-react";

interface ScanBarcodeViewProps {
  onSelectBook?: (book: Book) => void;
  onNavigate?: (view: string) => void;
}

export const ScanBarcodeView: React.FC<ScanBarcodeViewProps> = ({
  onSelectBook,
  onNavigate,
}) => {
  const {
    books,
    getBookByBarcode,
    identifyCode,
    transactions,
    students,
    settings,
    issueBook,
    returnBook,
    associateBarcodeWithBook,
  } = useLibrary();

  const [manualBarcode, setManualBarcode] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [matchingBook, setMatchingBook] = useState<Book | null>(null);
  const [matchingCopy, setMatchingCopy] = useState<BookCopy | null>(null);
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);

  const [scanStatus, setScanStatus] = useState<"idle" | "found" | "not_registered" | "invalid">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"idle" | "granted" | "denied" | "unavailable">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Workflow drawers
  const [isIssueDrawerOpen, setIsIssueDrawerOpen] = useState(false);
  const [isReturnDrawerOpen, setIsReturnDrawerOpen] = useState(false);
  const [isAssociateDrawerOpen, setIsAssociateDrawerOpen] = useState(false);

  // Issue state
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [issueDueDate, setIssueDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.borrowDurationDays || 14));
    return d.toISOString().split("T")[0];
  });
  const [issueError, setIssueError] = useState<string | null>(null);
  const [workflowSuccess, setWorkflowSuccess] = useState<string | null>(null);

  // Associate state
  const [associateBookId, setAssociateBookId] = useState<string>("");
  const [associateError, setAssociateError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio context might need user interaction first
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermission("unavailable");
      setCameraError("Camera unavailable in this browser environment.");
      setCameraActive(false);
      return;
    }

    try {
      const hints = new Map();
      const formats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR,
        BarcodeFormat.QR_CODE,
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const codeReader = new BrowserMultiFormatReader(hints, 400);
      codeReaderRef.current = codeReader;

      setCameraPermission("granted");
      setCameraActive(true);

      if (videoRef.current) {
        await codeReader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result) => {
            if (result) {
              const text = result.getText();
              if (text && text.trim()) {
                handleBarcodeDetected(text.trim());
              }
            }
          }
        );
      }
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraPermission("denied");
        setCameraError("Camera permission denied. Please allow camera access or use manual barcode entry.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraPermission("unavailable");
        setCameraError("Camera unavailable on this device. Please enter barcode manually.");
      } else {
        setCameraPermission("unavailable");
        setCameraError("Camera could not be started. Please enter barcode manually below.");
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (e) {
        // Safe cleanup
      }
      codeReaderRef.current = null;
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

  const handleBarcodeDetected = (rawBarcode: string) => {
    const clean = rawBarcode.trim();
    if (!clean) {
      setScanStatus("invalid");
      setStatusMessage("Unable to read this barcode. Please try again or enter the barcode manually.");
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);
    playBeep();

    setScannedBarcode(clean);
    setIsIssueDrawerOpen(false);
    setIsReturnDrawerOpen(false);
    setIsAssociateDrawerOpen(false);
    setWorkflowSuccess(null);

    const foundBook = getBookByBarcode(clean);

    if (foundBook) {
      setMatchingBook(foundBook);
      setScanStatus("found");
      setStatusMessage("Book found successfully.");

      const copy = foundBook.copies?.find(
        (c) =>
          (c.barcode && c.barcode.toLowerCase() === clean.toLowerCase()) ||
          c.id.toLowerCase() === clean.toLowerCase()
      );
      setMatchingCopy(copy || null);

      const active = transactions.find(
        (t) =>
          (t.status === "issued" || t.status === "overdue") &&
          (t.bookId === foundBook.id || (copy && t.copyId === copy.id))
      );
      setActiveTx(active || null);
    } else {
      const smartResult = identifyCode(clean);
      if (smartResult.type === "student" && smartResult.student && onNavigate) {
        onNavigate("issue-book");
        setIsProcessing(false);
        return;
      }

      setMatchingBook(null);
      setMatchingCopy(null);
      setActiveTx(null);
      setScanStatus("not_registered");
      setStatusMessage("Barcode not registered in LibSmart.");
    }

    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  const handleManualSearch = () => {
    if (!manualBarcode.trim()) {
      setScanStatus("invalid");
      setStatusMessage("Please enter a barcode number.");
      return;
    }
    handleBarcodeDetected(manualBarcode.trim());
  };

  const handleAssociateBarcode = () => {
    if (!scannedBarcode || !associateBookId) {
      setAssociateError("Please select a book to associate with this barcode.");
      return;
    }
    const res = associateBarcodeWithBook(scannedBarcode, associateBookId);
    if (res.success && res.book) {
      setMatchingBook(res.book);
      setScanStatus("found");
      setStatusMessage(`Barcode "${scannedBarcode}" successfully linked to "${res.book.title}".`);
      setIsAssociateDrawerOpen(false);
      setAssociateError(null);
    } else {
      setAssociateError(res.error || "Failed to associate barcode.");
    }
  };

  const handleConfirmIssue = () => {
    if (!matchingBook || !selectedStudentId) {
      setIssueError("Please select a student.");
      return;
    }

    const res = issueBook(
      selectedStudentId,
      matchingBook.id,
      issueDueDate,
      "Issued via barcode station",
      matchingCopy?.id
    );

    if (res.success) {
      setWorkflowSuccess(`"${matchingBook.title}" successfully issued to student.`);
      setIsIssueDrawerOpen(false);
      setIssueError(null);
      const updated = books.find((b) => b.id === matchingBook.id);
      if (updated) setMatchingBook(updated);
    } else {
      setIssueError(res.message);
    }
  };

  const handleConfirmReturn = () => {
    if (!activeTx) return;
    const res = returnBook(activeTx.id, new Date().toISOString().split("T")[0], "Returned via barcode station");
    if (res.success) {
      setWorkflowSuccess(`"${activeTx.bookTitle}" successfully returned. Copies updated.`);
      setActiveTx(null);
      setIsReturnDrawerOpen(false);
      if (matchingBook) {
        const updated = books.find((b) => b.id === matchingBook.id);
        if (updated) setMatchingBook(updated);
      }
    }
  };

  const calculateOverdueInfo = (tx: Transaction) => {
    const dueDate = new Date(tx.dueDate);
    const today = new Date();
    let daysOverdue = 0;
    if (today > dueDate) {
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    const fine = daysOverdue * (settings.finePerDay || 5);
    return { daysOverdue, fine };
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BarcodeIcon className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Scan Barcode
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scan physical book barcodes (EAN-13, EAN-8, UPC, Code 128, Code 39) with your camera or enter barcode manually.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 transition flex items-center gap-1.5 text-xs font-medium"
            title={soundEnabled ? "Mute beep sound" : "Enable beep sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? "Beep On" : "Muted"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Scanner Viewport & Manual Entry */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Scan Book Barcode</span>
              </h3>
              {cameraActive && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Camera permission granted
                </span>
              )}
            </div>

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
                <div className="text-center p-6 space-y-2.5 max-w-sm">
                  <CameraOff className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">Camera Scanner Inactive</p>
                  {cameraError ? (
                    <p className="text-[11px] text-amber-400 leading-relaxed font-medium">
                      {cameraError}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Camera preview paused. Click below to start scanning physical books.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry / Start Camera
                  </button>
                </div>
              )}

              {/* Align Barcode Reticle Overlay */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-72 h-36 border-2 border-indigo-400/90 rounded-xl relative shadow-[0_0_25px_rgba(99,102,241,0.3)] bg-indigo-500/5">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-300 -mt-0.5 -ml-0.5" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-300 -mt-0.5 -mr-0.5" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-300 -mb-0.5 -ml-0.5" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-300 -mb-0.5 -mr-0.5" />

                    <div className="w-full h-0.5 bg-red-500 absolute top-1/2 -translate-y-1/2 shadow-xs shadow-red-500 animate-pulse" />

                    <div className="absolute bottom-2 inset-x-0 text-center">
                      <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded uppercase tracking-wider">
                        Align barcode here
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/90 font-medium mt-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    Point the camera at the book barcode
                  </p>
                </div>
              )}

              {/* Floating Camera Controls */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={flipCamera}
                  className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-medium rounded-md backdrop-blur-xs border border-white/10 transition flex items-center gap-1"
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
                  {cameraActive ? "Pause" : "Start"}
                </button>
              </div>
            </div>

            {/* Enter Barcode Manually Section (Requirement 8) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BarcodeIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Enter Barcode Manually
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                  placeholder="Enter barcode number (e.g. 9780132350884)..."
                  className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleManualSearch}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shrink-0 flex items-center gap-1.5 shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search Barcode
                </button>
              </div>
            </div>

            {/* Quick Test Barcodes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Quick Test Real Barcodes (Click to simulate scanning)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {books.slice(0, 6).map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => handleBarcodeDetected(book.barcode || book.id)}
                    className="text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition group"
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600">
                      {book.title}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {book.barcode || book.id}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result & Actions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Status Alert if any */}
          {workflowSuccess && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{workflowSuccess}</span>
            </div>
          )}

          {scanStatus === "invalid" && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-in fade-in font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage || "Unable to read this barcode. Please try again or enter the barcode manually."}</span>
            </div>
          )}

          {/* Barcode Not Registered in LibSmart */}
          {scanStatus === "not_registered" && (
            <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-3.5 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    Barcode not registered in LibSmart.
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Scanned barcode: <span className="font-mono font-bold">{scannedBarcode}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                This physical barcode is not associated with any catalog book. You can link this barcode to an existing title right now.
              </p>

              <button
                type="button"
                onClick={() => setIsAssociateDrawerOpen(true)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                Add This Barcode
              </button>

              {/* Associate Barcode Drawer */}
              {isAssociateDrawerOpen && (
                <div className="mt-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-700 space-y-3 animate-in fade-in">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    Associate Scanned Barcode "{scannedBarcode}" to Book:
                  </h5>
                  <select
                    value={associateBookId}
                    onChange={(e) => setAssociateBookId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Existing Title --</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} (ISBN: {b.isbn}) {b.barcode ? `[Has: ${b.barcode}]` : "[No barcode]"}
                      </option>
                    ))}
                  </select>

                  {associateError && (
                    <p className="text-[11px] text-red-600 font-semibold">{associateError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAssociateBarcode}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Confirm Association
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAssociateDrawerOpen(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Book Found Successfully Card (Requirement 5) */}
          {scanStatus === "found" && matchingBook && (
            <div className="p-5 bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <span>Book Found ✓</span>
              </div>

              <div className="flex items-start gap-4">
                <img
                  src={matchingBook.coverImage}
                  alt={matchingBook.title}
                  className="w-20 h-28 object-cover rounded-xl shadow-xs shrink-0 border border-slate-200 dark:border-slate-800"
                />
                <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Title: {matchingBook.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Author: <span className="font-semibold text-slate-800 dark:text-slate-200">{matchingBook.author}</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-mono">
                    Barcode: <span className="font-bold text-indigo-600 dark:text-indigo-400">{matchingBook.barcode || scannedBarcode}</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Available Copies: <strong className="text-slate-900 dark:text-white">{matchingBook.availableCopies}</strong> of {matchingBook.totalCopies}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        matchingBook.availableCopies > 0
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      Status: {matchingBook.availableCopies > 0 ? "Available" : "Checked Out"}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Shelf: <span className="font-medium text-slate-700 dark:text-slate-300">{matchingBook.shelfLocation}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons: [Issue Book] [View Details] [Return Book] */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectBook?.(matchingBook)}
                  className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  View Details
                </button>

                {matchingBook.availableCopies > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsIssueDrawerOpen(!isIssueDrawerOpen);
                      setIsReturnDrawerOpen(false);
                      setIssueError(null);
                    }}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    Issue Book
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {activeTx && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsReturnDrawerOpen(!isReturnDrawerOpen);
                      setIsIssueDrawerOpen(false);
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Return Book
                  </button>
                )}
              </div>

              {/* Issue Book Workflow (Requirement 6) */}
              {isIssueDrawerOpen && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    Issue to Student
                  </h5>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Student *
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="">-- Select Student --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.studentId}>
                          {s.fullName} ({s.studentId}) • {s.course}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={issueDueDate}
                      onChange={(e) => setIssueDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  {issueError && (
                    <div className="p-2 bg-red-50 text-red-600 text-[11px] font-semibold rounded-lg border border-red-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{issueError}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmIssue}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Confirm Issue
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsIssueDrawerOpen(false)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Return Book Workflow (Requirement 7) */}
              {isReturnDrawerOpen && activeTx && (() => {
                const { daysOverdue, fine } = calculateOverdueInfo(activeTx);
                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-emerald-600" />
                      Active Checkout Record
                    </h5>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block uppercase">Student</span>
                        <span className="font-bold text-slate-900 dark:text-white">{activeTx.studentName}</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block uppercase">Student ID</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{activeTx.studentId}</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block uppercase">Issue Date</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{activeTx.issueDate}</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block uppercase">Due Date</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{activeTx.dueDate}</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Overdue Days:</span>
                      <span className={`font-bold ${daysOverdue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {daysOverdue} days
                      </span>
                    </div>

                    {fine > 0 && (
                      <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                        <span className="flex items-center gap-1 font-semibold">
                          <DollarSign className="w-3.5 h-3.5" />
                          Overdue Fine:
                        </span>
                        <span className="font-bold font-mono text-sm">{settings.currency}{fine}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmReturn}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Confirm Return
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsReturnDrawerOpen(false)}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Idle State Prompt */}
          {scanStatus === "idle" && (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                <BarcodeIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Scanner Ready
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Scan any physical textbook barcode with your camera or enter the barcode digits on the left.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
