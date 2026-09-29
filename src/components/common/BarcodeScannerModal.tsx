import React, { useState, useEffect, useRef } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Book, BookCopy, StudentProfile, Transaction } from "../../types";
import { ShelfLocatorBadge } from "./ShelfLocatorBadge";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import {
  Camera,
  CameraOff,
  X,
  CheckCircle2,
  Search,
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
} from "lucide-react";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (
    result: { book?: Book; copy?: BookCopy; student?: StudentProfile },
    actionType?: "view" | "issue" | "return"
  ) => void;
  mode?: "general" | "issue" | "return";
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  mode = "general",
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

  // Camera states
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

  // Issue workflow state
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [issueDueDate, setIssueDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.borrowDurationDays || 14));
    return d.toISOString().split("T")[0];
  });
  const [issueError, setIssueError] = useState<string | null>(null);
  const [workflowSuccess, setWorkflowSuccess] = useState<string | null>(null);

  // Associate barcode workflow state
  const [associateBookId, setAssociateBookId] = useState<string>("");
  const [associateError, setAssociateError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Sound feedback via Web Audio API
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
      // Audio context may be restricted before user gesture
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetScanState();
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const resetScanState = () => {
    setScannedBarcode(null);
    setMatchingBook(null);
    setMatchingCopy(null);
    setActiveTx(null);
    setScanStatus("idle");
    setStatusMessage(null);
    setManualBarcode("");
    setIssueError(null);
    setWorkflowSuccess(null);
    setIsIssueDrawerOpen(false);
    setIsReturnDrawerOpen(false);
    setIsAssociateDrawerOpen(false);
  };

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
      // Build hints for library barcodes
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
          (result, error) => {
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
        setCameraError("Camera permission denied. Please allow camera access or enter the barcode manually.");
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

  // Main barcode resolution logic
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

    // Search database for matching book
    const foundBook = getBookByBarcode(clean);

    if (foundBook) {
      setMatchingBook(foundBook);
      setScanStatus("found");
      setStatusMessage("Book found successfully.");

      // Check if this specific copy was matched
      const copy = foundBook.copies?.find(
        (c) =>
          (c.barcode && c.barcode.toLowerCase() === clean.toLowerCase()) ||
          c.id.toLowerCase() === clean.toLowerCase()
      );
      setMatchingCopy(copy || null);

      // Check if there is an active checkout for this book or copy
      const active = transactions.find(
        (t) =>
          (t.status === "issued" || t.status === "overdue") &&
          (t.bookId === foundBook.id || (copy && t.copyId === copy.id))
      );
      setActiveTx(active || null);
    } else {
      // Also check if barcode matches a student ID
      const smartResult = identifyCode(clean);
      if (smartResult.type === "student" && smartResult.student) {
        onScanSuccess?.({ student: smartResult.student }, "issue");
        onClose();
        setIsProcessing(false);
        return;
      }

      setMatchingBook(null);
      setMatchingCopy(null);
      setActiveTx(null);
      setScanStatus("not_registered");
      setStatusMessage("Barcode not registered in LibSmart.");
    }

    // Debounce to allow continuous scanning
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

  // Associate scanned barcode with existing book
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

  // Issue Book using Barcode
  const handleConfirmIssue = () => {
    if (!matchingBook || !selectedStudentId) {
      setIssueError("Please select a student.");
      return;
    }

    const res = issueBook(
      selectedStudentId,
      matchingBook.id,
      issueDueDate,
      "Issued via physical barcode scanner",
      matchingCopy?.id
    );

    if (res.success) {
      setWorkflowSuccess(`"${matchingBook.title}" successfully issued to student.`);
      setIsIssueDrawerOpen(false);
      setIssueError(null);
      // Refresh matching book from updated store
      const updated = books.find((b) => b.id === matchingBook.id);
      if (updated) setMatchingBook(updated);
    } else {
      setIssueError(res.message);
    }
  };

  // Return Book using Barcode
  const handleConfirmReturn = () => {
    if (!activeTx) return;
    const res = returnBook(activeTx.id, new Date().toISOString().split("T")[0], "Returned via barcode scanner");
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

  if (!isOpen) return null;

  // Calculate return overdue days & fines
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BarcodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Scan Book Barcode
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Point camera at physical book barcode (EAN-13, EAN-8, UPC, Code 128)
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
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Permission Status Indicator */}
          {cameraPermission === "granted" && cameraActive && (
            <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Camera permission granted • Scanner active
              </span>
              <span className="font-mono text-[10px]">
                {facingMode === "environment" ? "Back Camera" : "Front Camera"}
              </span>
            </div>
          )}

          {/* Camera Scanner Viewport */}
          <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />

            {/* Camera Inactive / Error Overlay */}
            {!cameraActive && (
              <div className="text-center p-6 space-y-2.5 max-w-sm">
                <CameraOff className="w-9 h-9 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">Camera Scanner Inactive</p>
                {cameraError ? (
                  <p className="text-[11px] text-amber-400 leading-relaxed font-medium">
                    {cameraError}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Camera turned off. Click below to start scanning or enter barcode manually.
                  </p>
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

            {/* Align Barcode Here Reticle Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Visual Barcode Alignment Box */}
                <div className="w-72 h-36 border-2 border-indigo-400/80 rounded-xl relative shadow-[0_0_25px_rgba(99,102,241,0.3)] bg-indigo-500/5 backdrop-blur-[0.5px]">
                  {/* Corner notches */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-300 -mt-0.5 -ml-0.5" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-300 -mt-0.5 -mr-0.5" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-300 -mb-0.5 -ml-0.5" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-300 -mb-0.5 -mr-0.5" />

                  {/* Red Laser Scanning Beam */}
                  <div className="w-full h-0.5 bg-red-500 absolute top-1/2 -translate-y-1/2 shadow-xs shadow-red-500 animate-pulse" />

                  {/* Center Text Prompt */}
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

            {/* Camera Floating Controls */}
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

          {/* Enter Barcode Manually Section (Requirement 8) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <BarcodeIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Enter Barcode Manually
            </span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                  placeholder="Enter barcode number (e.g. 9780132350884)..."
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={handleManualSearch}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                Search Barcode
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Useful for computers without a camera or if the physical barcode is faded.
            </p>
          </div>

          {/* Workflow Success Banner */}
          {workflowSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{workflowSuccess}</span>
            </div>
          )}

          {/* Scan Result Handling (Requirements 5 & 12) */}
          {/* 1. Barcode Not Registered */}
          {scanStatus === "not_registered" && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Barcode not registered in LibSmart.
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                    Scanned code: <span className="font-mono font-bold">{scannedBarcode}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
                <button
                  type="button"
                  onClick={() => setIsAssociateDrawerOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add This Barcode
                </button>
                <button
                  type="button"
                  onClick={() => resetScanState()}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 transition"
                >
                  Clear & Scan Next
                </button>
              </div>

              {/* Associate Barcode Drawer */}
              {isAssociateDrawerOpen && (
                <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-700 space-y-2.5 animate-in fade-in">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    Link Barcode "{scannedBarcode}" to an Existing Book:
                  </h5>
                  <select
                    value={associateBookId}
                    onChange={(e) => setAssociateBookId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select an Existing Book --</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} (ISBN: {b.isbn}) {b.barcode ? `[Has barcode: ${b.barcode}]` : "[No barcode]"}
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
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Confirm Association
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAssociateDrawerOpen(false)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Invalid Barcode */}
          {scanStatus === "invalid" && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-in fade-in font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage || "Unable to read this barcode. Please try again or enter the barcode manually."}</span>
            </div>
          )}

          {/* 3. Book Found Successfully (Requirement 5) */}
          {scanStatus === "found" && matchingBook && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3.5">
                <img
                  src={matchingBook.coverImage}
                  alt={matchingBook.title}
                  className="w-16 h-24 object-cover rounded-lg shadow-xs shrink-0 border border-emerald-300 dark:border-emerald-800"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Book Found ✓</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Title: {matchingBook.title}
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Author: {matchingBook.author}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                    Barcode: <span className="font-bold text-indigo-600 dark:text-indigo-400">{matchingBook.barcode || scannedBarcode}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Available Copies: <strong className="text-slate-900 dark:text-white">{matchingBook.availableCopies}</strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        matchingBook.availableCopies > 0
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      Status: {matchingBook.availableCopies > 0 ? "Available" : "Checked Out"}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Shelf: {matchingBook.shelfLocation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: [Issue Book] [View Details] [Return Book] */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-200/80 dark:border-emerald-800/80">
                <button
                  type="button"
                  onClick={() => {
                    onScanSuccess?.({ book: matchingBook, copy: matchingCopy || undefined }, "view");
                    onClose();
                  }}
                  className="flex-1 min-w-[100px] py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 transition flex items-center justify-center gap-1.5 shadow-xs"
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
                    className="flex-1 min-w-[110px] py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 shadow-xs"
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
                    className="flex-1 min-w-[110px] py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Return Book
                  </button>
                )}
              </div>

              {/* Issue Book Workflow Drawer (Requirement 6) */}
              {isIssueDrawerOpen && (
                <div className="mt-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    Issue "{matchingBook.title}" to Student:
                  </h5>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Select Student *
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
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
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  {issueError && (
                    <div className="p-2 bg-red-50 text-red-600 text-[11px] font-semibold rounded-lg border border-red-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{issueError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
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
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Return Book Workflow Drawer (Requirement 7) */}
              {isReturnDrawerOpen && activeTx && (() => {
                const { daysOverdue, fine } = calculateOverdueInfo(activeTx);
                return (
                  <div className="mt-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-emerald-600" />
                      Return Transaction Details:
                    </h5>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block uppercase">Student</span>
                        <span className="font-bold text-slate-900 dark:text-white">{activeTx.studentName} ({activeTx.studentId})</span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block uppercase">Issue Date</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{activeTx.issueDate}</span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block uppercase">Due Date</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{activeTx.dueDate}</span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block uppercase">Overdue Days</span>
                        <span className={`font-bold ${daysOverdue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {daysOverdue} days
                        </span>
                      </div>
                    </div>

                    {fine > 0 && (
                      <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                        <span className="flex items-center gap-1 font-semibold">
                          <DollarSign className="w-3.5 h-3.5" />
                          Late Return Fine:
                        </span>
                        <span className="font-bold font-mono text-sm">{settings.currency}{fine}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
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
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Quick Test Barcode Buttons for Instant Testing */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick Test Library Barcodes (Click to simulate scanning)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {books.slice(0, 4).map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => handleBarcodeDetected(book.barcode || book.id)}
                  className="text-left p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition group"
                >
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600">
                    {book.title}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Barcode: {book.barcode || book.id}
                  </p>
                </button>
              ))}
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
