import { FloorPlanUI } from "../ui/FloorPlanUI";

export interface FloorPlanProps {
  floorId: string;
  scale?: number;
  className?: string;
}

/**
 * FloorPlan is a container component that handles the business logic for displaying a floor plan.
 * It fetches the floor configuration based on the floorId and passes it to the FloorPlanUI component.
 *
 * @param floorId - The ID of the floor to display
 * @param scale - Optional scale factor for the floor plan (default: 0.8)
 * @param className - Optional CSS class name for styling
 */
export function FloorPlan({ floorId, className }: FloorPlanProps) {
  const floorSources: Record<string, string> = {
    "second-floor": "/floorplan/second.svg",
    "first-floor": "/floorplan/first.svg",
    "ground-floor": "/floorplan/ground.svg",
    basement: "/floorplan/basement.svg",
  };

  const imgSrc = floorSources[floorId];

  if (!imgSrc) {
    return <div>Floor plan not found for floor ID: {floorId}</div>;
  }
  return <FloorPlanUI imgSrc={imgSrc} {...(className && { className })} />;
}
