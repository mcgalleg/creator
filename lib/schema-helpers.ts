import type { ComponentSchema } from "@json-render/core";
import { z } from "zod";

/**
 * Helper function to cast Zod schemas to ComponentSchema type.
 * Needed due to Zod 4 type changes with @json-render/core.
 */
export function asProps<T extends z.ZodTypeAny>(schema: T): ComponentSchema {
  return schema as unknown as ComponentSchema;
}

/** Flexible chart data point — keys are column names, values are strings or numbers */
export const chartDataPointSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()])
);
