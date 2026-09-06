import writeExcelFile from "write-excel-file/browser";

import type {
  ComparisonPoint,
  ValidationMetrics,
} from "./comparison";

import type {
  ValidationStudioDataset,
  ValidationStudioVariable,
} from "./types";

function downloadBlob(
  blob:
    Blob,

  fileName:
    string,
) {
  const url =
    URL.createObjectURL(
      blob,
    );

  const anchor =
    document.createElement(
      "a",
    );

  anchor.href =
    url;

  anchor.download =
    fileName;

  document.body.appendChild(
    anchor,
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(
    url,
  );
}

function csvEscape(
  value:
    unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text =
    String(
      value,
    );

  if (
    /[",\n\r]/.test(
      text,
    )
  ) {
    return `"${text.replaceAll(
      '"',
      '""',
    )}"`;
  }

  return text;
}

export function exportComparisonCsv(
  input: {
    series:
      ComparisonPoint[];

    datasets:
      ValidationStudioDataset[];

    variable:
      ValidationStudioVariable;
  },
) {
  const rows = [
    [
      "timestamp",
      ...input.datasets.map(
        (dataset) =>
          dataset.name,
      ),
    ],

    ...input.series.map(
      (point) => [
        point.timestamp,

        ...input.datasets.map(
          (dataset) =>
            point.values[
              dataset.id
            ] ??
            "",
        ),
      ],
    ),
  ];

  const csv =
    rows
      .map(
        (row) =>
          row
            .map(
              csvEscape,
            )
            .join(
              ",",
            ),
      )
      .join(
        "\n",
      );

  downloadBlob(
    new Blob(
      [
        csv,
      ],
      {
        type:
          "text/csv;charset=utf-8",
      },
    ),
    `agritwin-validation-${input.variable}.csv`,
  );
}

export async function exportValidationWorkbook(
  input: {
    datasets:
      ValidationStudioDataset[];

    series:
      ComparisonPoint[];

    variable:
      ValidationStudioVariable;

    reference:
      ValidationStudioDataset;

    metrics:
      {
        dataset:
          ValidationStudioDataset;

        metrics:
          ValidationMetrics;
      }[];
  },
) {
  const summaryData = [
    [
      {
        value:
          "AgriTwin Validation & Explainability Report",
      },
      {
        value:
          "",
      },
    ],

    [
      {
        value:
          "Generated",
      },
      {
        value:
          new Date().toISOString(),
      },
    ],

    [
      {
        value:
          "Reference dataset",
      },
      {
        value:
          input.reference.name,
      },
    ],

    [
      {
        value:
          "Variable",
      },
      {
        value:
          input.variable,
      },
    ],

    [
      {
        value:
          "Synchronized timestamps",
      },
      {
        value:
          input.series.length,
      },
    ],
  ];

  const metricsData = [
    [
      {
        value:
          "Candidate",
      },
      {
        value:
          "Reference",
      },
      {
        value:
          "Samples",
      },
      {
        value:
          "MBE",
      },
      {
        value:
          "MAE",
      },
      {
        value:
          "RMSE",
      },
      {
        value:
          "nRMSE (%)",
      },
      {
        value:
          "R²",
      },
      {
        value:
          "Correlation",
      },
      {
        value:
          "Total-series error (%)",
      },
    ],

    ...input.metrics.map(
      ({
        dataset,
        metrics,
      }) => [
        {
          value:
            dataset.name,
        },
        {
          value:
            input.reference.name,
        },
        {
          value:
            metrics.count,
        },
        {
          value:
            metrics.mbe,
        },
        {
          value:
            metrics.mae,
        },
        {
          value:
            metrics.rmse,
        },
        {
          value:
            metrics.nrmsePercent,
        },
        {
          value:
            metrics.rSquared,
        },
        {
          value:
            metrics.correlation,
        },
        {
          value:
            metrics.energyErrorPercent,
        },
      ],
    ),
  ];

  const alignedData = [
    [
      {
        value:
          "timestamp",
      },

      ...input.datasets.map(
        (dataset) => ({
          value:
            dataset.name,
        }),
      ),
    ],

    ...input.series.map(
      (point) => [
        {
          value:
            point.timestamp,
        },

        ...input.datasets.map(
          (dataset) => ({
            value:
              point.values[
                dataset.id
              ] ??
              "",
          }),
        ),
      ],
    ),
  ];

  const datasetsData = [
    [
      {
        value:
          "Dataset",
      },
      {
        value:
          "Source",
      },
      {
        value:
          "File",
      },
      {
        value:
          "Timezone",
      },
      {
        value:
          "Interval (min)",
      },
      {
        value:
          "Rows",
      },
      {
        value:
          "Start",
      },
      {
        value:
          "End",
      },
      {
        value:
          "Variables",
      },
    ],

    ...input.datasets.map(
      (dataset) => [
        {
          value:
            dataset.name,
        },
        {
          value:
            dataset.sourceType,
        },
        {
          value:
            dataset.fileName ??
            "",
        },
        {
          value:
            dataset.timezone,
        },
        {
          value:
            dataset.intervalMinutes,
        },
        {
          value:
            dataset.observations.length,
        },
        {
          value:
            dataset.startTimestamp,
        },
        {
          value:
            dataset.endTimestamp,
        },
        {
          value:
            dataset.variables.join(
              ", ",
            ),
        },
      ],
    ),
  ];

  const provenanceData = [
    [
      {
        value:
          "Dataset",
      },
      {
        value:
          "Transformation",
      },
      {
        value:
          "From",
      },
      {
        value:
          "To",
      },
      {
        value:
          "Description",
      },
    ],

    ...input.datasets.flatMap(
      (dataset) =>
        dataset.transformations.map(
          (transformation) => [
            {
              value:
                dataset.name,
            },
            {
              value:
                transformation.kind,
            },
            {
              value:
                transformation.from ??
                "",
            },
            {
              value:
                transformation.to ??
                "",
            },
            {
              value:
                transformation.description,
            },
          ],
        ),
    ),
  ];

  await writeExcelFile(
    [
      {
        data:
          summaryData,

        sheet:
          "Summary",
      },

      {
        data:
          metricsData,

        sheet:
          "Metrics",
      },

      {
        data:
          alignedData,

        sheet:
          "Aligned Data",
      },

      {
        data:
          datasetsData,

        sheet:
          "Datasets",
      },

      {
        data:
          provenanceData,

        sheet:
          "Provenance",
      },
    ],
  ).toFile(
    `agritwin-validation-${input.variable}.xlsx`,
  );
}

function resolveMainChartSvg(
  container:
    HTMLElement,
): SVGSVGElement {
  const candidates =
    Array.from(
      container.querySelectorAll(
        "svg",
      ),
    ).filter(
      (
        element,
      ): element is SVGSVGElement =>
        element instanceof
        SVGSVGElement,
    );

  if (
    candidates.length ===
    0
  ) {
    throw new Error(
      "No validation chart SVG was found.",
    );
  }

  const ranked =
    candidates
      .map(
        (svg) => {
          const bounds =
            svg.getBoundingClientRect();

          return {
            svg,

            width:
              bounds.width,

            height:
              bounds.height,

            area:
              bounds.width *
              bounds.height,
          };
        },
      )
      .sort(
        (
          left,
          right,
        ) =>
          right.area -
          left.area,
      );

  const resolved =
    ranked[0];

  if (
    !resolved ||
    resolved.width <
      200 ||
    resolved.height <
      150
  ) {
    throw new Error(
      "The full validation chart SVG could not be resolved.",
    );
  }

  return resolved.svg;
}

function copySvgComputedStyles(
  source:
    Element,

  target:
    Element,
) {
  const computed =
    window.getComputedStyle(
      source,
    );

  const properties = [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "fill",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-opacity",
    "stroke-dasharray",
    "stroke-linecap",
    "stroke-linejoin",
    "opacity",
    "color",
    "text-anchor",
    "dominant-baseline",
    "visibility",
  ];

  for (
    const property of
    properties
  ) {
    const value =
      computed.getPropertyValue(
        property,
      );

    if (
      value
    ) {
      (
        target as
          HTMLElement
      ).style.setProperty(
        property,
        value,
      );
    }
  }

  const sourceChildren =
    Array.from(
      source.children,
    );

  const targetChildren =
    Array.from(
      target.children,
    );

  sourceChildren.forEach(
    (
      sourceChild,
      index,
    ) => {
      const targetChild =
        targetChildren[
          index
        ];

      if (
        targetChild
      ) {
        copySvgComputedStyles(
          sourceChild,
          targetChild,
        );
      }
    },
  );
}

export async function renderChartAsPngDataUrl(
  container:
    HTMLElement,
): Promise<string> {
  const sourceSvg =
    resolveMainChartSvg(
      container,
    );

  const bounds =
    sourceSvg.getBoundingClientRect();

  const width =
    Math.max(
      1,
      Math.round(
        bounds.width,
      ),
    );

  const height =
    Math.max(
      1,
      Math.round(
        bounds.height,
      ),
    );

  const svg =
    sourceSvg.cloneNode(
      true,
    ) as SVGSVGElement;

  svg.setAttribute(
    "xmlns",
    "http://www.w3.org/2000/svg",
  );

  svg.setAttribute(
    "width",
    String(
      width,
    ),
  );

  svg.setAttribute(
    "height",
    String(
      height,
    ),
  );

  svg.setAttribute(
    "viewBox",
    `0 0 ${width} ${height}`,
  );

  svg.style.width =
    `${width}px`;

  svg.style.height =
    `${height}px`;

  copySvgComputedStyles(
    sourceSvg,
    svg,
  );

  const background =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );

  background.setAttribute(
    "x",
    "0",
  );

  background.setAttribute(
    "y",
    "0",
  );

  background.setAttribute(
    "width",
    String(
      width,
    ),
  );

  background.setAttribute(
    "height",
    String(
      height,
    ),
  );

  background.setAttribute(
    "fill",
    "#ffffff",
  );

  svg.insertBefore(
    background,
    svg.firstChild,
  );

  const serialized =
    new XMLSerializer()
      .serializeToString(
        svg,
      );

  const svgBlob =
    new Blob(
      [
        serialized,
      ],
      {
        type:
          "image/svg+xml;charset=utf-8",
      },
    );

  const objectUrl =
    URL.createObjectURL(
      svgBlob,
    );

  try {
    const image =
      await new Promise<HTMLImageElement>(
        (
          resolve,
          reject,
        ) => {
          const candidate =
            new Image();

          candidate.onload =
            () =>
              resolve(
                candidate,
              );

          candidate.onerror =
            () =>
              reject(
                new Error(
                  "Unable to rasterize validation chart.",
                ),
              );

          candidate.src =
            objectUrl;
        },
      );

    const scale =
      2;

    const canvas =
      document.createElement(
        "canvas",
      );

    canvas.width =
      width *
      scale;

    canvas.height =
      height *
      scale;

    const context =
      canvas.getContext(
        "2d",
      );

    if (
      !context
    ) {
      throw new Error(
        "Unable to create validation chart canvas.",
      );
    }

    context.setTransform(
      scale,
      0,
      0,
      scale,
      0,
      0,
    );

    context.fillStyle =
      "#ffffff";

    context.fillRect(
      0,
      0,
      width,
      height,
    );

    context.drawImage(
      image,
      0,
      0,
      width,
      height,
    );

    return canvas.toDataURL(
      "image/png",
      1,
    );
  } finally {
    URL.revokeObjectURL(
      objectUrl,
    );
  }
}

export async function exportChartAsPng(
  container:
    HTMLElement,

  fileName:
    string,
) {
  const dataUrl =
    await renderChartAsPngDataUrl(
      container,
    );

  const anchor =
    document.createElement(
      "a",
    );

  anchor.href =
    dataUrl;

  anchor.download =
    fileName;

  document.body.appendChild(
    anchor,
  );

  anchor.click();

  anchor.remove();
}

