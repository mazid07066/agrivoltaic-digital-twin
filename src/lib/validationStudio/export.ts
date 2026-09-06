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

export function exportChartAsPng(
  container:
    HTMLElement,

  fileName:
    string,
) {
  const svgCandidates =
    Array.from(
      container.querySelectorAll(
        "svg",
      ),
    ).filter(
      (
        candidate,
      ): candidate is SVGSVGElement =>
        candidate instanceof
        SVGSVGElement,
    );

  if (
    svgCandidates.length ===
    0
  ) {
    throw new Error(
      "No chart SVG was found.",
    );
  }

  const sourceSvg =
    svgCandidates
      .map(
        (svg) => {
          const bounds =
            svg.getBoundingClientRect();

          return {
            svg,
            bounds,
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
      )[0];

  if (
    !sourceSvg ||
    sourceSvg.bounds.width <
      100 ||
    sourceSvg.bounds.height <
      100
  ) {
    throw new Error(
      "The main chart SVG could not be resolved.",
    );
  }

  const width =
    Math.round(
      sourceSvg.bounds.width,
    );

  const height =
    Math.round(
      sourceSvg.bounds.height,
    );

  const svg =
    sourceSvg.svg.cloneNode(
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

  function copyComputedStyles(
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
          copyComputedStyles(
            sourceChild,
            targetChild,
          );
        }
      },
    );
  }

  copyComputedStyles(
    sourceSvg.svg,
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

  const url =
    URL.createObjectURL(
      svgBlob,
    );

  const image =
    new Image();

  image.onload =
    () => {
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
        URL.revokeObjectURL(
          url,
        );

        console.error(
          "Unable to create PNG canvas context.",
        );

        return;
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

      canvas.toBlob(
        (png) => {
          URL.revokeObjectURL(
            url,
          );

          if (
            !png
          ) {
            console.error(
              "PNG generation returned an empty Blob.",
            );

            return;
          }

          downloadBlob(
            png,
            fileName,
          );
        },
        "image/png",
        1,
      );
    };

  image.onerror =
    () => {
      URL.revokeObjectURL(
        url,
      );

      console.error(
        "Unable to rasterize validation chart SVG.",
      );
    };

  image.src =
    url;
}

