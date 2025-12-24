"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Card } from "@/components/ui/card"
import { WeeklyCalendar } from "@/components/ui/weekly-calendar"
import { ClassDetailsModal } from "@/components/student/class-details-modal"
import { useAuth } from "@/lib/auth-context"
import { classesApi, type Class } from "@/lib/api"

export default function StudentDashboard() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/")
      return
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await classesApi.getAll()
        setClasses(data)
      } catch (error) {
        console.error("Failed to fetch classes:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchClasses()
    }
  }, [isAuthenticated])

  // Convert classes to time slot format for WeeklyCalendar
  const timeSlots = classes.map((cls) => ({
    id: cls.id,
    title: cls.title,
    startTime: cls.startTime,
    endTime: cls.endTime,
    date: new Date(cls.date).toISOString().split("T")[0],
    details: {
      teacher: cls.teacher?.name || "Unknown",
      subject: cls.subject || "",
      room: cls.room || "",
      location: cls.location || "",
      price: cls.price,
      capacity: cls.capacity,
      enrolled: cls.enrolled || 0,
      description: cls.description || "",
    },
    color: (cls.enrolled || 0) >= cls.capacity ? "destructive" : "primary",
  }))

  const handleSelectSlot = (slot: any) => {
    setSelectedSlot(slot)
  }

  if (authLoading || loading) {
    return (
      <LayoutWrapper userRole="student" userName={user?.name || "Student"}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading classes...</p>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper userRole="student" userName={user?.name || "Student"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Available Classes</h1>
          <p className="text-muted-foreground mt-1">Browse and book classes from the calendar view below</p>
        </div>

        <Card className="p-6">
          {timeSlots.length > 0 ? (
            <WeeklyCalendar slots={timeSlots} onSelectSlot={handleSelectSlot} startHour={8} endHour={18} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No classes available at the moment.</p>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-secondary/50">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">How to book a class:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click on any class in the calendar to view details</li>
              <li>Select a time slot to confirm your booking</li>
              <li>Complete payment within 2 hours or the booking will be cancelled</li>
            </ul>
          </div>
        </Card>
      </div>

      {selectedSlot && (
        <ClassDetailsModal
          class={{
            id: selectedSlot.id,
            title: selectedSlot.title,
            teacher: selectedSlot.details.teacher,
            subject: selectedSlot.details.subject,
            room: selectedSlot.details.room,
            location: selectedSlot.details.location,
            time: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
            date: selectedSlot.date,
            price: selectedSlot.details.price,
            capacity: selectedSlot.details.capacity,
            enrolled: selectedSlot.details.enrolled,
            description: selectedSlot.details.description,
          }}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </LayoutWrapper>
  )
}
