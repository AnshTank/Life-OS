"use client";

import { useMemo } from "react";

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

interface LineChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface CustomChartProps {
  data: ChartDataPoint[] | LineChartDataPoint[];
  type: "donut" | "bar" | "line";
  className?: string;
}

export function CustomChart({ data, type, className = "" }: CustomChartProps) {
  if (type === "donut") {
    const donutData = data as ChartDataPoint[];
    const total = donutData.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className={`relative ${className}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="20"
            className="opacity-20"
          />
          {donutData.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${percentage * 5.03} 502`;
            const strokeDashoffset = -cumulativePercentage * 5.03;
            cumulativePercentage += percentage;

            return (
              <circle
                key={index}
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={item.color}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "100px 100px",
                  animationDelay: `${index * 200}ms`,
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            {donutData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span>
                  {item.name}: {((item.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "bar") {
    const barData = data as ChartDataPoint[];
    const maxValue = Math.max(...barData.map((d) => d.value));

    return (
      <div className={`space-y-3 ${className}`}>
        {barData.map((item, index) => {
          const width = (item.value / maxValue) * 100;
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.value}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${width}%`,
                    background: item.color,
                    animationDelay: `${index * 100}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "line") {
    const lineData = data as LineChartDataPoint[];
    if (!lineData || lineData.length === 0) return null;

    // Get all numeric keys except 'name'
    const keys = Object.keys(lineData[0]).filter(
      (key) => key !== "name" && typeof lineData[0][key] === "number"
    );
    const allValues = lineData.flatMap((item) =>
      keys.map((key) => Number(item[key]))
    );
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue;

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    return (
      <div className={`relative ${className}`}>
        <svg viewBox="0 0 400 160" className="w-full h-full">
          <defs>
            {keys.map((key, index) => (
              <linearGradient
                key={key}
                id={`gradient-${key}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={colors[index % colors.length]}
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor={colors[index % colors.length]}
                  stopOpacity="0.1"
                />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="40"
              y1={20 + i * 25}
              x2="360"
              y2={20 + i * 25}
              stroke="hsl(var(--muted))"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}

          {keys.map((key, keyIndex) => {
            const points = lineData
              .map((item, index) => {
                const x = 40 + (index / (lineData.length - 1)) * 320;
                const y =
                  20 + (1 - (Number(item[key]) - minValue) / range) * 95;
                return `${x},${y}`;
              })
              .join(" ");

            const areaPoints = `40,115 ${points} ${40 + 320},115`;

            return (
              <g key={key}>
                <polygon
                  points={areaPoints}
                  fill={`url(#gradient-${key})`}
                  className="transition-all duration-1000 ease-out"
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke={colors[keyIndex % colors.length]}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-1000 ease-out"
                />
                {lineData.map((item, index) => {
                  const x = 40 + (index / (lineData.length - 1)) * 320;
                  const y =
                    20 + (1 - (Number(item[key]) - minValue) / range) * 95;
                  return (
                    <circle
                      key={`${key}-${index}`}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={colors[keyIndex % colors.length]}
                      className="transition-all duration-1000 ease-out"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* X-axis labels */}
          {lineData.map((item, index) => {
            const x = 40 + (index / (lineData.length - 1)) * 320;
            return (
              <text
                key={index}
                x={x}
                y="135"
                textAnchor="middle"
                className="text-xs fill-current opacity-60"
              >
                {item.name}
              </text>
            );
          })}
        </svg>

        {/* Compact Legend inside card */}
        <div className="flex justify-center gap-6 text-sm -mt-2">
          {keys.map((key, index) => (
            <div key={key} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span className="capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
