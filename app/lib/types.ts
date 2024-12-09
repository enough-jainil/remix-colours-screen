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
}