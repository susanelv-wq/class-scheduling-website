"use client"

import { useState } from "react"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WeeklyCalendar } from "@/components/ui/weekly-calendar"
import { Users, Clock, TrendingUp } from "lucide-react"

const mockTeacherClasses = [
  {
    id: 1,
    title: "Advanced JavaScript",
    startTime: "10:00",
    endTime: "11:30",
    date: "2025-12-12",
    details: {
      room: "Room 101",
      location: "Building A",
      enrolled: 15,
      capacity: 20,
      status: "scheduled",
    },
    color: "primary",
  },
  {
    id: 2,
    title: "Web Development Workshop",
    startTime: "14:00",
    endTime: "15:30",
    date: "2025-12-12",
    details: {
      room: "Room 102",
      location: "Building A",
      enrolled: 8,
      capacity: 15,
      status: "scheduled",
    },
    color: "primary",
  },
  {
    id: 3,
    title: "React Deep Dive",
    startTime: "11:00",
    endTime: "12:30",
    date: "2025-12-13",
    details: {
      room: "Room 105",
      location: "Building B",
      enrolled: 12,
      capacity: 18,
      status: "scheduled",
    },
    color: "primary",
  },
  {
    id: 4,
    title: "JavaScript Fundamentals",
    startTime: "15:00",
    endTime: "16:30",
    date: "2025-12-14",
    details: {
      room: "Room 101",
      location: "Building A",
      enrolled: 20,
      capacity: 20,
      status: "full",
    },
    color: "destructive",
  },
]

export default function TeacherDashboard() {
  const [selectedClass, setSelectedClass] = useState<(typeof mockTeacherClasses)[0] | null>(null)

  const totalEnrolled = mockTeacherClasses.reduce((sum, cls) => sum + cls.details.enrolled, 0)
  const totalCapacity = mockTeacherClasses.reduce((sum, cls) => sum + cls.details.capacity, 0)
  const occupancyRate = Math.round((totalEnrolled / totalCapacity) * 100)

  return (
    <LayoutWrapper userRole="teacher" userName="John Smith">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Teaching Schedule</h1>
          <p className="text-muted-foreground mt-1">View and manage your scheduled classes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-secondary/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-3xl font-bold text-foreground mt-2">{mockTeacherClasses.length}</p>
              </div>
              <Clock className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-secondary/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students Enrolled</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalEnrolled}</p>
              </div>
              <Users className="w-10 h-10 text-accent opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-secondary/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-3xl font-bold text-foreground mt-2">{occupancyRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Weekly Calendar View */}
        <Card className="p-6">
          <WeeklyCalendar
            slots={mockTeacherClasses}
            onSelectSlot={(slot) => setSelectedClass(slot)}
            startHour={8}
            endHour={18}
          />
        </Card>

        {/* Class Details Sidebar */}
        {selectedClass && (
          <Card className="p-6 border-primary bg-secondary/30 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedClass.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedClass.startTime} - {selectedClass.endTime}
                </p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Time</p>
                <p className="font-semibold text-foreground mt-1">
                  {selectedClass.startTime} - {selectedClass.endTime}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Location</p>
                <p className="font-semibold text-foreground mt-1">
                  {selectedClass.details.room}, {selectedClass.details.location}
                </p>
              </div>
            </div>

            <div className="bg-background rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Enrollment</span>
                <span className="font-bold text-foreground">
                  {selectedClass.details.enrolled}/{selectedClass.details.capacity}
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(selectedClass.details.enrolled / selectedClass.details.capacity) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1">
                View Attendance
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Send Announcement
              </Button>
            </div>
          </Card>
        )}
      </div>
    </LayoutWrapper>
  )
}
