import { Cross } from "lucide-react";

export function ClinicMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-[linear-gradient(145deg,#0a7a82,#075f72)] text-white shadow-[0_12px_28px_rgba(4,100,114,0.24)]">
        <Cross className="h-5 w-5 stroke-[2.5]" />
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="font-display text-[1.18rem] font-bold tracking-[-0.055em] text-slate-900">ClinicOCR</p>
          <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-teal-700">Clinical workspace</p>
        </div>
      )}
    </div>
  );
}
