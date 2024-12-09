import { ColorResponse } from "~/lib/types";

interface ColorDisplayProps {
  color: ColorResponse;
  isLoading: boolean;
}

export function ColorDisplay({ color, isLoading }: ColorDisplayProps) {
  return (
    <div className="text-center glass-morphism p-8 rounded-lg">
      <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4 font-righteous">
        {isLoading ? "Loading..." : color.name.value}
      </h1>
      <div className="flex flex-col gap-2 text-white/80">
        <p className="text-lg sm:text-xl">{color.hex.value}</p>
        <p className="text-lg sm:text-xl">{color.rgb.value}</p>
      </div>
    </div>
  );
}