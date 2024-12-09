import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlidingCounterProps {
  value: string;
  className?: string;
}

export function SlidingCounter({ value, className = "" }: SlidingCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="flex">
        {displayValue.split("").map((char, index) => (
          <div
            key={index}
            className="relative overflow-hidden"
            style={{ minWidth: char === " " ? "0.25em" : "auto" }}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={char + index}
                initial={{ y: 20, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  transition: {
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: [0.34, 1.56, 0.64, 1],
                  },
                }}
                exit={{
                  y: -20,
                  opacity: 0,
                  transition: {
                    duration: 0.3,
                    delay: index * 0.03,
                  },
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}