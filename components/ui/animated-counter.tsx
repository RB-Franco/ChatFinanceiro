"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useSpring, useTransform } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  formatter: (value: number) => string
  className?: string
}

export function AnimatedCounter({ value, formatter, className = "" }: AnimatedCounterProps) {
  const [prevValue, setPrevValue] = useState(value)
  const [isIncreasing, setIsIncreasing] = useState(false)
  const [isDecreasing, setIsDecreasing] = useState(false)
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (value > prevValueRef.current) {
      setIsIncreasing(true)
      setIsDecreasing(false)
    } else if (value < prevValueRef.current) {
      setIsIncreasing(false)
      setIsDecreasing(true)
    }

    setPrevValue(prevValueRef.current)
    prevValueRef.current = value

    const timer = setTimeout(() => {
      setIsIncreasing(false)
      setIsDecreasing(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [value])

  const springValue = useSpring(prevValue, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  })

  useEffect(() => {
    springValue.set(value)
  }, [springValue, value])

  const displayValue = useTransform(springValue, (latest) => formatter(latest))

  return (
    <div className={`relative w-full ${className}`}>
      <motion.span className="block truncate">{displayValue}</motion.span>
      {isIncreasing && (
        <motion.span
          className="absolute -right-4 text-green-500 text-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          ↑
        </motion.span>
      )}
      {isDecreasing && (
        <motion.span
          className="absolute -right-4 text-red-500 text-xs"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          ↓
        </motion.span>
      )}
    </div>
  )
}
