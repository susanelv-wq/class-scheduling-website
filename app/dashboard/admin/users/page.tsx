"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { usersApi, type User } from "@/lib/api"
import { X } from "lucide-react"

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

  const filteredUsers = useMemo(() => users, [users])

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
