import { Card } from "@/components/ui";

import "./FloorPlanUI.css";

export interface FloorPlanUIProps {
  imgSrc: string;
  className?: string | undefined;
  defaultCollapsed?: boolean;
}

/**
 * FloorPlanUI is a pure presentational component that wraps the FloorPlanRenderer.
 * It displays a floor plan based on the provided configuration and scale.
 *
 * @param config - The floor plan configuration object
 * @param scale - Optional scale factor for the floor plan (default: 1)
 * @param className - Optional CSS class name for styling
 */
export function FloorPlanUI({
  imgSrc,
  className,
  defaultCollapsed = false,
}: FloorPlanUIProps) {
  const isMobile = window.innerWidth <= 768;

  return (
    <Card
      className={className}
      title="Floor Plan"
      collapsible
      defaultCollapsed={defaultCollapsed || isMobile}
    >
      <img alt="Floor Plan" src={imgSrc} className="floor-plan-renderer-svg" />
    </Card>
  );
}
