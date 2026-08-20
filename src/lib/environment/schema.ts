import { z } from "zod";

export const geographicCoordinateSchema =
  z.object({
    latitude: z
      .number()
      .finite()
      .min(-90)
      .max(90),

    longitude: z
      .number()
      .finite()
      .min(-180)
      .max(180),
  });

export const environmentalSourceSchema =
  z.enum([
    "open_meteo",
    "sensor",
    "uploaded_dataset",
    "synthetic",
    "manual",
  ]);

export const environmentalModeSchema =
  z.enum([
    "historical",
    "forecast",
    "typical",
    "sensor",
    "dataset",
  ]);

export const environmentalDataRequestSchema =
  z.object({
    source:
      environmentalSourceSchema,

    mode:
      environmentalModeSchema,

    coordinate:
      geographicCoordinateSchema,

    startDate:
      z.string().min(10),

    endDate:
      z.string().min(10),

    timezone:
      z.string().optional(),

    datasetId:
      z.string()
        .nullable()
        .optional(),
  })
  .refine(
    (value) =>
      value.startDate <=
      value.endDate,
    {
      message:
        "Environmental start date must not be after end date.",
      path: [
        "endDate",
      ],
    },
  );
