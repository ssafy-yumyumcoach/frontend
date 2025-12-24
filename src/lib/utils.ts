import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDecimal(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0.0";
  return Number(value).toFixed(1);
}
