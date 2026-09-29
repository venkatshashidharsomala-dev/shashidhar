import React from "react";
import { FineRecord, DigitalReceiptData } from "../../types";
import { useLibrary } from "../../context/LibraryContext";
import { UniversalReceiptModal } from "./UniversalReceiptModal";
import { CheckCircle2, Printer, X } from "lucide-react";

interface ReceiptModalProps {
  fine?: FineRecord | null;
  receipt?: DigitalReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ fine, receipt, isOpen, onClose }) => {
  const { settings } = useLibrary();

  if (!isOpen) return null;

  // If modern DigitalReceiptData passed, delegate to UniversalReceiptModal
  if (receipt) {
    return <UniversalReceiptModal receipt={receipt} isOpen={isOpen} onClose={onClose} />;
  }

  if (!fine) return null;

  // Convert FineRecord to DigitalReceiptData for rich display
  const convertedReceipt: DigitalReceiptData = {
    type: "fine",
    transactionId: fine.transactionId,
    receiptNo: fine.receiptNo || "RCPT-" + fine.id,
    studentName: fine.studentName,
    studentId: fine.studentId,
    bookTitle: fine.bookTitle,
    issueDate: "Earlier",
    dueDate: fine.dueDate,
    returnDate: fine.paidDate || new Date().toISOString().split("T")[0],
    fineAmount: fine.amount,
    finePaid: fine.status === "paid",
    status: fine.status === "paid" ? "CLEARED" : "PENDING",
    librarian: "Circulation Desk",
    paymentMethod: fine.paymentMethod || "Cash / UPI",
    issuedAt: fine.paidDate ? `${fine.paidDate} (Settled)` : new Date().toLocaleString(),
  };

  return <UniversalReceiptModal receipt={convertedReceipt} isOpen={isOpen} onClose={onClose} />;
};

