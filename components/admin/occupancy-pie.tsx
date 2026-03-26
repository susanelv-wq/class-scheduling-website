"use client"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"

const config: ChartConfig = {
  enrolled: { label: "Enrolled", color: "hsl(var(--primary))" },
  remaining: { label: "Remaining", color: "hsl(var(--muted-foreground))" },
}

export function OccupancyPie({
  enrolled,
  capacity,
  size = "md",
}: {
  enrolled: number
  capacity: number
  size?: "sm" | "md"
}) {
  const safeEnrolled = Math.max(0, Number(enrolled) || 0)
  const safeCapacity = Math.max(0, Number(capacity) || 0)
  const remaining = Math.max(0, safeCapacity - safeEnrolled)

  const data = [
    { name: "Enrolled", value: safeEnrolled, key: "enrolled" as const },
    { name: "Remaining", value: remaining, key: "remaining" as const },
  ]

  const chartClassName = size === "sm" ? "h-[140px] w-full" : "h-[220px] w-full"
  const innerRadius = size === "sm" ? 34 : 55
  const outerRadius = size === "sm" ? 55 : 85

  return (
    <ChartContainer className={chartClassName} config={config}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={3}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

