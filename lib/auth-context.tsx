"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authApi, type User } from "./api"
import { hasSupabaseEnv, supabase } from "./supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, phone?: string, role?: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated on mount
  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoading(false)
      return
    }

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        try {
          const userData = await authApi.getMe()
          setUser(userData)
        } catch (error) {
          await supabase.auth.signOut()
          setUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
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
      setUser(response.user)
      
      // Redirect based on role
      const roleLower = response.user.role.toLowerCase()
      router.push(`/dashboard/${roleLower}`)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
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

