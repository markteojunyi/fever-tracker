"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
        type === "success" ? "bg-emerald-600" : "bg-rose-600"
      }`}
      style={{ color: "#ffffff" }}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      <span>{message}</span>
    </div>
  );
}
