import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ColorResponse, ColorPsychology } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertColorHistoryToCSV(colorHistory: ColorResponse[]) {
  const headers = [
    "Name",
    "HEX",
    "RGB",
    "R",
    "G",
    "B",
    "HSL",
    "H",
    "S",
    "L",
  ].join(",");

  const rows = colorHistory.map((color) => {
    // Ensure the color has HSL values
    const colorWithHsl = addHslToColor(color);

    return [
      colorWithHsl.name.value,
      colorWithHsl.hex.value,
      `"${colorWithHsl.rgb.value}"`,
      colorWithHsl.rgb.r,
      colorWithHsl.rgb.g,
      colorWithHsl.rgb.b,
      `"${colorWithHsl.hsl?.value || ""}"`,
      colorWithHsl.hsl?.h || "",
      colorWithHsl.hsl?.s || "",
      colorWithHsl.hsl?.l || "",
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

// Calculate HSL values from RGB
export function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  // Convert RGB to [0, 1] range
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / delta + 2) * 60;
    } else {
      h = ((r - g) / delta + 4) * 60;
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Add HSL values to a ColorResponse object
export function addHslToColor(color: ColorResponse): ColorResponse {
  if (color.hsl) return color;

  const { r, g, b } = color.rgb;
  const { h, s, l } = rgbToHsl(r, g, b);

  return {
    ...color,
    hsl: {
      value: `hsl(${h}, ${s}%, ${l}%)`,
      h,
      s,
      l,
    },
  };
}

// Determine the base color category from HSL
export function getBaseColor(hsl: { h: number; s: number; l: number }): string {
  const { h, s, l } = hsl;

  // Special cases for neutrals
  if (l <= 10) return "black";
  if (l >= 90) return "white";
  if (s <= 10) return "gray";

  // Hue-based categorization
  if (h >= 0 && h < 20) return "red";
  if (h >= 20 && h < 45) return "orange";
  if (h >= 45 && h < 65) return "yellow";
  if (h >= 65 && h < 165) return "green";
  if (h >= 165 && h < 190) return "teal";
  if (h >= 190 && h < 260) return "blue";
  if (h >= 260 && h < 290) return "purple";
  if (h >= 290 && h < 335) return "pink";
  if (h >= 335 && h <= 360) return "red";

  return "unknown";
}

// Get color psychology information
export function getColorPsychology(color: ColorResponse): ColorPsychology {
  const colorWithHsl = addHslToColor(color);
  const baseColor = getBaseColor(colorWithHsl.hsl!);

  const psychologyData: Record<string, ColorPsychology> = {
    red: {
      mood: "Energetic and passionate",
      meanings: ["Love", "Power", "Excitement", "Danger", "Strength"],
      commonUses: [
        "Food brands",
        "Sale notifications",
        "Warnings",
        "Action buttons",
      ],
    },
    orange: {
      mood: "Enthusiastic and creative",
      meanings: ["Energy", "Warmth", "Enthusiasm", "Creativity", "Adventure"],
      commonUses: [
        "Food and beverage",
        "Call-to-action buttons",
        "Fitness",
        "Youth brands",
      ],
    },
    yellow: {
      mood: "Optimistic and cheerful",
      meanings: ["Happiness", "Optimism", "Warning", "Attention", "Warmth"],
      commonUses: [
        "Discount promotions",
        "Food brands",
        "Children's products",
        "Energy",
      ],
    },
    green: {
      mood: "Refreshing and harmonious",
      meanings: ["Nature", "Growth", "Health", "Wealth", "Safety"],
      commonUses: [
        "Environmental brands",
        "Financial services",
        "Organic products",
        "Wellness",
      ],
    },
    teal: {
      mood: "Calm and sophisticated",
      meanings: ["Tranquility", "Wisdom", "Trust", "Reliability", "Balance"],
      commonUses: [
        "Medical websites",
        "Spas",
        "Technology",
        "Educational institutions",
      ],
    },
    blue: {
      mood: "Calm and trustworthy",
      meanings: ["Trust", "Dependability", "Calmness", "Security", "Logic"],
      commonUses: ["Corporate websites", "Banks", "Technology", "Healthcare"],
    },
    purple: {
      mood: "Luxurious and creative",
      meanings: ["Luxury", "Royalty", "Spirituality", "Creativity", "Mystery"],
      commonUses: [
        "Beauty products",
        "Anti-aging",
        "High-end brands",
        "Creative software",
      ],
    },
    pink: {
      mood: "Playful and romantic",
      meanings: ["Femininity", "Playfulness", "Romance", "Youth", "Tenderness"],
      commonUses: [
        "Beauty products",
        "Candy",
        "Children's toys",
        "Dating apps",
      ],
    },
    black: {
      mood: "Elegant and powerful",
      meanings: ["Sophistication", "Power", "Elegance", "Authority", "Mystery"],
      commonUses: [
        "Luxury brands",
        "Typography",
        "High-end products",
        "Formal websites",
      ],
    },
    white: {
      mood: "Pure and clean",
      meanings: ["Purity", "Cleanliness", "Simplicity", "Minimalism", "Space"],
      commonUses: [
        "Medical products",
        "Apple products",
        "Minimalist design",
        "Wedding themes",
      ],
    },
    gray: {
      mood: "Neutral and balanced",
      meanings: [
        "Balance",
        "Neutrality",
        "Sophistication",
        "Practicality",
        "Reliability",
      ],
      commonUses: [
        "Corporate designs",
        "Backgrounds",
        "Professional websites",
        "Typography",
      ],
    },
    unknown: {
      mood: "Unique and specific",
      meanings: [
        "Depends on specific shade",
        "Can evoke unique responses",
        "Personal associations",
      ],
      commonUses: ["Branding", "Specific theme designs", "Art", "Fashion"],
    },
  };

  return psychologyData[baseColor];
}
