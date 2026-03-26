import { assertSupabaseEnv, clearSupabaseBrowserAuth, supabase } from "@/lib/supabase"

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string | null
  role: "STUDENT" | "TEACHER" | "ADMIN"
  createdAt?: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface Class {
  id: string
  title: string
  description?: string | null
  subject?: string | null
  startTime: string
  endTime: string
  date: string
  room?: string | null
  location?: string | null
  capacity: number
  price: number
  status: string
  enrolled?: number
  availableSpots?: number
  teacher?: {
    id: string
    name: string
    email: string
  }
}

export interface Booking {
  id: string
  status: string
  bookingDate: string
  expiresAt?: string | null
  student: User
  class: Class
  payment?: {
    id: string
    amount: number
    status: string
  }
}

export interface AppSettings {
  orgName: string
  timezone: string
  locale: string
  currencyCode: string
  defaultStartHour: number
  defaultEndHour: number
  defaultClassDurationMinutes: number
  defaultCapacity: number
  defaultPrice: number
  allowStudentBooking: boolean
  bookingWindowDays: number
  paymentWindowMinutes: number
  cancellationWindowMinutes: number
  requirePhone: boolean
  supportEmail?: string | null
  supportWhatsApp?: string | null
  termsUrl?: string | null
}

type UserRole = "STUDENT" | "TEACHER" | "ADMIN"
type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
type ClassStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED"

type AppSettingsRow = {
  orgName: string
  timezone: string
  locale: string
  currencyCode: string
  defaultStartHour: number
  defaultEndHour: number
  defaultClassDurationMinutes: number
  defaultCapacity: number
  defaultPrice: number
  allowStudentBooking: boolean
  bookingWindowDays: number
  paymentWindowMinutes: number
  cancellationWindowMinutes: number
  requirePhone: boolean
  supportEmail: string | null
  supportWhatsApp: string | null
  termsUrl: string | null
}

type UserRow = {
  id: string
  email: string
  name: string
  phone: string | null
  role: UserRole
  createdAt?: string
}

type ClassRow = {
  id: string
  title: string
  description: string | null
  subject: string | null
  startTime: string
  endTime: string
  date: string
  room: string | null
  location: string | null
  capacity: number
  price: number
  status: ClassStatus
  teacherId?: string
  teacher_id?: string
}

type BookingRow = {
  id: string
  status: BookingStatus
  bookingDate: string
  expiresAt: string | null
  studentId: string
  classId: string
}

type PaymentRow = {
  id: string
  amount: number
  status: PaymentStatus
  paymentMethod: string | null
  transactionId: string | null
  paidAt: string | null
  userId: string
  bookingId: string
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  phone: row.phone,
  role: row.role,
  createdAt: row.createdAt,
})

const ensureSupabaseReady = () => {
  assertSupabaseEnv()
}

const resolveTeacherId = (row: ClassRow): string => row.teacherId || row.teacher_id || ""

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForSession = async (expectedUserId?: string, attempts = 8): Promise<string> => {
  for (let i = 0; i < attempts; i += 1) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.access_token && (!expectedUserId || session.user.id === expectedUserId)) {
      return session.access_token
    }

    await sleep(150)
  }

  throw new Error("Session not ready yet. Please try again.")
}

const fetchUserProfile = async (userId: string, attempts = 6): Promise<UserRow> => {
  for (let i = 0; i < attempts; i += 1) {
    const { data: profile, error } = await supabase
      .from("users")
      .select("id,email,name,phone,role,createdAt")
      .eq("id", userId)
      .single()

    if (profile) {
      return profile as UserRow
    }

    if (!error || error.code === "PGRST116") {
      await sleep(150)
      continue
    }

    throw new Error(error.message)
  }

  throw new Error("User profile missing in `users` table")
}

export const getAuthToken = (): string | null => null
export const setAuthToken = (_token: string): void => {}
export const removeAuthToken = (): void => {
  void supabase.auth.signOut().catch(() => {
    void clearSupabaseBrowserAuth()
  })
}

const ensureAuthenticatedUser = async (): Promise<UserRow> => {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error("Not authenticated")
  }

  return fetchUserProfile(authUser.id)
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    ensureSupabaseReady()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session || !data.user) {
      throw new Error(error?.message || "Login failed")
    }

    const token = await waitForSession(data.user.id)
    const profile = await fetchUserProfile(data.user.id)

    return {
      user: toUser(profile as UserRow),
      token,
    }
  },

  register: async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    role?: string
  ): Promise<LoginResponse> => {
    ensureSupabaseReady()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: role || "STUDENT",
        },
      },
    })

    if (error || !data.user) {
      throw new Error(error?.message || "Registration failed")
    }

    const { error: profileError } = await supabase.from("users").upsert({
      id: data.user.id,
      email,
      name,
      phone: phone || null,
      role: (role || "STUDENT") as UserRole,
    })

    if (profileError) {
      throw new Error(profileError.message)
    }

    if (!data.session) {
      throw new Error("Check your email to confirm your account, then log in.")
    }

    return {
      user: {
        id: data.user.id,
        email,
        name,
        phone: phone || null,
        role: (role || "STUDENT") as UserRole,
      },
      token: data.session.access_token,
    }
  },

  getMe: async (): Promise<User> => {
    ensureSupabaseReady()
    const profile = await ensureAuthenticatedUser()
    return toUser(profile)
  },
}

// Classes API
export const classesApi = {
  getAll: async (params?: {
    date?: string
    teacherId?: string
    status?: string
  }): Promise<Class[]> => {
    ensureSupabaseReady()
    const runQuery = async (teacherColumn: "teacherId" | "teacher_id") => {
      let query = supabase.from("classes").select("*").order("date", { ascending: true })
      if (params?.date) query = query.eq("date", params.date)
      if (params?.teacherId) query = query.eq(teacherColumn, params.teacherId)
      if (params?.status) query = query.eq("status", params.status)
      return query
    }

    let data: any[] | null = null
    let error: { message: string } | null = null

    const first = await runQuery("teacherId")
    data = first.data
    error = first.error

    if (error?.message?.includes("column classes.teacherId does not exist")) {
      const fallback = await runQuery("teacher_id")
      data = fallback.data
      error = fallback.error
    }

    if (error) throw new Error(error.message)

    const rows = (data || []) as ClassRow[]
    const teacherIds = Array.from(new Set(rows.map((r) => resolveTeacherId(r)).filter(Boolean)))

    let teachersById = new Map<string, UserRow>()
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase
        .from("users")
        .select("id,name,email,phone,role,createdAt")
        .in("id", teacherIds)
      teachersById = new Map((teachers as UserRow[] | null || []).map((t) => [t.id, t]))
    }

    // Add enrollment counts from bookings table
    const classIds = rows.map((r) => r.id)
    let enrollmentMap = new Map<string, number>()
    if (classIds.length > 0) {
      const { data: bookingCounts } = await supabase
        .from("bookings")
        .select("classId")
        .in("classId", classIds)
        .in("status", ["CONFIRMED", "PENDING"])
      ;(bookingCounts || []).forEach((b: any) => {
        enrollmentMap.set(b.classId, (enrollmentMap.get(b.classId) || 0) + 1)
      })
    }

    return rows.map((row) => ({
      ...row,
      enrolled: enrollmentMap.get(row.id) || 0,
      teacher: teachersById.has(resolveTeacherId(row))
        ? {
            id: resolveTeacherId(row),
            name: teachersById.get(resolveTeacherId(row))!.name,
            email: teachersById.get(resolveTeacherId(row))!.email,
          }
        : undefined,
    }))
  },

  getById: async (id: string): Promise<Class> => {
    ensureSupabaseReady()
    const { data, error } = await supabase.from("classes").select("*").eq("id", id).single()
    if (error || !data) throw new Error(error?.message || "Class not found")
    return data as Class
  },

  create: async (classData: Partial<Class>): Promise<Class> => {
    ensureSupabaseReady()
    const me = await ensureAuthenticatedUser()
    const desiredTeacherId =
      me.role === "ADMIN" && typeof (classData as any).teacherId === "string" ? (classData as any).teacherId : me.id
    const payloadCamel = {
      ...classData,
      teacherId: desiredTeacherId,
      status: (classData.status || "SCHEDULED") as ClassStatus,
    }
    const first = await supabase.from("classes").insert(payloadCamel).select("*").single()

    let data = first.data
    let error = first.error

    if (error?.message?.includes("column \"teacherId\" of relation \"classes\" does not exist")) {
      const payloadSnake = {
        ...classData,
        teacher_id: desiredTeacherId,
        status: (classData.status || "SCHEDULED") as ClassStatus,
      }
      const fallback = await supabase.from("classes").insert(payloadSnake).select("*").single()
      data = fallback.data
      error = fallback.error
    }

    if (error || !data) throw new Error(error?.message || "Failed to create class")
    return data as Class
  },

  update: async (id: string, classData: Partial<Class>): Promise<Class> => {
    ensureSupabaseReady()
    const first = await supabase.from("classes").update(classData).eq("id", id).select("*").single()

    let data = first.data
    let error = first.error

    // If DB uses snake_case teacher_id, translate teacherId updates.
    if (error?.message?.includes("column classes.teacherId does not exist") && typeof (classData as any).teacherId === "string") {
      const { teacherId, ...rest } = classData as any
      const fallback = await supabase
        .from("classes")
        .update({ ...rest, teacher_id: teacherId })
        .eq("id", id)
        .select("*")
        .single()
      data = fallback.data
      error = fallback.error
    }

    if (error || !data) throw new Error(error?.message || "Failed to update class")
    return data as Class
  },

  delete: async (id: string): Promise<void> => {
    ensureSupabaseReady()
    const { error } = await supabase.from("classes").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}

// Bookings API
export const bookingsApi = {
  getAll: async (params?: {
    status?: string
    studentId?: string
    classId?: string
  }): Promise<Booking[]> => {
    ensureSupabaseReady()
    let query = supabase.from("bookings").select("*").order("bookingDate", { ascending: false })
    if (params?.status) query = query.eq("status", params.status)
    if (params?.studentId) query = query.eq("studentId", params.studentId)
    if (params?.classId) query = query.eq("classId", params.classId)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    const rows = (data || []) as BookingRow[]

    const studentIds = Array.from(new Set(rows.map((r) => r.studentId)))
    const classIds = Array.from(new Set(rows.map((r) => r.classId)))
    const bookingIds = rows.map((r) => r.id)

    const [{ data: students }, { data: classes }, { data: payments }] = await Promise.all([
      studentIds.length
        ? supabase.from("users").select("id,email,name,phone,role,createdAt").in("id", studentIds)
        : Promise.resolve({ data: [] }),
      classIds.length ? supabase.from("classes").select("*").in("id", classIds) : Promise.resolve({ data: [] }),
      bookingIds.length
        ? supabase.from("payments").select("*").in("bookingId", bookingIds)
        : Promise.resolve({ data: [] }),
    ])

    const studentsById = new Map(((students as UserRow[]) || []).map((u) => [u.id, u]))
    const classesById = new Map(((classes as Class[]) || []).map((c) => [c.id, c]))
    const paymentsByBooking = new Map(((payments as PaymentRow[]) || []).map((p) => [p.bookingId, p]))

    const out: Booking[] = []
    for (const row of rows) {
      const studentRow = studentsById.get(row.studentId)
      const classRow = classesById.get(row.classId)
      if (!studentRow || !classRow) continue
      out.push({
        id: row.id,
        status: row.status,
        bookingDate: row.bookingDate,
        expiresAt: row.expiresAt,
        student: toUser(studentRow),
        class: classRow as Class,
        payment: paymentsByBooking.has(row.id)
          ? {
              id: paymentsByBooking.get(row.id)!.id,
              amount: paymentsByBooking.get(row.id)!.amount,
              status: paymentsByBooking.get(row.id)!.status,
            }
          : undefined,
      })
    }
    return out
  },

  getById: async (id: string): Promise<Booking> => {
    ensureSupabaseReady()
    const items = await bookingsApi.getAll()
    const booking = items.find((b) => b.id === id)
    if (!booking) throw new Error("Booking not found")
    return booking
  },

  create: async (classId: string): Promise<Booking> => {
    ensureSupabaseReady()
    const me = await ensureAuthenticatedUser()
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        classId,
        studentId: me.id,
        status: "PENDING" as BookingStatus,
      })
      .select("*")
      .single()

    if (error || !data) throw new Error(error?.message || "Failed to create booking")
    return bookingsApi.getById((data as BookingRow).id)
  },

  update: async (id: string, status: string): Promise<Booking> => {
    ensureSupabaseReady()
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id)
    if (error) throw new Error(error.message)
    return bookingsApi.getById(id)
  },

  cancel: async (id: string): Promise<Booking> => {
    ensureSupabaseReady()
    const { error } = await supabase.from("bookings").update({ status: "CANCELLED" }).eq("id", id)
    if (error) throw new Error(error.message)
    return bookingsApi.getById(id)
  },
}

// Payments API
export const paymentsApi = {
  create: async (
    bookingId: string,
    paymentMethod?: string,
    transactionId?: string
  ): Promise<any> => {
    ensureSupabaseReady()
    const me = await ensureAuthenticatedUser()
    const booking = await bookingsApi.getById(bookingId)

    const { data, error } = await supabase
      .from("payments")
      .upsert(
        {
          bookingId,
          userId: me.id,
          amount: booking.class.price,
          status: "COMPLETED" as PaymentStatus,
          paymentMethod: paymentMethod || null,
          transactionId: transactionId || null,
          paidAt: new Date().toISOString(),
        },
        { onConflict: "bookingId" }
      )
      .select("*")
      .single()

    if (error || !data) throw new Error(error?.message || "Failed to create payment")

    await supabase.from("bookings").update({ status: "CONFIRMED" }).eq("id", bookingId)
    return data
  },

  getAll: async (params?: { status?: string }): Promise<any[]> => {
    ensureSupabaseReady()
    let query = supabase.from("payments").select("*").order("createdAt", { ascending: false })
    if (params?.status) query = query.eq("status", params.status)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data || []
  },

  getById: async (id: string): Promise<any> => {
    ensureSupabaseReady()
    const { data, error } = await supabase.from("payments").select("*").eq("id", id).single()
    if (error || !data) throw new Error(error?.message || "Payment not found")
    return data
  },
}

// Users API
export const usersApi = {
  getAll: async (params?: { role?: string; search?: string }): Promise<User[]> => {
    ensureSupabaseReady()
    let query = supabase.from("users").select("id,email,name,phone,role,createdAt").order("createdAt", { ascending: false })
    if (params?.role) query = query.eq("role", params.role)
    if (params?.search) query = query.ilike("name", `%${params.search}%`)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return ((data as UserRow[]) || []).map(toUser)
  },

  getById: async (id: string): Promise<User> => {
    ensureSupabaseReady()
    const { data, error } = await supabase.from("users").select("id,email,name,phone,role,createdAt").eq("id", id).single()
    if (error || !data) throw new Error(error?.message || "User not found")
    return toUser(data as UserRow)
  },

  create: async (
    email: string,
    password: string,
    name: string,
    role: "STUDENT" | "TEACHER" | "ADMIN",
    phone?: string
  ): Promise<User> => {
    ensureSupabaseReady()
    throw new Error(
      "Creating users from the browser is blocked in Supabase for security. Create/invite users in Supabase Auth dashboard."
    )
  },

  update: async (id: string, data: { name?: string; phone?: string; password?: string }): Promise<User> => {
    ensureSupabaseReady()
    const updates: Record<string, string | null> = {}
    if (typeof data.name === "string") updates.name = data.name
    if (typeof data.phone === "string") updates.phone = data.phone

    const { error } = await supabase.from("users").update(updates).eq("id", id)
    if (error) throw new Error(error.message)

    if (data.password) {
      const me = await ensureAuthenticatedUser()
      if (me.id === id) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: data.password })
        if (passwordError) throw new Error(passwordError.message)
      }
    }

    return usersApi.getById(id)
  },

  delete: async (id: string): Promise<void> => {
    ensureSupabaseReady()
    const { error } = await supabase.from("users").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}

// Settings API
export const settingsApi = {
  get: async (): Promise<AppSettings> => {
    ensureSupabaseReady()
    const { data, error } = await supabase
      .from("app_settings")
      .select(
        "orgName,timezone,locale,currencyCode,defaultStartHour,defaultEndHour,defaultClassDurationMinutes,defaultCapacity,defaultPrice,allowStudentBooking,bookingWindowDays,paymentWindowMinutes,cancellationWindowMinutes,requirePhone,supportEmail,supportWhatsApp,termsUrl"
      )
      .eq("id", 1)
      .single()

    if (error || !data) throw new Error(error?.message || "Settings not found")
    return data as AppSettingsRow
  },

  update: async (updates: Partial<AppSettings>): Promise<AppSettings> => {
    ensureSupabaseReady()
    const { data, error } = await supabase
      .from("app_settings")
      .update(updates)
      .eq("id", 1)
      .select(
        "orgName,timezone,locale,currencyCode,defaultStartHour,defaultEndHour,defaultClassDurationMinutes,defaultCapacity,defaultPrice,allowStudentBooking,bookingWindowDays,paymentWindowMinutes,cancellationWindowMinutes,requirePhone,supportEmail,supportWhatsApp,termsUrl"
      )
      .single()

    if (error || !data) throw new Error(error?.message || "Failed to update settings")
    return data as AppSettingsRow
  },
}

