import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createPatient,
  createPrescription,
  deletePatient,
  getDashboard,
  getDuplicatePatient,
  getPatient,
  getPrescription,
  listPatientPrescriptions,
  listPatients,
  searchPrescriptions,
  updatePatient,
  updatePrescriptionMeta,
} from "./clinicDb";
import { analyzePrescriptionImage, decodePrescriptionUpload } from "./prescriptionPipeline";
import { storagePut } from "./storage";
import { protectedProcedure, router } from "./_core/trpc";

const patientSchema = z.object({
  name: z.string().trim().min(2, "Enter the patient's full name.").max(180),
  age: z.number().int().min(0).max(130).nullable().optional(),
  gender: z.string().trim().max(48).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
});

const medicineSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
});

function ensurePatient(result: unknown) {
  if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Patient not found." });
  return result;
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "prescription-image";
}

export const clinicRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const startedAt = performance.now();
    const dashboard = await getDashboard(ctx.user.id);
    if (typeof ctx.res.getHeader === "function" && typeof ctx.res.setHeader === "function") {
      const current = ctx.res.getHeader("Server-Timing");
      const prefix = typeof current === "string" && current.length ? `${current}, ` : "";
      ctx.res.setHeader("Server-Timing", `${prefix}dashboard;dur=${(performance.now() - startedAt).toFixed(1)}`);
    }
    return dashboard;
  }),
  patients: router({
    list: protectedProcedure
      .input(z.object({ query: z.string().optional() }).optional())
      .query(({ ctx, input }) => listPatients(ctx.user.id, input?.query)),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) =>
      getPatient(ctx.user.id, input.id),
    ),
    duplicates: protectedProcedure
      .input(patientSchema.extend({ excludeId: z.number().int().positive().optional() }))
      .query(({ ctx, input }) => {
        const { excludeId, ...patient } = input;
        return getDuplicatePatient(ctx.user.id, patient, excludeId);
      }),
    create: protectedProcedure.input(patientSchema).mutation(async ({ ctx, input }) => {
      const duplicates = await getDuplicatePatient(ctx.user.id, input);
      if (duplicates.length) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A patient with a matching name or phone number already exists. Review the directory before creating a duplicate.",
        });
      }
      return createPatient(ctx.user.id, input);
    }),
    update: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), patient: patientSchema }))
      .mutation(async ({ ctx, input }) => {
        ensurePatient(await getPatient(ctx.user.id, input.id));
        const duplicates = await getDuplicatePatient(ctx.user.id, input.patient, input.id);
        if (duplicates.length) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A patient with a matching name or phone number already exists. Review the directory before saving.",
          });
        }
        return updatePatient(ctx.user.id, input.id, input.patient);
      }),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      ensurePatient(await getPatient(ctx.user.id, input.id));
      return { success: await deletePatient(ctx.user.id, input.id) };
    }),
  }),
  prescriptions: router({
    analyze: protectedProcedure
      .input(
        z.object({
          patientId: z.number().int().positive(),
          dataUrl: z.string().min(32),
          filename: z.string().min(1).max(255),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        ensurePatient(await getPatient(ctx.user.id, input.patientId));
        const upload = decodePrescriptionUpload(input.dataUrl);
        const originalFilename = sanitizeFilename(input.filename);
        const extension = upload.mimeType === "image/png" ? "png" : "jpg";
        const original = await storagePut(
          `clinicocr/${ctx.user.id}/originals/${Date.now()}-${originalFilename}.${extension}`,
          upload.buffer,
          upload.mimeType,
        );
        const analysis = await analyzePrescriptionImage(upload.buffer, upload.mimeType);
        return {
          patientId: input.patientId,
          originalFilename,
          originalMimeType: upload.mimeType,
          imageKey: original.key,
          imageUrl: original.url,
          ...analysis,
        };
      }),
    save: protectedProcedure
      .input(
        z.object({
          patientId: z.number().int().positive(),
          imageKey: z.string().min(1),
          imageUrl: z.string().min(1),
          originalFilename: z.string().min(1).max(255),
          originalMimeType: z.enum(["image/jpeg", "image/png"]),
          rawOcr: z.string(),
          sourceLanguageCode: z.string().trim().min(2).max(24).optional(),
          sourceLanguageName: z.string().trim().min(1).max(80).optional(),
          sourceScript: z.string().trim().min(1).max(48).optional(),
          correctedText: z.string(),
          aiSummary: z.string(),
          medicines: z.array(medicineSchema),
          importantFindings: z.array(z.string()),
          tags: z.array(z.string()),
          doctorNotes: z.string().nullable().optional(),
          important: z.boolean().optional(),
          ocrConfidence: z.number().int().min(0).max(100).nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        ensurePatient(await getPatient(ctx.user.id, input.patientId));
        // This is the only persistence point. Analysis results are never saved automatically.
        return createPrescription(ctx.user.id, input);
      }),
    forPatient: protectedProcedure
      .input(z.object({ patientId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        ensurePatient(await getPatient(ctx.user.id, input.patientId));
        return listPatientPrescriptions(ctx.user.id, input.patientId);
      }),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) =>
      getPrescription(ctx.user.id, input.id),
    ),
    search: protectedProcedure
      .input(
        z.object({
          patient: z.string().optional(),
          medicine: z.string().optional(),
          from: z.date().optional(),
          to: z.date().optional(),
        }),
      )
      .query(({ ctx, input }) => searchPrescriptions(ctx.user.id, input)),
    updateMeta: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          doctorNotes: z.string().nullable().optional(),
          important: z.boolean().optional(),
          tags: z.array(z.string()).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...meta } = input;
        if (!Object.keys(meta).length) return getPrescription(ctx.user.id, id);
        return updatePrescriptionMeta(ctx.user.id, id, meta);
      }),
  }),
});
