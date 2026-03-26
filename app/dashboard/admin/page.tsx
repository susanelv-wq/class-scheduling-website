"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WeeklyCalendar } from "@/components/ui/weekly-calendar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Clock, DollarSign, AlertCircle, CheckCircle, UserPlus, Trash2, Plus, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { bookingsApi, classesApi, usersApi, type Booking, type Class, type User } from "@/lib/api"
import { CreateUserModal } from "@/components/admin/create-user-modal"
import { formatRupiah } from "@/lib/currency"
import { useAppSettings } from "@/lib/use-app-settings"

type AdminSlotDetails = {
  teacher: string
  room: string
  location: string
  enrolled: number
  capacity: number
  revenue: number
  status: "pending" | "confirmed"
  classId: string
}

export type AdminCalendarSlot = {
  id: string
  title: string
  startTime: string
  endTime: string
  date: string
  color: "primary" | "destructive"
  details: AdminSlotDetails
}

function classDateKey(d: string): string {
  if (!d) return ""
  return d.length >= 10 ? d.slice(0, 10) : d
}

function buildAdminSlots(classes: Class[], bookings: Booking[]): AdminCalendarSlot[] {
  const byClass = new Map<string, Booking[]>()
  for (const b of bookings) {
    const cid = b.class?.id
    if (!cid) continue
    if (!byClass.has(cid)) byClass.set(cid, [])
    byClass.get(cid)!.push(b)
  }

  return classes
    .map((cls) => {
      // Supabase sometimes returns rows with missing fields; guard to avoid crashing the calendar.
      if (typeof cls.startTime !== "string" || typeof cls.endTime !== "string" || !cls.startTime.includes(":") || !cls.endTime.includes(":")) {
        return null
      }

    const list = byClass.get(cls.id) || []
    const enrolled = list.filter((b) => b.status !== "CANCELLED").length
    const revenue = list.reduce((sum, b) => {
      if (b.payment?.status === "COMPLETED") return sum + (b.payment.amount || 0)
      return sum
    }, 0)
    const pendingPay = list.filter((b) => b.status === "PENDING" && !b.payment).length
    const status: AdminSlotDetails["status"] = pendingPay > 0 ? "pending" : "confirmed"

    return {
      id: cls.id,
      title: cls.title,
      startTime: cls.startTime,
      endTime: cls.endTime,
      date: classDateKey(cls.date),
      color: status === "pending" ? "destructive" : "primary",
      details: {
        teacher: cls.teacher?.name || "Unknown",
        room: cls.room || "",
        location: cls.location || "",
        enrolled,
        capacity: cls.capacity,
        revenue,
        status,
        classId: cls.id,
      },
    }
    })
    .filter((x): x is AdminCalendarSlot => x !== null)
}

export default function AdminDashboard() {
  const [selectedClass, setSelectedClass] = useState<AdminCalendarSlot | null>(null)
  const [filterRole, setFilterRole] = useState<"all" | "STUDENT" | "TEACHER">("all")
  const [users, setUsers] = useState<User[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateClassModal, setShowCreateClassModal] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [classListFilter, setClassListFilter] = useState<"all" | "pending">("all")
  const [calendarView, setCalendarView] = useState<"week" | "day" | "month">("week")
  const [focusDate, setFocusDate] = useState(() => new Date())
  const [revenueYear, setRevenueYear] = useState(() => new Date().getFullYear())
  const [revenueMonth, setRevenueMonth] = useState<number | "all">("all")
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { settings } = useAppSettings()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return
    if (user.role !== "ADMIN") {
      router.replace(`/dashboard/${user.role.toLowerCase()}`)
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAuthenticated || user?.role !== "ADMIN") return
      setUsersLoading(true)
      try {
        const roleFilter = filterRole === "all" ? undefined : filterRole
        const data = await usersApi.getAll({ role: roleFilter })
        setUsers(data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [isAuthenticated, user?.role, filterRole])

  const refreshClassesAndBookings = async () => {
    if (!isAuthenticated || user?.role !== "ADMIN") return
    setDataLoading(true)
    setDataError(null)
    try {
      const [c, b] = await Promise.all([classesApi.getAll(), bookingsApi.getAll()])
      setClasses(c)
      setBookings(b)
    } catch (e) {
      setDataError(e instanceof Error ? e.message : "Failed to load classes and bookings")
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      void refreshClassesAndBookings()
    }
  }, [isAuthenticated, user?.role])

  const handleUserCreated = () => {
    const fetchUsers = async () => {
      try {
        const roleFilter = filterRole === "all" ? undefined : filterRole
        const data = await usersApi.getAll({ role: roleFilter })
        setUsers(data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      }
    }
    fetchUsers()
  }

  const calendarSlots = useMemo(() => buildAdminSlots(classes, bookings), [classes, bookings])
  const filteredCalendarSlots = useMemo(() => {
    if (classListFilter === "pending") return calendarSlots.filter((s) => s.details.status === "pending")
    return calendarSlots
  }, [calendarSlots, classListFilter])

  const scrollToClasses = () => {
    if (typeof window === "undefined") return
    document.getElementById("admin-classes-list")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const scrollToRevenue = () => {
    if (typeof window === "undefined") return
    router.push("/dashboard/admin/users#revenue")
  }

  const toISODate = (d: Date) => d.toISOString().slice(0, 10)
  const addMinutes = (hhmm: string, minutesToAdd: number) => {
    const [hStr, mStr] = hhmm.split(":")
    const h = Math.min(23, Math.max(0, Number(hStr)))
    const m = Math.min(59, Math.max(0, Number(mStr)))
    const base = h * 60 + m
    const next = Math.min(23 * 60 + 59, Math.max(0, base + (Number(minutesToAdd) || 0)))
    const endH = Math.floor(next / 60)
    const endM = next % 60
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
  }

  const handleEmptyHourClick = (date: string, time: string) => {
    const duration = settings?.defaultClassDurationMinutes ?? 60
    setEditingClassId(null)
    setClassFormError(null)
    setClassForm((prev) => ({
      ...prev,
      teacherId: teacherOptions[0]?.id || prev.teacherId,
      date,
      startTime: time,
      endTime: addMinutes(time, duration),
    }))
    setShowCreateClassModal(true)
  }

  const monthStart = useMemo(() => new Date(focusDate.getFullYear(), focusDate.getMonth(), 1), [focusDate])
  const monthYearLabel = useMemo(
    () => monthStart.toLocaleString(undefined, { month: "long", year: "numeric" }),
    [monthStart],
  )

  const monthDays = useMemo(() => {
    const start = new Date(monthStart)
    const firstDow = start.getDay()
    start.setDate(start.getDate() - firstDow)
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  }, [monthStart])

  const totalRevenue = useMemo(
    () => calendarSlots.reduce((sum, s) => sum + s.details.revenue, 0),
    [calendarSlots],
  )
  const totalEnrolled = useMemo(
    () => calendarSlots.reduce((sum, s) => sum + s.details.enrolled, 0),
    [calendarSlots],
  )
  const totalCapacity = useMemo(
    () => calendarSlots.reduce((sum, s) => sum + (Number(s.details.capacity) || 0), 0),
    [calendarSlots],
  )

  const occupancyRate = useMemo(() => {
    if (totalCapacity <= 0) return 0
    return Math.round((totalEnrolled / totalCapacity) * 100)
  }, [totalEnrolled, totalCapacity])

  const pendingBookings = useMemo(
    () => calendarSlots.filter((s) => s.details.status === "pending").length,
    [calendarSlots],
  )

  const attendeesForSelected = useMemo(() => {
    if (!selectedClass) return []
    return bookings.filter((b) => b.class.id === selectedClass.details.classId && b.status !== "CANCELLED")
  }, [selectedClass, bookings])

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Delete this class? Bookings may need to be removed first.")) return
    setDeletingId(classId)
    try {
      await classesApi.delete(classId)
      setSelectedClass(null)
      await refreshClassesAndBookings()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete class")
    } finally {
      setDeletingId(null)
    }
  }

  const teacherOptions = useMemo(() => users.filter((u) => u.role === "TEACHER"), [users])
  const [classForm, setClassForm] = useState({
    teacherId: "",
    title: "",
    description: "",
    subject: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    room: "",
    location: "",
    capacity: 20,
    price: 0,
  })
  const [classFormError, setClassFormError] = useState<string | null>(null)
  const [classFormLoading, setClassFormLoading] = useState(false)

  const openCreateClass = () => {
    setClassFormError(null)
    setEditingClassId(null)
    setClassForm((prev) => ({
      ...prev,
      teacherId: teacherOptions[0]?.id || "",
      date: new Date().toISOString().slice(0, 10),
      capacity: settings?.defaultCapacity ?? prev.capacity,
      price: settings?.defaultPrice ?? prev.price,
    }))
    setShowCreateClassModal(true)
  }

  const openEditClass = (classId: string) => {
    const existing = classes.find((c) => c.id === classId)
    if (!existing) return
    setClassFormError(null)
    setEditingClassId(classId)
    setClassForm({
      teacherId: (existing as any).teacherId || (existing as any).teacher_id || existing.teacher?.id || teacherOptions[0]?.id || "",
      title: existing.title || "",
      description: existing.description || "",
      subject: existing.subject || "",
      date: classDateKey(existing.date as any),
      startTime: existing.startTime || "09:00",
      endTime: existing.endTime || "10:00",
      room: existing.room || "",
      location: existing.location || "",
      capacity: existing.capacity || 20,
      price: existing.price || 0,
    })
    setShowCreateClassModal(true)
  }

  const submitCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setClassFormError(null)
    setClassFormLoading(true)
    try {
      if (!classForm.teacherId) throw new Error("Select a teacher")
      const payload: any = {
        teacherId: classForm.teacherId,
        title: classForm.title,
        description: classForm.description,
        subject: classForm.subject,
        date: classForm.date,
        startTime: classForm.startTime,
        endTime: classForm.endTime,
        room: classForm.room,
        location: classForm.location,
        capacity: Number(classForm.capacity) || 20,
        price: Number(classForm.price) || 0,
      }
      if (editingClassId) {
        await classesApi.update(editingClassId, payload)
      } else {
        await classesApi.create(payload)
      }
      setShowCreateClassModal(false)
      setEditingClassId(null)
      await refreshClassesAndBookings()
    } catch (err) {
      setClassFormError(err instanceof Error ? err.message : "Failed to create class")
    } finally {
      setClassFormLoading(false)
    }
  }

  if (authLoading) {
    return (
      <LayoutWrapper userRole="admin" userName={user?.name || "Admin"}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </LayoutWrapper>
    )
  }

  if (user && user.role !== "ADMIN") {
    return (
      <LayoutWrapper userRole="admin" userName={user?.name || "Admin"}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper userRole="admin" userName={user?.name || "Admin"}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage all classes, bookings, and users (Supabase)</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={openCreateClass}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
            <Button variant="outline" size="sm" onClick={() => void refreshClassesAndBookings()} disabled={dataLoading}>
              {dataLoading ? "Refreshing…" : "Refresh data"}
            </Button>
          </div>
        </div>

        {dataError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {dataError}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className="p-6 bg-secondary/50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              scrollToRevenue()
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-accent mt-2">{formatRupiah(totalRevenue)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-accent opacity-20" />
            </div>
          </Card>

          <Card
            className="p-6 bg-secondary/50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setClassListFilter("all")
              scrollToClasses()
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-3xl font-bold text-primary mt-2">{classes.length}</p>
              </div>
              <Clock className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>

          <Card
            className="p-6 bg-secondary/50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setClassListFilter("all")
              scrollToClasses()
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalEnrolled}</p>
              </div>
              <Users className="w-10 h-10 text-foreground opacity-20" />
            </div>
          </Card>

          <Card
            className="p-6 bg-secondary/50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setClassListFilter("pending")
              scrollToClasses()
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Classes w/ pending payment</p>
                <p className="text-3xl font-bold text-destructive mt-2">{pendingBookings}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-destructive opacity-20" />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Occupancy Rate</h2>
              <p className="text-sm text-muted-foreground">
                {totalEnrolled} enrolled out of {totalCapacity} capacity ({occupancyRate}%)
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Occupancy</p>
              <p className="text-2xl font-bold text-foreground mt-1">{occupancyRate}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Enrolled</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalEnrolled}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Capacity</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalCapacity}</p>
            </Card>
          </div>
        </Card>

        {/* Master Calendar View */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as any)}>
              <TabsList>
                <TabsTrigger value="week">Weekly</TabsTrigger>
                <TabsTrigger value="day">Daily</TabsTrigger>
                <TabsTrigger value="month">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              {calendarView !== "month" ? (
                <Input
                  type="date"
                  value={toISODate(focusDate)}
                  onChange={(e) => setFocusDate(new Date(`${e.target.value}T00:00:00`))}
                  className="w-[170px]"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFocusDate(new Date(focusDate.getFullYear(), focusDate.getMonth() - 1, 1))}
                  >
                    Prev
                  </Button>
                  <span className="text-sm font-medium text-foreground min-w-[170px] text-center">{monthYearLabel}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFocusDate(new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>

          {calendarView === "week" ? (
            <WeeklyCalendar
              slots={calendarSlots}
              onSelectSlot={(slot) => openEditClass((slot as any).details?.classId || (slot as any).id)}
              onSelectEmptySlot={handleEmptyHourClick}
              editable
              initialWeek={focusDate}
              daysToShow={7}
              startHour={settings?.defaultStartHour ?? 8}
              endHour={settings?.defaultEndHour ?? 19}
            />
          ) : calendarView === "day" ? (
            <WeeklyCalendar
              slots={calendarSlots}
              onSelectSlot={(slot) => openEditClass((slot as any).details?.classId || (slot as any).id)}
              onSelectEmptySlot={handleEmptyHourClick}
              editable
              initialWeek={focusDate}
              daysToShow={1}
              startHour={settings?.defaultStartHour ?? 8}
              endHour={settings?.defaultEndHour ?? 19}
            />
          ) : (
            <div className="border border-border rounded-lg overflow-hidden bg-background">
              <div className="grid grid-cols-7 text-xs bg-secondary/30">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="px-3 py-2 font-semibold text-muted-foreground border-r border-border last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((d) => {
                  const iso = toISODate(d)
                  const inMonth = d.getMonth() === monthStart.getMonth()
                  const dayClasses = calendarSlots.filter((s) => s.date === iso)
                  const dayRevenue = dayClasses.reduce((sum, s) => sum + s.details.revenue, 0)
                  return (
                    <button
                      type="button"
                      key={iso}
                      onClick={() => {
                        setFocusDate(new Date(`${iso}T00:00:00`))
                        setCalendarView("day")
                      }}
                      className={`h-24 border-r border-b border-border last:border-r-0 p-2 text-left hover:bg-primary/5 transition-colors ${
                        inMonth ? "" : "opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{d.getDate()}</span>
                        {dayClasses.length > 0 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                            {dayClasses.length} class{dayClasses.length === 1 ? "" : "es"}
                          </span>
                        ) : null}
                      </div>
                      {dayRevenue > 0 ? (
                        <div className="mt-2 text-xs font-semibold text-accent">{formatRupiah(dayRevenue)}</div>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* All Classes List */}
        <Card className="p-6" id="admin-classes-list">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="text-xl font-semibold text-foreground">All Classes & Bookings</h2>
            {classListFilter === "pending" ? (
              <Button variant="outline" size="sm" onClick={() => setClassListFilter("all")}>
                Clear pending filter
              </Button>
            ) : null}
          </div>
          {dataLoading ? (
            <p className="text-muted-foreground py-8 text-center">Loading classes…</p>
          ) : filteredCalendarSlots.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No classes yet. Teachers can create classes from their schedule.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCalendarSlots.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-border hover:border-primary"
                  onClick={() => openEditClass(cls.details.classId)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{cls.title}</h3>
                      {cls.details.status === "pending" ? (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <span>
                          {cls.startTime} - {cls.endTime}
                        </span>
                        <span className="text-xs">· {cls.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{cls.details.teacher}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4 space-y-1">
                    <div className="text-sm font-semibold text-accent">{formatRupiah(cls.details.revenue)}</div>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        cls.details.status === "pending"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-green-500/10 text-green-600"
                      }`}
                    >
                      {cls.details.status === "pending" ? "Pending" : "Confirmed"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* User Management */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">User Management</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
                {(["all", "STUDENT", "TEACHER"] as const).map((role) => (
                  <Button
                    key={role}
                    variant={filterRole === role ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterRole(role)}
                    className={filterRole === role ? "bg-primary text-primary-foreground" : ""}
                  >
                    {role === "all" ? "All" : role === "STUDENT" ? "Students" : "Teachers"}
                  </Button>
                ))}
              </div>
            </div>

            {usersLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No users found. Ensure your account has role ADMIN in Supabase <code className="text-xs">public.users</code>.
                        </td>
                      </tr>
                    ) : (
                      users.map((userItem) => (
                        <tr
                          key={userItem.id}
                          className="border-b border-border hover:bg-secondary/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-foreground font-medium">{userItem.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{userItem.email}</td>
                          <td className="py-3 px-4 text-muted-foreground">{userItem.phone || "-"}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-secondary rounded text-xs font-medium text-foreground capitalize">
                              {userItem.role.toLowerCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">
                            {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm" className="text-xs">
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Class Details */}
        {selectedClass && (
          <Card className="p-6 border-primary bg-secondary/30 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedClass.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedClass.startTime} - {selectedClass.endTime} · {selectedClass.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClass(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Teacher</p>
                <p className="font-semibold text-foreground mt-1">{selectedClass.details.teacher}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Location</p>
                <p className="font-semibold text-foreground mt-1">
                  {[selectedClass.details.room, selectedClass.details.location].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </div>

            <div className="bg-background rounded-lg p-4 space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground text-sm">Enrollment</span>
                  <span className="font-bold text-foreground">
                    {selectedClass.details.enrolled}/{selectedClass.details.capacity}
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (selectedClass.details.enrolled / Math.max(1, selectedClass.details.capacity)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-muted-foreground text-sm mb-1">Recorded payments (completed)</p>
                <p className="text-2xl font-bold text-accent">{formatRupiah(selectedClass.details.revenue)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Attendees</p>
              {attendeesForSelected.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active bookings.</p>
              ) : (
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto border border-border rounded-md p-3 bg-background">
                  {attendeesForSelected.map((b) => (
                    <li key={b.id} className="flex justify-between gap-2">
                      <span>{b.student.name}</span>
                      <span className="text-muted-foreground">{b.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className={`p-3 rounded-lg text-sm ${
                selectedClass.details.status === "pending"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-green-500/10 text-green-600 border border-green-500/20"
              }`}
            >
              {selectedClass.details.status === "pending"
                ? "Some bookings are still pending payment."
                : "No pending-payment bookings for this class."}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="flex-1 min-w-[140px]"
                onClick={() => openEditClass(selectedClass.details.classId)}
              >
                Edit class
              </Button>
              <Button
                variant="destructive"
                className="flex-1 min-w-[140px]"
                disabled={deletingId === selectedClass.details.classId}
                onClick={() => void handleDeleteClass(selectedClass.details.classId)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deletingId === selectedClass.details.classId ? "Deleting…" : "Delete class"}
              </Button>
            </div>
          </Card>
        )}

        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleUserCreated}
          />
        )}

        {showCreateClassModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg p-4 relative max-h-[85vh] overflow-y-auto">
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-foreground mb-4 pr-8">
                {editingClassId ? "Edit Class" : "Create New Class"}
              </h2>

              <form onSubmit={submitCreateClass} className="space-y-4">
                <div>
                  <Label>Teacher</Label>
                  <select
                    value={classForm.teacherId}
                    onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    required
                  >
                    {teacherOptions.length === 0 ? (
                      <option value="">No teachers found</option>
                    ) : (
                      teacherOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.email})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Class Title *</Label>
                    <Input
                      id="title"
                      value={classForm.title}
                      onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={classForm.subject}
                      onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={classForm.description}
                    onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={classForm.date}
                      onChange={(e) => setClassForm({ ...classForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={classForm.startTime}
                      onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={classForm.endTime}
                      onChange={(e) => setClassForm({ ...classForm, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="room">Room</Label>
                    <Input
                      id="room"
                      value={classForm.room}
                      onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={classForm.location}
                      onChange={(e) => setClassForm({ ...classForm, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={classForm.capacity}
                      onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={classForm.price}
                      onChange={(e) => setClassForm({ ...classForm, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                {classFormError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {classFormError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowCreateClassModal(false)
                      setEditingClassId(null)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={classFormLoading}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {classFormLoading ? "Saving..." : editingClassId ? "Save Changes" : "Create Class"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </LayoutWrapper>
  )
}
