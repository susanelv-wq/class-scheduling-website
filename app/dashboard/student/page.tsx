"use client"

import { useState } from "react"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Card } from "@/components/ui/card"
import { WeeklyCalendar } from "@/components/ui/weekly-calendar"
import { ClassDetailsModal } from "@/components/student/class-details-modal"

// Mock data - converted to time slot format
const mockTimeSlots = [
  {
    id: 1,
    title: "Advanced JavaScript",
    startTime: "10:00",
    endTime: "11:30",
    date: "2025-12-12",
    details: {
      teacher: "John Smith",
      subject: "Programming",
      room: "Room 101",
      location: "Building A",
      price: 49.99,
      capacity: 20,
      enrolled: 15,
      description: "Deep dive into advanced JavaScript concepts including async/await, closures, and more.",
    },
    color: "primary",
  },
  {
    id: 2,
    title: "Web Design Basics",
    startTime: "14:00",
    endTime: "15:30",
    date: "2025-12-12",
    details: {
      teacher: "Sarah Johnson",
      subject: "Design",
      room: "Room 205",
      location: "Building B",
      price: 39.99,
      capacity: 25,
      enrolled: 20,
      description: "Learn the fundamentals of web design including color theory, layout, and UX principles.",
    },
    color: "primary",
  },
  {
    id: 3,
    title: "React Development",
    startTime: "11:00",
    endTime: "12:30",
    date: "2025-12-13",
    details: {
      teacher: "Mike Chen",
      subject: "Programming",
      room: "Room 102",
      location: "Building A",
      price: 59.99,
      capacity: 18,
      enrolled: 12,
      description: "Master React from basics to advanced patterns including hooks and state management.",
    },
    color: "primary",
  },
  {
    id: 4,
    title: "UI/UX Workshop",
    startTime: "15:00",
    endTime: "16:30",
    date: "2025-12-13",
    details: {
      teacher: "Emma Davis",
      subject: "Design",
      room: "Room 301",
      location: "Building C",
      price: 44.99,
      capacity: 15,
      enrolled: 8,
      description: "Interactive workshop on modern UI/UX design practices and tools.",
    },
    color: "accent",
  },
]

export default function StudentDashboard() {
  const [selectedSlot, setSelectedSlot] = useState<(typeof mockTimeSlots)[0] | null>(null)

  const handleSelectSlot = (slot: any) => {
    setSelectedSlot(slot)
  }

  return (
    <LayoutWrapper userRole="student" userName="Alice Student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Available Classes</h1>
          <p className="text-muted-foreground mt-1">Browse and book classes from the calendar view below</p>
        </div>

        <Card className="p-6">
          <WeeklyCalendar slots={mockTimeSlots} onSelectSlot={handleSelectSlot} startHour={8} endHour={18} />
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
