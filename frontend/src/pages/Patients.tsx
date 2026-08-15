import DashboardLayout from "@/components/DashboardLayout";
import { EmptyState, PageHeader } from "@/components/clinic/Ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatDate, initials } from "@/lib/clinic";
import { AlertTriangle, Plus, Search, UserRound, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type PatientForm = { name: string; age: string; gender: string; phone: string };
const initialForm: PatientForm = { name: "", age: "", gender: "", phone: "" };

function PatientDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PatientForm>(initialForm);
  const input = useMemo(() => ({ name: form.name.trim(), age: form.age ? Number(form.age) : null, gender: form.gender || null, phone: form.phone.trim() || null }), [form]);
  const duplicateQuery = trpc.clinic.patients.duplicates.useQuery(input, { enabled: open && form.name.trim().length >= 2 });
  const create = trpc.clinic.patients.create.useMutation({ onSuccess: () => { toast.success("Patient added to the clinic directory."); setOpen(false); setForm(initialForm); onDone(); }, onError: error => toast.error(error.message) });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 2) { toast.error("Enter the patient's full name."); return; }
    create.mutate(input);
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="bg-teal-700 shadow-lg shadow-teal-900/15 hover:bg-teal-800"><Plus className="mr-2 h-4 w-4" />Add patient</Button></DialogTrigger><DialogContent className="sm:max-w-[460px]"><form onSubmit={submit}><DialogHeader><DialogTitle className="font-display text-2xl tracking-[-0.045em]">Add a patient</DialogTitle><DialogDescription>Create a patient record before digitizing a prescription.</DialogDescription></DialogHeader><div className="mt-6 grid gap-4"><div className="grid gap-2"><Label htmlFor="name">Full name</Label><Input id="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Patient full name" autoFocus /></div>{duplicateQuery.data?.length ? <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>A possible duplicate exists: <strong>{duplicateQuery.data.map(item => item.name).join(", ")}</strong>. Review the directory before creating another record.</span></div> : null}<div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="age">Age</Label><Input id="age" type="number" min="0" max="130" value={form.age} onChange={event => setForm({ ...form, age: event.target.value })} placeholder="Optional" /></div><div className="grid gap-2"><Label>Gender</Label><Select value={form.gender} onValueChange={gender => setForm({ ...form, gender })}><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger><SelectContent><SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem><SelectItem value="Other">Other</SelectItem><SelectItem value="Prefer not to say">Prefer not to say</SelectItem></SelectContent></Select></div></div><div className="grid gap-2"><Label htmlFor="phone">Phone number</Label><Input id="phone" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="Optional" /></div></div><DialogFooter className="mt-7"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-700 hover:bg-teal-800" disabled={create.isPending}>{create.isPending ? "Saving…" : "Add patient"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

export default function Patients() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const queryInput = useMemo(() => ({ query: search.trim() || undefined }), [search]);
  const patients = trpc.clinic.patients.list.useQuery(queryInput);
  const utils = trpc.useUtils();

  return <DashboardLayout><div className="mx-auto max-w-7xl"><PageHeader eyebrow="Directory" title="Patients" description="Search by name or phone number, then open the prescription history when you need it." actions={<PatientDialog onDone={() => utils.clinic.patients.list.invalidate()} />} /><div className="mt-7"><div className="relative max-w-xl"><Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by patient name or phone number" className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm" /></div></div><div className="mt-5"><Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]"><CardContent className="p-0">{patients.isLoading ? <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-[74px] animate-pulse rounded-xl bg-slate-100" />)}</div> : patients.data?.length ? <div>{patients.data.map(patient => <button key={patient.id} className="flex w-full items-center gap-4 border-b border-slate-100 px-5 py-4 text-left transition-colors last:border-0 hover:bg-teal-50/40 sm:px-6" onClick={() => setLocation(`/patients/${patient.id}`)}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sm font-bold text-sky-700">{initials(patient.name)}</div><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-800">{patient.name}</p><p className="mt-1 text-xs text-slate-400">{[patient.age ? `${patient.age} years` : null, patient.gender, patient.phone].filter(Boolean).join(" · ") || "No demographic details"}</p></div><div className="hidden text-right sm:block"><p className="text-sm font-bold text-slate-700">{Number(patient.prescriptionCount)} record{Number(patient.prescriptionCount) === 1 ? "" : "s"}</p><p className="mt-1 text-xs text-slate-400">Added {formatDate(patient.createdAt)}</p></div><Badge variant="secondary" className="hidden rounded-full bg-teal-50 text-teal-700 md:inline-flex">View history</Badge></button>)}</div> : <div className="p-6"><EmptyState title={search ? "No matching patient" : "Your patient directory is empty"} description={search ? "Try a different name or phone number." : "Add your first patient to start a secure, review-first digitization workflow."} actionLabel={search ? undefined : "Add patient"} onAction={search ? undefined : () => document.querySelector<HTMLButtonElement>("[data-dialog-trigger]")?.click()} /></div>}</CardContent></Card></div></div></DashboardLayout>;
}
