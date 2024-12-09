import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ColorResponse } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertColorHistoryToCSV(colorHistory: ColorResponse[]) {
  const headers = ["Name", "HEX", "RGB", "R", "G", "B"].join(",");

  const rows = colorHistory.map((color) => {
    return [
      color.name.value,
      color.hex.value,
      `"${color.rgb.value}"`,
      color.rgb.r,
      color.rgb.g,
      color.rgb.b,
    ].join(",");
  });

  return [headers, ...rows].join("\n");
}

export function isLightColor(color: ColorResponse): boolean {
  const { r, g, b } = color.rgb;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

export async function loadRighteousFont() {
  const font = new FontFace(
    "Righteous",
    "url(https://fonts.gstatic.com/s/righteous/v14/1cXxaUPXBpj2rGoU7C9WiHGF.woff2)",
    { weight: "400" }
  );

  try {
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);
    return true;
  } catch (error) {
    console.error("Error loading Righteous font:", error);
    return false;
  }
}

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};