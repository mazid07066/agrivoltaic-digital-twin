# Phase 8A — Schema, Migration and Land Compatibility

This checkpoint introduces a versioned `SiteProfile`, persistent site metadata, legacy configuration migration, and a `land_agrivoltaic` adapter. The existing Phase 7B-PV equations remain unchanged.

## Structural-safety boundary

AgriTwin is a preliminary geometry, energy, crop-light and operational simulation tool. A qualified structural engineer must verify roof capacity, uplift, anchoring, waterproofing, fire access and local-code compliance before any rooftop installation.

## Verification

```powershell
npm install
npm run verify
npm run dev
```

The dashboard must retain the previous land-site results, charts, heat map, hourly table and synchronized Three.js scene. The header now records `land agrivoltaic · virtual`.
