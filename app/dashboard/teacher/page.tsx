"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WeeklyCalendar } from "@/components/ui/weekly-calendar"
import { Users, Clock, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { classesApi, type Class } from "@/lib/api"

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<any>(null)
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
        if (user?.id) {
          const data = await classesApi.getAll({ teacherId: user.id })
          setClasses(data)
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user?.id) {
      fetchClasses()
    }
  }, [isAuthenticated, user?.id])

  // Convert classes to time slot format
  const teacherClasses = classes.map((cls) => ({
    id: cls.id,
    title: cls.title,
    startTime: cls.startTime,
    endTime: cls.endTime,
    date: new Date(cls.date).toISOString().split("T")[0],
    details: {
      room: cls.room || "",
      location: cls.location || "",
      enrolled: cls.enrolled || 0,
      capacity: cls.capacity,
      status: cls.status.toLowerCase(),
    },
    color: (cls.enrolled || 0) >= cls.capacity ? "destructive" : "primary",
  }))

  const totalEnrolled = classes.reduce((sum, cls) => sum + (cls.enrolled || 0), 0)
  const totalCapacity = classes.reduce((sum, cls) => sum + cls.capacity, 0)
  const occupancyRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0

  if (authLoading || loading) {
    return (
      <LayoutWrapper userRole="teacher" userName={user?.name || "Teacher"}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper userRole="teacher" userName={user?.name || "Teacher"}>
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
                <p className="text-3xl font-bold text-foreground mt-2">{classes.length}</p>
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
          {teacherClasses.length > 0 ? (
            <WeeklyCalendar
              slots={teacherClasses}
              onSelectSlot={(slot) => setSelectedClass(slot)}
              startHour={8}
              endHour={18}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No classes scheduled yet.</p>
            </div>
          )}
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
