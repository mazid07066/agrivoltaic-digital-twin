# AgriTwin MATLAB/Simulink verification adapter

This directory defines the external Simulink verification boundary for
Phase 9G.

MATLAB is not currently installed on the AgriTwin development machine.
The AgriTwin application will therefore export a documented,
versioned, checksum-protected validation package that can be transferred
to a MATLAB/Simulink/Simscape Electrical workstation.

Planned scripts:

- `load_agritwin_package.m`
- `configure_agritwin_model.m`
- `run_agritwin_validation.m`
- `export_simulink_results.m`

Planned verification modes:

1. Full-weather mode.
2. Common-POA mode.

Simulink results must be exported into the common AgriTwin comparison
schema before they are accepted by the comparison engine.
