import { z } from "zod";

export const createCardSchema = z.object({
  columnId: z.string().uuid(),
  name: z.string().trim().min(1).max(200)
});

export const updateCardSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  projectManagerName: z.string().nullable().optional(),
  projectManagerEmail: z.string().email().nullable().optional(),
  projectCode: z.string().nullable().optional(),
  engineeringHours: z.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional()
});

export const moveCardSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().nonnegative()
});

export const assignCardSchema = z.object({
  engineerId: z.string().uuid(),
  action: z.enum(["assign", "remove", "replace"]).default("assign")
});
