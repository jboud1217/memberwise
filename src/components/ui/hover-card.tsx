"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HoverCardProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  delay?: number;
}

export function HoverCard({
  children,
  content,
  className,
  side = "bottom",
  align = "center",
  delay = 300,
}: HoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsOpen(true), delay);
  }, [delay]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsOpen(false);
  }, []);

  const alignClass =
    align === "start"
      ? "left-0"
      : align === "end"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  const sideClass = side === "top" ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-72 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg animate-fade-in",
            sideClass,
            alignClass,
            className
          )}
          onMouseEnter={() => clearTimeout(timeoutRef.current)}
          onMouseLeave={handleMouseLeave}
        >
          {content}
        </div>
      )}
    </div>
  );
}
