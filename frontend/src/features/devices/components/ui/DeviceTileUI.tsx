import type React from "react";
import { DeviceImage } from "./DeviceImage";
import "./DeviceTileUI.css";

export interface DeviceTileUIProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  ref?: React.Ref<HTMLDivElement>;
  name: string;
  imagePath?: string | undefined;
  isOn: boolean;
  isReachable: boolean;
  lightLevel?: number;
  lightColor?: string;
  holding?: boolean;
  // Value shown over the image while dragging, e.g. "62 %"
  overlay?: string | null;
}

export function DeviceTileUI({
  ref,
  name,
  imagePath,
  isOn,
  isReachable,
  lightLevel,
  lightColor,
  holding = false,
  overlay,
  className,
  ...rest
}: DeviceTileUIProps) {
  const classes = [
    "device-tile",
    holding && "device-tile-holding",
    !isReachable && "device-tile-unreachable",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} title={name} {...rest}>
      <div className="device-tile-image">
        <DeviceImage
          imagePath={imagePath}
          name={name}
          isOn={isOn}
          isReachable={isReachable}
          {...(lightLevel != null && { lightLevel })}
          {...(lightColor && { lightColor })}
        />
        {overlay && <div className="device-tile-overlay">{overlay}</div>}
      </div>
      <div className="device-tile-name">{name}</div>
    </div>
  );
}
