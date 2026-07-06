export function formatMoney(value: string | number, currency = "USD"): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function sumMoney(...values: Array<string | number>): string {
  const total = values.reduce<number>((acc, v) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    return acc + (Number.isNaN(n) ? 0 : n);
  }, 0);
  return total.toFixed(2);
}
