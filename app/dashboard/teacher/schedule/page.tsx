"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WeeklyCalendar } from "@/components/ui/weekly-calendar"
import { Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { classesApi, type Class } from "@/lib/api"
import { CreateClassModal } from "@/components/teacher/create-class-modal"
import { useAppSettings } from "@/lib/use-app-settings"

export default function SchedulePage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createModalData, setCreateModalData] = useState<{
    date?: string
    startTime?: string
    endTime?: string
    existingClass?: Class
  }>({})
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { settings } = useAppSettings()
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

  const handleRefresh = () => {
    const fetchClasses = async () => {
      try {
        if (user?.id) {
          const data = await classesApi.getAll({ teacherId: user.id })
          setClasses(data)
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error)
      }
    }
    fetchClasses()
  }

  // Convert classes to time slot format
  const timeSlots = classes.map((cls) => ({
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

  const handleSelectSlot = (slot: any) => {
    // Find the full class data
    const fullClass = classes.find((c) => c.id === slot.id)
    setCreateModalData({ existingClass: fullClass })
    setShowCreateModal(true)
  }

  const handleSelectEmptySlot = (date: string, time: string) => {
    const duration = settings?.defaultClassDurationMinutes ?? 60
    const [hours, minutes] = time.split(":").map(Number)
    const base = (Number(hours) || 0) * 60 + (Number(minutes) || 0)
    const next = Math.min(23 * 60 + 59, Math.max(0, base + duration))
    const endHours = Math.floor(next / 60)
    const endMinutes = next % 60
    const endTime = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`

    setCreateModalData({
      date,
      startTime: time,
      endTime,
    })
    setShowCreateModal(true)
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule Management</h1>
            <p className="text-muted-foreground mt-1">Create and modify your teaching schedule</p>
          </div>
          <Button
            onClick={() => {
              setCreateModalData({})
              setShowCreateModal(true)
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Class
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Tip:</strong> Click on any empty time slot in the calendar to create a new class, or click on an
              existing class to edit it.
            </p>
          </div>
          <WeeklyCalendar
            slots={timeSlots}
            onSelectSlot={handleSelectSlot}
            onSelectEmptySlot={handleSelectEmptySlot}
            editable={true}
            startHour={settings?.defaultStartHour ?? 8}
            endHour={settings?.defaultEndHour ?? 19}
          />
        </Card>

        {showCreateModal && (
          <CreateClassModal
            onClose={() => {
              setShowCreateModal(false)
              setCreateModalData({})
            }}
            onSuccess={() => {
              handleRefresh()
              setShowCreateModal(false)
              setCreateModalData({})
            }}
            initialDate={createModalData.date}
            initialStartTime={createModalData.startTime}
            initialEndTime={createModalData.endTime}
            existingClass={createModalData.existingClass}
          />
        )}
      </div>
    </LayoutWrapper>
  )
}
