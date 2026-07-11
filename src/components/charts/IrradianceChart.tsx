"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HourlySimulationPoint } from "@/types/simulation";

interface IrradianceChartProps {
  data: HourlySimulationPoint[];
}

export default function IrradianceChart({
  data,
}: IrradianceChartProps) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 18, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#dbe5dc"
          />

          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11, fill: "#52645a" }}
            interval={2}
          />

          <YAxis
            tick={{ fontSize: 11, fill: "#52645a" }}
            unit=" W"
          />

          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #dbe5dc",
            }}
          />

          <Legend />

          <Line
            type="monotone"
            dataKey="irradiance"
            name="Open-field irradiance"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="cropIrradiance"
            name="Crop-level irradiance"
            stroke="#16a34a"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}