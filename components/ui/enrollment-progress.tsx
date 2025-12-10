interface EnrollmentProgressProps {
  enrolled: number
  capacity: number
  showLabel?: boolean
}

export function EnrollmentProgress({ enrolled, capacity, showLabel = true }: EnrollmentProgressProps) {
  const percentage = (enrolled / capacity) * 100

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Enrollment</span>
          <span className="font-bold text-foreground">
            {enrolled}/{capacity}
          </span>
        </div>
      )}
      <div className="w-full bg-border rounded-full h-2">
        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
