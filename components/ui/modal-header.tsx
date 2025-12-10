"use client"

import { X } from "lucide-react"

interface ModalHeaderProps {
  title: string
  subtitle?: string
  onClose: () => void
}

export function ModalHeader({ title, subtitle, onClose }: ModalHeaderProps) {
  return (
    <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Close modal"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  )
}
