import { useState, useCallback } from "react";
import { ColorResponse } from "~/lib/types";

const initialColor: ColorResponse = {
  name: { value: "Loading..." },
  hex: { value: "#000000", clean: "000000" },
  rgb: { value: "rgb(0, 0, 0)", r: 0, g: 0, b: 0 },
};

export function useColorService() {
  const [currentColor, setCurrentColor] = useState<ColorResponse>(initialColor);
  const [colorHistory, setColorHistory] = useState<ColorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const changeColor = useCallback(async () => {
    try {
      const response = await fetch("https://api.color.pizza/v1/random");
      const data = await response.json();
      const newColor = data.colors[0];
      
      setCurrentColor(newColor);
      setColorHistory((prev) => [newColor, ...prev].slice(0, 50));
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching color:", error);
    }
  }, []);

  const handleColorSelect = useCallback((color: ColorResponse) => {
    setCurrentColor(color);
  }, []);

  return {
    currentColor,
    colorHistory,
    isLoading,
    changeColor,
    handleColorSelect,
  };
}