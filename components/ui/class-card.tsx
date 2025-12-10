"use client"

import { Clock, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ClassCardProps {
  title: string
  teacher: string
  time: string
  location: string
  room: string
  enrolled: number
  capacity: number
  price: number
  onClick?: () => void
  actionLabel?: string
}

export function ClassCard({
  title,
  teacher,
  time,
  location,
  room,
  enrolled,
  capacity,
  price,
  onClick,
  actionLabel = "View Details",
}: ClassCardProps) {
  const spotsLeft = capacity - enrolled

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer border-border hover:border-primary">
      <div className="space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground text-lg leading-tight">{title}</h3>
            <span className="text-accent font-bold text-lg whitespace-nowrap">${price}</span>
          </div>
          <p className="text-sm text-muted-foreground">{teacher}</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {room}, {location}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {enrolled}/{capacity} enrolled
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left` : "Full"}
          </span>
          <Button
            onClick={onClick}
            disabled={spotsLeft <= 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </Card>
  )
}
