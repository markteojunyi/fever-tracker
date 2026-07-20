// ─── Request-body validation ──────────────────────────────────────────────────
// Zod schemas for every mutating API route. parseBody() returns either the
// parsed data or a ready-to-return 400 response, so malformed payloads fail
// fast with a clear message instead of surfacing as Mongoose 500s.
// ──────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "must be a valid id");

// Accepts any string Date.parse understands (ISO strings from the client).
const dateString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "must be a valid date");

const dosageUnit = z.enum(["pills", "ml"]);

// ─── Children ─────────────────────────────────────────────────────────────────

export const childCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  dateOfBirth: dateString,
  weight: z.number().positive().max(200).nullish(),
});

export const childUpdateSchema = z.object({
  name: z.string().trim().min(1, "name required").max(100),
  dateOfBirth: dateString.optional(),
  weight: z.number().positive().max(200).nullish(),
});

// ─── Temperatures ─────────────────────────────────────────────────────────────
// Range mirrors the Mongoose model (35–43°C) so out-of-range readings get a
// 400 instead of a validation 500.

export const temperatureCreateSchema = z.object({
  childId: objectId,
  temperature: z.number().min(35).max(43),
  temperatureUnit: z.enum(["C", "F"]),
  timestamp: dateString,
  notes: z.string().max(1000).nullish(),
});

export const temperatureUpdateSchema = z.object({
  temperature: z.number().min(35).max(43).optional(),
  temperatureUnit: z.enum(["C", "F"]).optional(),
  timestamp: dateString.optional(),
  notes: z.string().max(1000).nullish(),
});

// ─── Observations ─────────────────────────────────────────────────────────────

export const observationCreateSchema = z.object({
  childId: objectId,
  content: z.string().trim().min(1, "content is required").max(5000),
  observedAt: dateString.optional(),
});

export const observationUpdateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "content cannot be empty")
    .max(5000)
    .optional(),
  observedAt: dateString.optional(),
});

// ─── Medication definitions ───────────────────────────────────────────────────

export const medicationCreateSchema = z.object({
  childId: objectId,
  name: z.string().trim().min(1).max(100),
  dosage: z.number().positive(),
  dosageUnit,
  frequency: z.number().positive().max(24),
  maxDosesPerDay: z.number().int().positive().max(24),
  maxTotalDailyDosage: z.number().positive().nullish(),
  startDate: dateString,
  endDate: dateString.nullish(),
});

export const medicationUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  dosage: z.number().positive().optional(),
  dosageUnit: dosageUnit.optional(),
  frequency: z.number().positive().max(24).optional(),
  maxDosesPerDay: z.number().int().positive().max(24).optional(),
  maxTotalDailyDosage: z.number().positive().nullish(),
  startDate: dateString.optional(),
  // "" is allowed so the client can clear the end date (route maps it to null).
  endDate: dateString.or(z.literal("")).nullish(),
  isActive: z.boolean().optional(),
});

// ─── Medication logs ──────────────────────────────────────────────────────────

export const medicationLogCreateSchema = z.object({
  childId: objectId,
  medicationDefinitionId: objectId,
  administeredAt: dateString,
  dosageAdministered: z.number().positive(),
  dosageUnit,
  administeredBy: z.string().trim().min(1).max(100),
  notes: z.string().max(1000).nullish(),
});

export const medicationLogUpdateSchema = z.object({
  administeredAt: dateString.optional(),
  dosageAdministered: z.number().positive().optional(),
  dosageUnit: dosageUnit.optional(),
  administeredBy: z.string().trim().min(1).max(100).optional(),
  notes: z.string().max(1000).nullish(),
});

// ─── Reminders ────────────────────────────────────────────────────────────────

export const reminderCreateSchema = z.object({
  medicationDefinitionId: objectId,
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

type ParseResult<S extends z.ZodType> =
  | { ok: true; data: z.infer<S> }
  | { ok: false; response: NextResponse };

export async function parseBody<S extends z.ZodType>(
  req: NextRequest,
  schema: S
): Promise<ParseResult<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.join(".");
    const message = path ? `${path}: ${issue.message}` : issue.message;
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    };
  }

  return { ok: true, data: result.data };
}
