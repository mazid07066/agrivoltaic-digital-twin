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


export interface ResearchChartSeries {
  name: string;
  color: string;
}

export interface ResearchChartExportOptions {
  title: string;
  subtitle?: string;
  variableLabel: string;
  unitLabel: string;
  periodLabel: string;
  resolutionLabel: string;
  series: ResearchChartSeries[];
  widthPx?: number;
}

function resolveResearchChartSvg(
  container: HTMLElement,
): SVGSVGElement {
  const candidates =
    Array.from(
      container.querySelectorAll(
        "svg",
      ),
    ).filter(
      (
        node,
      ): node is SVGSVGElement =>
        node instanceof SVGSVGElement,
    );

  if (
    candidates.length ===
    0
  ) {
    throw new Error(
      "No chart SVG was found.",
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
    ranked[0]?.svg;

  if (
    !resolved
  ) {
    throw new Error(
      "Unable to resolve the primary comparison chart.",
    );
  }

  return resolved;
}

function copyResearchSvgStyles(
  source: Element,
  target: Element,
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
        target as HTMLElement
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
      child,
      index,
    ) => {
      const targetChild =
        targetChildren[
          index
        ];

      if (
        targetChild
      ) {
        copyResearchSvgStyles(
          child,
          targetChild,
        );
      }
    },
  );
}

function createResearchChartSvg(
  container: HTMLElement,
  options: ResearchChartExportOptions,
): {
  svg: SVGSVGElement;
  width: number;
  height: number;
} {
  const sourceSvg =
    resolveResearchChartSvg(
      container,
    );

  const sourceBounds =
    sourceSvg.getBoundingClientRect();

  const sourceWidth =
    Math.max(
      1,
      Math.round(
        sourceBounds.width,
      ),
    );

  const sourceHeight =
    Math.max(
      1,
      Math.round(
        sourceBounds.height,
      ),
    );

  const topBand =
    92;

  const bottomBand =
    88;

  const totalHeight =
    sourceHeight +
    topBand +
    bottomBand;

  const outer =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );

  outer.setAttribute(
    "xmlns",
    "http://www.w3.org/2000/svg",
  );

  outer.setAttribute(
    "viewBox",
    `0 0 ${sourceWidth} ${totalHeight}`,
  );

  outer.setAttribute(
    "width",
    String(
      sourceWidth,
    ),
  );

  outer.setAttribute(
    "height",
    String(
      totalHeight,
    ),
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
      sourceWidth,
    ),
  );

  background.setAttribute(
    "height",
    String(
      totalHeight,
    ),
  );

  background.setAttribute(
    "fill",
    "#ffffff",
  );

  outer.appendChild(
    background,
  );

  const title =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );

  title.setAttribute(
    "x",
    "18",
  );

  title.setAttribute(
    "y",
    "28",
  );

  title.setAttribute(
    "fill",
    "#17251d",
  );

  title.setAttribute(
    "font-size",
    "18",
  );

  title.setAttribute(
    "font-weight",
    "700",
  );

  title.setAttribute(
    "font-family",
    "Arial, Helvetica, sans-serif",
  );

  title.textContent =
    options.title;

  outer.appendChild(
    title,
  );

  const subtitle =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );

  subtitle.setAttribute(
    "x",
    "18",
  );

  subtitle.setAttribute(
    "y",
    "50",
  );

  subtitle.setAttribute(
    "fill",
    "#53635a",
  );

  subtitle.setAttribute(
    "font-size",
    "12",
  );

  subtitle.setAttribute(
    "font-family",
    "Arial, Helvetica, sans-serif",
  );

  subtitle.textContent =
    [
      options.subtitle,
      `${options.variableLabel} [${options.unitLabel}]`,
      options.periodLabel,
      `${options.resolutionLabel} display`,
    ]
      .filter(
        Boolean,
      )
      .join(
        "  •  ",
      );

  outer.appendChild(
    subtitle,
  );

  const provenance =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );

  provenance.setAttribute(
    "x",
    "18",
  );

  provenance.setAttribute(
    "y",
    "72",
  );

  provenance.setAttribute(
    "fill",
    "#68766e",
  );

  provenance.setAttribute(
    "font-size",
    "10",
  );

  provenance.setAttribute(
    "font-family",
    "Arial, Helvetica, sans-serif",
  );

  provenance.textContent =
    "AgriTwin Validation & Explainability Studio";

  outer.appendChild(
    provenance,
  );

  const chartClone =
    sourceSvg.cloneNode(
      true,
    ) as SVGSVGElement;

  /*
   * Recharts encodes the critical chart geometry and series
   * styling directly in SVG attributes. Avoid recursively
   * querying computed styles here because large scientific
   * plots may contain thousands of SVG nodes and can freeze
   * the browser during export.
   */

  chartClone.setAttribute(
    "x",
    "0",
  );

  chartClone.setAttribute(
    "y",
    String(
      topBand,
    ),
  );

  chartClone.setAttribute(
    "width",
    String(
      sourceWidth,
    ),
  );

  chartClone.setAttribute(
    "height",
    String(
      sourceHeight,
    ),
  );

  chartClone.setAttribute(
    "viewBox",
    `0 0 ${sourceWidth} ${sourceHeight}`,
  );

  outer.appendChild(
    chartClone,
  );

  const legendY =
    topBand +
    sourceHeight +
    32;

  let legendX =
    24;

  for (
    const item of
    options.series
  ) {
    const line =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );

    line.setAttribute(
      "x1",
      String(
        legendX,
      ),
    );

    line.setAttribute(
      "x2",
      String(
        legendX +
        30,
      ),
    );

    line.setAttribute(
      "y1",
      String(
        legendY,
      ),
    );

    line.setAttribute(
      "y2",
      String(
        legendY,
      ),
    );

    line.setAttribute(
      "stroke",
      item.color,
    );

    line.setAttribute(
      "stroke-width",
      "4",
    );

    outer.appendChild(
      line,
    );

    const marker =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );

    marker.setAttribute(
      "cx",
      String(
        legendX +
        15,
      ),
    );

    marker.setAttribute(
      "cy",
      String(
        legendY,
      ),
    );

    marker.setAttribute(
      "r",
      "4",
    );

    marker.setAttribute(
      "fill",
      "#ffffff",
    );

    marker.setAttribute(
      "stroke",
      item.color,
    );

    marker.setAttribute(
      "stroke-width",
      "3",
    );

    outer.appendChild(
      marker,
    );

    const label =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );

    label.setAttribute(
      "x",
      String(
        legendX +
        40,
      ),
    );

    label.setAttribute(
      "y",
      String(
        legendY +
        4,
      ),
    );

    label.setAttribute(
      "fill",
      "#26352d",
    );

    label.setAttribute(
      "font-size",
      "12",
    );

    label.setAttribute(
      "font-family",
      "Arial, Helvetica, sans-serif",
    );

    label.textContent =
      item.name;

    outer.appendChild(
      label,
    );

    legendX +=
      40 +
      Math.max(
        85,
        item.name.length *
          8,
      );
  }

  const note =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );

  note.setAttribute(
    "x",
    "18",
  );

  note.setAttribute(
    "y",
    String(
      totalHeight -
      16,
    ),
  );

  note.setAttribute(
    "fill",
    "#6c786f",
  );

  note.setAttribute(
    "font-size",
    "9",
  );

  note.setAttribute(
    "font-family",
    "Arial, Helvetica, sans-serif",
  );

  note.textContent =
    "Displayed aggregation is for visualization only; validation metrics use synchronized raw observations.";

  outer.appendChild(
    note,
  );

  return {
    svg:
      outer,

    width:
      sourceWidth,

    height:
      totalHeight,
  };
}

export async function renderResearchChartPngDataUrl(
  container: HTMLElement,
  options: ResearchChartExportOptions,
): Promise<string> {
  const {
    svg,
    width,
    height,
  } =
    createResearchChartSvg(
      container,
      options,
    );

  const targetWidth =
    options.widthPx ??
    3000;

  const scale =
    targetWidth /
    width;

  const targetHeight =
    Math.round(
      height *
      scale,
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
                  "Unable to rasterize research chart.",
                ),
              );

          candidate.src =
            objectUrl;
        },
      );

    const canvas =
      document.createElement(
        "canvas",
      );

    canvas.width =
      targetWidth;

    canvas.height =
      targetHeight;

    const context =
      canvas.getContext(
        "2d",
      );

    if (
      !context
    ) {
      throw new Error(
        "Unable to create publication chart canvas.",
      );
    }

    context.fillStyle =
      "#ffffff";

    context.fillRect(
      0,
      0,
      targetWidth,
      targetHeight,
    );

    context.drawImage(
      image,
      0,
      0,
      targetWidth,
      targetHeight,
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

export async function exportResearchChartPng(
  container: HTMLElement,
  fileName: string,
  options: ResearchChartExportOptions,
) {
  await new Promise<void>(
    (resolve) => {
      requestAnimationFrame(
        () =>
          resolve(),
      );
    },
  );

  const dataUrl =
    await renderResearchChartPngDataUrl(
      container,
      options,
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

export function exportResearchChartSvg(
  container: HTMLElement,
  fileName: string,
  options: ResearchChartExportOptions,
) {
  const {
    svg,
  } =
    createResearchChartSvg(
      container,
      options,
    );

  const serialized =
    new XMLSerializer()
      .serializeToString(
        svg,
      );

  downloadBlob(
    new Blob(
      [
        serialized,
      ],
      {
        type:
          "image/svg+xml;charset=utf-8",
      },
    ),
    fileName,
  );
}

export interface ValidationMetricExportRow {
  candidateName: string;
  candidateSourceType: string;
  count: number;
  mbe: number;
  mae: number;
  rmse: number;
  nrmsePercent: number;
  rSquared: number;
  correlation: number;
  totalSeriesErrorPercent: number;
}

export interface ValidationMetricsWorkbookInput {
  variableLabel: string;
  unitLabel: string;
  referenceName: string;
  referenceSourceType: string;
  startTimestamp: string | null;
  endTimestamp: string | null;
  metrics: ValidationMetricExportRow[];
  datasets: ValidationStudioDataset[];
}

export async function exportValidationMetricsWorkbook(
  input:
    ValidationMetricsWorkbookInput,
) {
  const summary = [
    [
      {
        value:
          "AgriTwin Validation Metrics Report",
        fontWeight:
          "bold" as const,
      },
    ],
    [
      {
        value:
          "Variable",
      },
      {
        value:
          input.variableLabel,
      },
    ],
    [
      {
        value:
          "Unit",
      },
      {
        value:
          input.unitLabel,
      },
    ],
    [
      {
        value:
          "Reference dataset",
      },
      {
        value:
          input.referenceName,
      },
    ],
    [
      {
        value:
          "Reference source type",
      },
      {
        value:
          input.referenceSourceType,
      },
    ],
    [
      {
        value:
          "Start",
      },
      {
        value:
          input.startTimestamp ??
          "",
      },
    ],
    [
      {
        value:
          "End",
      },
      {
        value:
          input.endTimestamp ??
          "",
      },
    ],
    [
      {
        value:
          "Scientific interpretation",
      },
      {
        value:
          "Cross-model agreement is verification. Empirical validation requires synchronized measured observations.",
      },
    ],
    [
      {
        value:
          "Metric basis",
      },
      {
        value:
          "Metrics are calculated from synchronized raw observations. Display aggregation does not alter statistical results.",
      },
    ],
  ];

  const metricRows = [
    [
      {
        value:
          "Candidate",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Source",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "N",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "MBE",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "MAE",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "RMSE",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "nRMSE (%)",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "R²",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Correlation",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Total-series error (%)",
        fontWeight:
          "bold" as const,
      },
    ],

    ...input.metrics.map(
      (row) => [
        {
          value:
            row.candidateName,
        },
        {
          value:
            row.candidateSourceType,
        },
        {
          value:
            row.count,
        },
        {
          value:
            row.mbe,
        },
        {
          value:
            row.mae,
        },
        {
          value:
            row.rmse,
        },
        {
          value:
            row.nrmsePercent,
        },
        {
          value:
            row.rSquared,
        },
        {
          value:
            row.correlation,
        },
        {
          value:
            row.totalSeriesErrorPercent,
        },
      ],
    ),
  ];

  const datasetRows = [
    [
      {
        value:
          "Dataset",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Source type",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Source label",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "File",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Timezone",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Interval (min)",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Start",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "End",
        fontWeight:
          "bold" as const,
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
            dataset.sourceLabel,
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
            dataset.startTimestamp,
        },
        {
          value:
            dataset.endTimestamp,
        },
      ],
    ),
  ];

  const transformationRows = [
    [
      {
        value:
          "Dataset",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Kind",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Description",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "From",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "To",
        fontWeight:
          "bold" as const,
      },
    ],

    ...input.datasets.flatMap(
      (dataset) =>
        dataset.transformations.length >
        0
          ? dataset.transformations.map(
              (item) => [
                {
                  value:
                    dataset.name,
                },
                {
                  value:
                    item.kind,
                },
                {
                  value:
                    item.description,
                },
                {
                  value:
                    item.from ??
                    "",
                },
                {
                  value:
                    item.to ??
                    "",
                },
              ],
            )
          : [
              [
                {
                  value:
                    dataset.name,
                },
                {
                  value:
                    "",
                },
                {
                  value:
                    "No transformations recorded",
                },
                {
                  value:
                    "",
                },
                {
                  value:
                    "",
                },
              ],
            ],
    ),
  ];

  await writeExcelFile([
    {
      data:
        summary,
      sheet:
        "Summary",
    },
    {
      data:
        metricRows,
      sheet:
        "Metrics",
    },
    {
      data:
        datasetRows,
      sheet:
        "Datasets",
    },
    {
      data:
        transformationRows,
      sheet:
        "Transformations",
    },
  ]).toFile(
    "agritwin-validation-metrics.xlsx",
  );
}

export interface ExplainabilityExportRow {
  stage: string;
  description: string;
  datasetName: string;
  sourceType: string;
  status: string;
  evidence: string;
}

export interface ValidationExplainabilityWorkbookInput {
  rows: ExplainabilityExportRow[];
  datasets: ValidationStudioDataset[];
}

export async function exportValidationExplainabilityWorkbook(
  input:
    ValidationExplainabilityWorkbookInput,
) {
  const matrixRows = [
    [
      {
        value:
          "Physics stage",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Description",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Dataset",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Source type",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Status",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Evidence",
        fontWeight:
          "bold" as const,
      },
    ],

    ...input.rows.map(
      (row) => [
        {
          value:
            row.stage,
        },
        {
          value:
            row.description,
        },
        {
          value:
            row.datasetName,
        },
        {
          value:
            row.sourceType,
        },
        {
          value:
            row.status,
        },
        {
          value:
            row.evidence,
        },
      ],
    ),
  ];

  const provenanceRows = [
    [
      {
        value:
          "Dataset",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Variable",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Original column",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Original unit",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Canonical unit",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Classification",
        fontWeight:
          "bold" as const,
      },
    ],

    ...input.datasets.flatMap(
      (dataset) =>
        dataset.variableProvenance.map(
          (item) => [
            {
              value:
                dataset.name,
            },
            {
              value:
                item.variable,
            },
            {
              value:
                item.originalColumn ??
                "",
            },
            {
              value:
                item.originalUnit ??
                "",
            },
            {
              value:
                item.canonicalUnit,
            },
            {
              value:
                item.sourceClassification,
            },
          ],
        ),
    ),
  ];

  const transformationRows = [
    [
      {
        value:
          "Dataset",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Kind",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Description",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "From",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "To",
        fontWeight:
          "bold" as const,
      },
    ],

    ...input.datasets.flatMap(
      (dataset) =>
        dataset.transformations.map(
          (item) => [
            {
              value:
                dataset.name,
            },
            {
              value:
                item.kind,
            },
            {
              value:
                item.description,
            },
            {
              value:
                item.from ??
                "",
            },
            {
              value:
                item.to ??
                "",
            },
          ],
        ),
    ),
  ];

  const datasetRows = [
    [
      {
        value:
          "Dataset",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Source",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Timezone",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Interval (min)",
        fontWeight:
          "bold" as const,
      },
      {
        value:
          "Variables",
        fontWeight:
          "bold" as const,
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
            dataset.timezone,
        },
        {
          value:
            dataset.intervalMinutes,
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

  await writeExcelFile([
    {
      data:
        matrixRows,
      sheet:
        "Explainability Matrix",
    },
    {
      data:
        provenanceRows,
      sheet:
        "Variable Provenance",
    },
    {
      data:
        transformationRows,
      sheet:
        "Transformations",
    },
    {
      data:
        datasetRows,
      sheet:
        "Datasets",
    },
  ]).toFile(
    "agritwin-validation-explainability.xlsx",
  );
}
