export const HOLD_MS = 400;
export const SCROLL_SLOP_PX = 8;
export const AXIS_LOCK_PX = 10;

const LEVEL_DRAG_PX = 150;
const HUE_DRAG_PX = 250;
const TEMPERATURE_DRAG_PX = 250;
export const MIN_TEMPERATURE = 2202;
export const MAX_TEMPERATURE = 4000;

export type PressState = "pending" | "scroll" | "hold";
export type DragAxis = "vertical" | "horizontal";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Before the hold timer fires, moving past the slop means the user is scrolling.
export function classifyPress(
  elapsedMs: number,
  dx: number,
  dy: number
): PressState {
  if (elapsedMs >= HOLD_MS) return "hold";
  if (Math.hypot(dx, dy) > SCROLL_SLOP_PX) return "scroll";
  return "pending";
}

// Lock the drag to its dominant axis once it has moved far enough.
export function lockAxis(dx: number, dy: number): DragAxis | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_PX) return null;
  return Math.abs(dy) >= Math.abs(dx) ? "vertical" : "horizontal";
}

// Dragging up (negative dy) brightens.
export function levelFromDrag(startLevel: number, dy: number): number {
  return clamp(Math.round(startLevel - (dy * 100) / LEVEL_DRAG_PX), 1, 100);
}

export function hueFromDrag(startHue: number, dx: number): number {
  const hue = Math.round(startHue + (dx * 360) / HUE_DRAG_PX) % 360;
  return hue < 0 ? hue + 360 : hue;
}

export function temperatureFromDrag(
  startTemperature: number,
  dx: number
): number {
  const range = MAX_TEMPERATURE - MIN_TEMPERATURE;
  return clamp(
    Math.round(startTemperature + (dx * range) / TEMPERATURE_DRAG_PX),
    MIN_TEMPERATURE,
    MAX_TEMPERATURE
  );
}
