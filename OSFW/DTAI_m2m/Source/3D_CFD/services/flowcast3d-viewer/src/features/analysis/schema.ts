import { z } from "zod";
import { vectorSchema } from "../datasets/schema";
const finite = z.number().finite(),
  nullable = finite.nullable();
export const analysisSchema = z
  .object({
    contextKey: z.string(),
    field: z
      .object({ id: z.string(), unit: z.string().optional() })
      .passthrough(),
    time: finite,
    probes: z
      .array(z.object({ id: z.string(), point: vectorSchema, value: nullable }))
      .max(5),
    timeseries: z
      .array(
        z
          .object({
            id: z.string(),
            times: z.array(finite),
            values: z.array(nullable),
            maximum: nullable.optional(),
            maxTime: nullable.optional(),
            exceedanceDuration: nullable.optional(),
            timeUnit: z.string().optional(),
          })
          .refine(
            (item) => item.times.length === item.values.length,
            "Time series length mismatch",
          ),
      )
      .max(5),
    histogram: z.object({
      edges: z.array(finite),
      volumes: z.array(finite),
      percentages: z.array(finite),
      counts: z.array(finite).optional(),
    }),
    validVolume: nullable,
    thresholdVolume: nullable,
    statistics: z.object({
      minimum: nullable,
      maximum: nullable,
      mean: nullable,
    }),
    warnings: z.array(z.string()).optional(),
    method: z.record(z.string(), z.unknown()).optional(),
    analysisKind: z.enum(["volume", "surface", "points", "none"]).optional(),
    comparison: z
      .object({
        available: z.boolean(),
        reason: z.string().optional(),
        mae: nullable.optional(),
        rmse: nullable.optional(),
        cells: finite.optional(),
      })
      .optional(),
  })
  .refine(
    (value) =>
      value.validVolume === null ||
      (value.histogram.edges.length === value.histogram.volumes.length + 1 &&
        value.histogram.volumes.length === value.histogram.percentages.length),
    "Histogram length mismatch",
  );
