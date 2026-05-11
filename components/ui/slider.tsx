"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  prefix?: string;
  onChange: (value: number) => void;
};

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  prefix = "",
  onChange
}: SliderProps) {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <label className="block space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {prefix}
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary outline-none",
          "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary",
          "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-glow"
        )}
        style={{
          background: `linear-gradient(90deg, hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}%)`
        }}
      />
    </label>
  );
}
