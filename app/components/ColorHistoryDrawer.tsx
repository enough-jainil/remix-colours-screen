import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "~/components/ui/sheet";
import { History, Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ColorResponse } from "~/lib/types";
import { convertColorHistoryToCSV } from "~/lib/utils";

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
    const csvContent = convertColorHistoryToCSV(colorHistory);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "color-history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            {colorHistory.map((color, index) => (
              <div
                key={`${color.hex.clean}-${index}`}
                className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => onColorSelect(color)}
              >
                <div
                  className="w-12 h-12 rounded-md"
                  style={{ backgroundColor: color.hex.value }}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{color.name.value}</span>
                  <div className="flex flex-col text-sm text-muted-foreground">
                    <span>{color.hex.value}</span>
                    <span>{color.rgb.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
