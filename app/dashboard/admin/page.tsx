"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WeeklyCalendar } from "@/components/ui/weekly-calendar"
import { Users, Clock, DollarSign, AlertCircle, CheckCircle, UserPlus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { classesApi, usersApi, type Class, type User } from "@/lib/api"
import { CreateUserModal } from "@/components/admin/create-user-modal"

// Mock data for all classes and bookings (will be replaced with real data)
const mockAllClasses = [
  {
    id: 1,
    title: "Advanced JavaScript",
    startTime: "10:00",
    endTime: "11:30",
    date: "2025-12-12",
    details: {
      teacher: "John Smith",
      room: "Room 101",
      location: "Building A",
      enrolled: 15,
      capacity: 20,
      revenue: 749.85,
      status: "confirmed",
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
      room: "Room 205",
      location: "Building B",
      enrolled: 20,
      capacity: 25,
      revenue: 799.8,
      status: "confirmed",
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
      room: "Room 102",
      location: "Building A",
      enrolled: 12,
      capacity: 18,
      revenue: 719.88,
      status: "confirmed",
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
      room: "Room 301",
      location: "Building C",
      enrolled: 8,
      capacity: 15,
      revenue: 359.92,
      status: "pending",
    },
    color: "destructive",
  },
]

const mockUsers = [
  { id: 1, name: "Alice Student", email: "alice@example.com", role: "student", bookings: 3, status: "active" },
  { id: 2, name: "Bob Teacher", email: "bob@example.com", role: "teacher", bookings: 4, status: "active" },
  { id: 3, name: "Carol Student", email: "carol@example.com", role: "student", bookings: 1, status: "active" },
  { id: 4, name: "David Teacher", email: "david@example.com", role: "teacher", bookings: 6, status: "active" },
  { id: 5, name: "Eve Student", email: "eve@example.com", role: "student", bookings: 2, status: "inactive" },
]

export default function AdminDashboard() {
  const [selectedClass, setSelectedClass] = useState<(typeof mockAllClasses)[0] | null>(null)
  const [filterRole, setFilterRole] = useState<"all" | "STUDENT" | "TEACHER">("all")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/")
      return
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const roleFilter = filterRole === "all" ? undefined : filterRole
        const data = await usersApi.getAll({ role: roleFilter })
        setUsers(data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchUsers()
    }
  }, [isAuthenticated, filterRole])

  const handleUserCreated = () => {
    // Refresh users list
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

  const getFilteredUsers = () => {
    return users
  }

  const filteredUsers = getFilteredUsers()
  const totalRevenue = mockAllClasses.reduce((sum, cls) => sum + cls.details.revenue, 0)
  const totalEnrolled = mockAllClasses.reduce((sum, cls) => sum + cls.details.enrolled, 0)
  const pendingBookings = mockAllClasses.filter((cls) => cls.details.status === "pending").length

  if (authLoading) {
    return (
      <LayoutWrapper userRole="admin" userName={user?.name || "Admin"}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper userRole="admin" userName={user?.name || "Admin"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage all classes, bookings, and users</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-secondary/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-accent mt-2">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-accent opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-secondary/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-3xl font-bold text-primary mt-2">{mockAllClasses.length}</p>
              </div>
              <Clock className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-secondary/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalEnrolled}</p>
              </div>
              <Users className="w-10 h-10 text-foreground opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-secondary/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-3xl font-bold text-destructive mt-2">{pendingBookings}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-destructive opacity-20" />
            </div>
          </Card>
        </div>

        {/* Master Calendar View */}
        <Card className="p-6">
          <WeeklyCalendar
            slots={mockAllClasses}
            onSelectSlot={(slot) => setSelectedClass(slot)}
            startHour={8}
            endHour={18}
          />
        </Card>

        {/* All Classes List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">All Classes & Bookings</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mockAllClasses.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-border hover:border-primary"
                onClick={() => setSelectedClass(cls)}
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
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{cls.details.teacher}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4 space-y-1">
                  <div className="text-sm font-semibold text-accent">${cls.details.revenue.toFixed(2)}</div>
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
        </Card>

        {/* User Management */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">User Management</h2>
              <div className="flex gap-2">
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

            {loading ? (
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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((userItem) => (
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
                            {userItem.createdAt
                              ? new Date(userItem.createdAt).toLocaleDateString()
                              : "-"}
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
                <p className="text-xs text-muted-foreground font-medium">Teacher</p>
                <p className="font-semibold text-foreground mt-1">{selectedClass.details.teacher}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Time</p>
                <p className="font-semibold text-foreground mt-1">
                  {selectedClass.startTime} - {selectedClass.endTime}
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
                      width: `${(selectedClass.details.enrolled / selectedClass.details.capacity) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-muted-foreground text-sm mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-accent">${selectedClass.details.revenue.toFixed(2)}</p>
              </div>
            </div>

            <div
              className={`p-3 rounded-lg text-sm ${
                selectedClass.details.status === "pending"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-green-500/10 text-green-600 border border-green-500/20"
              }`}
            >
              {selectedClass.details.status === "pending"
                ? "This booking is pending payment confirmation"
                : "All payments confirmed"}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1">
                View Attendees
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Send Announcement
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
      </div>
    </LayoutWrapper>
  )
}
