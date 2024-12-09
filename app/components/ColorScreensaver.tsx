import { useEffect, useState, useCallback } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loader2, Pause, Play, Maximize, Minimize, Camera } from "lucide-react";
import { SlidingCounter } from "./SlidingCounter";
// import { ProgressBar } from "./ProgressBar";
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

  const fetchRandomColor = useCallback(async () => {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);

    const response = await fetch(
      `https://www.thecolorapi.com/id?rgb=${r},${g},${b}`
    );
    const data = await response.json();
    return data;
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
      document.documentElement.requestFullscreen().catch(console.error);
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
      if (!ctx) return;

      // Draw background
      ctx.fillStyle = color.hex.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Configure text
      ctx.fillStyle = isLightColor(color) ? "#000000" : "#FFFFFF";
      ctx.font = isMobile ? "36px Righteous" : "48px Righteous";
      ctx.textAlign = "center";

      // Draw text
      const centerY = canvas.height / 2;
      ctx.fillText(color.name.value, canvas.width / 2, centerY - 50);
      ctx.fillText(`HEX: ${color.hex.value}`, canvas.width / 2, centerY + 50);
      ctx.fillText(`RGB: ${color.rgb.value}`, canvas.width / 2, centerY + 150);

      // Create and trigger download
      const link = document.createElement("a");
      link.download = `color-${color.hex.clean}.png`;
      link.href = canvas.toDataURL("image/png");

      // For mobile Safari compatibility
      if (navigator.userAgent.match(/(iPhone|iPad|iPod)/i)) {
        const img = new Image();
        img.src = link.href;
        const w = window.open("");
        if (w) {
          w.document.write(img.outerHTML);
        }
      } else {
        link.click();
      }
    } catch (error) {
      console.error("Error taking screenshot:", error);
    }
  };

  const handleColorSelect = (selectedColor: ColorResponse) => {
    setColor(selectedColor);
    setNextBgColor(selectedColor.hex.value);
    setIsPlaying(false);
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
        backgroundColor: nextBgColor,
        transition: "background-color 1s ease-in-out",
      }}
    >
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
            <ColorHistoryDrawer
              colorHistory={colorHistory}
              onColorSelect={handleColorSelect}
              buttonColorClass={buttonColorClass}
            />
          </div>
        </div>

        {/* <ProgressBar
          key={color.hex.value}
          duration={5000}
          isPlaying={isPlaying}
          textColorClass={textColorClass}
        /> */}
      </Card>
    </main>
  );
}
