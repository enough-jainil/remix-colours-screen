export interface ColorResponse {
  name: {
    value: string;
  };
  hex: {
    value: string;
    clean: string;
  };
  rgb: {
    value: string;
    r: number;
    g: number;
    b: number;
  };
  hsl?: {
    value: string;
    h: number;
    s: number;
    l: number;
  };
}

export interface ColorPsychology {
  mood: string;
  meanings: string[];
  commonUses: string[];
}

export interface ColorInfo {
  colorResponse: ColorResponse;
  psychology: ColorPsychology;
}
