"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarProps {
  userRole: "student" | "teacher" | "admin"
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const getNavItems = () => {
    switch (userRole) {
      case "student":
        return [
          { href: "/dashboard/student", label: "Available Classes", icon: "📚" },
          { href: "/dashboard/student/my-bookings", label: "My Bookings", icon: "📅" },
          { href: "/dashboard/student/settings", label: "Settings", icon: "⚙️" },
        ]
      case "teacher":
        return [
          { href: "/dashboard/teacher", label: "My Calendar", icon: "📅" },
          { href: "/dashboard/teacher/schedule", label: "Schedule", icon: "📋" },
          { href: "/dashboard/teacher/settings", label: "Settings", icon: "⚙️" },
        ]
      case "admin":
        return [
          { href: "/dashboard/admin", label: "All Classes", icon: "📊" },
          { href: "/dashboard/admin/users", label: "Users", icon: "👥" },
          { href: "/dashboard/admin/settings", label: "Settings", icon: "⚙️" },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen">
      <nav className="p-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
