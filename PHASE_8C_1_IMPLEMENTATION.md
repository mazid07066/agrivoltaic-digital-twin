# Phase 8C-1 — Flat-Roof Foundation

This checkpoint introduces:

- a versioned `FlatRoofSiteProfile`;
- rectangular roof, parapet, setback and rack metadata;
- deterministic module placement within the usable roof rectangle;
- module-orientation-sensitive layout;
- installed-capacity and usable-area summaries;
- an explicit structural-engineering disclaimer;
- a Supabase RPC that creates an immutable flat-roof site version;
- automated geometry and schema tests.

This checkpoint intentionally does not:

- switch the current dashboard to a rooftop;
- alter the Phase 7B land simulation engine;
- calculate parapet or obstacle shadows;
- calculate structural loads or structural safety;
- implement rooftop wind cooling;
- implement the rooftop Three.js scene.

Units and conventions:

- length and height: metres;
- module power: watts;
- installed capacity: kilowatts;
- azimuth: degrees clockwise from north;
- tilt: degrees from horizontal;
- horizontal layout footprint along tilt direction:
  `module slope dimension × cos(tilt)`.

The plan-footprint calculation is a geometry-only assumption for placement.
It is not a complete row-to-row shading or structural model.
