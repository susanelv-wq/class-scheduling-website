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
  color?: "primary" | "accent" | "destructive" | "green" | "success"
  onSelect?: (slot: TimeSlot) => void
}

interface WeeklyCalendarProps {
  slots: TimeSlot[]
  onSelectSlot: (slot: TimeSlot) => void
  onSelectEmptySlot?: (date: string, time: string) => void // For creating new slots
  /** Week shown on first render (defaults to today). */
  initialWeek?: Date
  /** Show a single day instead of a week. */
  daysToShow?: 1 | 7
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
  initialWeek,
  daysToShow = 7,
  startHour = 8,
  endHour = 18,
  editable = false,
}: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(() => initialWeek ?? new Date())

  const getWeekDays = () => {
    if (daysToShow === 1) {
      const d = new Date(currentWeek)
      return [d]
    }
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

  const timeToMinutes = (time: unknown) => {
    if (typeof time !== "string") return NaN
    if (!time.includes(":")) return NaN
    const [hours, minutes] = time.split(":").map(Number)
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return NaN
    return hours * 60 + minutes
  }

  const getSlotStyle = (slot: TimeSlot, dayWidth: number) => {
    const startMinutes = timeToMinutes(slot.startTime)
    const endMinutes = timeToMinutes(slot.endTime)
    const totalMinutes = (endHour - startHour) * 60
    const slotMinutes = endMinutes - startMinutes
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || totalMinutes <= 0 || !Number.isFinite(slotMinutes)) {
      return { top: "0%", height: "0%" }
    }

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
      case "success":
        return "bg-green-500/80 border-green-600 text-white"
      case "destructive":
        return "bg-destructive/80 border-destructive text-white"
      case "green":
        return "bg-green-500/80 border-green-600 text-white"
      default:
        return "bg-primary/80 border-primary text-white"
    }
  }

  const weekDays = getWeekDays()
  const visibleHours = HOURS.slice(startHour, endHour)
  const dayWidth = `calc((100% - 80px) / 7)`

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{daysToShow === 1 ? "Daily View" : "Weekly View"}</h3>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentWeek)
              newDate.setDate(newDate.getDate() - (daysToShow === 1 ? 1 : 7))
              setCurrentWeek(newDate)
            }}
            className="p-1 h-auto"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-4 py-2 text-sm font-medium text-foreground min-w-64 text-center">
            {daysToShow === 1
              ? weekDays[0].toLocaleDateString()
              : `${weekDays[0].toLocaleDateString()} - ${weekDays[6].toLocaleDateString()}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentWeek)
              newDate.setDate(newDate.getDate() + (daysToShow === 1 ? 1 : 7))
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
                <div
                  key={dayIdx}
                  className={`flex-1 border-r border-border last:border-r-0 relative ${daysToShow === 1 ? "min-w-[420px]" : "min-w-40"}`}
                >
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
                      {daySlots.map((slot) => {
                        const valid =
                          typeof slot.startTime === "string" &&
                          typeof slot.endTime === "string" &&
                          slot.startTime.includes(":") &&
                          slot.endTime.includes(":")

                        if (!valid) return null

                        return (
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
                        )
                      })}
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
