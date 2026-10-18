import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import {
  HOLD_MS,
  classifyPress,
  lockAxis,
  type DragAxis,
  type PressState,
} from "../utils/holdDrag";

export interface UseHoldDragOptions {
  disabled?: boolean;
  onTap: () => void;
  onHold?: () => void;
  // offset is dy for a vertical drag and dx for a horizontal one, in px
  onDrag: (axis: DragAxis, offset: number) => void;
  onDragEnd: (axis: DragAxis, offset: number) => void;
}

interface Press {
  pointerId: number;
  x: number;
  y: number;
  start: number;
  state: PressState;
  axis: DragAxis | null;
  offset: number;
}

// Tap to toggle, or press and hold, then drag. A move before the hold is a scroll.
export function useHoldDrag<T extends HTMLElement>(
  options: UseHoldDragOptions
) {
  const ref = useRef<T>(null);
  const [holding, setHolding] = useState(false);
  const press = useRef<Press | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbacks = useRef(options);
  callbacks.current = options;

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    press.current = null;
    setHolding(false);
  }, []);

  // Must be non-passive so a hold can stop the page from scrolling.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (press.current?.state === "hold") e.preventDefault();
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      clearTimeout(timer.current);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<T>) => {
    if (callbacks.current.disabled || press.current) return;
    const el = e.currentTarget;
    const pointerId = e.pointerId;
    press.current = {
      pointerId,
      x: e.clientX,
      y: e.clientY,
      start: Date.now(),
      state: "pending",
      axis: null,
      offset: 0,
    };
    timer.current = setTimeout(() => {
      if (press.current?.state !== "pending") return;
      press.current.state = "hold";
      try {
        el.setPointerCapture(pointerId);
      } catch {
        // pointer already released
      }
      navigator.vibrate?.(10);
      setHolding(true);
      callbacks.current.onHold?.();
    }, HOLD_MS);
  };

  const onPointerMove = (e: React.PointerEvent<T>) => {
    const p = press.current;
    if (!p || e.pointerId !== p.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;

    if (p.state === "pending") {
      if (classifyPress(Date.now() - p.start, dx, dy) === "scroll") reset();
      return;
    }

    p.axis ??= lockAxis(dx, dy);
    if (!p.axis) return;
    p.offset = p.axis === "vertical" ? dy : dx;
    callbacks.current.onDrag(p.axis, p.offset);
  };

  const end = (e: React.PointerEvent<T>, isTap: boolean) => {
    const p = press.current;
    if (!p || e.pointerId !== p.pointerId) return;
    reset();
    if (p.state === "pending" && isTap) callbacks.current.onTap();
    if (p.state === "hold" && p.axis)
      callbacks.current.onDragEnd(p.axis, p.offset);
  };

  return {
    ref,
    holding,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e: React.PointerEvent<T>) => end(e, true),
      onPointerCancel: (e: React.PointerEvent<T>) => end(e, false),
      onContextMenu: (e: React.MouseEvent<T>) => e.preventDefault(),
    },
  };
}

// Leading-edge throttle: runs fn at most once per interval. The caller sends
// the final value itself when the drag ends.
export function useThrottle(intervalMs = 200) {
  const last = useRef(-Infinity);
  return useCallback(
    (fn: () => void) => {
      const now = Date.now();
      if (now - last.current < intervalMs) return;
      last.current = now;
      fn();
    },
    [intervalMs]
  );
}
