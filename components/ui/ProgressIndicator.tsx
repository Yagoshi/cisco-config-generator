"use client";

import type { ComponentProps, CSSProperties } from "react";
import "./progress-indicator.css";

export type ProgressIndicatorType = "stacked" | "inlined" | "stacked-underlay";

export type ProgressIndicatorProps = Omit<ComponentProps<"div">, "role"> & {
  type: ProgressIndicatorType;
  value?: number;
  active?: boolean;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export const ProgressIndicator = (props: ProgressIndicatorProps) => {
  const { children, className, type, value, active = true, style, ...rest } = props;
  if (!active) return null;

  const hasValue = value !== undefined && Number.isFinite(value);
  const normalized = hasValue ? clamp(value as number) : undefined;
  const isIndeterminate = normalized === undefined;

  const mergedStyle: CSSProperties = {
    ...style,
    ...(normalized !== undefined ? { ["--value" as string]: String(normalized) } : {}),
  };

  return (
    <div
      className={`
        group/progress flex items-center justify-center gap-x-3 gap-y-4 text-std-16N-170 text-app-text
        data-[type=stacked]:flex-col
        data-[type=stacked-underlay]:flex-col data-[type=stacked-underlay]:mx-auto data-[type=stacked-underlay]:w-fit
        data-[type=stacked-underlay]:rounded-16 data-[type=stacked-underlay]:border data-[type=stacked-underlay]:border-app-border
        data-[type=stacked-underlay]:bg-app-surface data-[type=stacked-underlay]:px-8 data-[type=stacked-underlay]:py-6
        ${className ?? ""}
      `}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      data-type={type}
      data-indeterminate={isIndeterminate ? "" : undefined}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </div>
  );
};

export type ProgressIndicatorSpinnerProps = ComponentProps<"svg"> & {
  size?: "lg" | "sm";
};

export const ProgressIndicatorSpinner = ({
  size = "lg",
  className,
  ...rest
}: ProgressIndicatorSpinnerProps) => {
  const isLg = size === "lg";
  const dimension = isLg ? 48 : 24;
  const center = dimension / 2;
  const radius = isLg ? 22 : 8;
  const outerRadius = isLg ? 23.5 : 9.5;
  const strokeWidth = isLg ? 4 : 3;

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox={`0 0 ${dimension} ${dimension}`}
      stroke="currentcolor"
      fill="none"
      aria-hidden="true"
      className={className ?? ""}
      {...rest}
    >
      <circle className="text-app-border-strong" cx={center} cy={center} r={radius} strokeWidth={strokeWidth} />
      <g className="[transform-origin:center] group-data-[indeterminate]/progress:animate-[dads-spinner-rotate_13s_linear_infinite] motion-reduce:[animation:none]">
        <g className="[transform-origin:center] group-data-[indeterminate]/progress:animate-[dads-spinner-group-rotate_2.5s_linear_infinite] motion-reduce:[animation:none]">
          <circle
            className="text-app-accent-text [stroke-dasharray:100] [transform:rotate(-90deg)] [transform-origin:center]
              [stroke-dashoffset:calc(100-clamp(0,var(--value,35),100))]
              group-data-[indeterminate]/progress:[animation:dads-spinner-bar-rotate_2.5s_cubic-bezier(0.4,0,0.3,1)_infinite,dads-spinner-bar-dash_2.5s_cubic-bezier(0.4,0,0.3,1)_infinite]
              motion-reduce:[animation:none]"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            pathLength={100}
          />
        </g>
      </g>
      <circle className="text-app-accent-text" cx={center} cy={center} r={outerRadius} strokeWidth={1} />
    </svg>
  );
};

export type ProgressIndicatorLabelProps = ComponentProps<"span">;

export const ProgressIndicatorLabel = ({ className, ...rest }: ProgressIndicatorLabelProps) => (
  <span className={`text-std-16B-170 text-app-text ${className ?? ""}`} {...rest} />
);

export type ProgressIndicatorDescriptionProps = ComponentProps<"span">;

export const ProgressIndicatorDescription = ({
  className,
  ...rest
}: ProgressIndicatorDescriptionProps) => (
  <span className={`text-std-16N-170 text-app-muted ${className ?? ""}`} {...rest} />
);
