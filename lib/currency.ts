export function formatRupiah(amount: number): string {
  const value = Number(amount || 0)
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

