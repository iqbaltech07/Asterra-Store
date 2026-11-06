"use client"

import { useEffect, useId, useState, type RefObject } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export interface AnimatedBeamProps {
  className?: string
  containerRef: RefObject<HTMLElement | null>
  fromRef: RefObject<HTMLElement | null>
  toRef: RefObject<HTMLElement | null>
  curvature?: number
  pathType?: "curve" | "circuit"
  reverse?: boolean
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  delay?: number
  duration?: number
  repeat?: number
  repeatDelay?: number
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  pathType = "circuit",
  reverse = false,
  duration = 5,
  delay = 0,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#ffaa40",
  gradientStopColor = "#9c40ff",
  repeat = Infinity,
  repeatDelay = 0,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}) => {
  const id = useId()
  const [pathD, setPathD] = useState("")
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })

  const gradientCoordinates = reverse
    ? {
        x1: ["90%", "-10%"],
        x2: ["100%", "0%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }
    : {
        x1: ["10%", "110%"],
        x2: ["0%", "100%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const rectA = fromRef.current.getBoundingClientRect()
        const rectB = toRef.current.getBoundingClientRect()

        // If either element is hidden (e.g. hidden on mobile via display: none), clear path
        if (
          rectA.width === 0 ||
          rectA.height === 0 ||
          rectB.width === 0 ||
          rectB.height === 0
        ) {
          setPathD("")
          return
        }

        const svgWidth = containerRect.width
        const svgHeight = containerRect.height
        setSvgDimensions({ width: svgWidth, height: svgHeight })

        const startX =
          rectA.left - containerRect.left + rectA.width / 2 + startXOffset
        const startY =
          rectA.top - containerRect.top + rectA.height / 2 + startYOffset
        const endX =
          rectB.left - containerRect.left + rectB.width / 2 + endXOffset
        const endY =
          rectB.top - containerRect.top + rectB.height / 2 + endYOffset

        let d = ""
        if (pathType === "circuit") {
          const isLeftToRight = startX < endX
          const cardEdgeX = isLeftToRight
            ? rectA.right - containerRect.left
            : rectA.left - containerRect.left
          const logoEdgeX = isLeftToRight
            ? rectB.left - containerRect.left
            : rectB.right - containerRect.left

          const dy = endY - startY
          const absDy = Math.abs(dy)

          if (isLeftToRight) {
            const gap = logoEdgeX - cardEdgeX
            let bend1 = cardEdgeX + gap * 0.35
            let bend2 = cardEdgeX + gap * 0.65
            if (gap > absDy && absDy > 0) {
              bend1 = cardEdgeX + (gap - absDy) * 0.4
              bend2 = bend1 + absDy
            }
            d = `M ${startX},${startY} L ${bend1},${startY} L ${bend2},${endY} L ${endX},${endY}`
          } else {
            const gap = cardEdgeX - logoEdgeX
            let bend1 = cardEdgeX - gap * 0.35
            let bend2 = cardEdgeX - gap * 0.65
            if (gap > absDy && absDy > 0) {
              bend1 = cardEdgeX - (gap - absDy) * 0.4
              bend2 = bend1 - absDy
            }
            d = `M ${startX},${startY} L ${bend1},${startY} L ${bend2},${endY} L ${endX},${endY}`
          }
        } else {
          const controlY = startY - curvature
          d = `M ${startX},${startY} Q ${
            (startX + endX) / 2
          },${controlY} ${endX},${endY}`
        }

        setPathD(d)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      updatePath()
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    updatePath()

    window.addEventListener("resize", updatePath)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updatePath)
    }
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    pathType,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ])

  if (!pathD) return null

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute top-0 left-0 transform-gpu stroke-2",
        className
      )}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeOpacity="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits={"userSpaceOnUse"}
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat,
            repeatDelay,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0"></stop>
          <stop stopColor={gradientStartColor}></stop>
          <stop offset="32.5%" stopColor={gradientStopColor}></stop>
          <stop
            offset="100%"
            stopColor={gradientStopColor}
            stopOpacity="0"
          ></stop>
        </motion.linearGradient>
      </defs>
    </svg>
  )
}
