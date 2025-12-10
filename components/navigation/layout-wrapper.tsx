"use client"

import type React from "react"

import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface LayoutWrapperProps {
  children: React.ReactNode
  userRole: "student" | "teacher" | "admin"
  userName: string
}

export function LayoutWrapper({ children, userRole, userName }: LayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} userName={userName} />
      <div className="flex">
        <Sidebar userRole={userRole} />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
