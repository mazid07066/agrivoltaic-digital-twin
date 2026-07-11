# AgriTwin: Agrivoltaic Digital Twin

## Project continuation and technical handoff

**Status date:** 11 July 2026  
**Local project:** `D:\agrivoltaic-digital-twin`  
**Development environment:** Windows 11, VS Code, PowerShell  
**Framework:** Next.js 16.2.10 with TypeScript, App Router and Turbopack

## Purpose

AgriTwin is a browser-based agrivoltaic digital twin intended to support:

- agrivoltaic site and PV-array design;
- interactive 3D visualization;
- weather-driven solar and crop-light simulation;
- PV energy estimation;
- crop Daily Light Integral (DLI) assessment;
- food-energy trade-off assessment;
- future field-sensor monitoring;
- future adaptive PV tracking and bidirectional control;
- deployment as a Vercel web application.

The interface must remain understandable to students, researchers and non-specialist stakeholders. Explanations and transparent equations are preferred over unexplained black-box outputs.

## Research foundation

The project is informed by two papers supplied by the user:

1. **Edirisinghe et al. (2026), “A Digital Twin-Enabled Framework for Agrivoltaic System Design, Simulation, Monitoring and Control,” Machines, 14, 254.**
   - Establishes the design-simulation-monitoring-control lifecycle.
   - Uses 3D geospatial visualization, pvlib, IoT, MQTT, Node-RED and InfluxDB.
   - Emphasizes that a true digital twin needs bidirectional synchronization, not only visualization.

2. **Juanhe Shen (2024), “Adaptive Control System-Enhanced Digital Twin Model for Optimizing Agrivoltaic System Efficiency,” Cornell University M.S. thesis.**
   - Defines Standard Tracking (ST), Reverse Tracking (RT) and Custom Tracking (CT).
   - Uses target DLI and daily feedback to balance crop light and PV production.
   - Provides the later adaptive-control direction for this project.

The implementation deliberately begins with a lighter Vercel-compatible stack. Advanced services are added only when their need is demonstrated.

## Selected free technology stack

| Layer | Technology | Role |
|---|---|---|
| Full-stack web app | Next.js + TypeScript | UI, API routes and simulation orchestration |
| Styling | Tailwind installation plus custom global CSS | Responsive dashboard |
| 3D scene | Three.js, React Three Fiber, Drei | PV field, crops, sun and shadows |
| State | Zustand | Shared configuration and selected hour |
| Charts | Recharts | Irradiance visualization |
| Solar geometry | SunCalc | Solar altitude and azimuth |
| Weather | Open-Meteo | GHI, DNI, DHI, temperature, cloud, humidity, wind and rain |
| Validation | Zod (installed, not yet fully used) | Planned input/API schemas |
| Database | Supabase (planned) | Projects, telemetry and commands |
| Deployment | Vercel (planned) | Public application |
| IoT | ESP8266/ESP32 (planned) | Field sensing and tracker actuation |

Installed packages:

```powershell
npm install three @react-three/fiber @react-three/drei recharts lucide-react suncalc zustand zod
npm install -D @types/three @types/suncalc
```

Do **not** run `npm audit fix --force` without reviewing breaking changes.

## Completed phases

### Phase 1: Project foundation — complete

- Next.js 16.2.10 project created.
- TypeScript, App Router, Tailwind and ESLint configured.
- Required component, library, state and type directories created.
- Development and production builds verified.
- `@/*` alias corrected in `tsconfig.json` to point to `./src/*`.
- Duplicate/incorrect App Router directory issue resolved; the active router is `src/app`.

### Phase 2: Interactive simulation dashboard — complete

Implemented:

- responsive configuration sidebar;
- site name, latitude, longitude and simulation date;
- PV rows, modules per row, spacing, height, tilt, azimuth, power and efficiency;
- fixed, standard, reverse and custom tracking selections;
- crop selection and crop DLI profiles;
- Zustand state management;
- interactive Three.js farm;
- orbit, zoom and pan controls;
- panel and crop geometry;
- hourly irradiance chart;
- PV energy, crop DLI, crop-yield index and Land Equivalent Ratio cards;
- configuration interpretation and recommendations.

### Phase 3A: Weather API — complete

Implemented a Next.js endpoint at:

```text
/api/weather?latitude=23.8103&longitude=90.4125&date=YYYY-MM-DD
```

The endpoint:

- validates latitude, longitude and date;
- selects Open-Meteo forecast or archive data;
- retrieves 24 hourly records;
- normalizes Open-Meteo fields;
- supplies a daily summary;
- needs no API key.

Weather variables include:

- shortwave radiation / GHI;
- direct normal irradiance / DNI;
- diffuse radiation / DHI;
- temperature at 2 m;
- relative humidity;
- cloud cover;
- wind speed at 10 m;
- precipitation;
- sunrise and sunset.

A `/weather-test` page was created to verify the service independently.

### Phase 3B: Weather-driven simulation — complete

- Dashboard automatically requests weather for selected coordinates and date.
- Synthetic radiation remains only as a fallback.
- Hourly Open-Meteo irradiance drives the chart and model.
- Daily GHI, temperature, cloud, humidity, wind and rainfall are shown.
- PV estimation includes preliminary temperature derating.
- Crop irradiance preserves diffuse light in shaded areas.
- Footer identifies whether Open-Meteo or synthetic data is active.
- Weather information is displayed in a compact dedicated card.

### Phase 4: Solar-position foundation — implemented and build error fixed

- `solarPosition.ts` calculates solar altitude and azimuth using SunCalc.
- Solar azimuth is converted to compass bearing.
- A Three.js-compatible sun position is calculated.
- The `suncalc` import must use a named export:

```ts
import { getPosition } from "suncalc";
```

Do not use a default import because the installed type declaration has no default export.

The most recent user report states that the resulting build succeeded after this correction.

## Current source structure

```text
src/
├── app/
│   ├── api/
│   │   └── weather/
│   │       └── route.ts
│   ├── weather-test/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── charts/
│   │   └── IrradianceChart.tsx
│   ├── dashboard/
│   │   └── WeatherConnectionCard.tsx
│   └── twin/
│       └── AgrivoltaicScene.tsx
├── lib/
│   ├── simulation/
│   │   ├── crops.ts
│   │   ├── engine.ts
│   │   └── solarPosition.ts
│   └── weather/
│       ├── client.ts
│       └── useWeather.ts
├── store/
│   └── useSimulationStore.ts
└── types/
    ├── simulation.ts
    └── weather.ts
```

## Present model equations and assumptions

### Installed PV capacity

```text
Installed capacity (kWp) = rows × modules per row × module power (W) / 1000
```

### DLI conversion

The current preliminary conversion is:

```text
PAR ≈ shortwave irradiance × 0.45
PPFD ≈ PAR × 4.57
DLI = Σ(PPFD × 3600) / 1,000,000
```

The coefficients must later be documented, made configurable where appropriate and calibrated against PAR/PPFD sensors.

### Crop-level irradiance

The preliminary model reduces direct radiation according to estimated panel shade while allowing diffuse radiation to continue reaching crops.

### PV power

The current implementation uses a simplified plane-of-array approximation, system efficiency, tracking factor and approximate temperature correction of 0.4% per degree Celsius above 25°C.

This is not yet a replacement for pvlib, PVWatts, SAM or measured inverter data.

### Crop-yield index

The crop-yield index is currently a light-based relative indicator derived from minimum, optimum and maximum DLI. It is not a validated biological yield prediction.

### Land Equivalent Ratio

The displayed LER combines relative crop and energy indices. Its reference cases need clearer definition and validation before research publication.

## Important scientific limitations

1. Open-Meteo values are weather-model or reanalysis data, not local sensor measurements.
2. Crop profiles are preliminary defaults and require citations and local validation.
3. PV plane-of-array transposition is simplified.
4. Crop shading is not yet ray-traced into spatial ground cells for numerical integration.
5. The tracker selections currently influence model factors; a complete physical tracker-angle solver is still required.
6. The system is not yet a full digital twin because physical-to-digital telemetry and digital-to-physical control have not been connected.
7. Timezone handling currently needs further validation for sites outside the browser timezone.
8. A weather-connected simulation is not described as live sensor data.

## Known technical issues already solved

### Alias resolution

`tsconfig.json` must include:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

### Default Next.js page persisted

This occurred because the wrong/duplicate App Router directory was active. The correct application location is `src/app`.

### Global CSS not applied

`src/app/layout.tsx` must include:

```ts
import "./globals.css";
```

### SunCalc error

Correct:

```ts
import { getPosition } from "suncalc";
```

Incorrect:

```ts
import SunCalc from "suncalc";
```

## Required verification at the start of the next thread

Ask the user to run:

```powershell
npm run build
npm run dev
```

Then verify:

- `/` loads the styled dashboard;
- `/weather-test` returns weather data;
- the weather card remains compact;
- coordinates or date trigger a new weather request;
- the selected-hour slider changes displayed hourly weather;
- solar altitude and azimuth change with time;
- 3D sun/shadows move correctly;
- no TypeScript or browser-console errors appear.

## Next recommended phase: Phase 5

### Accurate solar geometry, POA irradiance and tracker angles

Implement in this order:

1. Create explicit site-timezone conversion using the timezone returned by Open-Meteo.
2. Calculate solar zenith and compass azimuth for all 24 hours.
3. Calculate incidence angle between sun vector and PV surface normal.
4. Calculate beam, sky-diffuse and ground-reflected plane-of-array irradiance.
5. Implement standard single-axis tracking angle.
6. Implement reverse/anti-tracking orientation.
7. Implement custom tracking schedules as actual hourly angles rather than fixed multipliers.
8. Synchronize the numerical tracker angle with the 3D panel orientation.
9. Display an hourly table containing sun position, tracker mode, tracker angle, POA irradiance, PV power, crop irradiance and shade fraction.
10. Add unit tests for sunrise, noon, sunset, horizontal panels and known compass directions.

Suggested physical POA structure:

```text
POA_beam = DNI × max(cos(AOI), 0)
POA_sky_diffuse = DHI × (1 + cos(tilt)) / 2
POA_ground = GHI × albedo × (1 - cos(tilt)) / 2
POA_total = POA_beam + POA_sky_diffuse + POA_ground
```

Use an initial configurable ground albedo of 0.20.

## Later roadmap

### Phase 6: Spatial crop-light model

- Divide ground between rows into spatial cells.
- Compute hourly shade masks and irradiance per cell.
- Produce a ground heat map.
- Report minimum, mean, maximum and coefficient of variation of DLI.
- Distinguish crops between rows from crops directly beneath panels.

### Phase 7: Adaptive DLI controller

Implement the Shen thesis logic:

```text
rho_DLI = seasonal target DLI / historical open-field average DLI
daily target DLI = predicted open-field DLI × rho_DLI
```

Then search for the maximum standard-tracking duration that still meets crop DLI, with reverse tracking during the remaining permitted periods. Carry the previous day's DLI deficit into the following target.

### Phase 8: Comparison and optimization

- Compare fixed, ST, RT and CT configurations.
- Add Pareto visualization for PV energy versus crop DLI/yield.
- Add constraints for minimum DLI, tracker angle, wind stow, row spacing and height.
- Save and compare scenarios.

### Phase 9: Supabase persistence

Create tables for:

- users;
- sites;
- PV configurations;
- crop seasons;
- simulation runs;
- hourly simulation results;
- sensors;
- telemetry;
- tracker commands;
- alerts.

Apply Row Level Security. Never expose the service-role key in browser code.

### Phase 10: IoT monitoring

- Connect ESP8266/ESP32 measurements through a protected ingestion API.
- Begin with solar irradiance/PAR, air temperature, humidity, soil moisture, panel temperature and tracker angle.
- Store timestamp, device ID, quality flag and calibration version.
- Show model-versus-sensor residuals.

### Phase 11: Calibration and data fusion

- Correct weather/model radiation using field observations.
- Report MAE, RMSE, MAPE and NMBE.
- Preserve raw readings; store corrected readings separately.
- Track missing data and sensor faults.

### Phase 12: Bidirectional control

- Use command states: proposed, approved, sent, acknowledged, executed and failed.
- Require manual approval initially.
- Add mechanical limits, wind stow, timeout, emergency stop and audit logs.
- Do not send direct commands from the browser to a tracker.

### Phase 13: Vercel deployment

- Initialize Git.
- Push to GitHub.
- import the repository into Vercel.
- configure environment variables.
- verify API routes and Open-Meteo access in production.
- configure Supabase URLs and public keys.
- run production smoke tests.

## Working style requested by the user

- Work in sequential phases.
- Explain what each phase accomplishes and why it is scientifically necessary.
- Provide complete copy-paste-ready code for every file being created or replaced.
- State exact Windows PowerShell commands.
- Always request `npm run build` verification before treating a phase as complete.
- Diagnose full terminal output and screenshots when an error occurs.
- Use VS Code-oriented instructions.
- Do not skip from simulation to hardware control without validation and safety checks.

## Suggested opening message for a new chat

Copy the following with this file attached:

> Continue development of my AgriTwin agrivoltaic digital twin using the attached project handoff. Phases 1–4 are completed. First read the complete handoff, confirm the current build and functionality, and then begin Phase 5: accurate solar geometry, POA irradiance and physical tracker-angle modeling. Continue to provide explanations, exact PowerShell instructions and complete copy-paste-ready code for every changed file.

