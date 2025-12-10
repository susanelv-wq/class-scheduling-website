"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface TimeSlot {
  time: string
  available: boolean
}

interface TimeSelectorProps {
  date: string
  onSelectTime: (time: string) => void
  onClose: () => void
}

const AVAILABLE_TIMES = Array.from({ length: 10 }, (_, i) => {
  const hour = 8 + i
  return {
    time: `${String(hour).padStart(2, "0")}:00`,
    available: Math.random() > 0.3,
  }
})

export function TimeSlotSelector({ date, onSelectTime, onClose }: TimeSelectorProps) {
  return (
    <Card className="p-6 border-2 border-primary">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Select Time</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <p className="text-sm text-muted-foreground">Available slots for {date}</p>

        <div className="grid grid-cols-4 gap-2">
          {AVAILABLE_TIMES.map((slot) => (
            <Button
              key={slot.time}
              onClick={() => {
                if (slot.available) onSelectTime(slot.time)
              }}
              disabled={!slot.available}
              variant={slot.available ? "default" : "ghost"}
              className="text-sm"
            >
              {slot.time}
            </Button>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <Button onClick={onClose} variant="ghost" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  )
}
