import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Loader2,
  Pause,
  Play,
  Maximize,
  Minimize,
  Camera,
  Eye,
  EyeOff,
  Info,
  Palette,
  PenTool,
  X,
} from "lucide-react";
import { SlidingCounter } from "./SlidingCounter";
import { ColorInformation } from "./ColorInformation";
import {
  loadRighteousFont,
  isLightColor,
  copyToClipboard,
  addHslToColor,
  isValidHexColor,
} from "~/lib/utils";
import { ColorHistoryDrawer } from "./ColorHistoryDrawer";
import type { ColorResponse } from "~/lib/types";

// Define interfaces for vendor prefixed fullscreen methods
interface VendorFullscreenElement extends HTMLElement {
  mozRequestFullScreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export default function ColorScreensaver() {
  const [color, setColor] = useState<ColorResponse | null>(null);
  const [nextColor, setNextColor] = useState<ColorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [nextBgColor, setNextBgColor] = useState<string>("white");
  const [colorHistory, setColorHistory] = useState<ColorResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [showColorInfo, setShowColorInfo] = useState(false);
  const [patternType, setPatternType] = useState<string>("stripes");
  const [showPatternOptions, setShowPatternOptions] = useState(false);
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  const [customHexInput, setCustomHexInput] = useState("#FFFFFF");
  const [customRgbInput, setCustomRgbInput] = useState({
    r: 255,
    g: 255,
    b: 255,
  });
  const [isCustomHexValid, setIsCustomHexValid] = useState(true);
  const hexInputRef = useRef<HTMLInputElement>(null);

  const clearError = () => {
    if (error) {
      setTimeout(() => setError(null), 3000);
    }
  };

  const fetchRandomColor = useCallback(async () => {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);

    try {
      const response = await fetch(
        `https://www.thecolorapi.com/id?rgb=${r},${g},${b}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setError(null);
      return data;
    } catch (err) {
      const error = err as Error;
      console.error("Error fetching color:", error);
      setError(`Failed to fetch color: ${error.message}. Using fallback.`);
      clearError();
      // Return a fallback color to prevent app from crashing
      return {
        name: { value: "Fallback Color" },
        hex: {
          value: `#${r.toString(16).padStart(2, "0")}${g
            .toString(16)
            .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
          clean: `${r.toString(16).padStart(2, "0")}${g
            .toString(16)
            .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
        },
        rgb: { value: `rgb(${r}, ${g}, ${b})`, r, g, b },
      };
    }
  }, []);

  const changeColor = useCallback(async () => {
    if (!nextColor || !isPlaying) return;

    // Add HSL values to the color before setting it
    const enhancedColor = addHslToColor(nextColor);
    setColor(enhancedColor);
    setNextBgColor(enhancedColor.hex.value);

    const newNextColor = await fetchRandomColor();
    setNextColor(newNextColor);

    setColorHistory((prev) => {
      const newHistory = [enhancedColor, ...prev];
      return newHistory.slice(0, 20);
    });
  }, [nextColor, fetchRandomColor, isPlaying]);

  useEffect(() => {
    const initializeColors = async () => {
      try {
        setLoading(true);
        setError(null);
        const initialColor = await fetchRandomColor();
        const initialNextColor = await fetchRandomColor();

        if (!initialColor || !initialNextColor) {
          // Check if fetchRandomColor returned fallback due to error
          // Error state is already set inside fetchRandomColor
          setLoading(false);
          return; // Prevent further execution if colors couldn't be fetched
        }

        // Add HSL values to the initial color
        const enhancedInitialColor = addHslToColor(initialColor);
        setColor(enhancedInitialColor);
        setNextColor(initialNextColor);
        setNextBgColor(enhancedInitialColor.hex.value);
        setLoading(false);
      } catch (err) {
        const error = err as Error;
        console.error("Error initializing colors:", error);
        setError(`Initialization failed: ${error.message}`);
        setLoading(false);
        clearError();
      }
    };

    initializeColors();
  }, [fetchRandomColor]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(changeColor, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [changeColor, isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const docEl = document.documentElement as VendorFullscreenElement;

      const requestFullscreen =
        docEl.requestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.webkitRequestFullscreen ||
        docEl.msRequestFullscreen;

      if (requestFullscreen) {
        requestFullscreen.call(docEl).catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`
          );
        });
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const takeScreenshot = async () => {
    if (!color) return;
    setError(null);

    try {
      try {
        await loadRighteousFont();
        await document.fonts.ready;
      } catch (fontError) {
        console.error("Error loading font:", fontError);
        setError("Failed to load font for screenshot.");
        clearError();
        // Optionally continue without the font, or return
      }

      const canvas = document.createElement("canvas");
      // Use smaller dimensions for mobile devices
      const isMobile = window.innerWidth < 768;
      canvas.width = isMobile ? 1080 : 1920;
      canvas.height = isMobile ? 1080 : 1080;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get canvas context");
        setError("Failed to create screenshot: Cannot get canvas context.");
        clearError();
        return;
      }

      // Draw background
      ctx.fillStyle = color.hex.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Configure text
      ctx.fillStyle = isLightColor(color) ? "#000000" : "#FFFFFF";
      ctx.font = isMobile
        ? "36px Righteous, sans-serif"
        : "48px Righteous, sans-serif";
      ctx.textAlign = "center";

      // Draw text
      const centerY = canvas.height / 2;
      ctx.fillText(color.name.value, canvas.width / 2, centerY - 50);
      ctx.fillText(`HEX: ${color.hex.value}`, canvas.width / 2, centerY + 50);
      ctx.fillText(`RGB: ${color.rgb.value}`, canvas.width / 2, centerY + 150);

      // Universal approach for image download
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `color-${color.hex.clean}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      } catch (downloadError) {
        console.error("Error creating screenshot data URL:", downloadError);
        setError("Failed to generate screenshot image (Data URL).");
        clearError();

        // Fallback for browsers that restrict toDataURL
        try {
          const blob = await new Promise<Blob | null>((resolve, reject) => {
            // Wrap canvas.toBlob in try-catch inside the promise
            try {
              canvas.toBlob((blobResult) => {
                if (blobResult) {
                  resolve(blobResult);
                } else {
                  // Reject if toBlob returns null without throwing an error
                  reject(new Error("Canvas toBlob returned null."));
                }
              }, "image/png");
            } catch (e) {
              console.error("Canvas toBlob error:", e);
              reject(e); // Reject the promise if toBlob throws
            }
          });

          if (blob) {
            const url = URL.createObjectURL(blob);
            const win = window.open();
            if (win) {
              win.document.write(`<img src="${url}" alt="Color Screenshot"/>`);
              win.onload = () => URL.revokeObjectURL(url); // Clean up after image loads in popup
            } else {
              URL.revokeObjectURL(url); // Clean up if popup fails
              setError("Failed to open screenshot: Please allow pop-ups.");
              clearError();
            }
          } else {
            // This case might be hit if resolve(null) was called or promise rejected
            setError("Failed to generate screenshot image (Blob).");
            clearError();
          }
        } catch (blobError) {
          console.error("Error creating screenshot blob:", blobError);
          setError("Failed to generate screenshot image (Blob fallback).");
          clearError();
        }
      }
    } catch (generalError) {
      console.error("Error taking screenshot:", generalError);
      setError("An unexpected error occurred while taking the screenshot.");
      clearError();
    }
  };

  const handleColorSelect = (selectedColor: ColorResponse) => {
    setColor(selectedColor);
    setNextBgColor(selectedColor.hex.value);
    setIsPlaying(false);
  };

  const toggleAccessibilityMode = () => {
    setAccessibilityMode((prev) => !prev);
  };

  const togglePatternOptions = () => {
    setShowPatternOptions((prev) => !prev);
  };

  const selectPattern = (pattern: string) => {
    setPatternType(pattern);
    setShowPatternOptions(false);
  };

  const getAccessibleBackground = (color: ColorResponse) => {
    if (!accessibilityMode) return color.hex.value;

    // For color vision deficiencies, use increased contrast
    const { r, g, b } = color.rgb;

    // Calculate perceptual luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const isLight = luminance > 0.5;

    // Base contrast values for light and dark backgrounds
    const lightContrast = isLight ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.4)";
    const darkContrast = isLight ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.5)";

    // Return different patterns based on the selected pattern type
    switch (patternType) {
      case "stripes":
        return `linear-gradient(45deg, ${color.hex.value} 25%, ${lightContrast} 25%, ${lightContrast} 50%, ${color.hex.value} 50%, ${color.hex.value} 75%, ${lightContrast} 75%, ${lightContrast})`;
      case "dots":
        return `radial-gradient(circle, ${color.hex.value} 25%, ${lightContrast} 25%)`;
      case "circles":
        return `repeating-radial-gradient(circle at 0 0, ${color.hex.value}, ${color.hex.value} 10px, ${lightContrast} 10px, ${lightContrast} 20px)`;
      case "zigzag":
        return `linear-gradient(135deg, ${lightContrast} 25%, transparent 25%) 0 0, linear-gradient(225deg, ${lightContrast} 25%, transparent 25%) 0 0, linear-gradient(315deg, ${lightContrast} 25%, transparent 25%) 0 0, linear-gradient(45deg, ${lightContrast} 25%, ${color.hex.value} 25%) 0 0 ${color.hex.value}`;
      case "waves":
        return `linear-gradient(to right, ${color.hex.value}, ${lightContrast}, ${color.hex.value}, ${lightContrast}, ${color.hex.value})`;
      case "checkerboard":
        return `repeating-conic-gradient(${color.hex.value} 0% 25%, ${lightContrast} 0% 50%) 50% / 20px 20px`;
      case "triangles":
        return `linear-gradient(60deg, ${color.hex.value} 25%, transparent 25.5%, transparent 75%, ${color.hex.value} 75%, ${color.hex.value}), linear-gradient(120deg, ${color.hex.value} 25%, ${lightContrast} 25.5%, ${lightContrast} 75%, ${color.hex.value} 75%, ${color.hex.value})`;
      case "hexagons":
        return `linear-gradient(30deg, ${lightContrast} 12%, transparent 12.5%, transparent 87%, ${lightContrast} 87.5%, ${lightContrast}), linear-gradient(150deg, ${lightContrast} 12%, transparent 12.5%, transparent 87%, ${lightContrast} 87.5%, ${lightContrast}), linear-gradient(30deg, ${lightContrast} 12%, transparent 12.5%, transparent 87%, ${lightContrast} 87.5%, ${lightContrast}), linear-gradient(150deg, ${lightContrast} 12%, transparent 12.5%, transparent 87%, ${lightContrast} 87.5%, ${lightContrast}), linear-gradient(60deg, ${darkContrast} 25%, transparent 25.5%, transparent 75%, ${darkContrast} 75%, ${darkContrast}), linear-gradient(60deg, ${darkContrast} 25%, transparent 25.5%, transparent 75%, ${darkContrast} 75%, ${darkContrast}) ${color.hex.value}`;
      default:
        return `linear-gradient(45deg, ${color.hex.value} 25%, ${lightContrast} 25%, ${lightContrast} 50%, ${color.hex.value} 50%, ${color.hex.value} 75%, ${lightContrast} 75%, ${lightContrast})`;
    }
  };

  const toggleColorInfo = () => {
    setShowColorInfo((prev) => !prev);
  };

  const toggleCustomColorInput = () => {
    if (!showCustomColorInput && color) {
      // Initialize inputs with current color when opening
      setCustomHexInput(color.hex.value);
      setCustomRgbInput({
        r: color.rgb.r,
        g: color.rgb.g,
        b: color.rgb.b,
      });
    }
    setShowCustomColorInput((prev) => !prev);
    setIsCustomHexValid(true);

    // Focus the hex input when opening
    if (!showCustomColorInput) {
      setTimeout(() => {
        if (hexInputRef.current) {
          hexInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCustomHexInput(value);

    const isValid = isValidHexColor(value);
    setIsCustomHexValid(isValid);

    // Convert valid hex to RGB
    if (isValid) {
      const r = parseInt(value.slice(1, 3), 16);
      const g = parseInt(value.slice(3, 5), 16);
      const b = parseInt(value.slice(5, 7), 16);
      setCustomRgbInput({ r, g, b });
      setError(null);
    } else {
      setError("Invalid HEX format. Use #RRGGBB.");
    }
  };

  const handleRgbInputChange = (component: "r" | "g" | "b", value: number) => {
    // Ensure value is within bounds
    const clampedValue = Math.max(0, Math.min(255, value));
    const newRgb = { ...customRgbInput, [component]: clampedValue };
    setCustomRgbInput(newRgb);

    // Convert RGB to hex
    const hexValue = `#${newRgb.r.toString(16).padStart(2, "0")}${newRgb.g
      .toString(16)
      .padStart(2, "0")}${newRgb.b.toString(16).padStart(2, "0")}`;
    const upperHex = hexValue.toUpperCase();
    setCustomHexInput(upperHex);
    setIsCustomHexValid(true);
    setError(null);
  };

  const applyCustomColor = async () => {
    setError(null);

    // Verify hex is valid using the state
    if (!isCustomHexValid || !isValidHexColor(customHexInput)) {
      setError("Invalid hex color format. Please use #RRGGBB.");
      clearError();
      return;
    }

    try {
      // Fetch color information from API
      const response = await fetch(
        `https://www.thecolorapi.com/id?hex=${customHexInput.replace("#", "")}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Add HSL values to the color
      const enhancedColor = addHslToColor(data);

      // Set as current color
      setColor(enhancedColor);
      setNextBgColor(enhancedColor.hex.value);

      // Add to color history
      setColorHistory((prev) => {
        const newHistory = [enhancedColor, ...prev];
        return newHistory.slice(0, 20);
      });

      // Close the color input panel
      setShowCustomColorInput(false);

      // Pause automatic color changes
      setIsPlaying(false);
      setError(null);
    } catch (err) {
      const error = err as Error;
      console.error("Error applying custom color:", error);
      if (error.message.includes("API error")) {
        setError(`Failed to get color details: ${error.message}.`);
      } else {
        setError(`Failed to apply custom color: ${error.message}`);
      }
      clearError();
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCustomHexInput(value);
    setIsCustomHexValid(true);
    setError(null);

    // Convert hex to RGB
    const r = parseInt(value.slice(1, 3), 16);
    const g = parseInt(value.slice(3, 5), 16);
    const b = parseInt(value.slice(5, 7), 16);
    setCustomRgbInput({ r, g, b });
  };

  if (loading || !color) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isLight = isLightColor(color);
  const textColorClass = isLight ? "text-gray-900" : "text-white";
  const buttonColorClass = isLight
    ? "bg-gray-900/80 text-white hover:bg-gray-900/90"
    : "bg-white/80 text-gray-900 hover:bg-white/90";
  const inputBgClass = isLight
    ? "border-gray-300 bg-white/80 text-gray-900 focus:bg-white"
    : "border-gray-600 bg-black/50 text-white focus:bg-black/60";
  const invalidInputClass = "!border-red-500 ring-1 ring-red-500";
  const patterns = [
    { id: "stripes", name: "Stripes" },
    { id: "dots", name: "Dots" },
    { id: "circles", name: "Circles" },
    { id: "zigzag", name: "Zigzag" },
    { id: "waves", name: "Waves" },
    { id: "checkerboard", name: "Checkerboard" },
    { id: "triangles", name: "Triangles" },
    { id: "hexagons", name: "Hexagons" },
  ];

  return (
    <main
      className={`min-h-screen flex items-center justify-center p-4 relative`}
      style={{
        background:
          accessibilityMode && color
            ? getAccessibleBackground(color)
            : nextBgColor,
        transition: "background-color 1s ease-in-out",
        backgroundSize: "20px 20px",
      }}
    >
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center">
          {error}
        </div>
      )}
      <Card
        className={`w-full max-w-md mx-4 p-4 sm:p-6 backdrop-blur-xl bg-opacity-20 border border-opacity-30 shadow-lg relative overflow-hidden`}
        style={{
          backgroundColor: `${nextBgColor}33`,
          borderColor: nextBgColor,
          transition: "all 1s ease-in-out",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: `0 8px 32px 0 ${
            isLight ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)"
          }`,
        }}
      >
        <div className="space-y-3 sm:space-y-4 text-center">
          <h1
            className={`text-2xl sm:text-4xl font-bold tracking-tight ${textColorClass}`}
          >
            <SlidingCounter value={color.name.value} className="inline-block" />
          </h1>
          <div className={`grid grid-cols-2 gap-2 sm:gap-4 ${textColorClass}`}>
            <div
              onClick={() => copyToClipboard(color.hex.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  copyToClipboard(color.hex.value);
                }
              }}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              role="button"
              tabIndex={0}
              aria-label="Copy HEX value"
            >
              <p className="text-xs sm:text-sm font-medium">HEX</p>
              <p className="text-sm sm:text-base font-mono group flex items-center justify-center gap-1">
                <SlidingCounter
                  value={color.hex.value}
                  className="inline-block"
                />
              </p>
            </div>
            <div
              onClick={() => copyToClipboard(color.rgb.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  copyToClipboard(color.rgb.value);
                }
              }}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              role="button"
              tabIndex={0}
              aria-label="Copy RGB value"
            >
              <p className="text-xs sm:text-sm font-medium">RGB</p>
              <p className="text-sm sm:text-base font-mono group flex items-center justify-center gap-1">
                <SlidingCounter
                  value={color.rgb.value}
                  className="inline-block"
                />
              </p>
            </div>
          </div>

          {/* Custom Color Input */}
          {showCustomColorInput && (
            <div className="mt-4 border-t border-current border-opacity-20 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-sm font-medium ${textColorClass}`}>
                  Custom Color
                </h3>
                <button
                  onClick={toggleCustomColorInput}
                  className={`p-1 rounded-full ${buttonColorClass} opacity-80 hover:opacity-100`}
                  aria-label="Close custom color panel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Color Picker */}
                <div className="flex justify-center mb-2">
                  <input
                    type="color"
                    value={customHexInput}
                    onChange={handleColorPickerChange}
                    className="w-12 h-12 rounded cursor-pointer border-0"
                    aria-label="Color picker"
                  />
                </div>

                {/* Hex Input */}
                <div className="flex items-center">
                  <label
                    htmlFor="hex-input"
                    className={`text-xs font-medium ${textColorClass} w-12`}
                  >
                    HEX:
                  </label>
                  <input
                    id="hex-input"
                    ref={hexInputRef}
                    type="text"
                    value={customHexInput}
                    onChange={handleHexInputChange}
                    placeholder="#RRGGBB"
                    className={`ml-2 flex-1 px-2 py-1 text-sm rounded border ${inputBgClass} ${
                      !isCustomHexValid ? invalidInputClass : ""
                    }`}
                    maxLength={7}
                    aria-invalid={!isCustomHexValid}
                    aria-describedby={
                      !isCustomHexValid ? "hex-error" : undefined
                    }
                  />
                </div>
                {!isCustomHexValid && (
                  <p
                    id="hex-error"
                    className="text-xs text-red-500 text-right -mt-1"
                  >
                    Invalid format
                  </p>
                )}

                {/* RGB Sliders */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label
                      htmlFor="r-slider"
                      className={`text-xs font-medium ${textColorClass} w-12`}
                    >
                      R:
                    </label>
                    <input
                      id="r-slider"
                      type="range"
                      min="0"
                      max="255"
                      value={customRgbInput.r}
                      onChange={(e) =>
                        handleRgbInputChange("r", parseInt(e.target.value, 10))
                      }
                      className={`flex-1 h-2 accent-red-600 cursor-pointer ${buttonColorClass}`}
                    />
                    <span
                      className={`text-xs font-mono ml-2 w-8 text-right ${textColorClass}`}
                    >
                      {customRgbInput.r}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <label
                      htmlFor="g-slider"
                      className={`text-xs font-medium ${textColorClass} w-12`}
                    >
                      G:
                    </label>
                    <input
                      id="g-slider"
                      type="range"
                      min="0"
                      max="255"
                      value={customRgbInput.g}
                      onChange={(e) =>
                        handleRgbInputChange("g", parseInt(e.target.value, 10))
                      }
                      className={`flex-1 h-2 accent-green-600 cursor-pointer ${buttonColorClass}`}
                    />
                    <span
                      className={`text-xs font-mono ml-2 w-8 text-right ${textColorClass}`}
                    >
                      {customRgbInput.g}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <label
                      htmlFor="b-slider"
                      className={`text-xs font-medium ${textColorClass} w-12`}
                    >
                      B:
                    </label>
                    <input
                      id="b-slider"
                      type="range"
                      min="0"
                      max="255"
                      value={customRgbInput.b}
                      onChange={(e) =>
                        handleRgbInputChange("b", parseInt(e.target.value, 10))
                      }
                      className={`flex-1 h-2 accent-blue-600 cursor-pointer ${buttonColorClass}`}
                    />
                    <span
                      className={`text-xs font-mono ml-2 w-8 text-right ${textColorClass}`}
                    >
                      {customRgbInput.b}
                    </span>
                  </div>
                </div>

                {/* Apply Button */}
                <Button
                  onClick={applyCustomColor}
                  className={`${buttonColorClass} w-full mt-4 text-xs py-1 h-8`}
                  disabled={!isCustomHexValid}
                >
                  Apply Color
                </Button>
              </div>
            </div>
          )}

          {/* Color Information Section */}
          {showColorInfo && (
            <div className="mt-4 border-t border-current border-opacity-20 pt-4">
              <ColorInformation color={color} textColorClass={textColorClass} />
            </div>
          )}

          {/* Pattern Options Section */}
          {showPatternOptions && accessibilityMode && (
            <div className="mt-4 border-t border-current border-opacity-20 pt-4">
              <h3 className={`text-sm font-medium mb-2 ${textColorClass}`}>
                Pattern Options
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {patterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => selectPattern(pattern.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      patternType === pattern.id
                        ? "ring-2 ring-offset-2 ring-current"
                        : ""
                    } ${buttonColorClass}`}
                  >
                    {pattern.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={togglePlayPause}
              className={`${buttonColorClass} text-xs sm:text-sm h-8 sm:h-9`}
              aria-label={isPlaying ? "Pause screensaver" : "Play screensaver"}
            >
              {isPlaying ? (
                <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Play className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button
              onClick={toggleFullscreen}
              className={`${buttonColorClass} text-xs sm:text-sm h-8 sm:h-9 hidden sm:inline-flex`}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              {isFullscreen ? "Exit" : "Fullscreen"}
            </Button>
            <Button
              onClick={takeScreenshot}
              className={`${buttonColorClass} text-xs sm:text-sm h-8 sm:h-9`}
              aria-label="Take screenshot"
            >
              <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
              Screenshot
            </Button>
            <Button
              onClick={toggleAccessibilityMode}
              className={`${buttonColorClass} text-xs sm:text-sm h-8 sm:h-9`}
              aria-label={
                accessibilityMode
                  ? "Disable accessibility mode"
                  : "Enable accessibility mode"
              }
              title={
                accessibilityMode
                  ? "Disable accessibility mode"
                  : "Enable accessibility mode for color vision deficiencies"
              }
            >
              {accessibilityMode ? (
                <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              ) : (
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              )}
              {accessibilityMode ? "Standard" : "A11y"}
            </Button>
            {accessibilityMode && (
              <Button
                onClick={togglePatternOptions}
                className={`${buttonColorClass} text-xs sm:text-sm h-8 sm:h-9`}
                aria-label={
                  showPatternOptions
                    ? "Hide pattern options"
                    : "Show pattern options"
                }
              >
                <Palette className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {showPatternOptions ? "Hide Patterns" : "Patterns"}
              </Button>
            )}
            <Button
              onClick={toggleCustomColorInput}
              className={`${buttonColorClass} text-xs sm:text-sm h-8 sm:h-9`}
              aria-label="Custom color input"
            >
              <PenTool className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Custom
            </Button>
            <Button
              onClick={toggleColorInfo}
              className={`${buttonColorClass} text-xs sm:text-sm h-8 sm:h-9`}
              aria-label={
                showColorInfo
                  ? "Hide color information"
                  : "Show color information"
              }
            >
              <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {showColorInfo ? "Hide Info" : "Info"}
            </Button>
            <ColorHistoryDrawer
              colorHistory={colorHistory}
              onColorSelect={handleColorSelect}
              buttonColorClass={buttonColorClass}
            />
          </div>
        </div>
      </Card>
    </main>
  );
}
