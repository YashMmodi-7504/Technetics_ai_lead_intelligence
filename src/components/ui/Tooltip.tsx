import React, { useState } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}

/**
 * Accessible, dependency-free tooltip. Shows on hover and keyboard focus.
 */
export default function Tooltip({
  content,
  children,
  side = "top",
  className = "",
}: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 left-1/2 -translate-x-1/2 w-max max-w-[220px] px-2.5 py-1.5 rounded-lg bg-[#0F172A] text-white text-[10px] font-medium leading-snug shadow-lg pointer-events-none animate-fade-in ${
            side === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {content}
          <span
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#0F172A] ${
              side === "top" ? "top-full -mt-1" : "bottom-full -mb-1"
            }`}
          />
        </span>
      )}
    </span>
  );
}
