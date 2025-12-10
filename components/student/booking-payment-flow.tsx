"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Clock, CreditCard } from "lucide-react"

interface BookingPaymentFlowProps {
  class: {
    id: number
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
}

export function BookingPaymentFlow({ class: cls, onComplete }: BookingPaymentFlowProps) {
  const [step, setStep] = useState<"booking" | "payment" | "confirmed">("booking")
  const [bookingData, setBookingData] = useState({
    fullName: "",
    email: "",
    phone: "",
  })
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  })
  const [timeoutMinutes, setTimeoutMinutes] = useState(120)

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (bookingData.fullName && bookingData.email && bookingData.phone) {
      setStep("payment")
      // Start 2-hour countdown
      const countdown = setInterval(() => {
        setTimeoutMinutes((prev) => {
          if (prev <= 1) {
            clearInterval(countdown)
            setStep("booking") // Reset on timeout
            return 120
          }
          return prev - 1
        })
      }, 60000)
    }
  }

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentData.cardNumber && paymentData.expiryDate && paymentData.cvv && paymentData.cardholderName) {
      setStep("confirmed")
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div
            className={`p-3 rounded-lg font-medium text-center transition-all ${
              step === "booking" || step === "payment" || step === "confirmed"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Booking
          </div>
        </div>
        <div className="h-1 flex-1 bg-muted mx-2" />
        <div className="flex-1">
          <div
            className={`p-3 rounded-lg font-medium text-center transition-all ${
              step === "payment" || step === "confirmed"
                ? step === "confirmed"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground"
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

      {/* Booking Step */}
      {step === "booking" && (
        <form onSubmit={handleBooking} className="space-y-4">
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-foreground font-medium">
              <Clock className="w-4 h-4 text-accent" />
              <span>Expires in: {formatTime(timeoutMinutes)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Full Name *</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={bookingData.fullName}
                onChange={(e) => setBookingData({ ...bookingData, fullName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Email *</label>
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={bookingData.email}
                onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                value={bookingData.phone}
                onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> You have 2 hours to complete payment after booking confirmation. If not completed
              within this time, your reservation will be automatically cancelled and the booking released.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              Continue to Payment
            </Button>
          </div>
        </form>
      )}

      {/* Payment Step */}
      {step === "payment" && (
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-foreground font-medium">
              <Clock className="w-4 h-4 text-accent" />
              <span>Time remaining: {formatTime(timeoutMinutes)}</span>
            </div>
          </div>

          <Card className="p-4 border-border bg-secondary/20">
            <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{cls.title}</span>
                <span className="font-medium text-foreground">${cls.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{cls.time}</span>
                <span>{cls.date}</span>
              </div>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-foreground">
              <span>Total Amount:</span>
              <span className="text-lg text-accent">${cls.price.toFixed(2)}</span>
            </div>
          </Card>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Cardholder Name *</label>
              <input
                type="text"
                required
                placeholder="As shown on card"
                value={paymentData.cardholderName}
                onChange={(e) => setPaymentData({ ...paymentData, cardholderName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Card Number *</label>
              <input
                type="text"
                required
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Expiry Date *</label>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  maxLength={5}
                  value={paymentData.expiryDate}
                  onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">CVV *</label>
                <input
                  type="text"
                  required
                  placeholder="123"
                  maxLength={4}
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-lg p-3 border border-border text-xs text-muted-foreground">
            <p>
              <strong>Security:</strong> Your payment information is encrypted and secure. We use industry-standard
              PCI-DSS compliance.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep("booking")} className="flex-1">
              Back
            </Button>
            <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${cls.price.toFixed(2)}
            </Button>
          </div>
        </form>
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
              <p className="text-xl font-bold text-accent">${cls.price.toFixed(2)}</p>
            </div>
          </Card>

          <div className="bg-secondary/50 rounded-lg p-4 border border-border">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <p className="font-medium text-foreground mb-1">What happens next?</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  A confirmation email has been sent to {bookingData.email}. Please check your email for booking details
                  and further instructions.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={onComplete} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Back to Available Classes
          </Button>
        </div>
      )}
    </div>
  )
}
