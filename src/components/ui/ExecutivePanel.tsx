import React from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface ExecutivePanelProps {
  eyebrow?: string;
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  index?: number;
}

/**
 * Higher-emphasis section panel for executive surfaces — gradient icon chip,
 * eyebrow label, title, and optional action. Used for grouped insight blocks.
 */
export default function ExecutivePanel({
  eyebrow,
  title,
  icon: Icon,
  action,
  children,
  className = "",
  index = 0,
}: ExecutivePanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`card-premium p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-sm shadow-blue-500/25 shrink-0">
              <Icon className="w-4 h-4" />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{eyebrow}</p>
            )}
            <h3 className="text-sm font-bold text-[#0F172A] truncate">{title}</h3>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </motion.section>
  );
}
