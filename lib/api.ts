// API Configuration and Utilities

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

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

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token)
  }
}

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
  }
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken()
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "An error occurred")
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Network error")
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    return response.data!
  },

  register: async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    role?: string
  ): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, phone, role }),
    })
    return response.data!
  },

  getMe: async (): Promise<User> => {
    const response = await apiRequest<User>("/auth/me")
    return response.data!
  },
}

// Classes API
export const classesApi = {
  getAll: async (params?: {
    date?: string
    teacherId?: string
    status?: string
  }): Promise<Class[]> => {
    const queryParams = new URLSearchParams()
    if (params?.date) queryParams.append("date", params.date)
    if (params?.teacherId) queryParams.append("teacherId", params.teacherId)
    if (params?.status) queryParams.append("status", params.status)

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/classes?${queryString}` : "/classes"

    const response = await apiRequest<Class[]>(endpoint)
    return response.data || []
  },

  getById: async (id: string): Promise<Class> => {
    const response = await apiRequest<Class>(`/classes/${id}`)
    return response.data!
  },

  create: async (classData: Partial<Class>): Promise<Class> => {
    const response = await apiRequest<Class>("/classes", {
      method: "POST",
      body: JSON.stringify(classData),
    })
    return response.data!
  },

  update: async (id: string, classData: Partial<Class>): Promise<Class> => {
    const response = await apiRequest<Class>(`/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(classData),
    })
    return response.data!
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest(`/classes/${id}`, {
      method: "DELETE",
    })
  },
}

// Bookings API
export const bookingsApi = {
  getAll: async (params?: {
    status?: string
    studentId?: string
    classId?: string
  }): Promise<Booking[]> => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append("status", params.status)
    if (params?.studentId) queryParams.append("studentId", params.studentId)
    if (params?.classId) queryParams.append("classId", params.classId)

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/bookings?${queryString}` : "/bookings"

    const response = await apiRequest<Booking[]>(endpoint)
    return response.data || []
  },

  getById: async (id: string): Promise<Booking> => {
    const response = await apiRequest<Booking>(`/bookings/${id}`)
    return response.data!
  },

  create: async (classId: string): Promise<Booking> => {
    const response = await apiRequest<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify({ classId }),
    })
    return response.data!
  },

  update: async (id: string, status: string): Promise<Booking> => {
    const response = await apiRequest<Booking>(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
    return response.data!
  },

  cancel: async (id: string): Promise<Booking> => {
    const response = await apiRequest<Booking>(`/bookings/${id}`, {
      method: "DELETE",
    })
    return response.data!
  },
}

// Payments API
export const paymentsApi = {
  create: async (
    bookingId: string,
    paymentMethod?: string,
    transactionId?: string
  ): Promise<any> => {
    const response = await apiRequest("/payments", {
      method: "POST",
      body: JSON.stringify({ bookingId, paymentMethod, transactionId }),
    })
    return response.data
  },

  getAll: async (params?: { status?: string }): Promise<any[]> => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append("status", params.status)

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/payments?${queryString}` : "/payments"

    const response = await apiRequest<any[]>(endpoint)
    return response.data || []
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiRequest(`/payments/${id}`)
    return response.data!
  },
}

// Users API
export const usersApi = {
  getAll: async (params?: { role?: string; search?: string }): Promise<User[]> => {
    const queryParams = new URLSearchParams()
    if (params?.role) queryParams.append("role", params.role)
    if (params?.search) queryParams.append("search", params.search)

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/users?${queryString}` : "/users"

    const response = await apiRequest<User[]>(endpoint)
    return response.data || []
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiRequest<User>(`/users/${id}`)
    return response.data!
  },

  create: async (
    email: string,
    password: string,
    name: string,
    role: "STUDENT" | "TEACHER" | "ADMIN",
    phone?: string
  ): Promise<User> => {
    const response = await apiRequest<User>("/users", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role, phone }),
    })
    return response.data!
  },

  update: async (id: string, data: { name?: string; phone?: string; password?: string }): Promise<User> => {
    const response = await apiRequest<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response.data!
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest(`/users/${id}`, {
      method: "DELETE",
    })
  },
}

