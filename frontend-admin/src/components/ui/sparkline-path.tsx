'use client';

import React, { useRef, useState, useEffect } from 'react';
import { MOTION_DURATION, MOTION_EASING, isReducedMotion } from '@/lib/motion';

export interface SparklinePathProps {
  path: string;
  arrowPath?: string;
  endDot?: { cx: number; cy: number };
  color: string;
  gradientId: string;
  delay?: number;
  width?: number;
  height?: number;
  className?: string;
}

export function SparklinePath({
  path,
  arrowPath,
  endDot = { cx: 27, cy: 2 },
  color,
  gradientId,
  delay = 0,
  width = 28,
  height = 16,
  className = '',
}: SparklinePathProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [totalLength, setTotalLength] = useState<number>(100);
  const [isDrawn, setIsDrawn] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    if (isReducedMotion()) {
      setIsDrawn(true);
      return;
    }

    if (pathRef.current) {
      try {
        const len = pathRef.current.getTotalLength();
        if (len > 0) {
          setTotalLength(Math.ceil(len));
        }
      } catch {
        setTotalLength(100);
      }
    }

    setIsDrawn(false);
    // Trigger drawing after a brief frame
    const timer = setTimeout(() => {
      setIsDrawn(true);
    }, 40);

    return () => clearTimeout(timer);
  }, [path]);

  const reduced = isReducedMotion();

  // Create closed area under curve for the gradient fill
  const areaPath = `${path} L${width - 1} ${height} L1 ${height} Z`;

  return (
    <svg
      className={`overflow-visible select-none ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Subtle area gradient below curve */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
        style={{
          opacity: reduced || (isDrawn && isMounted) ? 1 : 0,
          transition: reduced
            ? 'none'
            : `opacity 400ms ease ${delay + 700}ms`,
        }}
      />

      {/* Main Sparkline Stroke */}
      <path
        ref={pathRef}
        d={path}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: totalLength,
          strokeDashoffset: reduced || isDrawn ? 0 : totalLength,
          transition: reduced
            ? 'none'
            : `stroke-dashoffset ${MOTION_DURATION.sparklineDraw}ms ${MOTION_EASING.editorial}`,
          transitionDelay: reduced ? '0ms' : `${delay}ms`,
        }}
      />

      {/* Arrow Head (if provided) */}
      {arrowPath && (
        <path
          d={arrowPath}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: reduced || isDrawn ? 1 : 0,
            transform: reduced || isDrawn ? 'scale(1)' : 'scale(0.5)',
            transformOrigin: `${endDot.cx}px ${endDot.cy}px`,
            transition: reduced
              ? 'none'
              : `opacity 250ms ease ${delay + 750}ms, transform 250ms ${MOTION_EASING.springPop} ${delay + 750}ms`,
          }}
        />
      )}

      {/* End Dot with Spring Scale-Pop */}
      <circle
        cx={endDot.cx}
        cy={endDot.cy}
        r="2"
        fill={color}
        style={{
          opacity: reduced || isDrawn ? 1 : 0,
          transform: reduced || isDrawn ? 'scale(1)' : 'scale(0)',
          transformOrigin: `${endDot.cx}px ${endDot.cy}px`,
          transition: reduced
            ? 'none'
            : `opacity 250ms ease ${delay + 850}ms, transform 300ms ${MOTION_EASING.springPop} ${delay + 850}ms`,
        }}
      />
    </svg>
  );
}
