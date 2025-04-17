import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "~/components/ui/sheet";
import { History, Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ColorResponse } from "~/lib/types";
import { convertColorHistoryToCSV, addHslToColor } from "~/lib/utils";

interface ColorHistoryDrawerProps {
  colorHistory: ColorResponse[];
  onColorSelect: (color: ColorResponse) => void;
  buttonColorClass: string;
}

export function ColorHistoryDrawer({
  colorHistory,
  onColorSelect,
  buttonColorClass,
}: ColorHistoryDrawerProps) {
  const handleDownloadCSV = () => {
    // Ensure all colors have HSL data for the CSV
    const enhancedHistory = colorHistory.map((color) => addHslToColor(color));

    const csvContent = convertColorHistoryToCSV(enhancedHistory);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", "color-history.csv");
    document.body.appendChild(link);
    link.click();

    // Clean up to avoid memory leaks
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className={`${buttonColorClass} text-xs sm:text-sm h-8 sm:h-9`}
          aria-label="View color history"
        >
          <History className="h-3 w-3 sm:h-4 sm:w-4" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-lg font-semibold">
              Color History
            </SheetTitle>
            <Button
              onClick={handleDownloadCSV}
              className={`${buttonColorClass} text-xs sm:text-sm`}
              size="sm"
              aria-label="Download history as CSV"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              Export CSV
            </Button>
          </div>
          <div className="grid gap-2">
            {colorHistory.map((color, index) => {
              // Ensure color has HSL data
              const enhancedColor = addHslToColor(color);

              return (
                <div
                  key={`${enhancedColor.hex.clean}-${index}`}
                  className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onColorSelect(enhancedColor)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onColorSelect(enhancedColor);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select color ${enhancedColor.name.value}`}
                >
                  <div
                    className="w-12 h-12 rounded-md"
                    style={{ backgroundColor: enhancedColor.hex.value }}
                  />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">
                      {enhancedColor.name.value}
                    </span>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      <span>{enhancedColor.hex.value}</span>
                      <div className="flex gap-2">
                        <span className="text-xs">
                          {enhancedColor.rgb.value}
                        </span>
                        {enhancedColor.hsl && (
                          <span className="text-xs">
                            {enhancedColor.hsl.value}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
