"use client"

import { LayoutWrapper } from "@/components/navigation/layout-wrapper"
import { Card } from "@/components/ui/card"

export default function AdminUsersPage() {
  return (
    <LayoutWrapper userRole="admin" userName="Admin Manager">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage all users in the system</p>
        </div>

        <Card className="p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">Coming soon</p>
        </Card>
      </div>
    </LayoutWrapper>
  )
}
