import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileScan,
  Languages,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const entranceEase = [0.22, 1, 0.36, 1] as const;
const heroLines = ["Prescriptions,", "made clear."];

export function getLandingMotionPlan(reducedMotion: boolean | null) {
  if (reducedMotion === true) {
    return {
      mode: "reduced" as const,
      heroScan: { animate: {}, transition: { duration: 0 } },
      heroPulse: { animate: {}, transition: { duration: 0 } },
      heroSignal: { animate: {}, transition: { duration: 0 } },
      aboutEvidence: { animate: {}, transition: { duration: 0 } },
      signInRings: { animate: {}, transition: { duration: 0 } },
    };
  }

  return {
    mode: "active" as const,
    heroScan: {
      animate: { y: ["-180%", "440%"] },
      transition: { duration: 2.25, repeat: Infinity, repeatDelay: 0.65, ease: "easeInOut" as const },
    },
    heroPulse: {
      animate: { scale: [0.94, 1.08, 0.94], opacity: [0.22, 0.64, 0.22] },
      transition: { duration: 4.8, repeat: Infinity, ease: "easeInOut" as const },
    },
    heroSignal: {
      animate: { x: ["-115%", "125%"] },
      transition: { duration: 2.8, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" as const },
    },
    aboutEvidence: {
      animate: { y: [0, -12, 0] },
      transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const },
    },
    signInRings: {
      animate: { scale: [0.9, 1.18, 0.9], opacity: [0.2, 0.65, 0.2] },
      transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" as const },
    },
  };
}

export function getLandingNavigationState(scrollY: number) {
  return scrollY > 28 ? "compact" : "expanded";
}

function Brand({ compact = false, onLight = false }: { compact?: boolean; onLight?: boolean }) {
  return (
    <div className={`flex items-center transition-all duration-300 ${onLight ? "text-slate-950" : "text-white"} ${compact ? "gap-2" : "gap-3"}`}>
      <div className={`flex items-center justify-center rounded-[15px] font-bold shadow-[0_10px_32px_rgba(0,0,0,0.12)] transition-all duration-300 ${onLight ? "bg-teal-700 text-white" : "bg-white text-teal-800"} ${compact ? "h-8 w-8 text-base" : "h-10 w-10 text-xl"}`}>
        +
      </div>
      <div className="leading-none">
        <p className={`font-display font-bold tracking-[-0.06em] transition-all duration-300 ${compact ? "text-base" : "text-xl"}`}>ClinicOCR</p>
        <p className={`mt-1 font-bold uppercase tracking-[0.18em] transition-all duration-300 ${onLight ? "text-teal-700" : "text-teal-200"} ${compact ? "hidden" : "text-[0.61rem]"}`}>Prescription intelligence</p>
      </div>
    </div>
  );
}

function Label({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-current/10 px-1 text-[0.58rem]">{index}</span>
      {children}
    </p>
  );
}

function StagedHeroHeading({ reducedMotion }: { reducedMotion: boolean | null }) {
  const still = reducedMotion === true;
  return (
    <h1 data-testid="hero-staged-copy" className="mt-9 font-editorial text-[4.15rem] font-medium leading-[0.79] tracking-[-0.07em] text-slate-950 sm:text-[5rem] lg:text-[8rem]">
      {heroLines.map((line, index) => (
        <span key={line} className="block overflow-hidden pb-[0.07em]">
          <motion.span
            className={index === 1 ? "block text-teal-600" : "block"}
            initial={{ opacity: 0, y: still ? 0 : 34, filter: still ? "blur(0px)" : "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: still ? 0 : 0.74, delay: still ? 0 : 0.2 + index * 0.15, ease: entranceEase }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

function EvidenceFlow({ reducedMotion }: { reducedMotion: boolean | null }) {
  const plan = getLandingMotionPlan(reducedMotion);
  const still = reducedMotion === true;
  const steps = [
    { label: "Ink", value: "Temporary scan", className: "border-amber-100 bg-[#fff9ee] text-amber-800" },
    { label: "Review", value: "Doctor-led", className: "border-teal-100 bg-teal-50 text-teal-800" },
    { label: "Record", value: "Text only", className: "border-slate-700 bg-slate-950 text-white" },
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, y: still ? 0 : 28, scale: still ? 1 : 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: still ? 0 : 0.8, delay: still ? 0 : 0.9, ease: entranceEase }}
      className="relative mx-auto mt-14 w-full max-w-4xl overflow-hidden rounded-[1.9rem] border border-teal-900/10 bg-white p-3 shadow-[0_32px_82px_rgba(12,82,83,0.17)] sm:p-4"
    >
      <motion.div
        aria-hidden
        animate={plan.heroPulse.animate}
        transition={plan.heroPulse.transition}
        className="absolute -left-20 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-teal-300/25 blur-3xl"
      />
      <div className="relative grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-[1.45rem] bg-[#f6fbfa] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-teal-950">
              <motion.span animate={still ? {} : { scale: [1, 1.5, 1] }} transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }} className="h-2 w-2 rounded-full bg-teal-500" />
              <span className="text-[0.66rem] font-bold tracking-[0.13em]">CLINICAL EVIDENCE FLOW</span>
            </div>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-teal-700">Doctor controlled</span>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
            <div className="absolute inset-x-8 top-[56%] h-px overflow-hidden bg-slate-200">
              <motion.span data-testid="hero-signal-trace" aria-hidden animate={plan.heroSignal.animate} transition={plan.heroSignal.transition} className="block h-full w-1/3 bg-[linear-gradient(90deg,transparent,#14b8a6,#8ff5e7,transparent)] shadow-[0_0_14px_rgba(20,184,166,0.9)]" />
            </div>
            <div className="relative grid grid-cols-3 gap-2 sm:gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: still ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: still ? 0 : 0.46, delay: still ? 0 : 1.04 + index * 0.1, ease: entranceEase }}
                  className={`min-h-[132px] rounded-2xl border p-3 sm:p-4 ${step.className}`}
                >
                  <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] opacity-70">0{index + 1}</span>
                  <p className="mt-4 text-sm font-bold sm:text-base">{step.label}</p>
                  <p className="mt-1 text-[0.68rem] font-semibold opacity-70 sm:text-xs">{step.value}</p>
                  {index === 0 && <p className="mt-4 -rotate-2 font-serif text-base leading-5">Rx<br />দিনে ২ বার</p>}
                  {index === 1 && <ScanLine className="mt-5 h-5 w-5" />}
                  {index === 2 && <CheckCircle2 className="mt-5 h-5 w-5 text-teal-300" />}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#062a34] p-5 text-white">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-teal-200/20" />
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-teal-200/10" />
          <div className="relative">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-teal-200">Review status</p>
            <p className="mt-3 font-display text-2xl font-bold leading-[0.95] tracking-[-0.055em]">Nothing enters the record without you.</p>
            <div className="mt-6 space-y-2.5">
              {["Language retained", "Uncertain medicines flagged", "Image discarded after approval"].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: still ? 0 : 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: still ? 0 : 0.42, delay: still ? 0 : 1.28 + index * 0.08, ease: entranceEase }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-teal-50"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-300 text-[0.58rem] font-bold text-teal-950">{index + 1}</span>
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function About({ reducedMotion }: { reducedMotion: boolean | null }) {
  const plan = getLandingMotionPlan(reducedMotion);
  const still = reducedMotion === true;
  const highlights = [
    { icon: FileScan, label: "Review source", value: "Temporary by design" },
    { icon: Languages, label: "Language", value: "Native script retained" },
    { icon: ShieldCheck, label: "Approval", value: "Doctor decides" },
  ];
  return (
    <section id="about" className="relative overflow-hidden bg-[#f2fbf8] px-5 py-24 text-slate-900 lg:px-8 lg:py-32">
      <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
        <motion.div initial={{ opacity: 0, x: still ? 0 : -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: still ? 0 : 0.56 }}>
          <Label index="02">About ClinicOCR</Label>
          <h2 className="mt-5 font-display text-5xl font-bold leading-[0.95] tracking-[-0.07em] text-slate-950">A safer path from ink to insight.</h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">ClinicOCR turns a scan into an organized, searchable draft. The upload exists only for OCR and doctor review; the approved clinical record contains reviewed text, not the image.</p>
          <div className="mt-8 grid gap-3">
            {highlights.map(item => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-teal-900/8 bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(8,79,80,0.04)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><item.icon className="h-4 w-4" /></div>
                <div><p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-teal-700">{item.label}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{item.value}</p></div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div data-testid="about-evidence-flow" animate={plan.aboutEvidence.animate} transition={plan.aboutEvidence.transition} className="rounded-[2rem] border border-teal-900/10 bg-white p-5 shadow-[0_26px_55px_rgba(8,79,80,0.14)]">
          <div className="flex items-center justify-between"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-teal-700">Review flow</p><p className="mt-1 font-display text-2xl font-bold tracking-[-0.05em]">One visible handoff</p></div><ScanLine className="h-6 w-6 text-teal-700" /></div>
          <div className="mt-6 grid grid-cols-3 gap-2"><div className="rounded-2xl border border-amber-100 bg-[#fff9ee] p-3"><span className="text-[0.6rem] font-bold uppercase tracking-wide text-amber-700">Upload</span><p className="mt-3 font-serif text-lg text-slate-700">Rx<br />দিনে ২ বার</p></div><div className="flex items-center justify-center"><ArrowRight className="h-5 w-5 text-teal-700" /></div><div className="rounded-2xl bg-slate-950 p-3 text-white"><span className="text-[0.6rem] font-bold uppercase tracking-wide text-teal-300">Approved</span><p className="mt-3 text-sm font-bold leading-5">Text-only<br />record</p></div></div>
          <div className="mt-5 overflow-hidden rounded-full bg-teal-50 p-1"><div className="h-2 w-full rounded-full bg-[linear-gradient(90deg,#0d766f,#82e4d4)]" /></div>
          <div className="mt-4 flex items-center justify-between text-[0.68rem] font-bold uppercase tracking-[0.11em] text-slate-400"><span>Review image</span><span>Doctor review</span><span>Text record</span></div>
        </motion.div>
      </div>
    </section>
  );
}

function SignIn({ loading, user, onEnter, reducedMotion }: { loading: boolean; user: unknown; onEnter: () => void; reducedMotion: boolean | null }) {
  const plan = getLandingMotionPlan(reducedMotion);
  return (
    <section id="signin" className="relative isolate overflow-hidden bg-[#062c36] px-5 py-24 text-white lg:px-8 lg:py-32">
      <div className="relative mx-auto grid max-w-6xl gap-10 rounded-[2rem] border border-white/12 bg-white/[0.06] p-7 shadow-[0_32px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm md:grid-cols-[0.94fr_1.06fr] md:p-12">
        <div>
          <Label index="03">Secure sign in</Label>
          <h2 className="mt-5 font-display text-5xl font-bold leading-[0.96] tracking-[-0.07em]">Your clinical workspace is ready when you are.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-teal-50/78">Sign in to open the doctor-controlled workspace. Approved records retain structured clinical text; temporary review sources are not kept after approval.</p>
          <Button onClick={onEnter} size="lg" className="mt-8 h-13 rounded-xl bg-white px-6 text-base font-bold text-teal-950 shadow-[0_18px_35px_rgba(0,0,0,0.22)] hover:bg-teal-50">{loading ? "Checking session" : user ? "Open workspace" : "Sign in to ClinicOCR"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[1.7rem] border border-white/12 bg-[#073d49] p-6">
          <motion.div data-testid="signin-session-rings" animate={plan.signInRings.animate} transition={plan.signInRings.transition} className="absolute h-52 w-52 rounded-full border border-teal-300/35" />
          <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 text-slate-900 shadow-2xl"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><LockKeyhole className="h-5 w-5" /></div><div><p className="font-display text-lg font-bold tracking-[-0.04em]">Protected workspace</p><p className="text-xs text-slate-500">ClinicOCR account access</p></div></div><div className="mt-6 space-y-3">{["Identity verified", "Encrypted session", "Workspace unlocked"].map((step, index) => <div key={step} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-[0.65rem] font-bold text-teal-800">{index + 1}</span><span className="text-sm font-semibold text-slate-700">{step}</span></div>)}</div><div className="mt-6 flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800"><ShieldCheck className="h-4 w-4" />Session secured</div></div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, loading, login } = useAuth();
  const reducedMotion = useReducedMotion();
  const still = reducedMotion === true;
  const preserveLandingPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has("preview");
  const [navigationState, setNavigationState] = useState(() => getLandingNavigationState(typeof window === "undefined" ? 0 : window.scrollY));
  const compactNavigation = navigationState === "compact";

  useEffect(() => {
    if (user && !preserveLandingPreview) setLocation("/workspace");
  }, [preserveLandingPreview, setLocation, user]);

  useEffect(() => {
    const updateNavigation = () => setNavigationState(getLandingNavigationState(window.scrollY));
    updateNavigation();
    window.addEventListener("scroll", updateNavigation, { passive: true });
    return () => window.removeEventListener("scroll", updateNavigation);
  }, []);

  const enterWorkspace = () => {
    if (user) {
      setLocation("/workspace");
      return;
    }
    login();
  };
  const scrollTo = (id: string) => {
    if (id === "signin") {
      enterWorkspace();
      return;
    }
    document.getElementById(id)?.scrollIntoView?.({ behavior: still ? "auto" : "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fbfa] text-slate-950 selection:bg-teal-200 selection:text-teal-950">
      <section id="hero" className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_20%,rgba(126,236,197,0.25),transparent_25%),radial-gradient(circle_at_84%_38%,rgba(72,197,166,0.14),transparent_20%),linear-gradient(180deg,#fcfdfc_0%,#f4fbf8_72%,#eef8f5_100%)]" />
        <nav data-testid="landing-navigation" data-navigation-state={navigationState} className={`fixed left-1/2 z-30 flex w-[calc(100%-2.5rem)] -translate-x-1/2 items-center justify-between transition-[top,max-width,padding,background-color,border-color,box-shadow,backdrop-filter] duration-300 ${compactNavigation ? "top-3 max-w-5xl rounded-2xl border border-teal-900/10 bg-white/82 px-4 py-3 shadow-[0_16px_42px_rgba(13,92,89,0.12)] backdrop-blur-xl md:w-[calc(100%-4rem)]" : "top-0 max-w-7xl px-0 py-6 md:w-[calc(100%-4rem)]"}`}>
          <Brand compact={compactNavigation} onLight />
          <div className="hidden items-center gap-5 text-sm font-semibold text-slate-600 md:flex"><button className="transition-colors hover:text-teal-700" onClick={() => scrollTo("hero")}>Home</button><button className="transition-colors hover:text-teal-700" onClick={() => scrollTo("about")}>About</button><button className="transition-colors hover:text-teal-700" onClick={() => scrollTo("signin")}>Sign in</button></div>
          <Button onClick={() => scrollTo("signin")} variant="outline" className={`border-teal-900/15 bg-white/80 text-slate-800 transition-all duration-300 hover:bg-teal-700 hover:text-white ${compactNavigation ? "h-9 rounded-xl px-3 text-xs" : "rounded-xl"}`}>{loading ? "Checking session" : user ? "Open workspace" : "Sign in"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
        </nav>

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-32 lg:px-8 lg:pb-28 lg:pt-40">
          <div className="mx-auto max-w-6xl text-center">
            <motion.div initial={{ opacity: 0, y: still ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: still ? 0 : 0.56, ease: entranceEase }} className="inline-flex items-center gap-2 rounded-full border border-teal-900/10 bg-white px-4 py-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-teal-800 shadow-[0_12px_35px_rgba(13,92,89,0.08)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-white"><Stethoscope className="h-3 w-3" /></span>
              <span>Clinician-led</span>
            </motion.div>
            <StagedHeroHeading reducedMotion={reducedMotion} />
            <motion.p initial={{ opacity: 0, y: still ? 0 : 16, filter: still ? "blur(0px)" : "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: still ? 0 : 0.7, delay: still ? 0 : 0.58, ease: entranceEase }} className="mx-auto mt-7 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">From handwriting to reviewed records.</motion.p>
            <motion.div initial={{ opacity: 0, y: still ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: still ? 0 : 0.64, delay: still ? 0 : 0.72, ease: entranceEase }} className="mt-7 flex justify-center">
              <Button onClick={() => scrollTo("signin")} size="lg" className="h-10 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white shadow-[0_18px_35px_rgba(9,112,103,0.22)] hover:bg-teal-800">Enter ClinicOCR<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </motion.div>
          </div>
          <EvidenceFlow reducedMotion={reducedMotion} />
        </div>
      </section>
      <About reducedMotion={reducedMotion} />
      <SignIn loading={loading} user={user} onEnter={enterWorkspace} reducedMotion={reducedMotion} />
      <AnimatePresence>{loading && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="pointer-events-none fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-slate-950/65 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur">Secure session check in progress</motion.div>}</AnimatePresence>
    </main>
  );
}
