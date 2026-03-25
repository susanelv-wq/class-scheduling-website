"use client"

import { useState, useEffect } from "react"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Card } from "@/components/ui/card"
import { bookingsApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { CheckCircle, Clock } from "lucide-react"

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      bookingsApi
        .getAll({ studentId: user.id })
        .then((data) => setBookings(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [user?.id])

  return (
    <LayoutWrapper userRole="student" userName={user?.name || "Student"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground mt-1">View and manage your class bookings</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading your bookings...</p>
        ) : bookings.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">No bookings yet</p>
            <p className="text-sm mt-1">Go to Available Classes to book your first session.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Card key={b.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {b.status === "CONFIRMED" ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{b.class?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.class?.date} · {b.class?.startTime}–{b.class?.endTime}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    b.status === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : b.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {b.status}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutWrapper>
  )
}
