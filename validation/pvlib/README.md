# AgriTwin pvlib verification adapter

This directory will contain the independent pvlib reference runner for
Phase 9G.

The runner will consume the versioned AgriTwin validation exchange
package. It must not import or reproduce hidden state from the TypeScript
application.

Planned inputs:

- `manifest.json`
- `inputs/weather.csv`
- `topology/electrical-topology.csv`
- `topology/physical-topology.csv`
- module and inverter equipment records
- AgriTwin hourly outputs

Planned verification modes:

1. Full-weather mode, where pvlib calculates solar geometry and POA.
2. Common-POA mode, where pvlib receives the same POA values as
   AgriTwin and verifies the downstream thermal and electrical stages.

The Python environment and pvlib version will be pinned before the
runner is implemented.
