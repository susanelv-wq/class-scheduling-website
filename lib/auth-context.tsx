"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authApi, getAuthToken, setAuthToken, removeAuthToken, type User } from "./api"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, phone?: string, role?: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken()
      if (token) {
        try {
          const userData = await authApi.getMe()
          setUser(userData)
        } catch (error) {
          // Token is invalid, remove it
          removeAuthToken()
          setUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      setAuthToken(response.token)
      setUser(response.user)
      
      // Redirect based on role
      const role = response.user.role.toLowerCase()
      router.push(`/dashboard/${role}`)
    } catch (error) {
      throw error
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    role?: string
  ) => {
    try {
      const response = await authApi.register(email, password, name, phone, role)
      setAuthToken(response.token)
      setUser(response.user)
      
      // Redirect based on role
      const roleLower = response.user.role.toLowerCase()
      router.push(`/dashboard/${roleLower}`)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    removeAuthToken()
    setUser(null)
    router.push("/")
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

