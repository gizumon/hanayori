"use client";

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 28,
        transform: "translateX(-50%)",
        zIndex: 70,
        background: "rgba(92,74,74,0.92)",
        color: "#FFF9F5",
        fontSize: 13,
        letterSpacing: "0.08em",
        padding: "10px 20px",
        borderRadius: 999,
        pointerEvents: "none",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      }}
    >
      {message}
    </div>
  );
}
