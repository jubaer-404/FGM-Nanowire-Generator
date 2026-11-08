# Multi-Material FGM Nanostructure Generator

> **LAMMPS MD-Ready Generator for Multi-Material Segmented Base Alloys (Cu, Ni, Fe, Al, Ti, Pt, Au, etc.) with Functionally Graded Material (FGM) Distributions.**






## 🔬 Core Features
- **Multi-Material Base Segments**: Segmented alloy layers (e.g. Cu-Ni-Fe) with exact segment lengths (nm) or core-shell concentric shells.
- **Graded Material Substitution**: Distribute additive elements (Au, Ni, Al, Pt, etc.) using Power-Law (P-FGM), Exponential (E-FGM), Sigmoidal (S-FGM), Linear, or Custom formulas.
- **LAMMPS & OVITO 100% Compatible**:
  - Atom types contiguous strictly from `1..N` (no gaps or phantom types).
  - Box bounds `xlo`, `ylo`, `zlo` start strictly from `0.00000000`.
  - Generates `.data` files, `.xyz` coordinate files, `.csv` bin statistics, and simulation input scripts (`in.fgm`).
- **Interactive 3D WebGL Viewer**: Orbit, pan, zoom, inspect atom types, slice cross-sections, and toggle wireframe box bounds.

Please access through this link "https://ai.studio/apps/dfdc4d05-953f-4eb9-8642-0742045096eb"
