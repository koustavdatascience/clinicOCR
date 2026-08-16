import DashboardLayout from "@/components/DashboardLayout";
import { BackButton, EmptyState, PageHeader, TagPill } from "@/components/clinic/Ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/clinic";
import { trpc } from "@/lib/trpc";
import { jsPDF } from "jspdf";
import { Check, Download, FileText, Save, Star, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

type ExportableRecord = {
  prescription: {
    correctedText: string;
    aiSummary: string;
    medicines: Array<{ name: string; dosage: string; frequency: string }>;
    doctorNotes: string | null;
    createdAt: Date | string | number;
  };
  patient: { name: string; age: number | null; phone: string | null };
};

function exportPdf(record: ExportableRecord) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const { prescription, patient } = record;
  let y = 56;
  const section = (title: string, text: string) => { doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(title, 48, y); y += 16; doc.setFont("helvetica", "normal"); doc.setFontSize(10); const lines = doc.splitTextToSize(text || "Not recorded", 500); doc.text(lines, 48, y); y += lines.length * 14 + 18; };
  doc.setFillColor(7, 98, 114); doc.rect(0, 0, 595, 92, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("ClinicOCR", 48, 46); doc.setFontSize(10); doc.text("Reviewed prescription report", 48, 66); doc.setTextColor(25, 35, 46); y = 128;
  section("Patient", `${patient.name}${patient.age ? ` · ${patient.age} years` : ""}${patient.phone ? ` · ${patient.phone}` : ""}`);
  section("Prescription date", formatDate(prescription.createdAt));
  section("Corrected text", prescription.correctedText);
  section("AI summary", prescription.aiSummary);
  section("Medicines", (prescription.medicines ?? []).map((m: { name: string; dosage: string; frequency: string }) => [m.name, m.dosage, m.frequency].filter(Boolean).join(" — ")).join("\n"));
  section("Doctor notes", prescription.doctorNotes || "Not recorded");
  doc.save(`ClinicOCR-${patient.name.replace(/\s+/g, "-")}-${formatDate(prescription.createdAt).replace(/\s+/g, "-")}.pdf`);
}

export default function PrescriptionDetail() {
  const [, params] = useRoute("/prescriptions/:id");
  const [, setLocation] = useLocation();
  const id = Number(params?.id || 0);
  const input = useMemo(() => ({ id }), [id]);
  const detail = trpc.clinic.prescriptions.get.useQuery(input, { enabled: id > 0 });
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState<string | null>(null);
  const update = trpc.clinic.prescriptions.updateMeta.useMutation({ onSuccess: () => { toast.success("Record details updated."); utils.clinic.prescriptions.get.invalidate(input); utils.clinic.prescriptions.forPatient.invalidate(); }, onError: error => toast.error(error.message) });
  const record = detail.data;
  if (!detail.isLoading && !record) return <DashboardLayout><div className="mx-auto max-w-6xl"><BackButton label="Records" to="/search" /><EmptyState title="Prescription not found" description="This record may have been deleted or is not available in your clinic workspace." actionLabel="Find records" onAction={() => setLocation("/search")} /></div></DashboardLayout>;
  const prescription = record?.prescription;
  const doctorNotes = notes ?? prescription?.doctorNotes ?? "";
  return <DashboardLayout><div className="mx-auto max-w-7xl"><BackButton to={record ? `/patients/${record.patient.id}` : "/search"} label={record ? "Patient record" : "Records"} /><PageHeader eyebrow="Saved prescription" title={record ? `${record.patient.name}'s prescription` : "Loading prescription…"} description={prescription ? `Reviewed and saved on ${formatDate(prescription.createdAt)}` : ""} actions={record ? <><Button variant="outline" className="border-slate-200 bg-white" onClick={() => exportPdf(record)}><Download className="mr-2 h-4 w-4" />Export PDF</Button><Button className={prescription?.important ? "bg-amber-400 text-amber-950 hover:bg-amber-300" : "bg-teal-700 hover:bg-teal-800"} onClick={() => update.mutate({ id, important: !prescription?.important })}><Star className={`mr-2 h-4 w-4 ${prescription?.important ? "fill-amber-950" : ""}`} />{prescription?.important ? "Important record" : "Mark important"}</Button></> : undefined} /><section className="mt-7 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]"><div className="space-y-6"><Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="font-display text-lg font-bold tracking-[-0.04em] text-slate-900">Original image</p><Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50">Preserved source</Badge></div><div className="mt-4 flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl bg-slate-50">{prescription?.imageUrl && <img src={prescription.imageUrl} alt="Original prescription" className="max-h-[480px] w-full object-contain" />}</div></CardContent></Card><Card className="border-0 bg-slate-900 text-white shadow-[0_12px_32px_rgba(15,23,42,0.12)]"><CardContent className="p-5"><p className="font-display text-lg font-bold tracking-[-0.04em]">Raw OCR output</p><p className="mt-1 text-xs text-slate-400">Stored exactly as returned by OCR.</p><pre className="mt-4 max-h-[270px] overflow-auto whitespace-pre-wrap rounded-xl bg-white/7 p-4 font-mono text-xs leading-6 text-slate-200">{prescription?.rawOcr}</pre></CardContent></Card></div><div className="space-y-6"><Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><FileText className="h-5 w-5" /></div><div><p className="font-display text-xl font-bold tracking-[-0.045em] text-slate-900">Reviewed content</p><p className="text-sm text-slate-500">The doctor-approved saved record.</p></div></div><div className="mt-6"><p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400">Corrected text</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{prescription?.correctedText || "No corrected text recorded."}</p></div><div className="mt-6 rounded-2xl bg-teal-50/80 p-4"><p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-teal-700">AI summary, reviewed by doctor</p><p className="mt-2 text-sm leading-6 text-slate-700">{prescription?.aiSummary || "No summary recorded."}</p></div></CardContent></Card><Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]"><CardContent className="p-6"><p className="font-display text-xl font-bold tracking-[-0.045em] text-slate-900">Medicines</p><div className="mt-4 overflow-hidden rounded-xl border border-slate-100">{prescription?.medicines?.length ? prescription.medicines.map((medicine, index) => <div key={`${medicine.name}-${index}`} className="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-0 sm:grid-cols-3"><p className={`text-sm font-bold ${/^possibly\b/i.test(medicine.name) ? "text-amber-700" : "text-slate-700"}`}>{medicine.name}{/^possibly\b/i.test(medicine.name) && <span className="ml-2 text-[0.62rem] uppercase tracking-wide text-amber-500">verify</span>}</p><p className="text-sm text-slate-500">{medicine.dosage || "—"}</p><p className="text-sm text-slate-500">{medicine.frequency || "—"}</p></div>) : <p className="p-4 text-sm text-slate-500">No medicine list recorded.</p>}</div><div className="mt-5"><p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400">Tags</p><div className="mt-2 flex flex-wrap gap-2">{prescription?.tags?.length ? prescription.tags.map(tag => <TagPill key={tag} className="bg-teal-50 text-teal-700">{tag}</TagPill>) : <span className="text-sm text-slate-400">No tags</span>}</div></div></CardContent></Card><Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]"><CardContent className="p-6"><p className="font-display text-xl font-bold tracking-[-0.045em] text-slate-900">Doctor notes</p><Textarea className="mt-4 min-h-[100px] rounded-xl border-slate-200" value={doctorNotes} onChange={event => setNotes(event.target.value)} placeholder="Add a clinical follow-up note" /><div className="mt-3 flex justify-end"><Button size="sm" className="bg-teal-700 hover:bg-teal-800" disabled={update.isPending} onClick={() => update.mutate({ id, doctorNotes: doctorNotes || null })}><Save className="mr-2 h-3.5 w-3.5" />Save note</Button></div></CardContent></Card></div></section></div></DashboardLayout>;
}
