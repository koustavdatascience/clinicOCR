import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileScan,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const still = reducedMotion === true;
  const [activeStep, setActiveStep] = useState(0);
  const workflowStepRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const steps = [
    { id: "01", title: "Upload the prescription", description: "Choose the patient and add the source image.", visualLabel: "Temporary source", visualText: "Rx" as const, icon: FileScan },
    { id: "02", title: "Review the draft", description: "Correct the structured text and medicines.", visualLabel: "Doctor review", visualText: "Review" as const, icon: ScanLine },
    { id: "03", title: "Approve the record", description: "Save only the clinician-approved text.", visualLabel: "Text-only record", visualText: "Approved" as const, icon: ShieldCheck },
  ];
  const active = steps[activeStep];

  useEffect(() => {
    const updateActiveStepFromScroll = () => {
      const readingLine = window.innerHeight * 0.46;
      let nextStep = 0;

      workflowStepRefs.current.forEach((step, index) => {
        if (step && step.getBoundingClientRect().top <= readingLine) nextStep = index;
      });

      setActiveStep(currentStep => currentStep === nextStep ? currentStep : nextStep);
    };

    updateActiveStepFromScroll();
    window.addEventListener("scroll", updateActiveStepFromScroll, { passive: true });
    window.addEventListener("resize", updateActiveStepFromScroll);
    return () => {
      window.removeEventListener("scroll", updateActiveStepFromScroll);
      window.removeEventListener("resize", updateActiveStepFromScroll);
    };
  }, []);

  return (
    <section id="about" className="relative overflow-hidden bg-[#f7fbf9] px-5 py-24 text-slate-900 lg:overflow-visible lg:px-8 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: still ? 0 : 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: still ? 0 : 0.56, ease: entranceEase }} className="flex items-center justify-center gap-3 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-700"><Sparkles className="h-4 w-4" /></span>
          <h2 className="font-display text-3xl font-bold tracking-[-0.055em] text-slate-950 sm:text-4xl">How ClinicOCR works</h2>
        </motion.div>

        <div data-testid="workflow-scroll-region" data-workflow-layout="sticky-two-column" className="mx-auto mt-16 flex max-w-5xl flex-col gap-14 lg:flex-row lg:gap-0 lg:pb-[15vh]">
          <div data-testid="about-evidence-flow" data-evidence-position="fixed" data-active-step={active.id} className="lg:sticky lg:top-[15vh] lg:flex lg:h-[60vh] lg:w-1/2 lg:items-center lg:justify-end lg:self-start lg:pr-12 xl:pr-20">
            <div className="mx-auto flex w-fit items-start gap-7 lg:mx-0">
              <div className="relative flex h-[250px] w-[250px] items-center justify-center overflow-hidden rounded-[2rem] border border-teal-200 bg-white p-6 shadow-[0_18px_44px_rgba(13,92,89,0.08)] sm:h-[320px] sm:w-[320px] sm:rounded-[2.5rem] sm:p-8 lg:h-[360px] lg:w-[360px] lg:rounded-[2.75rem] lg:p-10">
                <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-teal-100/80 blur-2xl" />
                {steps.map((step, index) => {
                  const VisualIcon = step.icon;
                  const isVisualActive = activeStep === index;
                  return <div key={step.id} data-testid={`workflow-visual-${step.id}`} data-visual-state={isVisualActive ? "active" : "inactive"} aria-hidden={!isVisualActive} className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-[opacity,transform] duration-500 ${isVisualActive ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}>
                    <div className={`flex h-20 w-20 items-center justify-center rounded-[1.6rem] sm:h-24 sm:w-24 sm:rounded-[1.8rem] ${index === 0 ? "bg-amber-50 text-amber-700" : index === 1 ? "bg-teal-50 text-teal-700" : "bg-slate-950 text-teal-300"}`}><VisualIcon className="h-9 w-9 sm:h-10 sm:w-10" /></div>
                    <p className="mt-6 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-teal-700">{step.visualLabel}</p>
                    <p className={`mt-2 font-editorial text-4xl leading-none sm:text-5xl ${index === 2 ? "text-slate-950" : "text-slate-800"}`}>{step.visualText}</p>
                    {index === 0 && <p className="mt-5 rounded-xl bg-[#fff9ee] px-4 py-2 font-editorial text-lg text-slate-700 sm:text-xl">দিনে ২ বার</p>}
                    {index === 1 && <div className="mt-5 w-full rounded-2xl border border-teal-100 bg-teal-50/70 p-3 text-left text-xs font-semibold leading-5 text-teal-900">Structured text · medicines · notes</div>}
                    {index === 2 && <div className="mt-5 flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800"><CheckCircle2 className="h-4 w-4" />Ready to save</div>}
                  </div>;
                })}
              </div>
              <div aria-label="Workflow progress" className="hidden flex-col items-center gap-2 pt-12 lg:flex">
                {steps.map((step, index) => <motion.div key={step.id} layout transition={{ duration: still ? 0 : 0.6, ease: entranceEase }} className={activeStep === index ? "h-20 w-3 rounded-full bg-teal-400 shadow-[0_0_18px_rgba(45,212,191,0.42)]" : "h-3 w-3 rounded-full bg-slate-300"} />)}
              </div>
            </div>
          </div>

          <div data-testid="workflow-stage-list" className="flex flex-col gap-12 pl-2 sm:pl-4 lg:w-1/2 lg:gap-36 lg:pb-[75vh] lg:pl-12 xl:pl-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              return <button ref={element => { workflowStepRefs.current[index] = element; }} key={step.id} type="button" aria-current={isActive ? "step" : undefined} aria-pressed={isActive} onClick={() => setActiveStep(index)} onMouseEnter={() => setActiveStep(index)} onFocus={() => setActiveStep(index)} className={`block min-h-36 w-full origin-left py-3 text-left transition-all duration-700 ${isActive ? "scale-100 opacity-100" : "scale-90 opacity-30 hover:scale-[0.94] hover:opacity-70 focus:scale-100 focus:opacity-100"}`}>
                <span className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 sm:h-14 sm:w-14 ${isActive ? "bg-teal-100 text-slate-950 shadow-sm" : "border-2 border-slate-200 text-slate-400"}`}>{step.id}</span>
                <span className="mt-6 block"><span className="flex items-center gap-2"><Icon className={`h-4 w-4 ${isActive ? "text-teal-700" : "text-slate-400"}`} /><span className={`text-2xl font-bold tracking-[-0.045em] sm:text-3xl lg:text-4xl ${isActive ? "text-slate-950" : "text-slate-500"}`}>{step.title}</span></span><span className={`mt-3 block max-w-sm text-sm leading-6 sm:text-base ${isActive ? "text-slate-600" : "text-slate-400"}`}>{step.description}</span></span>
              </button>;
            })}
          </div>
        </div>
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
    <main data-testid="landing-root" data-sticky-scroll-safe="true" className="min-h-screen bg-[#f8fbfa] text-slate-950 selection:bg-teal-200 selection:text-teal-950">
      <section id="hero" className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_20%,rgba(126,236,197,0.25),transparent_25%),radial-gradient(circle_at_84%_38%,rgba(72,197,166,0.14),transparent_20%),linear-gradient(180deg,#fcfdfc_0%,#f4fbf8_72%,#eef8f5_100%)]" />
        <nav data-testid="landing-navigation" data-navigation-state={navigationState} className={`fixed left-1/2 z-30 flex w-[calc(100%-2.5rem)] -translate-x-1/2 items-center transition-[top,max-width,padding,background-color,border-color,box-shadow,backdrop-filter] duration-300 ${compactNavigation ? "top-3 max-w-5xl rounded-2xl border border-teal-900/10 bg-white/82 px-4 py-3 shadow-[0_16px_42px_rgba(13,92,89,0.12)] backdrop-blur-xl md:w-[calc(100%-4rem)]" : "top-0 max-w-7xl px-0 py-6 md:w-[calc(100%-4rem)]"}`}>
          <Brand compact={compactNavigation} onLight />
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 text-sm font-semibold text-slate-600 md:flex"><button className="transition-colors hover:text-teal-700" onClick={() => scrollTo("hero")}>Home</button><button className="transition-colors hover:text-teal-700" onClick={() => scrollTo("about")}>About</button><button className="transition-colors hover:text-teal-700" onClick={() => scrollTo("about")}>Workflow</button></div>
          <Button onClick={() => scrollTo("signin")} variant="outline" className={`ml-auto border-teal-900/15 bg-white/80 text-slate-800 transition-all duration-300 hover:bg-teal-700 hover:text-white ${compactNavigation ? "h-9 rounded-xl px-3 text-xs" : "rounded-xl"}`}>{loading ? "Checking session" : user ? "Open workspace" : "Sign in"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
        </nav>

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-32 lg:px-8 lg:pb-28 lg:pt-40">
          <div className="mx-auto max-w-6xl text-center">
            <motion.div initial={{ opacity: 0, y: still ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: still ? 0 : 0.56, ease: entranceEase }} className="inline-flex items-center gap-2 rounded-full border border-teal-900/10 bg-white px-4 py-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-teal-800 shadow-[0_12px_35px_rgba(13,92,89,0.08)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-white"><Stethoscope className="h-3 w-3" /></span>
              <span>Language aware</span>
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
