import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { SlidingCounter } from "./SlidingCounter";
import { loadRighteousFont, isLightColor, copyToClipboard } from "~/lib/utils";
import { ColorHistoryDrawer } from "./ColorHistoryDrawer";
import type { ColorResponse } from "~/lib/types";

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
      return data;
    } catch (error) {
      console.error("Error fetching color:", error);
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

    setColor(nextColor);
    setNextBgColor(nextColor.hex.value);

    const newNextColor = await fetchRandomColor();
    setNextColor(newNextColor);

    setColorHistory((prev) => {
      const newHistory = [nextColor, ...prev];
      return newHistory.slice(0, 20);
    });
  }, [nextColor, fetchRandomColor, isPlaying]);

  useEffect(() => {
    const initializeColors = async () => {
      const initialColor = await fetchRandomColor();
      const initialNextColor = await fetchRandomColor();
      setColor(initialColor);
      setNextColor(initialNextColor);
      setNextBgColor(initialColor.hex.value);
      setLoading(false);
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
      const docEl = document.documentElement;

      // Using type assertions to avoid TypeScript errors for vendor prefixes
      const requestFullscreen =
        docEl.requestFullscreen ||
        (docEl as any).mozRequestFullScreen ||
        (docEl as any).webkitRequestFullscreen ||
        (docEl as any).msRequestFullscreen;

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

    try {
      await loadRighteousFont();
      await document.fonts.ready;

      const canvas = document.createElement("canvas");
      // Use smaller dimensions for mobile devices
      const isMobile = window.innerWidth < 768;
      canvas.width = isMobile ? 1080 : 1920;
      canvas.height = isMobile ? 1080 : 1080;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get canvas context");
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
      } catch (err) {
        console.error("Error creating screenshot:", err);
        // Fallback for browsers that restrict toDataURL
        const blob = await new Promise<Blob | null>((resolve) => {
          try {
            canvas.toBlob(resolve, "image/png");
          } catch (e) {
            console.error("Canvas toBlob error:", e);
            resolve(null);
          }
        });

        if (blob) {
          const url = URL.createObjectURL(blob);
          const win = window.open();
          if (win) {
            win.document.write(`<img src="${url}" alt="Color Screenshot"/>`);
            // Clean up
            win.onload = () => URL.revokeObjectURL(url);
          } else {
            URL.revokeObjectURL(url);
            alert("Please allow pop-ups to view your screenshot");
          }
        }
      }
    } catch (error) {
      console.error("Error taking screenshot:", error);
      setError("Failed to create screenshot. Try again later.");
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
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

  const getAccessibleBackground = (color: ColorResponse) => {
    if (!accessibilityMode) return color.hex.value;

    // For color vision deficiencies, use increased contrast
    const { r, g, b } = color.rgb;

    // Calculate perceptual luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Add a pattern or adjust the color based on the luminance
    if (luminance > 0.5) {
      // For lighter colors, darken them slightly for better contrast
      return `linear-gradient(45deg, ${color.hex.value} 25%, rgba(0,0,0,0.1) 25%, rgba(0,0,0,0.1) 50%, ${color.hex.value} 50%, ${color.hex.value} 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1))`;
    } else {
      // For darker colors, lighten them slightly for better contrast
      return `linear-gradient(45deg, ${color.hex.value} 25%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.2) 50%, ${color.hex.value} 50%, ${color.hex.value} 75%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.2))`;
    }
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
    ? "bg-gray-900 text-white hover:bg-gray-700"
    : "bg-white text-gray-900 hover:bg-gray-200";

  return (
    <main
      className={`min-h-screen flex items-center justify-center p-4 relative`}
      style={{
        background:
          accessibilityMode && color
            ? getAccessibleBackground(color)
            : nextBgColor,
        transition: "background-color 1s ease-in-out",
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
