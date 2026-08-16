import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, FilePlus2, Inbox } from "lucide-react";
import { ReactNode } from "react";
import { useLocation } from "wouter";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-slate-200/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-bold tracking-[-0.055em] text-slate-900 sm:text-[2.15rem]">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function BackButton({ to, label = "Back" }: { to?: string; label?: string }) {
  const [, setLocation] = useLocation();
  return (
    <Button variant="ghost" size="sm" className="-ml-2 gap-2 text-slate-500 hover:text-slate-900" onClick={() => setLocation(to || "/")}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-teal-900/15 bg-white/65 px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-bold tracking-[-0.035em] text-slate-800">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-5 gap-2 bg-teal-700 hover:bg-teal-800" onClick={onAction}>
          <FilePlus2 className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function TagPill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[0.67rem] font-bold tracking-wide text-slate-600", className)}>{children}</span>;
}

export function LoadingCard() {
  return <div className="h-32 animate-pulse rounded-[22px] bg-slate-100" />;
}
