"use client";

import { useEffect } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Shared modal shell — fixed overlay + centered card with a titled header.
 * Closes on Escape. The body (form, fields, action buttons) is passed in.
 */
export default function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
