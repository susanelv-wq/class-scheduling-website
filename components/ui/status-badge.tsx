interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "confirmed" | "full"
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600 border border-green-500/20"
      case "inactive":
        return "bg-muted text-muted-foreground"
      case "pending":
        return "bg-destructive/10 text-destructive border border-destructive/20"
      case "confirmed":
        return "bg-green-500/10 text-green-600 border border-green-500/20"
      case "full":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-secondary text-foreground"
    }
  }

  const getLabel = () => {
    if (label) return label
    switch (status) {
      case "active":
        return "Active"
      case "inactive":
        return "Inactive"
      case "pending":
        return "Pending"
      case "confirmed":
        return "Confirmed"
      case "full":
        return "Full"
      default:
        return status
    }
  }

  return <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStyles()}`}>{getLabel()}</span>
}
