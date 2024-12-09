import { useEffect, useState } from "react";
import { ColorResponse } from "~/lib/types";
import { ColorHistoryDrawer } from "./ColorHistoryDrawer";
import { ColorDisplay } from "./ColorDisplay";
import { loadRighteousFont } from "~/lib/utils";
import { useColorService } from "~/hooks/useColorService";

export default function ColorScreensaver() {
  const {
    currentColor,
    colorHistory,
    isLoading,
    changeColor,
    handleColorSelect
  } = useColorService();

  useEffect(() => {
    loadRighteousFont();
    changeColor();
    const interval = setInterval(changeColor, 5000);
    return () => clearInterval(interval);
  }, [changeColor]);

  const buttonColorClass = "bg-white/20 hover:bg-white/30 text-white";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center transition-colors duration-1000"
      style={{ backgroundColor: currentColor.hex.value }}
    >
      <div className="fixed top-4 right-4">
        <ColorHistoryDrawer
          colorHistory={colorHistory}
          onColorSelect={handleColorSelect}
          buttonColorClass={buttonColorClass}
        />
      </div>
      
      <ColorDisplay color={currentColor} isLoading={isLoading} />
    </div>
  );
}