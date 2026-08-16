import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, LoadingCard, TagPill, EmptyState } from "@/components/clinic/Ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/clinic";
import { Activity, ArrowUpRight, FilePlus2, Files, Plus, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

function MetricCard({ label, value, icon: Icon, tint }: { label: string; value: number; icon: typeof UsersRound; tint: string }) {
  return (
    <Card className="overflow-hidden border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]">
      <CardContent className="relative p-5">
        <div className={`mb-7 flex h-10 w-10 items-center justify-center rounded-2xl ${tint}`}><Icon className="h-5 w-5" /></div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold tracking-[-0.06em] text-slate-900">{value}</p>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-[linear-gradient(90deg,rgba(13,148,136,0.75),rgba(13,148,136,0.06))]" />
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const dashboard = trpc.clinic.dashboard.useQuery();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Clinical overview"
          title="Good morning. Your records are ready."
          description="A calm, review-first workspace for digitizing and referencing prescriptions."
          actions={
            <>
              <Button variant="outline" className="border-slate-200 bg-white text-slate-700" onClick={() => setLocation("/patients")}><Plus className="mr-2 h-4 w-4" />Add patient</Button>
              <Button className="bg-teal-700 shadow-lg shadow-teal-900/15 hover:bg-teal-800" onClick={() => setLocation("/upload")}><FilePlus2 className="mr-2 h-4 w-4" />Digitize prescription</Button>
            </>
          }
        />

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          {dashboard.isLoading ? <><LoadingCard /><LoadingCard /><LoadingCard /></> : <>
            <MetricCard label="Total patients" value={dashboard.data?.patientCount ?? 0} icon={UsersRound} tint="bg-sky-50 text-sky-700" />
            <MetricCard label="Saved prescriptions" value={dashboard.data?.prescriptionCount ?? 0} icon={Files} tint="bg-teal-50 text-teal-700" />
            <Card className="border-0 bg-[linear-gradient(145deg,#0c6572,#0d8a85)] text-white shadow-[0_16px_36px_rgba(4,100,114,0.2)]"><CardContent className="p-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12"><Activity className="h-5 w-5" /></div><p className="mt-7 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-teal-100">Record safety</p><p className="mt-1 font-display text-xl font-bold tracking-[-0.04em]">Nothing saves without your review.</p></CardContent></Card>
          </>}
        </section>

        <section className="mt-7 grid gap-7 lg:grid-cols-[1.55fr_0.8fr]">
          <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-6 py-5"><div><p className="font-display text-xl font-bold tracking-[-0.045em] text-slate-900">Recent uploads</p><p className="mt-1 text-sm text-slate-500">Latest approved prescription records.</p></div><Button variant="ghost" className="gap-2 text-teal-700 hover:text-teal-800" onClick={() => setLocation("/search")}>View all <ArrowUpRight className="h-4 w-4" /></Button></div>
              <div className="border-t border-slate-100">
                {dashboard.isLoading ? <div className="space-y-3 p-6"><div className="h-16 animate-pulse rounded-xl bg-slate-100" /><div className="h-16 animate-pulse rounded-xl bg-slate-100" /></div> : dashboard.data?.recent.length ? dashboard.data.recent.map(item => <button key={item.id} onClick={() => setLocation(`/prescriptions/${item.id}`)} className="flex w-full items-center gap-4 border-b border-slate-100 px-6 py-4 text-left transition-colors last:border-0 hover:bg-teal-50/40"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">{item.imageUrl ? <img src={item.imageUrl} alt="Prescription" className="h-full w-full object-cover" /> : <Files className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold text-slate-800">{item.patientName}</p>{item.important && <span className="text-amber-500">★</span>}</div><p className="mt-1 text-xs text-slate-400">Saved {formatDate(item.createdAt)}</p></div><div className="hidden max-w-[40%] gap-1 overflow-hidden sm:flex">{(item.tags ?? []).slice(0, 2).map(tag => <TagPill key={tag}>{tag}</TagPill>)}</div><ArrowUpRight className="h-4 w-4 text-slate-300" /></button>) : <div className="p-6"><EmptyState title="No records saved yet" description="Start by selecting a patient and uploading a prescription image. You will review every extracted field before saving." actionLabel="Digitize first prescription" onAction={() => setLocation("/upload")} /></div>}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[#edf7f5] shadow-[0_12px_32px_rgba(15,70,70,0.05)]"><CardContent className="p-6"><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-teal-700">A safer digitization flow</p><h2 className="mt-3 font-display text-2xl font-bold leading-[1.05] tracking-[-0.055em] text-slate-900">Original evidence. Editable intelligence.</h2><p className="mt-4 text-sm leading-6 text-slate-600">ClinicOCR keeps your source image and raw OCR output intact, then gives you an editable draft for confident clinical review.</p><div className="mt-6 space-y-3">{[["1", "Upload original image"], ["2", "Review raw OCR & AI draft"], ["3", "Explicitly approve record"]].map(([number, text]) => <div key={number} className="flex items-center gap-3 rounded-xl bg-white/80 p-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-[0.65rem] font-bold text-white">{number}</span><span className="text-sm font-semibold text-slate-700">{text}</span></div>)}</div></CardContent></Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
