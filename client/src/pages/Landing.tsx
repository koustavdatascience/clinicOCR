import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileScan, Languages, LockKeyhole, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

function ClinicBrand() {
  return (
    <div className="flex items-center gap-3 text-white">
      <div className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-white text-teal-800 shadow-[0_10px_32px_rgba(0,0,0,0.18)]"><span className="text-xl font-bold">+</span></div>
      <div className="leading-none"><p className="font-display text-xl font-bold tracking-[-0.06em]">ClinicOCR</p><p className="mt-1 text-[0.61rem] font-bold uppercase tracking-[0.18em] text-teal-200">Prescription intelligence</p></div>
    </div>
  );
}

function PrescriptionPreview({ reducedMotion }: { reducedMotion: boolean | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.7, delay: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className="relative mx-auto mt-12 w-full max-w-[620px]"
    >
      <div className="absolute -inset-10 rounded-[3rem] bg-[radial-gradient(circle_at_45%_35%,rgba(112,234,215,0.24),transparent_58%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#f6fbfa] p-3 shadow-[0_38px_90px_rgba(2,20,31,0.38)]">
        <div className="flex items-center justify-between rounded-[1.45rem] bg-[#ecf5f3] px-5 py-3"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal-500" /><span className="text-xs font-bold tracking-wide text-teal-900">PRESCRIPTION REVIEW</span></div><span className="rounded-full bg-white px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-slate-500">Doctor controlled</span></div>
        <div className="grid gap-3 p-3 sm:grid-cols-[0.76fr_1.24fr]">
          <div className="relative min-h-64 overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(145deg,#fdf8ef,#eee6d7)] p-5">
            <div className="absolute inset-x-8 top-6 h-px bg-amber-900/10" />
            <p className="mt-7 -rotate-2 font-serif text-2xl leading-relaxed text-slate-700">Rx<br /><span className="text-xl">Tab. Paracetamol</span><br /><span className="text-[1.05rem]">দিনে ২ বার</span><br /><span className="text-lg">after food</span></p>
            <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white/65 px-3 py-2 text-[0.61rem] font-medium text-slate-500">Original image preserved</div>
          </div>
          <div className="space-y-3 rounded-2xl bg-white p-5 shadow-[0_10px_24px_rgba(15,70,70,0.06)]">
            <div className="flex items-center justify-between"><div><p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-teal-700">Structured draft</p><p className="mt-1 font-display text-lg font-bold tracking-[-0.04em] text-slate-900">Ready for review</p></div><motion.div animate={reducedMotion ? {} : { rotate: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }} className="rounded-xl bg-teal-50 p-2 text-teal-700"><Sparkles className="h-4 w-4" /></motion.div></div>
            <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-3"><p className="text-[0.61rem] font-bold uppercase tracking-[0.14em] text-teal-700">Source language</p><p className="mt-1 text-sm font-bold text-slate-800">Bengali · বাংলা</p></div>
            <div className="space-y-2"><div className="h-2.5 w-[88%] rounded-full bg-slate-100" /><div className="h-2.5 w-[67%] rounded-full bg-slate-100" /><div className="h-2.5 w-[76%] rounded-full bg-slate-100" /></div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white"><CheckCircle2 className="h-3.5 w-3.5 text-teal-300" />Nothing saves without approval.</div>
          </div>
        </div>
      </div>
      <motion.div animate={reducedMotion ? {} : { y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }} className="absolute -right-3 top-[23%] hidden rounded-2xl border border-white/30 bg-white/95 px-3 py-2 shadow-xl sm:block"><div className="flex items-center gap-2"><Languages className="h-4 w-4 text-teal-700" /><span className="text-xs font-bold text-slate-700">Language retained</span></div></motion.div>
      <motion.div animate={reducedMotion ? {} : { y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.3 }} className="absolute -left-4 bottom-[15%] hidden rounded-2xl border border-white/20 bg-[#103e48] px-3 py-2 text-white shadow-xl sm:block"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-300" /><span className="text-xs font-bold">Review-first record</span></div></motion.div>
    </motion.div>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const reducedMotion = useReducedMotion();
  const preserveLandingPreview = new URLSearchParams(window.location.search).has("preview");

  useEffect(() => {
    if (user && !preserveLandingPreview) setLocation("/workspace");
  }, [preserveLandingPreview, setLocation, user]);

  const enterWorkspace = () => {
    if (user) {
      setLocation("/workspace");
      return;
    }
    startLogin();
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#062c36] text-white selection:bg-teal-300 selection:text-teal-950">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_12%,rgba(49,170,164,0.3),transparent_31%),radial-gradient(circle_at_87%_42%,rgba(118,219,206,0.16),transparent_26%),linear-gradient(150deg,#062c36_0%,#073c48_50%,#052b35_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(rgba(197,255,246,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(197,255,246,0.13)_1px,transparent_1px)] [background-size:58px_58px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8"><ClinicBrand /><div className="flex items-center gap-3"><span className="hidden text-sm text-teal-100/80 sm:block">Private clinical workspace</span><Button onClick={enterWorkspace} variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white hover:text-teal-950">{loading ? "Checking session" : user ? "Open workspace" : "Sign in"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></nav>

        <section className="mx-auto max-w-7xl px-5 pb-28 pt-16 lg:px-8 lg:pb-36 lg:pt-24">
          <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: reducedMotion ? 0 : 0.08 }} className="mx-auto max-w-4xl text-center">
            <motion.div variants={reveal} transition={{ duration: reducedMotion ? 0 : 0.45 }} className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-100"><LockKeyhole className="h-3.5 w-3.5 text-teal-300" />Built for doctor-reviewed records</motion.div>
            <motion.h1 variants={reveal} transition={{ duration: reducedMotion ? 0 : 0.55 }} className="mt-7 font-display text-5xl font-bold leading-[0.94] tracking-[-0.075em] text-white sm:text-7xl lg:text-[5.6rem]">The prescription stays human.<br /><span className="bg-[linear-gradient(90deg,#92efe0,#d5fff7,#73d8e0)] bg-clip-text text-transparent">The record becomes clear.</span></motion.h1>
            <motion.p variants={reveal} transition={{ duration: reducedMotion ? 0 : 0.5 }} className="mx-auto mt-7 max-w-2xl text-base leading-7 text-teal-50/80 sm:text-lg">ClinicOCR turns handwritten prescriptions—across languages—into organized, searchable records while keeping the original image and the doctor in control.</motion.p>
            <motion.div variants={reveal} transition={{ duration: reducedMotion ? 0 : 0.45 }} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"><Button onClick={enterWorkspace} size="lg" className="h-12 rounded-xl bg-white px-6 text-base font-bold text-teal-950 shadow-[0_18px_35px_rgba(0,0,0,0.22)] hover:bg-teal-50">{user ? "Go to dashboard" : "Enter ClinicOCR"}<ArrowRight className="ml-2 h-4 w-4" /></Button><div className="flex items-center gap-2 px-3 text-sm text-teal-100/75"><ShieldCheck className="h-4 w-4 text-teal-300" />Original image always preserved</div></motion.div>
          </motion.div>
          <PrescriptionPreview reducedMotion={reducedMotion} />
        </section>
      </div>

      <section className="border-y border-teal-900 bg-[#f4fbf9] px-5 py-20 text-slate-900 lg:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Designed for clinical confidence</p><h2 className="mt-4 font-display text-4xl font-bold leading-[0.98] tracking-[-0.06em] text-slate-950">Useful intelligence.<br />Clear responsibility.</h2><p className="mt-5 max-w-md text-sm leading-7 text-slate-600">A thoughtful handoff from source image to structured draft, with no silent automation between the clinician and the final record.</p></div><div className="grid gap-4 sm:grid-cols-3">{[{ icon: FileScan, title: "Keep evidence", body: "Store the source image unchanged beside every record." }, { icon: Languages, title: "Keep language", body: "Preserve the prescription's native language and script." }, { icon: ScanLine, title: "Keep control", body: "Review each field before anything is saved." }].map((item, index) => <motion.div key={item.title} initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: reducedMotion ? 0 : 0.42, delay: reducedMotion ? 0 : index * 0.08 }} className="rounded-2xl border border-teal-900/8 bg-white p-5 shadow-[0_14px_28px_rgba(8,79,80,0.06)]"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><item.icon className="h-5 w-5" /></div><h3 className="mt-5 font-display text-lg font-bold tracking-[-0.04em]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p></motion.div>)}</div></div></section>

      <section className="bg-[#ecf5f3] px-5 py-20 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-[#0b5867] p-8 text-white shadow-[0_24px_56px_rgba(4,65,75,0.18)] md:flex-row md:items-end md:p-12"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-200">A calmer clinical workspace</p><h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[0.98] tracking-[-0.06em]">Digitize carefully. Retrieve confidently.</h2></div><Button onClick={enterWorkspace} size="lg" className="h-12 shrink-0 rounded-xl bg-white px-6 font-bold text-teal-950 hover:bg-teal-50">{user ? "Open workspace" : "Sign in to begin"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></section>
      <AnimatePresence>{loading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-slate-950/65 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur">Secure session check in progress</motion.div>}</AnimatePresence>
    </main>
  );
}
