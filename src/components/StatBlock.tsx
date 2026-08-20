export function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-extrabold text-[#1a1a1a]">{value}</div>
      <div className="text-xs uppercase tracking-wide text-[#4d4d4d]">{label}</div>
    </div>
  )
}
