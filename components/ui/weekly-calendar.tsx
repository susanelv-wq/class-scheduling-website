"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TimeSlot {
  id: string | number
  title: string
  startTime: string // "HH:MM" format
  endTime: string // "HH:MM" format
  date: string // "YYYY-MM-DD" format
  details?: Record<string, any>
  color?: "primary" | "accent" | "destructive" | "green"
  onSelect?: (slot: TimeSlot) => void
}

interface WeeklyCalendarProps {
  slots: TimeSlot[]
  onSelectSlot: (slot: TimeSlot) => void
  onSelectEmptySlot?: (date: string, time: string) => void // For creating new slots
  startHour?: number // Default: 8
  endHour?: number // Default: 18
  editable?: boolean // Allow clicking empty slots
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function WeeklyCalendar({
  slots,
  onSelectSlot,
  onSelectEmptySlot,
  startHour = 8,
  endHour = 18,
  editable = false,
}: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date(2025, 11, 8))

  const getWeekDays = () => {
    const days = []
    const start = new Date(currentWeek)
    start.setDate(start.getDate() - start.getDay())

    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    return days
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const getSlotStyle = (slot: TimeSlot, dayWidth: number) => {
    const startMinutes = timeToMinutes(slot.startTime)
    const endMinutes = timeToMinutes(slot.endTime)
    const totalMinutes = (endHour - startHour) * 60
    const slotMinutes = endMinutes - startMinutes

    const topPercent = ((startMinutes - startHour * 60) / totalMinutes) * 100
    const heightPercent = (slotMinutes / totalMinutes) * 100

    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
    }
  }

  const getColorClass = (color?: string) => {
    switch (color) {
      case "accent":
        return "bg-accent/20 border-accent text-accent-foreground"
      case "destructive":
        return "bg-destructive/20 border-destructive text-destructive"
      case "green":
        return "bg-green-500/20 border-green-500 text-green-700"
      default:
        return "bg-primary/20 border-primary text-primary-foreground"
    }
  }

  const weekDays = getWeekDays()
  const visibleHours = HOURS.slice(startHour, endHour)
  const dayWidth = `calc((100% - 80px) / 7)`

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Weekly View</h3>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentWeek)
              newDate.setDate(newDate.getDate() - 7)
              setCurrentWeek(newDate)
            }}
            className="p-1 h-auto"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-4 py-2 text-sm font-medium text-foreground min-w-64 text-center">
            {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentWeek)
              newDate.setDate(newDate.getDate() + 7)
              setCurrentWeek(newDate)
            }}
            className="p-1 h-auto"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto border border-border rounded-lg bg-background">
        <div className="flex min-w-full">
          {/* Hours column */}
          <div className="w-20 flex-shrink-0 border-r border-border">
            <div className="h-16 border-b border-border flex items-end justify-center pb-2">
              <span className="text-xs font-medium text-muted-foreground">Time</span>
            </div>
            <div className="relative">
              {visibleHours.map((hour) => (
                <div key={hour} className="h-24 border-b border-border flex items-start justify-center pt-1">
                  <span className="text-xs text-muted-foreground font-medium">{String(hour).padStart(2, "0")}:00</span>
                </div>
              ))}
            </div>
          </div>

          {/* Days columns */}
          <div className="flex flex-1">
            {weekDays.map((day, dayIdx) => {
              const dayString = formatDate(day)
              const daySlots = slots.filter((slot) => slot.date === dayString)

              return (
                <div key={dayIdx} className="flex-1 border-r border-border last:border-r-0 min-w-40 relative">
                  {/* Day header */}
                  <div className="h-16 border-b border-border flex flex-col items-center justify-center sticky top-0 bg-background z-10">
                    <p className="text-xs font-medium text-muted-foreground">{DAY_SHORT[day.getDay()]}</p>
                    <p className="text-lg font-bold text-foreground">{day.getDate()}</p>
                  </div>

                  {/* Time slots background and events */}
                  <div className="relative">
                    {/* Hour divisions - clickable if editable */}
                    {visibleHours.map((hour) => (
                      <div
                        key={hour}
                        className={`h-24 border-b border-border/50 ${editable ? "hover:bg-primary/5 cursor-pointer" : ""}`}
                        onClick={
                          editable && onSelectEmptySlot
                            ? () => {
                                const timeString = `${String(hour).padStart(2, "0")}:00`
                                onSelectEmptySlot(dayString, timeString)
                              }
                            : undefined
                        }
                      />
                    ))}

                    {/* Event slots */}
                    <div className="absolute inset-0 top-0 w-full pointer-events-none">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          style={getSlotStyle(slot, 100)}
                          className={`absolute left-1 right-1 border-l-4 rounded-md p-2 cursor-pointer transition-shadow hover:shadow-md pointer-events-auto ${getColorClass(
                            slot.color,
                          )}`}
                          onClick={() => onSelectSlot(slot)}
                        >
                          <p className="text-xs font-semibold truncate">{slot.title}</p>
                          <p className="text-xs truncate">
                            {slot.startTime} - {slot.endTime}
                          </p>
                          {slot.details?.room && <p className="text-xs truncate opacity-75">{slot.details.room}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {slots.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No classes scheduled for this week</p>
        </div>
      )}
    </div>
  )
}
