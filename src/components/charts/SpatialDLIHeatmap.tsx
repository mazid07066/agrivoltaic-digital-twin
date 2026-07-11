"use client";

import { useState } from "react";
import { SpatialLightResults } from "@/types/simulation";

export default function SpatialDLIHeatmap({ data, selectedHour }: {
  data: SpatialLightResults;
  selectedHour: number;
}) {
  const [view, setView] = useState<"dli" | "shadow">("dli");
  const range = Math.max(data.maximumDLI - data.minimumDLI, 0.01);
  return (
    <div>
      <div className="heatmap-controls">
        <button className={view === "dli" ? "active" : ""} onClick={() => setView("dli")}>Daily DLI</button>
        <button className={view === "shadow" ? "active" : ""} onClick={() => setView("shadow")}>Shadow at {String(selectedHour).padStart(2, "0")}:00</button>
      </div>
      <div className="dli-heatmap" style={{ gridTemplateColumns: `repeat(${data.columns}, 1fr)` }}>
        {data.cells.map((cell) => {
          const ratio = (cell.dli - data.minimumDLI) / range;
          const backgroundColor = view === "dli"
            ? `hsl(${28 + ratio * 92} 66% 47%)`
            : cell.hourlyShade[selectedHour] > 0 ? "#334155" : "#9bd47e";
          return <div key={`${cell.row}-${cell.column}`} className={`dli-cell zone-${cell.zone}`}
            style={{ backgroundColor }}
            title={`${cell.zone}; x ${cell.x} m, z ${cell.z} m; DLI ${cell.dli}; ${view === "shadow" ? `shade ${cell.hourlyShade[selectedHour]}%` : `${cell.relativeDLI}% of open field`}`} />;
        })}
      </div>
      <div className="heatmap-legend"><span>{view === "dli" ? "Lower DLI" : "Direct sun"}</span><i className={view} /><span>{view === "dli" ? "Higher DLI" : "Panel shadow"}</span></div>
    </div>
  );
}
