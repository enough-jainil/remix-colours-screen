import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlidingCounterProps {
  value: string;
  className?: string;
}

export function SlidingCounter({ value, className = "" }: SlidingCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);

  // Use useMemo to avoid recreating the array on each render
  const characters = useMemo(() => displayValue.split(""), [displayValue]);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="flex">
        {characters.map((char, index) => {
          // Skip animation for spaces and special characters to reduce animations
          const isSimpleChar =
            char === " " || char === "," || char === "(" || char === ")";

          return (
            <div
              key={index}
              className="relative overflow-hidden"
              style={{ minWidth: char === " " ? "0.25em" : "auto" }}
            >
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={char + index}
                  initial={
                    isSimpleChar ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }
                  }
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: {
                      duration: isSimpleChar ? 0.1 : 0.4,
                      // Stagger the delay based on index but cap it to prevent too many delayed animations
                      delay: Math.min(index * 0.02, 0.3),
                      ease: [0.34, 1.56, 0.64, 1],
                    },
                  }}
                  exit={{
                    y: -20,
                    opacity: 0,
                    transition: {
                      duration: isSimpleChar ? 0.1 : 0.3,
                      delay: Math.min(index * 0.01, 0.2),
                    },
                  }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
