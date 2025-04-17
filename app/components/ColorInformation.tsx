import { useState } from "react";
import type { ColorResponse } from "~/lib/types";
import {
  addHslToColor,
  getColorPsychology,
  isLightColor,
  getBaseColor,
} from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SlidingCounter } from "./SlidingCounter";

interface ColorInformationProps {
  color: ColorResponse;
  textColorClass: string;
}

export function ColorInformation({
  color,
  textColorClass,
}: ColorInformationProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const colorWithHsl = addHslToColor(color);
  const psychology = getColorPsychology(colorWithHsl);
  const isLight = isLightColor(color);
  const baseColor = getBaseColor(colorWithHsl.hsl!);

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: { opacity: 1, y: 0 },
  };

  // Animation for meaning tags
  const tagContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const tagVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
  };

  // Define tag styling based on theme and color
  let tagStyle = "";
  if (baseColor === "green" || baseColor === "yellow") {
    // Green and yellow need stronger contrast - use white background with dark text
    tagStyle = "bg-black bg-opacity-80 text-white";
  } else if (isLight) {
    tagStyle = "bg-gray-800 bg-opacity-90 text-white";
  } else {
    tagStyle = "bg-white bg-opacity-80 text-gray-900";
  }

  // Define styling for section titles to make them stand out
  const sectionTitleStyle =
    "uppercase tracking-wider font-semibold text-xs sm:text-sm border-b border-current border-opacity-20 pb-1 mb-3";

  return (
    <div className={`space-y-3 ${textColorClass}`}>
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className={`text-sm sm:text-base font-medium`}>
          Color Information
        </h2>
      </motion.div>

      {/* HSL Values */}
      <motion.div
        className="rounded-md border border-current border-opacity-20 overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <button
          onClick={() => toggleSection("hsl")}
          className={`flex justify-between items-center w-full p-2 text-left`}
          aria-expanded={expandedSection === "hsl"}
        >
          <span className="text-xs sm:text-sm font-medium">HSL Values</span>
          <span className="text-xs opacity-70">
            {expandedSection === "hsl" ? "Hide" : "Show"}
          </span>
        </button>

        <AnimatePresence>
          {expandedSection === "hsl" && (
            <motion.div
              className="p-3 border-t border-current border-opacity-20 space-y-2"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
            >
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 gap-1"
              >
                <div className="text-xs font-medium">HSL Value</div>
                <div className="text-xs font-mono">
                  <SlidingCounter value={colorWithHsl.hsl?.value || ""} />
                </div>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 gap-1"
              >
                <div className="text-xs font-medium">Hue</div>
                <div className="text-xs font-mono">{colorWithHsl.hsl?.h}°</div>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 gap-1"
              >
                <div className="text-xs font-medium">Saturation</div>
                <div className="text-xs font-mono">{colorWithHsl.hsl?.s}%</div>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 gap-1"
              >
                <div className="text-xs font-medium">Lightness</div>
                <div className="text-xs font-mono">{colorWithHsl.hsl?.l}%</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Color Psychology */}
      <motion.div
        className="rounded-md border border-current border-opacity-20 overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <button
          onClick={() => toggleSection("psychology")}
          className={`flex justify-between items-center w-full p-2 text-left`}
          aria-expanded={expandedSection === "psychology"}
        >
          <span className="text-xs sm:text-sm font-medium">
            Color Psychology
          </span>
          <span className="text-xs opacity-70">
            {expandedSection === "psychology" ? "Hide" : "Show"}
          </span>
        </button>

        <AnimatePresence>
          {expandedSection === "psychology" && (
            <motion.div
              className="p-3 border-t border-current border-opacity-20 space-y-6"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="text-center">
                <div className={`${sectionTitleStyle} text-center`}>Mood</div>
                <div className="text-center text-base sm:text-lg font-medium mt-2">
                  {psychology.mood}
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="text-center">
                <div className={`${sectionTitleStyle} text-center`}>
                  Meanings
                </div>
                <motion.div
                  className="flex flex-wrap justify-center gap-2 mt-2"
                  variants={tagContainerVariants}
                >
                  {psychology.meanings.map((meaning, i) => (
                    <motion.span
                      key={i}
                      className={`text-xs px-3 py-1 rounded-full ${tagStyle}`}
                      variants={tagVariants}
                    >
                      {meaning}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Common Uses */}
      <motion.div
        className="rounded-md border border-current border-opacity-20 overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <button
          onClick={() => toggleSection("uses")}
          className={`flex justify-between items-center w-full p-2 text-left`}
          aria-expanded={expandedSection === "uses"}
        >
          <span className="text-xs sm:text-sm font-medium">Common Uses</span>
          <span className="text-xs opacity-70">
            {expandedSection === "uses" ? "Hide" : "Show"}
          </span>
        </button>

        <AnimatePresence>
          {expandedSection === "uses" && (
            <motion.div
              className="p-3 border-t border-current border-opacity-20"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
            >
              <div className={`${sectionTitleStyle} text-center`}>
                Common Uses
              </div>
              <motion.ul
                variants={tagContainerVariants}
                className="mx-auto max-w-xs space-y-2 mt-2"
              >
                {psychology.commonUses.map((use, i) => (
                  <motion.li
                    key={i}
                    className="text-center text-sm list-none"
                    variants={tagVariants}
                  >
                    {use}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
