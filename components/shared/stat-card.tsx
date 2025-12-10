import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  color?: "primary" | "accent" | "destructive" | "foreground" | "green"
}

export function StatCard({ label, value, icon: Icon, color = "primary" }: StatCardProps) {
  const colorMap = {
    primary: "text-primary",
    accent: "text-accent",
    destructive: "text-destructive",
    foreground: "text-foreground",
    green: "text-green-500",
  }

  return (
    <Card className="p-6 bg-secondary/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
        </div>
        <Icon className={`w-10 h-10 ${colorMap[color]} opacity-20`} />
      </div>
    </Card>
  )
}
