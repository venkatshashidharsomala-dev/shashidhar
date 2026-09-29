import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { Download, Printer, RefreshCw, AlertCircle } from "lucide-react";

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  showActions?: boolean;
  showValue?: boolean;
  onDownload?: () => void;
  onPrint?: () => void;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 160,
  className = "",
  title,
  subtitle,
  showActions = false,
  showValue = true,
  onDownload,
  onPrint,
}) => {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async () => {
    if (!value || !value.trim()) {
      setHasError(true);
      setErrorMessage("No Book ID or QR code data provided.");
      setIsLoading(false);
      setDataUrl("");
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");

      // Generate high-resolution Data URL for guaranteed crisp image rendering
      const url = await QRCode.toDataURL(value.trim(), {
        width: Math.max(size * 2, 280),
        margin: 1,
        errorCorrectionLevel: "M",
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });

      setDataUrl(url);

      // Also render to canvas if available
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, value.trim(), {
          width: size,
          margin: 1,
          errorCorrectionLevel: "M",
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
      }
    } catch (err: any) {
      console.error("[QRCodeView] Generation failure:", err);
      setHasError(true);
      setErrorMessage("Unable to generate QR code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateQRCode();
  }, [value, size]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!dataUrl) return;
    const cleanName = value.replace(/[^a-zA-Z0-9_-]/g, "_");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `QR-${cleanName || "book"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    if (!dataUrl) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print QR Code - ${value}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 90vh;
                margin: 0;
                padding: 20px;
                color: #0f172a;
              }
              .sticker-card {
                border: 2px dashed #94a3b8;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                max-width: 320px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              }
              .library-tag {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
                color: #4f46e5;
                margin-bottom: 4px;
              }
              .title {
                font-size: 14px;
                font-weight: 700;
                margin: 8px 0;
              }
              .qr-img {
                width: 180px;
                height: 180px;
                margin: 12px auto;
                display: block;
              }
              .book-id {
                font-family: monospace;
                font-size: 13px;
                font-weight: 700;
                color: #1e293b;
                background: #f1f5f9;
                padding: 4px 10px;
                border-radius: 6px;
                display: inline-block;
                margin-top: 6px;
              }
              .footer {
                font-size: 10px;
                color: #64748b;
                margin-top: 10px;
              }
              @media print {
                body { padding: 0; }
                .sticker-card { border: 1px solid #000; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="sticker-card">
              <div class="library-tag">LibSmart Central Library</div>
              ${title ? `<div class="title">${title}</div>` : ""}
              <img class="qr-img" src="${dataUrl}" alt="QR Code" />
              <div class="book-id">Book ID: ${value}</div>
              <div class="footer">Scan to Issue / Return Book</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900 text-center ${className}`}>
        <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
        <p className="text-xs font-semibold text-red-700 dark:text-red-400">
          {errorMessage || "Unable to generate QR code. Please try again."}
        </p>
        <button
          type="button"
          onClick={generateQRCode}
          className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[11px] font-medium transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs relative group ${className}`}>
      {isLoading ? (
        <div
          style={{ width: size, height: size }}
          className="flex flex-col items-center justify-center bg-slate-50 rounded-lg animate-pulse"
        >
          <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mb-1" />
          <span className="text-[10px] text-slate-400 font-medium">Generating QR...</span>
        </div>
      ) : (
        <div className="relative flex items-center justify-center p-1 bg-white rounded-lg">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR Code for ${value}`}
              style={{ width: size, height: size }}
              className="object-contain block rounded-sm"
              loading="eager"
            />
          ) : (
            <canvas ref={canvasRef} style={{ width: size, height: size }} />
          )}
        </div>
      )}

      {title && (
        <span className="mt-1.5 text-xs font-bold text-slate-800 truncate max-w-[200px] text-center">
          {title}
        </span>
      )}

      {subtitle && (
        <span className="text-[11px] text-slate-500 truncate max-w-[200px] text-center">
          {subtitle}
        </span>
      )}

      {showValue && (
        <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md mt-1">
          {value.startsWith("BK") || value.startsWith("LIB-") ? value : `Book ID: ${value}`}
        </span>
      )}

      {showActions && (
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 w-full justify-center">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!dataUrl || isLoading}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-slate-200"
            title="Download QR image as PNG"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            Download QR
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!dataUrl || isLoading}
            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
            title="Print Spine/Cover sticker label"
          >
            <Printer className="w-3.5 h-3.5" />
            Print QR
          </button>
        </div>
      )}
    </div>
  );
};
