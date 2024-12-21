import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hlsStringToHex(hlsString: string): string {
  // Extract numbers and remove % signs
  const [h, l, s] = hlsString
      .replace(/%/g, '')
      .split(' ')
      .map(Number);

  // Convert to RGB
  const l_decimal = l / 100;
  const s_decimal = s / 100;
  
  const c = (1 - Math.abs(2 * l_decimal - 1)) * s_decimal;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l_decimal - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
      [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
      [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
      [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
      [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
      [r, g, b] = [x, 0, c];
  } else {
      [r, g, b] = [c, 0, x];
  }
  
  // Convert to 0-255 range and round
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  // Convert to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}