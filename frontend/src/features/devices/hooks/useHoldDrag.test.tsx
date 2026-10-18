import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  renderHook,
} from "@testing-library/react";
import {
  useHoldDrag,
  useThrottle,
  type UseHoldDragOptions,
} from "./useHoldDrag";

function Tile(props: UseHoldDragOptions) {
  const { ref, holding, handlers } = useHoldDrag<HTMLDivElement>(props);
  return (
    <div ref={ref} data-testid="tile" data-holding={holding} {...handlers} />
  );
}

const pointer = (x: number, y: number) => ({
  pointerId: 1,
  clientX: x,
  clientY: y,
});

function setup() {
  const callbacks = {
    onTap: vi.fn(),
    onHold: vi.fn(),
    onDrag: vi.fn(),
    onDragEnd: vi.fn(),
  };
  render(<Tile {...callbacks} />);
  return { tile: screen.getByTestId("tile"), ...callbacks };
}

describe("useHoldDrag", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onTap for a short press without movement", () => {
    const { tile, onTap, onHold, onDragEnd } = setup();
    fireEvent.pointerDown(tile, pointer(50, 50));
    act(() => vi.advanceTimersByTime(150));
    fireEvent.pointerUp(tile, pointer(52, 51));

    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onHold).not.toHaveBeenCalled();
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it("treats a move before the hold as a scroll: no tap, no drag", () => {
    const { tile, onTap, onDrag } = setup();
    fireEvent.pointerDown(tile, pointer(50, 50));
    fireEvent.pointerMove(tile, pointer(50, 80));
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerMove(tile, pointer(50, 120));
    fireEvent.pointerUp(tile, pointer(50, 120));

    expect(onTap).not.toHaveBeenCalled();
    expect(onDrag).not.toHaveBeenCalled();
  });

  it("holds, locks to the vertical axis and reports the offset", () => {
    const { tile, onTap, onHold, onDrag, onDragEnd } = setup();
    fireEvent.pointerDown(tile, pointer(50, 100));
    act(() => vi.advanceTimersByTime(400));
    expect(onHold).toHaveBeenCalledTimes(1);
    expect(tile.dataset.holding).toBe("true");

    fireEvent.pointerMove(tile, pointer(52, 70));
    fireEvent.pointerMove(tile, pointer(80, 40));
    fireEvent.pointerUp(tile, pointer(80, 40));

    expect(onDrag).toHaveBeenNthCalledWith(1, "vertical", -30);
    expect(onDrag).toHaveBeenNthCalledWith(2, "vertical", -60);
    expect(onDragEnd).toHaveBeenCalledWith("vertical", -60);
    expect(onTap).not.toHaveBeenCalled();
    expect(tile.dataset.holding).toBe("false");
  });

  it("locks to the horizontal axis", () => {
    const { tile, onDrag, onDragEnd } = setup();
    fireEvent.pointerDown(tile, pointer(50, 50));
    act(() => vi.advanceTimersByTime(400));
    fireEvent.pointerMove(tile, pointer(75, 55));
    fireEvent.pointerUp(tile, pointer(75, 55));

    expect(onDrag).toHaveBeenCalledWith("horizontal", 25);
    expect(onDragEnd).toHaveBeenCalledWith("horizontal", 25);
  });

  it("does nothing on release after a hold without a drag", () => {
    const { tile, onTap, onDragEnd } = setup();
    fireEvent.pointerDown(tile, pointer(50, 50));
    act(() => vi.advanceTimersByTime(600));
    fireEvent.pointerUp(tile, pointer(50, 50));

    expect(onTap).not.toHaveBeenCalled();
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it("blocks touch scrolling only while holding", () => {
    const { tile } = setup();
    const touchMove = () =>
      tile.dispatchEvent(new Event("touchmove", { cancelable: true }));

    fireEvent.pointerDown(tile, pointer(50, 50));
    expect(touchMove()).toBe(true);
    act(() => vi.advanceTimersByTime(400));
    expect(touchMove()).toBe(false);
  });

  it("ignores all gestures when disabled", () => {
    const onTap = vi.fn();
    const onHold = vi.fn();
    render(
      <Tile
        disabled
        onTap={onTap}
        onHold={onHold}
        onDrag={vi.fn()}
        onDragEnd={vi.fn()}
      />
    );
    const tile = screen.getByTestId("tile");
    fireEvent.pointerDown(tile, pointer(50, 50));
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(tile, pointer(50, 50));

    expect(onTap).not.toHaveBeenCalled();
    expect(onHold).not.toHaveBeenCalled();
  });
});

describe("useThrottle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs at most once per interval, leading edge", () => {
    const { result } = renderHook(() => useThrottle(200));
    const fn = vi.fn();
    result.current(fn);
    result.current(fn);
    vi.advanceTimersByTime(199);
    result.current(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    result.current(fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
