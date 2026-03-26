"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Clock, MapPin, Users, CheckCircle } from "lucide-react"
import { bookingsApi } from "@/lib/api"
import { formatRupiah } from "@/lib/currency"
import { BookingPaymentFlow } from "@/components/student/booking-payment-flow"

interface ClassDetailsModalProps {
  class: {
    id: string
    title: string
    teacher: string
    subject: string
    room: string
    location: string
    time: string
    date: string
    price: number
    capacity: number
    enrolled: number
    description: string
    alreadyBooked?: boolean
  }
  onClose: () => void
}

export function ClassDetailsModal({ class: cls, onClose }: ClassDetailsModalProps) {
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [booking, setBooking] = useState<{ id: string; expiresAt?: string | null } | null>(null)
  const spotsLeft = cls.capacity - cls.enrolled

  const handleConfirmBooking = async () => {
    setIsLoading(true)
    setBookingError(null)
    try {
      const b = await bookingsApi.create(cls.id)
      setBooking({ id: b.id, expiresAt: b.expiresAt })
    } catch (err: any) {
      setBookingError(err?.message || "Failed to create booking. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">{cls.title}</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Subject</p>
                  <p className="text-sm font-medium text-foreground mt-1">{cls.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Teacher</p>
                  <p className="text-sm font-medium text-foreground mt-1">{cls.teacher}</p>
                </div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-5 h-5 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium text-foreground">{cls.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium text-foreground">
                      {cls.room}, {cls.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-5 h-5 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground">Availability</p>
                    <p className="font-medium text-foreground">
                      {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left ({cls.enrolled}/{cls.capacity})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Course Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{cls.description}</p>
            </div>

            {cls.alreadyBooked ? (
              <div className="border-t border-border pt-6 space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Already Booked</h3>
                  <p className="text-sm text-muted-foreground">You have already registered for this class.</p>
                </div>
                <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Close
                </Button>
              </div>
            ) : !booking ? (
              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Price per class:</span>
                  <span className="text-3xl font-bold text-accent">{formatRupiah(cls.price)}</span>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">
                    You have 2 hours after booking to complete payment. If not paid within 2 hours, your reservation
                    will be automatically cancelled.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setShowBookingForm(true)}
                    disabled={spotsLeft <= 0}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {spotsLeft > 0 ? "Continue to Booking" : "Class Full"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-border pt-6">
                <BookingPaymentFlow
                  booking={booking}
                  class={cls}
                  onExpired={() => {
                    setBooking(null)
                    setShowBookingForm(false)
                  }}
                  onComplete={() => {
                    onClose()
                    if (typeof window !== "undefined") window.location.reload()
                  }}
                />
              </div>
            )}

            {showBookingForm && !booking && !cls.alreadyBooked && (
              <div className="border-t border-border pt-6 space-y-4 bg-secondary/30 rounded-lg p-4">
                <h3 className="font-semibold text-foreground">Booking Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                {bookingError && <p className="text-sm text-red-500 mt-2">{bookingError}</p>}
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setShowBookingForm(false)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={isLoading}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {isLoading ? "Booking..." : "Confirm Booking"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
