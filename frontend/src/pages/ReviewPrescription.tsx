import DashboardLayout from "@/components/DashboardLayout";
import { BackButton, EmptyState, PageHeader, TagPill } from "@/components/clinic/Ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clearDraft, formatPrescriptionText, readDraft, type DraftMedicine, type PrescriptionDraft } from "@/lib/clinic";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, ImageIcon, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function MedicineRow({ medicine, onChange, onDelete }: { medicine: DraftMedicine; onChange: (next: DraftMedicine) => void; onDelete: () => void }) {
  const uncertain = /^possibly\b/i.test(medicine.name);
  return (
    <div className={`grid gap-2 rounded-xl border p-3 sm:grid-cols-[1.2fr_0.8fr_0.9fr_auto] ${uncertain ? "border-amber-200 bg-amber-50/45" : "border-slate-200 bg-white"}`}>
      <Input value={medicine.name} onChange={event => onChange({ ...medicine, name: event.target.value })} placeholder="Medicine name" className="h-9 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0" />
      <Input value={medicine.dosage} onChange={event => onChange({ ...medicine, dosage: event.target.value })} placeholder="Dosage" className="h-9 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0" />
      <Input value={medicine.frequency} onChange={event => onChange({ ...medicine, frequency: event.target.value })} placeholder="Frequency" className="h-9 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0" />
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-600" onClick={onDelete} aria-label={`Remove ${medicine.name || "medicine"}`}><Trash2 className="h-4 w-4" /></Button>
      {uncertain && <div className="sm:col-span-4 flex items-center gap-2 px-1 text-[0.68rem] font-bold text-amber-800"><AlertTriangle className="h-3.5 w-3.5" />Uncertain medicine name — verify against the source image.</div>}
    </div>
  );
}

export default function ReviewPrescription() {
  const [, setLocation] = useLocation();
  const [draft, setDraft] = useState<PrescriptionDraft | null>(null);
  const [notes, setNotes] = useState("");
  const [important, setImportant] = useState(false);

  useEffect(() => {
    const savedDraft = readDraft();
    setDraft(savedDraft ? { ...savedDraft, correctedText: formatPrescriptionText(savedDraft.correctedText) } : null);
  }, []);

  const save = trpc.clinic.prescriptions.save.useMutation({
    onSuccess: record => {
      clearDraft();
      toast.success("Prescription saved after doctor review.");
      setLocation(`/prescriptions/${record?.prescription.id}`);
    },
    onError: error => toast.error(error.message),
  });

  if (!draft) {
    return <DashboardLayout><div className="mx-auto max-w-5xl"><BackButton to="/upload" label="Upload prescription" /><EmptyState title="No draft is ready for review" description="Upload a prescription image first. ClinicOCR will never save a record until you explicitly approve it from this screen." actionLabel="Go to upload" onAction={() => setLocation("/upload")} /></div></DashboardLayout>;
  }

  const updateMedicine = (index: number, medicine: DraftMedicine) => setDraft(current => current ? { ...current, medicines: current.medicines.map((item, itemIndex) => itemIndex === index ? medicine : item) } : current);
  const addMedicine = () => setDraft(current => current ? { ...current, medicines: [...current.medicines, { name: "", dosage: "", frequency: "" }] } : current);
  const removeMedicine = (index: number) => setDraft(current => current ? { ...current, medicines: current.medicines.filter((_, itemIndex) => itemIndex !== index) } : current);
  const saveRecord = () => {
    save.mutate({
      patientId: draft.patientId,
      rawOcr: draft.rawOcr,
      sourceLanguageCode: draft.sourceLanguageCode || "und",
      sourceLanguageName: draft.sourceLanguageName || "Undetermined",
      sourceScript: draft.sourceScript || "Unknown",
      correctedText: draft.correctedText,
      aiSummary: draft.summary,
      medicines: draft.medicines,
      importantFindings: draft.importantFindings,
      tags: draft.tags,
      doctorNotes: notes || null,
      important,
      ocrConfidence: draft.ocrConfidence,
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1480px]">
        <BackButton to="/upload" label="New upload" />
        <PageHeader
          eyebrow="Doctor review required"
          title="Review prescription"
          description="Use the temporary source image to confirm each field, then save the reviewed text record when ready."
          actions={<Button variant="outline" className="border-slate-200 bg-white" onClick={() => { clearDraft(); setLocation("/upload"); }}>Discard draft</Button>}
        />

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span><strong>Review-first safeguard:</strong> nothing is saved until you approve this record.</span>
        </div>

        <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.22fr)]">
          <aside className="xl:sticky xl:top-8">
            <Card className="overflow-hidden border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="font-display text-lg font-bold tracking-[-0.04em] text-slate-900">Original prescription</p>
                    <p className="mt-1 text-xs text-slate-500">Reference this image while reviewing</p>
                  </div>
                  <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50">Source</Badge>
                </div>
                <div className="flex min-h-[400px] items-center justify-center bg-[linear-gradient(145deg,#f8fbfb,#eef7f5)] p-5">
                  {draft.reviewImageUrl ? <img src={draft.reviewImageUrl} alt="Temporary prescription review source" className="max-h-[620px] w-full rounded-xl object-contain shadow-[0_12px_30px_rgba(15,70,70,0.1)]" /> : <p className="max-w-xs text-center text-sm leading-6 text-slate-500">The temporary source image is no longer available. Upload again if you need to check the handwriting before approval.</p>}
                </div>
                <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-teal-700" />Temporary source image — removed after approval.</div>{draft.sourceLanguageName && <p className="mt-2 text-teal-800"><strong>Detected source:</strong> {draft.sourceLanguageName}{draft.sourceScript ? ` · ${draft.sourceScript} script` : ""}</p>}</div>
              </CardContent>
            </Card>
          </aside>

          <div className="min-w-0 space-y-6">
            <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-bold tracking-[-0.045em] text-slate-900">Structured prescription draft</p>
                    <p className="mt-1 text-sm text-slate-500">Patient details, clinical notes, and medicine instructions are separated for a clearer review.</p>
                  </div>
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-teal-700" />
                </div>
                {draft.aiError && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">AI structuring was unavailable. Complete the review manually using the original image.</div>}
                <div className="mt-6 grid gap-5">
                  <div className="grid gap-2">
                    <Label>Corrected prescription text</Label>
                    <Textarea lang={draft.sourceLanguageCode || undefined} dir={draft.sourceScript === "Arabic" ? "rtl" : "auto"} value={draft.correctedText} onChange={event => setDraft({ ...draft, correctedText: event.target.value })} className="min-h-[245px] resize-y whitespace-pre-wrap rounded-xl border-slate-200 bg-slate-50/60 font-mono text-[0.82rem] leading-7" placeholder="Review and enter corrected prescription text" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Concise summary</Label>
                    <Textarea lang={draft.sourceLanguageCode || undefined} dir={draft.sourceScript === "Arabic" ? "rtl" : "auto"} value={draft.summary} onChange={event => setDraft({ ...draft, summary: event.target.value })} className="min-h-[86px] resize-y rounded-xl border-slate-200 leading-6" placeholder="Doctor-reviewed summary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 2xl:grid-cols-[1.16fr_0.84fr]">
              <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div><p className="font-display text-xl font-bold tracking-[-0.045em] text-slate-900">Medicines</p><p className="mt-1 text-sm text-slate-500">Confirm the name, dosage, and frequency before saving.</p></div>
                    <Button type="button" variant="outline" size="sm" className="shrink-0 border-slate-200" onClick={addMedicine}><Plus className="mr-1.5 h-3.5 w-3.5" />Add</Button>
                  </div>
                  <div className="mt-5 space-y-2">
                    {draft.medicines.length ? draft.medicines.map((medicine, index) => <MedicineRow key={`${index}-${medicine.name}`} medicine={medicine} onChange={next => updateMedicine(index, next)} onDelete={() => removeMedicine(index)} />) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No medicines were extracted. Add any verified medicine manually.</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]">
                <CardContent className="p-6">
                  <p className="font-display text-xl font-bold tracking-[-0.045em] text-slate-900">Review notes</p>
                  <p className="mt-1 text-sm text-slate-500">Record verified findings and any follow-up context.</p>
                  <div className="mt-5 space-y-5">
                    <div><Label>Important findings</Label><div className="mt-2 flex flex-wrap gap-2">{draft.importantFindings.length ? draft.importantFindings.map(finding => <TagPill key={finding} className="bg-rose-50 text-rose-700">{finding}</TagPill>) : <span className="text-sm text-slate-400">No findings identified.</span>}</div></div>
                    <div><Label>Organization tags</Label><div className="mt-2 flex flex-wrap gap-2">{draft.tags.length ? draft.tags.map(tag => <TagPill key={tag} className="bg-teal-50 text-teal-700">{tag}</TagPill>) : <span className="text-sm text-slate-400">No tags generated.</span>}</div></div>
                    <div className="grid gap-2"><Label>Doctor notes <span className="font-normal text-slate-400">(optional)</span></Label><Textarea value={notes} onChange={event => setNotes(event.target.value)} className="min-h-[98px] rounded-xl border-slate-200" placeholder="For example: Follow up after 5 days" /></div>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3"><input type="checkbox" checked={important} onChange={event => setImportant(event.target.checked)} className="h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400" /><span className="text-sm font-semibold text-amber-900">Mark as important record</span></label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="sticky bottom-4 z-10 rounded-2xl bg-white/90 p-2 shadow-[0_10px_30px_rgba(15,70,70,0.12)] backdrop-blur">
              <Button className="h-12 w-full bg-teal-700 text-base shadow-lg shadow-teal-900/15 hover:bg-teal-800" disabled={save.isPending} onClick={saveRecord}>{save.isPending ? "Saving reviewed record…" : <><Save className="mr-2 h-4 w-4" />Save reviewed record</>}</Button>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
