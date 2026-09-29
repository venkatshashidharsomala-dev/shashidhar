import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Barcode as BarcodeIcon, Printer, Download } from "lucide-react";

interface BarcodeViewProps {
  value: string;
  format?: "CODE128" | "EAN13" | "EAN8" | "UPC";
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
  showActions?: boolean;
  title?: string;
}

export const BarcodeView: React.FC<BarcodeViewProps> = ({
  value,
  width = 1.8,
  height = 55,
  displayValue = true,
  className = "",
  showActions = false,
  title,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      const cleanValue = value.trim();
      // Determine best format
      const digitsOnly = cleanValue.replace(/\D/g, "");
      let detectedFormat = "CODE128";
      let renderValue = cleanValue;

      if (digitsOnly.length === 13) {
        detectedFormat = "EAN13";
        renderValue = digitsOnly;
      } else if (digitsOnly.length === 8) {
        detectedFormat = "EAN8";
        renderValue = digitsOnly;
      } else if (digitsOnly.length === 12) {
        detectedFormat = "UPC";
        renderValue = digitsOnly;
      }

      JsBarcode(svgRef.current, renderValue, {
        format: detectedFormat,
        width: width,
        height: height,
        displayValue: displayValue,
        font: "monospace",
        fontSize: 13,
        textMargin: 3,
        lineColor: "#0f172a",
        background: "transparent",
        margin: 4,
      });
    } catch {
      // Fallback to CODE128 for any alphanumeric barcode
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, value.trim(), {
            format: "CODE128",
            width: width,
            height: height,
            displayValue: displayValue,
            font: "monospace",
            fontSize: 13,
            lineColor: "#0f172a",
            background: "transparent",
          });
        }
      } catch (e) {
        console.warn("[BarcodeView] Rendering error:", e);
      }
    }
  }, [value, width, height, displayValue]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
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
        const png = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.download = `Barcode-${value}.png`;
        a.href = png;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
    image.src = blobURL;
  };

  if (!value) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400 ${className}`}>
        <BarcodeIcon className="w-4 h-4 shrink-0" />
        <span>No physical barcode assigned.</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs ${className}`}>
      {title && (
        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
          {title}
        </span>
      )}
      <div className="flex items-center justify-center overflow-hidden max-w-full">
        <svg ref={svgRef} className="max-w-full h-auto" />
      </div>

      {showActions && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 w-full justify-center">
          <button
            type="button"
            onClick={handleDownload}
            className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
            title="Download barcode image"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-2.5 py-1 text-white bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
            title="Print barcode tag"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Tag
          </button>
        </div>
      )}
    </div>
  );
};
