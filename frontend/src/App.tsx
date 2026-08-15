import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import PatientDetail from "./pages/PatientDetail";
import Patients from "./pages/Patients";
import PrescriptionDetail from "./pages/PrescriptionDetail";
import ReviewPrescription from "./pages/ReviewPrescription";
import SearchRecords from "./pages/SearchRecords";
import UploadPrescription from "./pages/UploadPrescription";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path={"/workspace"} component={Home} />
      <Route path={"/patients"} component={Patients} />
      <Route path={"/patients/:id"} component={PatientDetail} />
      <Route path={"/upload"} component={UploadPrescription} />
      <Route path={"/review"} component={ReviewPrescription} />
      <Route path={"/prescriptions/:id"} component={PrescriptionDetail} />
      <Route path={"/search"} component={SearchRecords} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
