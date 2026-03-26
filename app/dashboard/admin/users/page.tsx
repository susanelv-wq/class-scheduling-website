"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { bookingsApi, classesApi, usersApi, type Booking, type Class, type User } from "@/lib/api"
import { X } from "lucide-react"
import { formatRupiah } from "@/lib/currency"

export default function AdminUsersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filterRole, setFilterRole] = useState<"all" | "STUDENT" | "TEACHER" | "ADMIN">("all")
  const [search, setSearch] = useState("")

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: "STUDENT" as "STUDENT" | "TEACHER" | "ADMIN",
  })

  // Revenue breakdown state (moved from dashboard)
  const [classes, setClasses] = useState<Class[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [revenueError, setRevenueError] = useState<string | null>(null)
  const [revenueYear, setRevenueYear] = useState(() => new Date().getFullYear())
  const [revenueMonth, setRevenueMonth] = useState<number | "all">("all")

  const refreshRevenue = async () => {
    setRevenueLoading(true)
    setRevenueError(null)
    try {
      const [c, b] = await Promise.all([classesApi.getAll(), bookingsApi.getAll()])
      setClasses(c)
      setBookings(b)
    } catch (e) {
      setRevenueError(e instanceof Error ? e.message : "Failed to load revenue data")
    } finally {
      setRevenueLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const role = filterRole === "all" ? undefined : filterRole
      const data = await usersApi.getAll({ role, search: search || undefined })
      setUsers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return
    if (user.role !== "ADMIN") router.replace(`/dashboard/${user.role.toLowerCase()}`)
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") void fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role, filterRole, search])

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") void refreshRevenue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role])

  const filteredUsers = useMemo(() => users, [users])

  const revenueSlots = useMemo(() => {
    // Build per-class revenue from bookings/payments
    const byClass = new Map<string, { classId: string; title: string; date: string; teacher: string; revenue: number }>()
    for (const cls of classes) {
      byClass.set(cls.id, {
        classId: cls.id,
        title: cls.title,
        date: (typeof cls.date === "string" ? cls.date : new Date(cls.date as any).toISOString()).slice(0, 10),
        teacher: cls.teacher?.name || "Unknown",
        revenue: 0,
      })
    }
    for (const b of bookings) {
      if (b.payment?.status !== "COMPLETED") continue
      const cid = b.class?.id
      if (!cid) continue
      if (!byClass.has(cid)) continue
      byClass.get(cid)!.revenue += b.payment.amount || 0
    }
    return Array.from(byClass.values())
  }, [classes, bookings])

  const revenueByClass = useMemo(() => {
    const monthIdx = revenueMonth === "all" ? null : revenueMonth
    return revenueSlots
      .filter((s) => {
        const d = new Date(`${s.date}T00:00:00`)
        if (d.getFullYear() !== revenueYear) return false
        if (monthIdx !== null && d.getMonth() !== monthIdx) return false
        return s.revenue > 0
      })
      .sort((a, b) => b.revenue - a.revenue)
  }, [revenueSlots, revenueYear, revenueMonth])

  const monthlyRevenueSummary = useMemo(() => {
    const totals = Array.from({ length: 12 }, () => ({ classes: 0, revenue: 0 }))
    const seenClass = new Set<string>()
    for (const s of revenueSlots) {
      const d = new Date(`${s.date}T00:00:00`)
      if (d.getFullYear() !== revenueYear) continue
      const m = d.getMonth()
      if (!seenClass.has(s.classId)) {
        totals[m].classes += 1
        seenClass.add(s.classId)
      }
      totals[m].revenue += s.revenue
    }
    return totals
  }, [revenueSlots, revenueYear])

  const openEdit = (u: User) => {
    setEditError(null)
    setEditingUser(u)
    setEditForm({
      name: u.name || "",
      phone: u.phone || "",
      role: u.role,
    })
  }

  const closeEdit = () => {
    setEditingUser(null)
    setEditError(null)
    setEditLoading(false)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setEditLoading(true)
    setEditError(null)
    try {
      // Update name/phone via usersApi.update (profile table)
      await usersApi.update(editingUser.id, {
        name: editForm.name,
        phone: editForm.phone,
      })

      // Role change: use Supabase update directly through usersApi.update isn't wired for role
      // so we call usersApi.getById after role update via a lightweight update request.
      // This relies on admin RLS allowing updates to `public.users`.
      await (await import("@/lib/supabase")).supabase
        .from("users")
        .update({ role: editForm.role })
        .eq("id", editingUser.id)

      closeEdit()
      await fetchUsers()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save user")
    } finally {
      setEditLoading(false)
    }
  }

  const deleteProfile = async (u: User) => {
    if (!confirm("Delete this user profile row? (Does not delete Supabase Auth user)")) return
    try {
      await usersApi.delete(u.id)
      await fetchUsers()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete user")
    }
  }

  return (
    <LayoutWrapper userRole="admin" userName={user?.name || "Admin"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage all users in the system</p>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name"
              />
            </div>
            <div className="w-full md:w-64">
              <Label>Role</Label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="all">All</option>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <Button variant="outline" onClick={() => void fetchUsers()} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 text-muted-foreground">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-muted-foreground">No users found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border hover:bg-secondary/20">
                    <td className="py-3 px-4 text-foreground font-medium">{u.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-4 text-muted-foreground">{u.phone || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-secondary rounded text-xs font-medium text-foreground">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => void deleteProfile(u)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Revenue Breakdown (moved here from dashboard) */}
        <Card className="p-6" id="revenue">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Revenue Breakdown</h2>
              <p className="text-sm text-muted-foreground">See which classes generated revenue, by month and year.</p>
            </div>
            <div className="flex gap-2 items-end flex-wrap">
              <Button variant="outline" onClick={() => void refreshRevenue()} disabled={revenueLoading}>
                {revenueLoading ? "Loading..." : "Refresh revenue"}
              </Button>
              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={revenueYear}
                  onChange={(e) => setRevenueYear(Number(e.target.value) || new Date().getFullYear())}
                  className="w-[110px]"
                />
              </div>
              <div>
                <Label>Month</Label>
                <select
                  value={revenueMonth === "all" ? "all" : String(revenueMonth)}
                  onChange={(e) => setRevenueMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="w-[170px] px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="all">All months</option>
                  {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                    <option key={i} value={i}>
                      {new Date(2000, i, 1).toLocaleString(undefined, { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {revenueError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
              {revenueError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="p-4 bg-secondary/20 border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Monthly totals ({revenueYear})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">Month</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Classes</th>
                      <th className="text-right py-2 pl-2 font-semibold text-muted-foreground">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRevenueSummary.map((m, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer"
                        onClick={() => setRevenueMonth(idx)}
                      >
                        <td className="py-2 pr-2 text-foreground">
                          {new Date(2000, idx, 1).toLocaleString(undefined, { month: "long" })}
                        </td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{m.classes}</td>
                        <td className="py-2 pl-2 text-right font-semibold text-accent">{formatRupiah(m.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click a month to filter the revenue list.</p>
            </Card>

            <Card className="p-4 bg-secondary/20 border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Sample data</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>In Supabase, ensure you have at least 1 TEACHER and 1 STUDENT in <code className="text-xs">public.users</code>.</li>
                <li>Open Supabase Dashboard → SQL Editor.</li>
                <li>Run <code className="text-xs">supabase/sample-data.sql</code>.</li>
              </ol>
            </Card>
          </div>

          {revenueLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading revenue…</div>
          ) : revenueByClass.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No completed-payment revenue found for this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Class</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Teacher</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByClass.map((r) => (
                    <tr key={r.classId} className="border-b border-border hover:bg-secondary/20">
                      <td className="py-3 px-4 text-foreground font-medium">{r.title}</td>
                      <td className="py-3 px-4 text-muted-foreground">{r.teacher}</td>
                      <td className="py-3 px-4 text-muted-foreground">{r.date}</td>
                      <td className="py-3 px-4 text-right font-semibold text-accent">{formatRupiah(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg p-6 relative">
              <button
                onClick={closeEdit}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-foreground mb-4">Edit User</h2>
              <form onSubmit={saveEdit} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Role</Label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                {editError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {editError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={closeEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={editLoading}>
                    {editLoading ? "Saving..." : "Save"}
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
