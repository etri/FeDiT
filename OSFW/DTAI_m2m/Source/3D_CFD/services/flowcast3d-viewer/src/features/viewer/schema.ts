import { z } from "zod";
import { fieldSchema, vectorSchema } from "../datasets/schema";
const assetUrl = z
  .string()
  .startsWith("/app-api/assets/")
  .refine((value) => !value.includes(".."), "Invalid scene asset URL");
export const sceneSchema = z
  .object({
    contextKey: z.string(),
    origin: vectorSchema,
    bounds: z.tuple([vectorSchema, vectorSchema]),
    field: fieldSchema.optional(),
    range: z.tuple([z.number().finite(), z.number().finite()]).optional(),
    time: z.number().finite().optional(),
    assets: z
      .array(
        z.object({
          kind: z.enum([
            "points",
            "geometry",
            "volume",
            "tiles",
            "trajectories",
          ]),
          format: z.string(),
          url: assetUrl,
          count: z.number().int().nonnegative().optional(),
          stride: z.number().int().positive().optional(),
          dimensions: z
            .tuple([
              z.number().int().positive().max(512),
              z.number().int().positive().max(512),
              z.number().int().positive().max(512),
            ])
            .optional(),
          origin: vectorSchema.optional(),
          spacing: vectorSchema.optional(),
          maskUrl: assetUrl.optional(),
          sha256: z
            .string()
            .regex(/^[a-f0-9]{64}$/)
            .optional(),
          byteLength: z.number().int().nonnegative().optional(),
        }),
      )
      .max(32),
    warnings: z.array(z.string()).optional(),
    particlePaths: z
      .object({
        schema: z.literal("flowcast.particle-paths/1"),
        datasetId: z.string().min(1),
        resultId: z.string().min(1),
        source: vectorSchema,
        sourceDatasetId: z.string().min(1),
        sourceResultId: z.string().min(1).nullable(),
        sourceVersion: z.string().min(1),
        methodVersion: z.string().min(1),
        seed: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
        times: z.array(z.number().finite()).min(1).max(361),
        verified: z.literal(true),
        verification: z.literal("all-concentration-frames-equal"),
        timestampInterpretation: z.string().min(1),
      })
      .optional(),
  })
  .refine(
    (scene) => !scene.field || scene.time !== undefined,
    "Field scene requires source time",
  );
