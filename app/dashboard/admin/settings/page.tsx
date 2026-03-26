"use client"

import { useEffect, useMemo, useState } from "react"
import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth-context"
import { settingsApi, type AppSettings } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function AdminSettingsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState<AppSettings>({
    orgName: "Indonesian Language Course",
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    currencyCode: "IDR",
    defaultStartHour: 8,
    defaultEndHour: 19,
    defaultClassDurationMinutes: 60,
    defaultCapacity: 20,
    defaultPrice: 0,
    allowStudentBooking: true,
    bookingWindowDays: 60,
    paymentWindowMinutes: 120,
    cancellationWindowMinutes: 0,
    requirePhone: false,
    supportEmail: null,
    supportWhatsApp: null,
    termsUrl: null,
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return
    if (user.role !== "ADMIN") router.replace(`/dashboard/${user.role.toLowerCase()}`)
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") return
    setLoading(true)
    setError(null)
    setSuccess(null)
    settingsApi
      .get()
      .then((s) => setForm(s))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load settings"))
      .finally(() => setLoading(false))
  }, [isAuthenticated, user?.role])

  const hoursError = useMemo(() => {
    if (form.defaultStartHour < 0 || form.defaultStartHour > 23) return "Start hour must be between 0 and 23"
    if (form.defaultEndHour < 0 || form.defaultEndHour > 23) return "End hour must be between 0 and 23"
    if (form.defaultEndHour <= form.defaultStartHour) return "End hour must be after start hour"
    return null
  }, [form.defaultStartHour, form.defaultEndHour])

  const paymentWindowError = useMemo(() => {
    if (form.paymentWindowMinutes < 0 || form.paymentWindowMinutes > 1440) return "Payment window must be between 0 and 1440 minutes"
    return null
  }, [form.paymentWindowMinutes])

  const bookingWindowError = useMemo(() => {
    if (form.bookingWindowDays < 1 || form.bookingWindowDays > 365) return "Booking window must be between 1 and 365 days"
    return null
  }, [form.bookingWindowDays])

  const cancellationWindowError = useMemo(() => {
    if (form.cancellationWindowMinutes < 0 || form.cancellationWindowMinutes > 10080) {
      return "Cancellation window must be between 0 and 10080 minutes"
    }
    return null
  }, [form.cancellationWindowMinutes])

  const defaultsError = useMemo(() => {
    if (form.defaultClassDurationMinutes < 15 || form.defaultClassDurationMinutes > 360) {
      return "Default class duration must be between 15 and 360 minutes"
    }
    if (form.defaultCapacity < 1 || form.defaultCapacity > 200) return "Default capacity must be between 1 and 200"
    if (form.defaultPrice < 0) return "Default price must be >= 0"
    return null
  }, [form.defaultClassDurationMinutes, form.defaultCapacity, form.defaultPrice])

  const canSave =
    !loading &&
    !saving &&
    !hoursError &&
    !paymentWindowError &&
    !bookingWindowError &&
    !cancellationWindowError &&
    !defaultsError

  const onSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await settingsApi.update(form)
      setForm(updated)
      setSuccess("Saved")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <LayoutWrapper userRole="admin" userName={user?.name || "Admin"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage system settings and configurations</p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <Card className="p-6 space-y-6">
          {loading ? (
            <p className="text-muted-foreground">Loading settings…</p>
          ) : (
            <>
              {/* Branding */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Branding & locale</h2>
                  <p className="text-sm text-muted-foreground mt-1">These values are used across dashboards and emails.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization name</Label>
                    <Input
                      id="orgName"
                      value={form.orgName}
                      onChange={(e) => setForm((p) => ({ ...p, orgName: e.target.value }))}
                      placeholder="Indonesian Language Course"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={form.timezone}
                      onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                      placeholder="Asia/Jakarta"
                    />
                    <p className="text-xs text-muted-foreground">Used for displaying dates/times in the UI.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locale">Locale</Label>
                    <Input
                      id="locale"
                      value={form.locale}
                      onChange={(e) => setForm((p) => ({ ...p, locale: e.target.value }))}
                      placeholder="id-ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currencyCode">Currency code</Label>
                    <Input
                      id="currencyCode"
                      value={form.currencyCode}
                      onChange={(e) => setForm((p) => ({ ...p, currencyCode: e.target.value.toUpperCase() }))}
                      placeholder="IDR"
                    />
                    <p className="text-xs text-muted-foreground">ISO 4217 currency code (e.g. IDR, USD).</p>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Calendar defaults</h2>
                  <p className="text-sm text-muted-foreground mt-1">Controls the time range shown in calendars.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultStartHour">Start hour</Label>
                    <Input
                      id="defaultStartHour"
                      type="number"
                      min={0}
                      max={23}
                      value={form.defaultStartHour}
                      onChange={(e) => setForm((p) => ({ ...p, defaultStartHour: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultEndHour">End hour</Label>
                    <Input
                      id="defaultEndHour"
                      type="number"
                      min={0}
                      max={23}
                      value={form.defaultEndHour}
                      onChange={(e) => setForm((p) => ({ ...p, defaultEndHour: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultClassDurationMinutes">Default class duration (minutes)</Label>
                    <Input
                      id="defaultClassDurationMinutes"
                      type="number"
                      min={15}
                      max={360}
                      value={form.defaultClassDurationMinutes}
                      onChange={(e) => setForm((p) => ({ ...p, defaultClassDurationMinutes: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground">Used when clicking empty time slots to create a class.</p>
                  </div>
                </div>
              </div>

              {/* Booking & payments */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Booking & payments</h2>
                  <p className="text-sm text-muted-foreground mt-1">Rules that affect booking availability and payment deadlines.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bookingWindowDays">Booking window (days)</Label>
                    <Input
                      id="bookingWindowDays"
                      type="number"
                      min={1}
                      max={365}
                      value={form.bookingWindowDays}
                      onChange={(e) => setForm((p) => ({ ...p, bookingWindowDays: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground">How far ahead students can book.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentWindowMinutes">Payment window (minutes)</Label>
                    <Input
                      id="paymentWindowMinutes"
                      type="number"
                      min={0}
                      max={1440}
                      value={form.paymentWindowMinutes}
                      onChange={(e) => setForm((p) => ({ ...p, paymentWindowMinutes: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground">Time allowed to pay before auto-cancel.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cancellationWindowMinutes">Cancellation window (minutes)</Label>
                    <Input
                      id="cancellationWindowMinutes"
                      type="number"
                      min={0}
                      max={10080}
                      value={form.cancellationWindowMinutes}
                      onChange={(e) => setForm((p) => ({ ...p, cancellationWindowMinutes: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground">Minimum minutes before start time a booking can be cancelled.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Allow student booking</p>
                      <p className="text-xs text-muted-foreground">Turn off to temporarily disable new bookings.</p>
                    </div>
                    <Switch
                      checked={form.allowStudentBooking}
                      onCheckedChange={(v) => setForm((p) => ({ ...p, allowStudentBooking: Boolean(v) }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Require phone number</p>
                      <p className="text-xs text-muted-foreground">If enabled, phone becomes required for bookings.</p>
                    </div>
                    <Switch
                      checked={form.requirePhone}
                      onCheckedChange={(v) => setForm((p) => ({ ...p, requirePhone: Boolean(v) }))}
                    />
                  </div>
                </div>
              </div>

              {/* Defaults */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Default class values</h2>
                  <p className="text-sm text-muted-foreground mt-1">Used as defaults when creating a new class.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCapacity">Default capacity</Label>
                    <Input
                      id="defaultCapacity"
                      type="number"
                      min={1}
                      max={200}
                      value={form.defaultCapacity}
                      onChange={(e) => setForm((p) => ({ ...p, defaultCapacity: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultPrice">Default price</Label>
                    <Input
                      id="defaultPrice"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.defaultPrice}
                      onChange={(e) => setForm((p) => ({ ...p, defaultPrice: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              {/* Contact & legal */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Support & legal</h2>
                  <p className="text-sm text-muted-foreground mt-1">Shown in guidance messages and future emails.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support email</Label>
                    <Input
                      id="supportEmail"
                      value={form.supportEmail || ""}
                      onChange={(e) => setForm((p) => ({ ...p, supportEmail: e.target.value || null }))}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportWhatsApp">Support WhatsApp</Label>
                    <Input
                      id="supportWhatsApp"
                      value={form.supportWhatsApp || ""}
                      onChange={(e) => setForm((p) => ({ ...p, supportWhatsApp: e.target.value || null }))}
                      placeholder="+62..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="termsUrl">Terms / policy URL</Label>
                    <Input
                      id="termsUrl"
                      value={form.termsUrl || ""}
                      onChange={(e) => setForm((p) => ({ ...p, termsUrl: e.target.value || null }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {(hoursError || paymentWindowError || bookingWindowError || cancellationWindowError || defaultsError) && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {hoursError || paymentWindowError || bookingWindowError || cancellationWindowError || defaultsError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => window.location.reload()} disabled={saving}>
                  Reset
                </Button>
                <Button onClick={onSave} disabled={!canSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </LayoutWrapper>
  )
}
