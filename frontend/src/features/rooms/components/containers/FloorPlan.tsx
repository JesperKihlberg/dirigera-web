import { FloorPlanUI } from "../ui/FloorPlanUI";

export interface FloorPlanProps {
  floorPlan: string | null;
  scale?: number;
  className?: string;
}

/**
 * FloorPlan is a container component that handles the business logic for displaying a floor plan.
 * It resolves the floor's configured SVG and passes it to the FloorPlanUI component.
 *
 * @param floorPlan - SVG filename under /floorplan/ (set in Admin Mode), or null for none
 * @param scale - Optional scale factor for the floor plan (default: 0.8)
 * @param className - Optional CSS class name for styling
 */
export function FloorPlan({ floorPlan, className }: FloorPlanProps) {
  if (!floorPlan) {
    return null;
  }
  return (
    <FloorPlanUI
      imgSrc={`/floorplan/${floorPlan}`}
      {...(className && { className })}
    />
  );
}
