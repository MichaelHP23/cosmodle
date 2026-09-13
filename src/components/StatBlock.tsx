export function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-extrabold text-[var(--ink-strong)]">{value}</div>
      <div className="text-xs uppercase tracking-wide text-[var(--ink-2)]">{label}</div>
    </div>
  )
}
