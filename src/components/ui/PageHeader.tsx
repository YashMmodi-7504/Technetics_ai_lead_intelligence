import React from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Right-aligned actions (buttons, toggles, badges). */
  actions?: React.ReactNode;
  /** Optional stat/segment row rendered below the title block. */
  children?: React.ReactNode;
}

/**
 * Unified page header used across every workspace for consistent visual
 * hierarchy. Gradient icon chip + title + subtitle + optional actions.
 */
export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card-premium p-5 flex flex-col gap-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-[#0F172A] tracking-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}
