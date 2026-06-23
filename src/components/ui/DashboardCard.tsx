import React from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Disable inner padding (e.g. for tables that manage their own). */
  flush?: boolean;
  /** Entrance stagger index. */
  index?: number;
  animate?: boolean;
}

/**
 * Standard surface for dashboard panels — replaces the repeated
 * `card-premium p-5 + header` markup scattered across pages.
 */
export default function DashboardCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = "",
  flush = false,
  index = 0,
  animate = true,
}: DashboardCardProps) {
  const inner = (
    <div className={`card-premium overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-sm font-bold text-[#0F172A] truncate">{title}</h3>}
              {subtitle && <p className="text-[11px] text-[#64748B] truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </div>
  );

  if (!animate) return inner;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      {inner}
    </motion.div>
  );
}
