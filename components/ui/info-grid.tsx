interface InfoGridProps {
  items: { label: string; value: string }[]
  columns?: 1 | 2 | 3 | 4
}

export function InfoGrid({ items, columns = 2 }: InfoGridProps) {
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[columns]

  return (
    <div className={`grid ${gridColsClass} gap-4`}>
      {items.map((item, idx) => (
        <div key={idx}>
          <p className="text-xs text-muted-foreground font-medium uppercase">{item.label}</p>
          <p className="text-sm font-medium text-foreground mt-1">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
