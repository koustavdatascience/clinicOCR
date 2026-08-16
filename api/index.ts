import { createClinicApp } from "../server/_core/app";

// Vercel recognizes a default-exported Express app as a Node.js serverless function.
// It must not call app.listen(); Vercel owns the HTTP listener.
export default createClinicApp();
