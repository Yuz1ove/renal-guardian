import type { CSSProperties } from "react";
import type { ModuleTone } from "./assistiveDeviceData";

export interface AnchorPoint {
  x: number;
  y: number;
}

export interface BlueprintConnectorProps {
  sourceAnchor: AnchorPoint;
  targetAnchor: AnchorPoint;
  color?: string;
  status: ModuleTone;
  selected: boolean;
  dimmed: boolean;
  labelId: string;
  moduleId: string;
  laneOffset?: number;
}

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function elbowPath(source: AnchorPoint, target: AnchorPoint, laneOffset = 0) {
  const targetIsLeft = target.x < source.x;
  const horizontalGap = Math.abs(target.x - source.x);
  const laneDirection = targetIsLeft ? -1 : 1;
  const laneDistance = Math.max(7, Math.min(18, horizontalGap * 0.42)) + laneOffset;
  const laneX = source.x + laneDirection * laneDistance;

  return `M ${source.x} ${source.y} H ${laneX} V ${target.y} H ${target.x}`;
}

export function BlueprintConnector({
  sourceAnchor,
  targetAnchor,
  color,
  status,
  selected,
  dimmed,
  labelId,
  moduleId,
  laneOffset = 0
}: BlueprintConnectorProps) {
  return (
    <path
      className={classNames(
        "blueprint-connector",
        `tone-${status}`,
        selected && "is-active",
        dimmed && "is-dimmed"
      )}
      d={elbowPath(sourceAnchor, targetAnchor, laneOffset)}
      style={color ? ({ "--connector-color": color } as CSSProperties) : undefined}
      data-label-id={labelId}
      data-module-id={moduleId}
    />
  );
}
