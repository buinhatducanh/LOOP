import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function rgba(color: string, a: number): string {
  if (!color) return "transparent";
  if (color.startsWith("var(")) {
    return `color-mix(in srgb, ${color}, transparent ${Math.round((1 - a) * 100)}%)`;
  }
  if (color.startsWith("rgba")) return color;
  const h = color.replace("#", "");
  if (h.length !== 6 && h.length !== 3) return color;
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.slice(0, 2), 16);
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.slice(2, 4), 16);
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
