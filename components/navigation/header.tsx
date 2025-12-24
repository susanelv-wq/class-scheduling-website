"use client"

import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface HeaderProps {
  userRole: "student" | "teacher" | "admin"
  userName: string
}

export function Header({ userRole, userName }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const getRoleLabel = () => {
    return userRole.charAt(0).toUpperCase() + userRole.slice(1)
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={`/dashboard/${userRole}`} className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg group-hover:shadow-md transition-shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">ClassHub</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
            </div>

            <Button onClick={handleLogout} variant="ghost" className="text-muted-foreground hover:text-foreground">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
