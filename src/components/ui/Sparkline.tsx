import React, { useId } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  className?: string;
}

/**
 * Lightweight pure-SVG sparkline with a soft gradient fill.
 * No chart lib dependency so it stays fast inside KPI cards.
 */
export default function Sparkline({
  data,
  width = 120,
  height = 36,
  stroke = "#2563EB",
  fill = "#2563EB",
  strokeWidth = 2,
  className = "",
}: SparklineProps) {
  const gradientId = useId();
  const points = data.length > 0 ? data : [0, 0];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / Math.max(points.length - 1, 1);

  const coords = points.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - strokeWidth * 2) - strokeWidth;
    return [x, y] as const;
  });

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.28} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={coords[coords.length - 1][0]}
        cy={coords[coords.length - 1][1]}
        r={2.6}
        fill={stroke}
      />
    </svg>
  );
}
