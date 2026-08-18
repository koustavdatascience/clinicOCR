import DashboardLayout from "@/components/DashboardLayout";
import { BackButton, EmptyState, PageHeader, TagPill } from "@/components/clinic/Ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/clinic";
import { trpc } from "@/lib/trpc";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Download, FileText, Save, ShieldCheck, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

type ExportableRecord = {
  prescription: {
    correctedText: string;
    aiSummary: string;
    sourceLanguageCode: string | null;
    sourceLanguageName: string | null;
    sourceScript: string | null;
    medicines: Array<{ name: string; dosage: string; frequency: string }>;
    doctorNotes: string | null;
    createdAt: Date | string | number;
  };
  patient: { name: string; age: number | null; phone: string | null };
};

function languageDirection(script: string | null | undefined) {
  return script === "Arabic" ? "rtl" : "ltr";
}

function SourceRecordPanel({ imageUrl }: { imageUrl: string | null | undefined }) {
  if (imageUrl) {
    return <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="font-display text-lg font-bold tracking-[-0.04em] text-slate-900">Original source</p><Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">Legacy record</Badge></div><div className="mt-4 flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl bg-slate-50"><img src={imageUrl} alt="Legacy prescription source" className="max-h-[480px] w-full object-contain" /></div><p className="mt-4 text-xs leading-5 text-slate-500">This source reference belongs to a legacy record. Newly approved prescriptions retain reviewed text only.</p></CardContent></Card>;
  }
  return <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="font-display text-lg font-bold tracking-[-0.04em] text-slate-900">Text-only record</p><Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50">No image retained</Badge></div><div className="mt-4 flex min-h-[320px] flex-col items-center justify-center rounded-xl bg-teal-50/70 p-7 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm"><ShieldCheck className="h-6 w-6" /></div><p className="mt-4 font-semibold text-slate-800">Doctor-approved clinical text</p><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">The source image was used only during review and is not stored with this prescription.</p></div></CardContent></Card>;
}

function appendPdfSection(root: HTMLElement, title: string, text: string, direction: "ltr" | "rtl") {
  const section = document.createElement("section");
  section.style.cssText = "margin-top:20px;break-inside:avoid;";
  const heading = document.createElement("h2");
  heading.textContent = title;
  heading.style.cssText = "margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0f5f6e;";
  const content = document.createElement("p");
  content.textContent = text || "Not recorded";
  content.dir = direction;
  content.style.cssText = "margin:0;white-space:pre-wrap;font-size:13px;line-height:1.65;color:#1f2937;";
  section.append(heading, content);
  root.append(section);
}

async function exportPdf(record: ExportableRecord) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const { prescription, patient } = record;
  const direction = languageDirection(prescription.sourceScript);
  const report = document.createElement("article");
  report.lang = prescription.sourceLanguageCode || "und";
  report.dir = direction;
  report.className = "font-clinical-source";
  report.style.cssText = "position:fixed;left:-10000px;top:0;width:720px;background:#fff;color:#1f2937;padding:46px;box-sizing:border-box;font-family:\"Noto Sans\",\"Noto Sans Devanagari\",\"Noto Sans Bengali\",\"Noto Sans Tamil\",\"Noto Sans Telugu\",\"Noto Sans Gujarati\",\"Noto Sans Gurmukhi\",\"Noto Sans Arabic\",\"Noto Sans Urdu\",Arial,sans-serif;";
  const header = document.createElement("header");
  header.style.cssText = "margin:-46px -46px 32px;padding:34px 46px;background:#076272;color:#fff;";
  const brand = document.createElement("h1");
  brand.textContent = "ClinicOCR";
  brand.style.cssText = "margin:0;font-family:Arial,sans-serif;font-size:28px;letter-spacing:-0.04em;";
  const subtitle = document.createElement("p");
  subtitle.textContent = "Reviewed prescription report";
  subtitle.style.cssText = "margin:7px 0 0;font-family:Arial,sans-serif;font-size:12px;opacity:0.9;";
  header.append(brand, subtitle);
  report.append(header);
  appendPdfSection(report, "Patient", `${patient.name}${patient.age ? ` · ${patient.age} years` : ""}${patient.phone ? ` · ${patient.phone}` : ""}`, "ltr");
  appendPdfSection(report, "Prescription date", formatDate(prescription.createdAt), "ltr");
  appendPdfSection(report, "Source language", `${prescription.sourceLanguageName || "Undetermined"}${prescription.sourceScript ? ` · ${prescription.sourceScript} script` : ""}`, "ltr");
  appendPdfSection(report, "Corrected text", prescription.correctedText, direction);
  appendPdfSection(report, "AI summary", prescription.aiSummary, direction);
  appendPdfSection(report, "Medicines", (prescription.medicines ?? []).map(medicine => [medicine.name, medicine.dosage, medicine.frequency].filter(Boolean).join(" — ")).join("\n"), direction);
  appendPdfSection(report, "Doctor notes", prescription.doctorNotes || "Not recorded", direction);
  document.body.append(report);
  try {
    const canvas = await html2canvas(report, { backgroundColor: "#ffffff", scale: 2, logging: false });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const outputWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const sourcePageHeight = Math.floor((availableHeight * canvas.width) / outputWidth);
    for (let offset = 0, page = 0; offset < canvas.height; offset += sourcePageHeight, page += 1) {
      if (page) doc.addPage();
      const sliceHeight = Math.min(sourcePageHeight, canvas.height - offset);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceHeight;
      slice.getContext("2d")?.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      doc.addImage(slice.toDataURL("image/png"), "PNG", margin, margin, outputWidth, (sliceHeight * outputWidth) / canvas.width);
    }
    doc.save(`ClinicOCR-${patient.name.replace(/\s+/g, "-")}-${formatDate(prescription.createdAt).replace(/\s+/g, "-")}.pdf`);
    toast.success("Prescription PDF exported.");
  } catch {
    toast.error("Could not generate the prescription PDF. Please try again.");
  } finally {
    report.remove();
  }
}

export default function PrescriptionDetail() {
  const [, params] = useRoute("/prescriptions/:id");
  const [, setLocation] = useLocation();
  const id = Number(params?.id || 0);
  const input = useMemo(() => ({ id }), [id]);
  const detail = trpc.clinic.prescriptions.get.useQuery(input, { enabled: id > 0 });
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState<string | null>(null);
  const update = trpc.clinic.prescriptions.updateMeta.useMutation({
    onSuccess: () => {
      toast.success("Record details updated.");
      utils.clinic.prescriptions.get.invalidate(input);
      utils.clinic.prescriptions.forPatient.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const record = detail.data;

  if (!detail.isLoading && !record) {
    return <DashboardLayout><div className="mx-auto max-w-6xl"><BackButton label="Records" to="/search" /><EmptyState title="Prescription not found" description="This record may have been deleted or is not available in your clinic workspace." actionLabel="Find records" onAction={() => setLocation("/search")} /></div></DashboardLayout>;
  }

  const prescription = record?.prescription;
  const doctorNotes = notes ?? prescription?.doctorNotes ?? "";
  const direction = languageDirection(prescription?.sourceScript);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <BackButton to={record ? `/patients/${record.patient.id}` : "/search"} label={record ? "Patient record" : "Records"} />
        <PageHeader
          eyebrow="Saved prescription"
          title={record ? `${record.patient.name}'s prescription` : "Loading prescription…"}
          description={prescription ? `Reviewed and saved on ${formatDate(prescription.createdAt)}` : ""}
          actions={record ? <><Button variant="outline" className="border-slate-200 bg-white" onClick={() => void exportPdf(record)}><Download className="mr-2 h-4 w-4" />Export PDF</Button><Button className={prescription?.important ? "bg-amber-400 text-amber-950 hover:bg-amber-300" : "bg-teal-700 hover:bg-teal-800"} onClick={() => update.mutate({ id, important: !prescription?.important })}><Star className={`mr-2 h-4 w-4 ${prescription?.important ? "fill-amber-950" : ""}`} />{prescription?.important ? "Important record" : "Mark important"}</Button></> : undefined}
        />

        <section className="mt-7 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div><SourceRecordPanel imageUrl={prescription?.imageUrl} /></div>

          <div className="space-y-6">
            <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><FileText className="h-5 w-5" /></div><div><p className="font-display text-xl font-bold tracking-[-0.045em] text-slate-900">Reviewed content</p><p className="text-sm text-slate-500">The doctor-approved saved record.</p></div></div>{prescription?.sourceLanguageName && <div className="mt-5 inline-flex items-center rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">Source language: {prescription.sourceLanguageName}{prescription.sourceScript ? ` · ${prescription.sourceScript}` : ""}</div>}<div className="mt-6"><p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400">Corrected text</p><p lang={prescription?.sourceLanguageCode || undefined} dir={direction} className="font-clinical-source mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{prescription?.correctedText || "No corrected text recorded."}</p></div><div className="mt-6 rounded-2xl bg-teal-50/80 p-4"><p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-teal-700">AI summary, reviewed by doctor</p><p lang={prescription?.sourceLanguageCode || undefined} dir={direction} className="font-clinical-source mt-2 text-sm leading-6 text-slate-700">{prescription?.aiSummary || "No summary recorded."}</p></div></CardContent></Card>
            <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]"><CardContent className="p-6"><p className="font-display text-xl font-bold tracking-[-0.045em] text-slate-900">Medicines</p><div className="mt-4 overflow-hidden rounded-xl border border-slate-100">{prescription?.medicines?.length ? prescription.medicines.map((medicine, index) => <div key={`${medicine.name}-${index}`} dir={direction} className="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-0 sm:grid-cols-3"><p className={`font-clinical-source text-sm font-bold ${/^possibly\b/i.test(medicine.name) ? "text-amber-700" : "text-slate-700"}`}>{medicine.name}{/^possibly\b/i.test(medicine.name) && <span className="ml-2 text-[0.62rem] uppercase tracking-wide text-amber-500">verify</span>}</p><p className="font-clinical-source text-sm text-slate-500">{medicine.dosage || "—"}</p><p className="font-clinical-source text-sm text-slate-500">{medicine.frequency || "—"}</p></div>) : <p className="p-4 text-sm text-slate-500">No medicine list recorded.</p>}</div><div className="mt-5"><p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400">Tags</p><div className="mt-2 flex flex-wrap gap-2">{prescription?.tags?.length ? prescription.tags.map(tag => <TagPill key={tag} className="bg-teal-50 text-teal-700">{tag}</TagPill>) : <span className="text-sm text-slate-400">No tags</span>}</div></div></CardContent></Card>
            <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]"><CardContent className="p-6"><p className="font-display text-xl font-bold tracking-[-0.045em] text-slate-900">Doctor notes</p><Textarea className="mt-4 min-h-[100px] rounded-xl border-slate-200" value={doctorNotes} onChange={event => setNotes(event.target.value)} placeholder="Add a clinical follow-up note" /><div className="mt-3 flex justify-end"><Button size="sm" className="bg-teal-700 hover:bg-teal-800" disabled={update.isPending} onClick={() => update.mutate({ id, doctorNotes: doctorNotes || null })}><Save className="mr-2 h-3.5 w-3.5" />Save note</Button></div></CardContent></Card>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
