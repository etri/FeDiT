import { z } from "zod";
export const vectorSchema = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);
export const fieldSchema = z
  .object({
    id: z.string(),
    label: z.string().optional(),
    unit: z.string().optional(),
    association: z.enum(["cell", "point"]).optional(),
    components: z.number().int().positive().optional(),
    range: z.tuple([z.number().finite(), z.number().finite()]).optional(),
    supportModes: z.array(z.string()).optional(),
  })
  .passthrough();
const resultMetadata = {
  capabilities: z
    .union([z.array(z.string()), z.record(z.string(), z.boolean())])
    .optional(),
  supportModes: z.array(z.string()).optional(),
  analysisKind: z.enum(["volume", "surface", "points", "none"]).optional(),
  scenarioId: z.string().optional(),
  resultRole: z
    .enum([
      "geometry",
      "reference_concentration",
      "observations",
      "reference_wind",
      "model_wind",
      "virtual_reference",
      "virtual_model",
    ])
    .optional(),
  sourceRef: z
    .object({
      datasetId: z.string().optional(),
      resultId: z.string().nullish(),
      recordId: z.union([z.string(), z.number()]).optional(),
      doi: z.string().optional(),
      license: z.string().optional(),
      sourceUrl: z.string().optional(),
      title: z.string().optional(),
      creators: z.array(z.unknown()).optional(),
      comparisonKind: z.string().optional(),
    })
    .passthrough()
    .optional(),
  colorRange: z.tuple([z.number().finite(), z.number().finite()]).optional(),
  initialFrame: z.number().int().nonnegative().optional(),
};
export const datasetSchema = z
  .object({
    ...resultMetadata,
    id: z.string(),
    name: z.string().optional(),
    label: z.string().optional(),
    spaceName: z.string().optional(),
    spaceId: z.string().optional(),
    thumbnailUrl: z
      .string()
      .regex(
        /^\/app-api\/datasets\/[^/?#\\\s]+\/thumbnail(?:\?[^#\\\s]*)?$/,
        "Invalid dataset thumbnail URL.",
      )
      .optional(),
    status: z.string().optional(),
    fields: z.array(fieldSchema).default([]),
    times: z.array(z.number().finite()).default([]),
    bounds: z.tuple([vectorSchema, vectorSchema]).optional(),
    origin: vectorSchema.optional(),
    version: z.string().optional(),
    source: z.string().optional(),
    fileFormat: z.string().nullish(),
    synthetic: z.boolean().optional(),
    timeUnit: z.string().optional(),
    coordinateUnit: z.string().optional(),
    sizeBytes: z.number().nonnegative().optional(),
    scenarioModes: z.array(z.enum(["reference", "model"])).optional(),
    referenceResultId: z.string().nullish(),
    provenance: z.record(z.string(), z.unknown()).nullish(),
    attribution: z
      .object({
        source: z.string(),
        license: z.string().optional(),
        url: z.string().nullish(),
        changes: z.string().optional(),
      })
      .optional(),
    validation: z
      .array(z.object({ level: z.string(), message: z.string() }))
      .optional(),
    results: z
      .array(
        z.object({
          ...resultMetadata,
          id: z.string(),
          label: z.string().optional(),
          name: z.string().optional(),
          status: z.string().optional(),
          times: z.array(z.number().finite()).optional(),
          fields: z.array(fieldSchema).optional(),
        }),
      )
      .optional(),
  })
  .passthrough();
export const datasetsSchema = z.object({ datasets: z.array(datasetSchema) });
