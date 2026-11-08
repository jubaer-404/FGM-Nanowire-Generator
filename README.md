# Multi-Material FGM Nanostructure Generator

> **LAMMPS MD-Ready Generator for Multi-Material Segmented Base Alloys (Cu, Ni, Fe, Al, Ti, Pt, Au, etc.) with Functionally Graded Material (FGM) Distributions.**

---

## 🌐 Publish & Use Directly on GitHub (GitHub Pages)

Anyone can access and use this full software directly in their web browser via your GitHub account with zero installation:

### Step 1: Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Enter a repository name, for example: `fgm-nanowire-generator`.
3. Choose **Public**, and click **Create repository**.

### Step 2: Push this Project to GitHub
In your project folder on your PC, open a terminal and run:
```bash
git init
git add .
git commit -m "Initial release of Multi-Material FGM Generator"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```
*(Replace `<YOUR-USERNAME>` and `<YOUR-REPO-NAME>` with your GitHub username and repo name).*

### Step 3: Enable GitHub Pages in 2 Clicks
1. In your GitHub repository, click **Settings** (top tab) → **Pages** (left sidebar).
2. Under **Build and deployment** → **Source**, select:
   👉 **`GitHub Actions`** (instead of Deploy from a branch).
3. That's it! The included `.github/workflows/deploy.yml` workflow will automatically build and publish your app.

### Step 4: Access Your Live App
Your live application will be instantly available at:
```
https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/
```
Anyone visiting this link can design multi-material nanowires, preview 3D atoms, and export LAMMPS simulation files directly in their browser without downloading anything!

---

## 💻 Other Ways to Run

### 1. Instant Desktop App Mode (PWA)
When viewing the site in Chrome or Edge, click **"Install on PC"** in the top bar to install it as an offline native desktop window.

### 2. Run Locally on your PC (Node.js)
- **Windows**: Double-click `start.bat`.
- **macOS / Linux**: Run `./start.sh`.
- **Manual CLI**:
  ```bash
  npm install
  npm run dev
  ```
  Open `http://localhost:3000`.

---

## 🔬 Core Features
- **Multi-Material Base Segments**: Segmented alloy layers (e.g. Cu-Ni-Fe) with exact segment lengths (nm) or core-shell concentric shells.
- **Graded Material Substitution**: Distribute additive elements (Au, Ni, Al, Pt, etc.) using Power-Law (P-FGM), Exponential (E-FGM), Sigmoidal (S-FGM), Linear, or Custom formulas.
- **LAMMPS & OVITO 100% Compatible**:
  - Atom types contiguous strictly from `1..N` (no gaps or phantom types).
  - Box bounds `xlo`, `ylo`, `zlo` start strictly from `0.00000000`.
  - Generates `.data` files, `.xyz` coordinate files, `.csv` bin statistics, and simulation input scripts (`in.fgm`).
- **Interactive 3D WebGL Viewer**: Orbit, pan, zoom, inspect atom types, slice cross-sections, and toggle wireframe box bounds.
