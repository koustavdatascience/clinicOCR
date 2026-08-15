import DashboardLayout from "@/components/DashboardLayout";
import { BackButton, PageHeader } from "@/components/clinic/Ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { saveDraft } from "@/lib/clinic";
import { formatAnalysisError } from "@/lib/gatewayResponse";
import { Check, FileImage, ImagePlus, LoaderCircle, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export default function UploadPrescription() {
  const [location, setLocation] = useLocation();
  const patientIdFromUrl = Number(new URLSearchParams(location.split("?")[1] || "").get("patient") || 0);
  const [selectedPatientId, setSelectedPatientId] = useState(patientIdFromUrl || 0);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const patientsInput = useMemo(() => ({ query: search.trim() || undefined }), [search]);
  const patients = trpc.clinic.patients.list.useQuery(patientsInput);
  const patient = trpc.clinic.patients.get.useQuery({ id: selectedPatientId }, { enabled: selectedPatientId > 0 });
  const analyze = trpc.clinic.prescriptions.analyze.useMutation({
    onSuccess: data => {
      saveDraft({ ...data, reviewImageUrl: preview });
      toast.success("Analysis draft ready for doctor review.");
      setLocation("/review");
    },
    onError: error => toast.error(formatAnalysisError(error.message)),
  });

  useEffect(() => {
    if (patientIdFromUrl) setSelectedPatientId(patientIdFromUrl);
  }, [patientIdFromUrl]);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (!picked) return;
    if (!['image/jpeg', 'image/png'].includes(picked.type)) {
      toast.error("Upload a JPG, JPEG, or PNG prescription image.");
      return;
    }
    if (picked.size > 8 * 1024 * 1024) {
      toast.error("Please choose an image under 8 MB.");
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  async function startAnalysis() {
    if (!file || !selectedPatientId) {
      toast.error("Select a patient and prescription image first.");
      return;
    }
    try {
      const dataUrl = await readFile(file);
      analyze.mutate({ patientId: selectedPatientId, dataUrl, filename: file.name });
    } catch {
      toast.error("The image could not be read. Try another file.");
    }
  }

  const steps = analyze.isPending
    ? ["Preparing temporary review image", "Preparing image for OCR", "Extracting raw text", "Creating editable AI draft"]
    : ["Temporary source prepared", "OCR preprocessing", "Raw OCR extraction", "Doctor review"];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <BackButton label="Overview" />
        <PageHeader
          eyebrow="New prescription"
          title="Digitize a prescription"
          description="Select the patient first. The image is used only for OCR and doctor review; the approved record stores reviewed text, not the upload."
        />

        <section className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">1</span>
                <div>
                  <h2 className="font-display text-xl font-bold tracking-[-0.045em]">Choose the patient</h2>
                  <p className="mt-1 text-sm text-slate-500">Search the directory to keep the record correctly linked.</p>
                </div>
              </div>
              {selectedPatientId && patient.data ? (
                <div className="mt-5 flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
                  <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-700"><UserRound className="h-5 w-5" /></div><div><p className="text-sm font-bold text-slate-800">{patient.data.name}</p><p className="mt-0.5 text-xs text-slate-500">Selected patient</p></div></div>
                  <Button variant="ghost" size="sm" className="text-teal-700" onClick={() => setSelectedPatientId(0)}>Change</Button>
                </div>
              ) : (
                <>
                  <div className="relative mt-5"><Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><Input value={search} onChange={event => setSearch(event.target.value)} className="rounded-xl bg-slate-50 pl-9" placeholder="Search name or phone" /></div>
                  <div className="mt-3 max-h-[214px] overflow-auto rounded-xl border border-slate-100">
                    {patients.isLoading ? <div className="space-y-2 p-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div> : patients.data?.length ? patients.data.map(item => <button key={item.id} onClick={() => setSelectedPatientId(item.id)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-teal-50/50"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><UserRound className="h-4 w-4" /></div><div><p className="text-sm font-bold text-slate-700">{item.name}</p><p className="text-xs text-slate-400">{item.phone || "No phone recorded"}</p></div></button>) : <div className="p-5 text-center text-sm text-slate-500">No patients found. Add one from the directory first.</div>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(15,70,70,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">2</span><div><h2 className="font-display text-xl font-bold tracking-[-0.045em]">Upload the original</h2><p className="mt-1 text-sm text-slate-500">JPG, JPEG, or PNG up to 8 MB.</p></div></div>
              <Label htmlFor="prescription-image" className="mt-5 flex min-h-[214px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-teal-900/20 bg-[linear-gradient(145deg,#f7fcfb,#eef8f6)] p-5 text-center transition-colors hover:border-teal-500">
                {preview ? <img src={preview} alt="Selected prescription preview" className="max-h-[190px] max-w-full rounded-xl object-contain shadow-sm" /> : <><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm"><ImagePlus className="h-5 w-5" /></div><p className="mt-4 text-sm font-bold text-slate-700">Choose prescription image</p><p className="mt-1 text-xs text-slate-400">Used temporarily for OCR and doctor review; not kept with the approved record.</p></>}
                <Input id="prescription-image" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={selectFile} />
              </Label>
              {file && <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><FileImage className="h-4 w-4 text-teal-700" /><span className="truncate">{file.name}</span><span className="text-slate-300">·</span><span>{Math.ceil(file.size / 1024)} KB</span></div>}
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 rounded-[24px] bg-slate-900 p-5 text-white shadow-[0_16px_36px_rgba(15,23,42,0.13)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-teal-200"><ShieldCheck className="h-4 w-4" /><p className="text-[0.66rem] font-bold uppercase tracking-[0.15em]">Doctor-controlled workflow</p></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{steps.map((step, index) => <span key={step} className="flex items-center gap-2 text-xs text-slate-300">{analyze.isPending && index === 3 ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-teal-300" /> : <Check className="h-3.5 w-3.5 text-teal-300" />}{step}</span>)}</div></div><Button disabled={!selectedPatientId || !file || analyze.isPending} className="bg-teal-400 text-teal-950 hover:bg-teal-300 disabled:bg-slate-700 disabled:text-slate-400" onClick={startAnalysis}>{analyze.isPending ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Preparing draft…</> : <><Sparkles className="mr-2 h-4 w-4" />Analyze for review</>}</Button></div>
        </section>
      </div>
    </DashboardLayout>
  );
}
