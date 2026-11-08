# Multi-Material FGM Nanostructure Generator

LAMMPS MD-Ready Generator for Multi-Material Segmented Base Alloys (Cu, Ni, Fe, Al, Ti, Pt, Au, etc.) with Functionally Graded Material (FGM) Distributions.

---

## Option 1: Instant 1-Click Desktop App (Recommended)
You don't even need to install Node.js to use it as a desktop application!
1. Open the application URL in Google Chrome, Microsoft Edge, or Brave.
2. In the top header of the app or in your browser's address bar, click **"Install Desktop App"** (or the computer icon with down arrow).
3. The app is installed directly to your PC desktop and taskbar, and works **100% offline** with standalone window mode.

---

## Option 2: Deploy & Run Locally on Your PC (Node.js)

### Prerequisites
- Install **Node.js (version 18 or newer)** from [https://nodejs.org](https://nodejs.org).

### On Windows
Just double-click **`start.bat`**!
- It automatically installs any missing dependencies on first run.
- It automatically launches your browser to `http://localhost:3000`.

### On macOS / Linux
Open a terminal in the folder and run:
```bash
chmod +x start.sh
./start.sh
```

### Manual Command Line Steps
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser:
# http://localhost:3000
```

---

## Option 3: Production Static Build
To generate an optimized, fast offline web package:
```bash
npm run build
npm run preview
```
The compiled standalone files will be in the `dist/` directory and can be hosted on any static web server, Apache, Nginx, or GitHub Pages.

---

## Option 4: Packaging as Native `.exe` / `.dmg` with Electron
If you want to package the app into a standalone desktop `.exe` (Windows) or `.dmg` (Mac):
```bash
# 1. Build the production web bundle
npm run build

# 2. Use nativefier or electron-builder:
npx nativefier --name "FGM Builder" "http://localhost:3000"
```
Or with Tauri / Electron to bundle into an installer.

---

## Key Features
- **Multi-Material Base Segments**: Build nanowires with arbitrary segmented alloy layers (e.g. Cu-Ni-Fe) with exact segment lengths (nm) or core-shell concentric shells.
- **Graded Material Substitution**: Distribute additive elements (Au, Ni, Al, Pt, etc.) using Power-Law (P-FGM), Exponential (E-FGM), Sigmoidal (S-FGM), Linear, or Custom formulas.
- **LAMMPS & OVITO 100% Compatible**:
  - Atom types contiguous strictly from `1..N`.
  - Box bounds `xlo`, `ylo`, `zlo` start strictly from `0.00000000`.
  - Generates `.data` files, `.xyz` coordinate files, `.csv` bin statistics, and simulation input scripts (`in.fgm`).
- **Interactive 3D WebGL Viewer**: Orbit, pan, zoom, inspect atom types, slice cross-sections, and toggle wireframe box bounds.
