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

import type {
  CanonicalHourlySimulationPoint,
} from "@/lib/execution/types";

interface SimulationHourlyChartProps {
  data:
    CanonicalHourlySimulationPoint[];
}

export default function SimulationHourlyChart({
  data,
}: SimulationHourlyChartProps) {
  const chartData =
    data.map(
      (point) => ({
        hour:
          `${String(
            point.hourIndex,
          ).padStart(
            2,
            "0",
          )}:00`,

        GHI:
          point.ghiWm2,

        POA:
          point.poaWm2,

        PV:
          point.pvPowerKw,
      }),
    );

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={
            chartData
          }
          margin={{
            top:
              10,

            right:
              25,

            left:
              0,

            bottom:
              5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="hour"
          />

          <YAxis
            yAxisId="irradiance"
            label={{
              value:
                "Irradiance (W/m²)",

              angle:
                -90,

              position:
                "insideLeft",
            }}
          />

          <YAxis
            yAxisId="power"
            orientation="right"
            label={{
              value:
                "PV Power (kW)",

              angle:
                90,

              position:
                "insideRight",
            }}
          />

          <Tooltip />

          <Legend />

          <Line
            yAxisId="irradiance"
            type="monotone"
            dataKey="GHI"
            dot={
              false
            }
            strokeWidth={
              2
            }
          />

          <Line
            yAxisId="irradiance"
            type="monotone"
            dataKey="POA"
            dot={
              false
            }
            strokeWidth={
              2
            }
          />

          <Line
            yAxisId="power"
            type="monotone"
            dataKey="PV"
            dot={
              false
            }
            strokeWidth={
              2
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
