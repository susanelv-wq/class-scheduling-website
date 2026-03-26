"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Clock, CreditCard } from "lucide-react"
import { formatRupiah } from "@/lib/currency"
import { bookingsApi, paymentsApi } from "@/lib/api"

interface BookingPaymentFlowProps {
  booking: {
    id: string
    expiresAt?: string | null
  }
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
  }
  onComplete: () => void
  onExpired?: () => void
}

export function BookingPaymentFlow({ class: cls, booking, onComplete, onExpired }: BookingPaymentFlowProps) {
  const [step, setStep] = useState<"payment" | "confirmed" | "expired">("payment")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const expiresAtMs = useMemo(() => {
    if (!booking.expiresAt) return null
    const t = Date.parse(booking.expiresAt)
    return Number.isFinite(t) ? t : null
  }, [booking.expiresAt])

  const remainingMs = useMemo(() => {
    if (!expiresAtMs) return null
    return Math.max(0, expiresAtMs - now)
  }, [expiresAtMs, now])

  useEffect(() => {
    if (!expiresAtMs) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiresAtMs])

  useEffect(() => {
    if (step !== "payment") return
    if (remainingMs === null) return
    if (remainingMs <= 0) {
      setStep("expired")
      onExpired?.()
    }
  }, [remainingMs, step, onExpired])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${String(secs).padStart(2, "0")}`
  }

  const handleSimulatePay = async () => {
    setBusy(true)
    setError(null)
    try {
      await paymentsApi.create(booking.id, "FAKE", `fake-${Date.now()}`)
      setStep("confirmed")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed")
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    setBusy(true)
    setError(null)
    try {
      await bookingsApi.cancel(booking.id)
      setStep("expired")
      onExpired?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel reservation")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="p-3 rounded-lg font-medium text-center transition-all bg-primary text-primary-foreground">
            Booking
          </div>
        </div>
        <div className="h-1 flex-1 bg-muted mx-2" />
        <div className="flex-1">
          <div
            className={`p-3 rounded-lg font-medium text-center transition-all ${
              step === "payment"
                ? "bg-accent text-accent-foreground"
                : step === "confirmed"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Payment
          </div>
        </div>
        <div className="h-1 flex-1 bg-muted mx-2" />
        <div className="flex-1">
          <div
            className={`p-3 rounded-lg font-medium text-center transition-all ${
              step === "confirmed" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            Confirmed
          </div>
        </div>
      </div>

      {/* Payment Step */}
      {step === "payment" && (
        <div className="space-y-4">
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-foreground font-medium">
              <Clock className="w-4 h-4 text-accent" />
              <span>Time remaining: {remainingMs === null ? "—" : formatTime(remainingMs)}</span>
            </div>
          </div>

          <Card className="p-4 border-border bg-secondary/20">
            <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{cls.title}</span>
                <span className="font-medium text-foreground">{formatRupiah(cls.price)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{cls.time}</span>
                <span>{cls.date}</span>
              </div>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-foreground">
              <span>Total Amount:</span>
              <span className="text-lg text-accent">{formatRupiah(cls.price)}</span>
            </div>
          </Card>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={busy} className="flex-1">
              Cancel reservation
            </Button>
            <Button type="button" onClick={handleSimulatePay} disabled={busy} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
              <CreditCard className="w-4 h-4 mr-2" />
              {busy ? "Processing…" : "Simulate payment success"}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Step */}
      {step === "confirmed" && (
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Payment Successful!</h3>
            <p className="text-muted-foreground">Your booking has been confirmed and paid for.</p>
          </div>

          <Card className="p-6 bg-secondary/30 border-border text-left space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Class</p>
              <p className="font-semibold text-foreground">{cls.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="font-medium text-foreground">{cls.time}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">{cls.room}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="text-xl font-bold text-accent">{formatRupiah(cls.price)}</p>
            </div>
          </Card>

          <Button onClick={onComplete} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Back to Available Classes
          </Button>
        </div>
      )}

      {step === "expired" && (
        <div className="text-center space-y-4 py-6">
          <div className="flex justify-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Reservation expired</h3>
            <p className="text-sm text-muted-foreground">This spot has been released. Please try booking again.</p>
          </div>
          <Button onClick={onComplete} className="w-full">
            Close
          </Button>
        </div>
      )}
    </div>
  )
}
