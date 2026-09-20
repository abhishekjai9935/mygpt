"use client";

import { useId, useState } from "react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-describedby={tooltipId}
        aria-label="More information"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] leading-none opacity-60 hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-current"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          id={tooltipId}
          className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-md border border-[var(--border)] bg-[var(--panel)] p-2 text-xs font-normal text-[var(--foreground)] shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
