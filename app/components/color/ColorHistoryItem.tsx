import { ColorResponse } from "~/lib/types";

interface ColorHistoryItemProps {
  color: ColorResponse;
  onClick: () => void;
}

export function ColorHistoryItem({ color, onClick }: ColorHistoryItemProps) {
  return (
    <div
      className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
      onClick={onClick}
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
  );
}