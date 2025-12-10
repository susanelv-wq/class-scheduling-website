"use client"

import { LayoutWrapper } from "@/components/navigation/layout-wrapper"

export default function TeacherSettingsPage() {
  return (
    <LayoutWrapper userRole="teacher" userName="John Smith">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your teacher account preferences</p>
        </div>
      </div>
    </LayoutWrapper>
  )
}
